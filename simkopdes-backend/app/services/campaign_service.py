"""
Campaign Service
Manages campaign lifecycle: blast sending, status tracking, and member targeting.
"""
import logging
from typing import Optional, List, Dict, Any

from app.database.json_db import db
from app.core.events import event_bus, EVENT_CAMPAIGN_CREATED, EVENT_CAMPAIGN_SENT, EVENT_WHATSAPP_MESSAGE, EVENT_ACTIVITY_LOG
from app.utils.helpers import generate_id, now_iso

logger = logging.getLogger(__name__)


async def get_all_campaigns() -> List[Dict[str, Any]]:
    """Get all campaigns, newest first."""
    campaigns = await db.get_all("campaigns")
    return sorted(campaigns, key=lambda c: c.get("created_at", ""), reverse=True)


async def get_campaign_by_id(campaign_id: str) -> Optional[Dict[str, Any]]:
    """Get a single campaign by ID."""
    return await db.get_by_id("campaigns", campaign_id)


async def get_pending_campaigns() -> List[Dict[str, Any]]:
    """Get campaigns that haven't been sent yet."""
    return await db.query("campaigns", lambda c: c.get("status") == "Pending")


async def get_targeted_members(product: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get targeted members based on transaction history of relevant product categories.
    """
    category = product.get("category", "")
    
    # Mapping of product categories to target profiles and labels
    mapping = {
        "Sembako": {
            "relevant_categories": ["Sembako", "Bumbu Dapur", "Minyak & Lemak"],
            "label": "Ibu Rumah Tangga teridentifikasi"
        },
        "Bumbu Dapur": {
            "relevant_categories": ["Sembako", "Bumbu Dapur", "Minyak & Lemak"],
            "label": "Ibu Rumah Tangga teridentifikasi"
        },
        "Minyak & Lemak": {
            "relevant_categories": ["Sembako", "Bumbu Dapur", "Minyak & Lemak"],
            "label": "Ibu Rumah Tangga teridentifikasi"
        },
        "Kebutuhan Rumah": {
            "relevant_categories": ["Kebutuhan Rumah", "Sembako"],
            "label": "Pelanggan Rumah Tangga tersegmentasi"
        },
        "Pupuk": {
            "relevant_categories": ["Pupuk", "Benih"],
            "label": "Petani tersegmentasi"
        },
        "Benih": {
            "relevant_categories": ["Pupuk", "Benih"],
            "label": "Petani tersegmentasi"
        }
    }
    
    map_entry = mapping.get(category, {
        "relevant_categories": [category] if category else [],
        "label": "Umum / Anggota Aktif"
    })
    
    relevant_cats = map_entry["relevant_categories"]
    segment_label = map_entry["label"]
    
    # Get all transactions
    tx_logs = await db.get_all("transaction_logs")
    # Get products mapping to resolve categories
    all_products = await db.get_all("products")
    product_cat_map = {p["id"]: p.get("category", "") for p in all_products}
    
    # Get all active members
    active_members = await db.query("members", lambda m: m.get("active_status", False))
    active_member_ids = {m["id"] for m in active_members}
    
    # Filter members who have purchased relevant categories
    targeted_member_ids = set()
    for log in tx_logs:
        p_id = log.get("product_id", "")
        p_cat = product_cat_map.get(p_id, "")
        
        # If transaction product category matches, add member
        if p_cat in relevant_cats:
            m_id = log.get("member_id", "")
            if m_id in active_member_ids:
                targeted_member_ids.add(m_id)
                
    # Fallback to all active members if no purchase history exists
    if not targeted_member_ids:
        targeted_member_ids = list(active_member_ids)
        segment_label = "Umum / Anggota Aktif"
        original_count = len(targeted_member_ids)
    else:
        original_count = len(targeted_member_ids)
        targeted_member_ids = list(targeted_member_ids)
        
    # Ensure the demo user 'mem-001' is always included to receive the websocket message
    recipient_member_ids = list(targeted_member_ids)
    if "mem-001" not in recipient_member_ids:
        recipient_member_ids.append("mem-001")
        
    return {
        "member_ids": recipient_member_ids,
        "count": original_count,
        "segment_label": segment_label
    }


async def trigger_campaign(product_id: str, discount_override: int = None) -> Optional[Dict[str, Any]]:
    """
    Manually trigger a flash sale campaign for a specific product.
    If discount_override is provided, uses that instead of AI recommendation.
    """
    product = await db.get_by_id("products", product_id)
    if not product:
        logger.warning(f"Campaign trigger failed: product {product_id} not found")
        return None

    discount = discount_override or product.get("discount_ai", 10)
    promo_price = int(product["selling_price"] * (1 - discount / 100))

    # Get targeted active members
    targeting = await get_targeted_members(product)
    member_ids = targeting["member_ids"]
    target_count = targeting["count"]
    segment_label = targeting["segment_label"]

    # Build campaign message
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
        "urgency_score": 0,
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

    # Update product promo price
    await db.update("products", product_id, {"promo_price": promo_price})

    await event_bus.publish(EVENT_CAMPAIGN_CREATED, campaign)
    await _log_activity(
        f"Campaign created for {product['name']}: {discount}% off → Rp{promo_price:,}",
        "info"
    )

    logger.info(f"Campaign triggered for {product['name']}")
    return campaign


async def send_campaign(campaign_id: str) -> Optional[Dict[str, Any]]:
    """
    Send a campaign to all target members via WebSocket (simulating WhatsApp blast).
    Updates campaign status to 'Sent'.
    """
    campaign = await db.get_by_id("campaigns", campaign_id)
    if not campaign:
        return None

    if campaign["status"] not in ("Pending", "Sending"):
        logger.warning(f"Campaign {campaign_id} already in status: {campaign['status']}")
        return campaign

    # Update status to Sending
    await db.update("campaigns", campaign_id, {"status": "Sending"})

    # Broadcast to all target members via WhatsApp channel
    for member_id in campaign.get("target_member_ids", []):
        member = await db.get_by_id("members", member_id)
        if member:
            wa_message = {
                "type": "campaign_blast",
                "campaign_id": campaign["id"],
                "product_id": campaign["product_id"],
                "product_name": campaign["product_name"],
                "message": campaign["message_template"],
                "promo_price": campaign["promo_price"],
                "original_price": campaign["original_price"],
                "discount": campaign["discount_percentage"],
                "member_id": member_id,
                "member_name": member["name"],
                "timestamp": now_iso(),
            }
            await event_bus.publish(EVENT_WHATSAPP_MESSAGE, wa_message)

    # Mark as sent
    updated = await db.update("campaigns", campaign_id, {
        "status": "Sent",
        "sent_at": now_iso(),
    })

    await event_bus.publish(EVENT_CAMPAIGN_SENT, updated)
    await _log_activity(
        f"Campaign SENT to {campaign['target_member_count']} {campaign.get('target_segment_label', 'Anggota Aktif')}: {campaign['product_name']}",
        "success"
    )

    logger.info(f"Campaign {campaign_id} sent to {campaign['target_member_count']} members")
    return updated



async def trigger_and_send_campaign(product_id: str, discount_override: int = None) -> Optional[Dict[str, Any]]:
    """Convenience: trigger a campaign and immediately send it."""
    campaign = await trigger_campaign(product_id, discount_override)
    if campaign:
        return await send_campaign(campaign["id"])
    return None


async def _log_activity(message: str, log_type: str = "info"):
    """Log activity and broadcast."""
    log_entry = {
        "id": generate_id("log"),
        "timestamp": now_iso(),
        "message": message,
        "type": log_type,
    }
    await db.insert("activity_logs", log_entry)
    await event_bus.publish(EVENT_ACTIVITY_LOG, log_entry)
