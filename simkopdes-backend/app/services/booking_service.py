"""
Booking Service
Manages booking lifecycle: creation, queue submission, status updates, and cancellation.
"""
import logging
from typing import Optional, List, Dict, Any

from app.database.json_db import db
from app.core.events import (
    event_bus, EVENT_BOOKING_CREATED, EVENT_BOOKING_STATUS_CHANGED, EVENT_ACTIVITY_LOG
)
from app.utils.helpers import generate_id, generate_booking_code, now_iso

logger = logging.getLogger(__name__)


async def get_all_bookings() -> List[Dict[str, Any]]:
    """Get all bookings, newest first."""
    bookings = await db.get_all("bookings")
    return sorted(bookings, key=lambda b: b.get("created_at", ""), reverse=True)


async def get_booking_by_id(booking_id: str) -> Optional[Dict[str, Any]]:
    """Get a single booking by ID."""
    return await db.get_by_id("bookings", booking_id)


async def get_active_bookings() -> List[Dict[str, Any]]:
    """Get bookings that are still being processed (not completed/cancelled/failed)."""
    active_statuses = {"Pending", "Queued", "Processing", "Confirmed"}
    return await db.query("bookings", lambda b: b.get("status") in active_statuses)


async def get_bookings_by_member(member_id: str) -> List[Dict[str, Any]]:
    """Get all bookings for a specific member."""
    bookings = await db.query("bookings", lambda b: b.get("member_id") == member_id)
    return sorted(bookings, key=lambda b: b.get("created_at", ""), reverse=True)


async def create_booking(product_id: str, member_id: str, quantity: int = 1,
                          idempotency_key: str = None) -> Optional[Dict[str, Any]]:
    """
    Create a new booking entry.
    Does NOT process the booking — that's handled by the queue worker.
    """
    # Validate product exists
    product = await db.get_by_id("products", product_id)
    if not product:
        logger.warning(f"Booking failed: product {product_id} not found")
        return None

    # Validate member exists
    member = await db.get_by_id("members", member_id)
    if not member:
        logger.warning(f"Booking failed: member {member_id} not found")
        return None

    # Check stock availability (pre-check, real deduction happens in queue)
    if product["stock"] < quantity:
        logger.warning(f"Booking failed: insufficient stock for {product['name']}")
        return None

    # Determine price (promo if available)
    unit_price = product.get("promo_price") or product["selling_price"]

    booking = {
        "id": generate_id("book"),
        "booking_code": generate_booking_code(),
        "product_id": product_id,
        "product_name": product["name"],
        "member_id": member_id,
        "member_name": member["name"],
        "quantity": quantity,
        "unit": product["unit"],
        "unit_price": unit_price,
        "total_price": unit_price * quantity,
        "status": "Pending",
        "idempotency_key": idempotency_key,
        "queue_position": None,
        "created_at": now_iso(),
        "updated_at": now_iso(),
        "version": 1,
    }

    result = await db.insert("bookings", booking)

    await event_bus.publish(EVENT_BOOKING_CREATED, result)
    await _log_activity(
        f"Booking created: {member['name']} → {product['name']} x{quantity} [{result['booking_code']}]",
        "info"
    )

    logger.info(f"Booking created: {result['booking_code']} for {product['name']}")
    return result


async def update_booking_status(booking_id: str, new_status: str, error_message: str = None) -> Optional[Dict[str, Any]]:
    """Update booking status and broadcast change."""
    updates = {
        "status": new_status,
        "updated_at": now_iso(),
    }
    if error_message:
        updates["error_message"] = error_message

    result = await db.update("bookings", booking_id, updates)

    if result:
        await event_bus.publish(EVENT_BOOKING_STATUS_CHANGED, result)

        # Determine log type based on status
        log_type = "info"
        if new_status in ("Confirmed", "Completed"):
            log_type = "success"
        elif new_status in ("Failed", "Cancelled"):
            log_type = "error"

        await _log_activity(
            f"Booking [{result['booking_code']}] status → {new_status}",
            log_type
        )

    return result


async def cancel_booking(booking_id: str, reason: str = "Cancelled by user") -> Optional[Dict[str, Any]]:
    """Cancel a booking. Only works for Pending/Queued/Confirmed bookings."""
    booking = await db.get_by_id("bookings", booking_id)
    if not booking:
        return None

    if booking["status"] in ("Completed", "Failed", "Cancelled"):
        logger.warning(f"Cannot cancel booking {booking_id}: already in terminal state {booking['status']}")
        return booking

    # If booking was confirmed, restore stock
    if booking["status"] in ("Confirmed", "Processing"):
        product = await db.get_by_id("products", booking["product_id"])
        if product:
            await db.update("products", booking["product_id"], {
                "stock": product["stock"] + booking["quantity"],
            })
            await _log_activity(
                f"Stock restored: {product['name']} +{booking['quantity']} (cancelled booking)",
                "warning"
            )

    return await update_booking_status(booking_id, "Cancelled")


async def confirm_payment(booking_id: str) -> Optional[Dict[str, Any]]:
    """Confirm payment for a booking, moving it to Completed status."""
    booking = await db.get_by_id("bookings", booking_id)
    if not booking:
        return None

    if booking["status"] != "Confirmed":
        logger.warning(f"Cannot confirm payment for booking {booking_id}: status is {booking['status']}")
        return booking

    return await update_booking_status(booking_id, "Completed")


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
