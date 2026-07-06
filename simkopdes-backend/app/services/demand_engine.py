"""
Coop-Demand Engine
Periodic analysis engine that reads transaction logs, detects dead stock,
calculates urgency scores, and generates flash sale campaign recommendations.
"""
import logging
from typing import List, Dict, Any
from datetime import datetime, timedelta

from app.database.json_db import db
from app.core import config
from app.core.events import event_bus, EVENT_ENGINE_ANALYSIS_COMPLETE, EVENT_ACTIVITY_LOG
from app.utils.helpers import generate_id, now_iso, now_wib, WIB

logger = logging.getLogger(__name__)


async def run_analysis_cycle() -> dict:
    """
    Execute one full demand analysis cycle:
    1. Read transaction logs within rolling window
    2. Calculate demand per product
    3. Detect dead stock
    4. Calculate urgency scores
    5. Generate discount recommendations
    6. Create campaign suggestions
    Returns analysis result summary.
    """
    cycle_id = generate_id("cycle")
    logger.info(f"Demand Engine: Starting analysis cycle {cycle_id}")

    # Step 1: Get all products and transaction logs
    products = await db.get_all("products")
    tx_logs = await db.get_all("transaction_logs")

    if not products:
        logger.info("Demand Engine: No products to analyze")
        return {"cycle_id": cycle_id, "products_analyzed": 0, "dead_stock_found": 0, "campaigns_generated": 0}

    # Step 2: Calculate rolling window boundary
    now = now_wib()
    window_start = now - timedelta(days=config.ROLLING_WINDOW_DAYS)
    window_start_iso = window_start.isoformat()

    # Step 3: Calculate demand (transaction count) per product within window
    demand_map: Dict[str, int] = {}  # product_id -> total qty sold in window
    for log in tx_logs:
        log_time = log.get("timestamp", "")
        if log_time >= window_start_iso:
            pid = log.get("product_id", "")
            demand_map[pid] = demand_map.get(pid, 0) + log.get("quantity", 0)

    # Step 4: Analyze each product
    max_stock_value = max((p["stock"] * p["purchase_price"] for p in products), default=1)
    max_demand = max(demand_map.values(), default=1)

    dead_stock_found = 0
    campaigns_generated = []
    analysis_details = []

    for product in products:
        pid = product["id"]
        demand = demand_map.get(pid, 0)
        stock_value = product["stock"] * product["purchase_price"]

        # Calculate stagnant days based on last_transaction_date
        last_tx_str = product.get("last_transaction_date", "")
        if last_tx_str:
            try:
                # Parse ISO datetime string
                last_tx = datetime.fromisoformat(last_tx_str)
                if last_tx.tzinfo is None:
                    last_tx = last_tx.replace(tzinfo=WIB)
                stagnant_days = max(0, (now - last_tx).days)
            except (ValueError, TypeError):
                stagnant_days = product.get("stagnant_days", 0)
        else:
            stagnant_days = product.get("stagnant_days", 0)

        # Dead stock detection: no sales in the rolling window
        is_dead_stock = stagnant_days >= config.DEAD_STOCK_THRESHOLD_DAYS

        # Urgency score calculation (0-100)
        stagnant_ratio = min(stagnant_days / config.ROLLING_WINDOW_DAYS, 1.0)
        stock_value_ratio = stock_value / max_stock_value if max_stock_value > 0 else 0
        demand_ratio = demand / max_demand if max_demand > 0 else 0
        inverse_demand = 1 - demand_ratio

        urgency_score = round(
            (stagnant_ratio * config.URGENCY_WEIGHT_STAGNANT +
             stock_value_ratio * config.URGENCY_WEIGHT_STOCK_VALUE +
             inverse_demand * config.URGENCY_WEIGHT_DEMAND) * 100,
            1
        )

        # Priority assignment
        if urgency_score >= 70:
            priority = "Tinggi"
        elif urgency_score >= 40:
            priority = "Sedang"
        else:
            priority = "Rendah"

        # Discount recommendation
        recommended_discount = _get_recommended_discount(urgency_score)

        # Update product in database
        updates = {
            "stagnant_days": stagnant_days,
            "is_dead_stock": is_dead_stock,
            "priority": priority,
            "discount_ai": recommended_discount,
        }

        # Set promo price if discount > 0
        if recommended_discount > 0:
            promo_price = int(product["selling_price"] * (1 - recommended_discount / 100))
            updates["promo_price"] = promo_price

        await db.update("products", pid, updates)

        if is_dead_stock:
            dead_stock_found += 1

        # Generate campaign for high-urgency dead stock
        if is_dead_stock and urgency_score >= 50:
            campaign = await _generate_campaign(product, urgency_score, recommended_discount)
            if campaign:
                campaigns_generated.append(campaign)

        analysis_details.append({
            "product_id": pid,
            "product_name": product["name"],
            "demand_in_window": demand,
            "stagnant_days": stagnant_days,
            "urgency_score": urgency_score,
            "priority": priority,
            "is_dead_stock": is_dead_stock,
            "recommended_discount": recommended_discount,
        })

    # Build result
    result = {
        "cycle_id": cycle_id,
        "timestamp": now_iso(),
        "products_analyzed": len(products),
        "dead_stock_found": dead_stock_found,
        "campaigns_generated": len(campaigns_generated),
        "campaigns": campaigns_generated,
        "details": analysis_details,
    }

    # Broadcast result to dashboard
    await event_bus.publish(EVENT_ENGINE_ANALYSIS_COMPLETE, result)

    # Log activity
    log_msg = (
        f"ENGINE CYCLE [{cycle_id}]: "
        f"Analyzed {len(products)} products, "
        f"found {dead_stock_found} dead stock, "
        f"generated {len(campaigns_generated)} campaigns"
    )
    log_entry = {
        "id": generate_id("log"),
        "timestamp": now_iso(),
        "message": log_msg,
        "type": "info" if dead_stock_found == 0 else "warning",
    }
    await db.insert("activity_logs", log_entry)
    await event_bus.publish(EVENT_ACTIVITY_LOG, log_entry)

    logger.info(log_msg)
    return result


def _get_recommended_discount(urgency_score: float) -> int:
    """Get recommended discount percentage based on urgency score."""
    for min_score, max_score, discount in config.DISCOUNT_TIERS:
        if min_score <= urgency_score < max_score:
            return discount
    # If score >= 100 (shouldn't happen but just in case)
    return config.DISCOUNT_TIERS[-1][2]


async def _generate_campaign(product: dict, urgency_score: float, discount: int) -> dict:
    """Generate a flash sale campaign for a dead stock product."""
    promo_price = int(product["selling_price"] * (1 - discount / 100))

    # Get targeted active members
    from app.services.campaign_service import get_targeted_members
    targeting = await get_targeted_members(product)
    member_ids = targeting["member_ids"]
    target_count = targeting["count"]
    segment_label = targeting["segment_label"]

    # Create WhatsApp-style message template
    message = (
        f"📢 *PROMO SPECIAL KOPERASI SIMKOPDES!* 📢\n\n"
        f"Halo Bapak/Ibu Anggota Koperasi yang budiman! 😊\n\n"
        f"🌾 *{product['name']}*\n"
        f"💰 Harga Normal: Rp{product['selling_price']:,}\n"
        f"🔥 Harga Promo: *Rp{promo_price:,}* (Diskon {discount}%!)\n"
        f"📦 Stok tersisa: {product['stock']} {product['unit']}\n\n"
        f"Balas *TEBUS* untuk booking sekarang!\n"
        f"Promo berlaku sampai pukul 20.00 WIB hari ini."
    ).replace(",", ".")

    campaign = {
        "id": generate_id("camp"),
        "product_id": product["id"],
        "product_name": product["name"],
        "campaign_type": "flash_sale",
        "discount_percentage": discount,
        "original_price": product["selling_price"],
        "promo_price": promo_price,
        "urgency_score": urgency_score,
        "message_template": message,
        "target_member_ids": member_ids,
        "target_member_count": target_count,
        "target_segment_label": segment_label,
        "status": "Pending",
        "bookings_generated": 0,
        "created_at": now_iso(),
        "sent_at": None,
    }

    await db.insert("campaigns", campaign)
    logger.info(f"Campaign generated for {product['name']}: {discount}% off → Rp{promo_price:,}")
    return campaign
