"""
Ledger Service
Handles product CRUD, stock management, double-entry bookkeeping, and transaction logging.
This is the core data layer that the Simkopdes cooperative relies on.
"""
import logging
from typing import List, Optional, Dict, Any

from app.database.json_db import db
from app.core.events import event_bus, EVENT_STOCK_UPDATED, EVENT_LEDGER_ENTRY_ADDED, EVENT_ACTIVITY_LOG
from app.utils.helpers import generate_id, now_iso, now_time_str

logger = logging.getLogger(__name__)


# =====================================================================
# Product CRUD
# =====================================================================

async def get_all_products() -> List[Dict[str, Any]]:
    """Get all products from the ledger."""
    return await db.get_all("products")


async def get_product_by_id(product_id: str) -> Optional[Dict[str, Any]]:
    """Get a single product by ID."""
    return await db.get_by_id("products", product_id)


async def create_product(data: dict) -> Dict[str, Any]:
    """Create a new product in the inventory."""
    product = {
        "id": generate_id("prod"),
        "name": data["name"],
        "category": data["category"],
        "stock": data["stock"],
        "unit": data["unit"],
        "purchase_price": data["purchase_price"],
        "selling_price": data["selling_price"],
        "promo_price": data.get("promo_price"),
        "discount_ai": 0,
        "stagnant_days": 0,
        "priority": "Rendah",
        "is_dead_stock": False,
        "last_transaction_date": now_iso(),
        "created_at": now_iso(),
        "version": 1,
    }
    result = await db.insert("products", product)
    await _log_activity(f"Product created: {product['name']} (stock: {product['stock']})", "success")
    return result


async def update_product(product_id: str, updates: dict) -> Optional[Dict[str, Any]]:
    """Update product fields. Uses simple merge (no optimistic locking for basic updates)."""
    # Filter out None values
    clean_updates = {k: v for k, v in updates.items() if v is not None}
    result = await db.update("products", product_id, clean_updates)
    if result:
        await _log_activity(f"Product updated: {result['name']}", "info")
    return result


async def delete_product(product_id: str) -> bool:
    """Delete a product from the inventory."""
    product = await db.get_by_id("products", product_id)
    deleted = await db.delete("products", product_id)
    if deleted and product:
        await _log_activity(f"Product deleted: {product['name']}", "warning")
    return deleted


# =====================================================================
# Stock Management (with optimistic locking)
# =====================================================================

async def deduct_stock(product_id: str, quantity: int, expected_version: int, reason: str = "sale", reference_id: str = None) -> Optional[Dict[str, Any]]:
    """
    Deduct stock from a product using optimistic locking.
    Returns updated product or None on version conflict or insufficient stock.
    """
    product = await db.get_by_id("products", product_id)
    if not product:
        logger.warning(f"Stock deduction failed: product {product_id} not found")
        return None

    if product["stock"] < quantity:
        logger.warning(f"Stock deduction failed: insufficient stock for {product['name']} (have {product['stock']}, need {quantity})")
        return None

    new_stock = product["stock"] - quantity
    updates = {
        "stock": new_stock,
        "last_transaction_date": now_iso(),
    }

    result = await db.update_with_version("products", product_id, updates, expected_version)

    if result:
        # Record transaction log
        await _record_transaction(product, quantity, reason, reference_id)

        # Create double-entry ledger entries
        unit_price = product.get("promo_price") or product["selling_price"]
        total = unit_price * quantity
        await _create_sale_ledger_entries(product, total, reference_id)

        # Broadcast stock update
        await event_bus.publish(EVENT_STOCK_UPDATED, {
            "product_id": product_id,
            "product_name": product["name"],
            "old_stock": product["stock"],
            "new_stock": new_stock,
            "quantity_deducted": quantity,
            "reason": reason,
        })

        await _log_activity(
            f"Stock deducted: {product['name']} -{quantity} (remaining: {new_stock})",
            "success"
        )
        logger.info(f"Stock deducted: {product['name']} -{quantity} → {new_stock}")
    else:
        logger.warning(f"Optimistic lock conflict for product {product_id}")

    return result


async def add_stock(product_id: str, quantity: int, reason: str = "restock") -> Optional[Dict[str, Any]]:
    """Add stock to a product (no optimistic locking needed for restocking)."""
    product = await db.get_by_id("products", product_id)
    if not product:
        return None

    new_stock = product["stock"] + quantity
    result = await db.update("products", product_id, {
        "stock": new_stock,
        "last_transaction_date": now_iso(),
    })

    if result:
        await event_bus.publish(EVENT_STOCK_UPDATED, {
            "product_id": product_id,
            "product_name": product["name"],
            "old_stock": product["stock"],
            "new_stock": new_stock,
            "quantity_added": quantity,
            "reason": reason,
        })
        await _log_activity(f"Stock added: {product['name']} +{quantity} (total: {new_stock})", "info")

    return result


# =====================================================================
# Dead Stock & Inventory Status
# =====================================================================

async def get_dead_stock_products() -> List[Dict[str, Any]]:
    """Get all products flagged as dead stock."""
    return await db.query("products", lambda p: p.get("is_dead_stock", False))


async def get_stagnant_products() -> List[Dict[str, Any]]:
    """Get products with stagnant_days > 0 (sorted by stagnant_days desc)."""
    products = await db.query("products", lambda p: p.get("stagnant_days", 0) > 0)
    return sorted(products, key=lambda p: p.get("stagnant_days", 0), reverse=True)


async def get_inventory_status() -> dict:
    """Calculate aggregated inventory KPIs."""
    products = await db.get_all("products")

    total_stock_value = sum(p["stock"] * p["purchase_price"] for p in products)
    dead_stock_products = [p for p in products if p.get("is_dead_stock", False)]
    dead_stock_value = sum(p["stock"] * p["purchase_price"] for p in dead_stock_products)
    stagnant_products = [p for p in products if p.get("stagnant_days", 0) > 0]

    # Potential recovery: stock value at discounted selling price
    potential_recovery = 0
    for p in stagnant_products:
        discount = p.get("discount_ai", 0) / 100
        discounted_price = p["selling_price"] * (1 - discount)
        potential_recovery += p["stock"] * discounted_price

    # Category breakdown
    categories = {}
    for p in products:
        cat = p.get("category", "Lainnya")
        if cat not in categories:
            categories[cat] = {"count": 0, "total_stock": 0, "value": 0}
        categories[cat]["count"] += 1
        categories[cat]["total_stock"] += p["stock"]
        categories[cat]["value"] += p["stock"] * p["purchase_price"]

    return {
        "total_products": len(products),
        "dead_stock_count": len(dead_stock_products),
        "stagnant_count": len(stagnant_products),
        "total_stock_value": total_stock_value,
        "dead_stock_value": dead_stock_value,
        "potential_recovery_value": potential_recovery,
        "categories": categories,
    }


# =====================================================================
# Ledger Operations
# =====================================================================

async def get_all_ledger_entries() -> List[Dict[str, Any]]:
    """Get all ledger entries, newest first."""
    entries = await db.get_all("ledger")
    return sorted(entries, key=lambda e: e.get("timestamp", ""), reverse=True)


async def create_ledger_entry(description: str, debit: int = None, credit: int = None,
                               reference_type: str = None, reference_id: str = None) -> Dict[str, Any]:
    """Create a single ledger entry."""
    entry = {
        "id": generate_id("ledger"),
        "timestamp": now_iso(),
        "description": description,
        "debit": debit,
        "credit": credit,
        "reference_type": reference_type,
        "reference_id": reference_id,
        "balance_after": None,
    }
    result = await db.insert("ledger", entry)

    await event_bus.publish(EVENT_LEDGER_ENTRY_ADDED, result)
    return result


async def get_ledger_summary() -> dict:
    """Calculate ledger summary KPIs."""
    entries = await db.get_all("ledger")
    total_debit = sum(e.get("debit", 0) or 0 for e in entries)
    total_credit = sum(e.get("credit", 0) or 0 for e in entries)

    return {
        "total_debit": total_debit,
        "total_credit": total_credit,
        "net_balance": total_debit - total_credit,
        "entry_count": len(entries),
        "last_sync_time": now_iso(),
    }


# =====================================================================
# Transaction Logs
# =====================================================================

async def get_transaction_logs() -> List[Dict[str, Any]]:
    """Get all transaction logs, newest first."""
    logs = await db.get_all("transaction_logs")
    return sorted(logs, key=lambda l: l.get("timestamp", ""), reverse=True)


# =====================================================================
# Internal Helpers
# =====================================================================

async def _record_transaction(product: dict, quantity: int, transaction_type: str, reference_id: str = None):
    """Record a sale/booking transaction in the transaction log."""
    unit_price = product.get("promo_price") or product["selling_price"]
    log = {
        "id": generate_id("txlog"),
        "timestamp": now_iso(),
        "product_id": product["id"],
        "product_name": product["name"],
        "member_id": None,
        "member_name": None,
        "quantity": quantity,
        "unit_price": unit_price,
        "total_amount": unit_price * quantity,
        "transaction_type": transaction_type,
    }
    if reference_id:
        # Try to get member info from booking
        booking = await db.get_by_id("bookings", reference_id)
        if booking:
            log["member_id"] = booking.get("member_id")
            log["member_name"] = booking.get("member_name")

    await db.insert("transaction_logs", log)


async def _create_sale_ledger_entries(product: dict, total_amount: int, reference_id: str = None):
    """Create paired debit/credit ledger entries for a sale."""
    # Debit: Cash/Kas Koperasi increases
    await create_ledger_entry(
        description=f"Kas Koperasi (Penjualan {product['name']})",
        debit=total_amount,
        reference_type="sale",
        reference_id=reference_id,
    )
    # Credit: Inventory/Persediaan decreases
    await create_ledger_entry(
        description=f"Persediaan {product['name']}",
        credit=total_amount,
        reference_type="sale",
        reference_id=reference_id,
    )


async def _log_activity(message: str, log_type: str = "info"):
    """Log an activity event and broadcast it."""
    log_entry = {
        "id": generate_id("log"),
        "timestamp": now_iso(),
        "message": message,
        "type": log_type,
    }
    await db.insert("activity_logs", log_entry)
    await event_bus.publish(EVENT_ACTIVITY_LOG, log_entry)
