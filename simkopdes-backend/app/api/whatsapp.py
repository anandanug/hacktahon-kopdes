"""
WhatsApp Mock Integration API
Endpoints for the WhatsApp Mock UI to interact with the backend.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.database.json_db import db
from app.services import booking_service, campaign_service
from app.queue.booking_queue import booking_queue
from app.services.gateway_service import check_idempotency, store_idempotency_response, increment_metric
from app.utils.helpers import generate_id, generate_idempotency_key, now_iso
from app.core.events import event_bus, EVENT_WHATSAPP_MESSAGE, EVENT_ACTIVITY_LOG

router = APIRouter(prefix="/api/whatsapp", tags=["WhatsApp"])


class WhatsAppReply(BaseModel):
    """Schema for a WhatsApp reply message (e.g., 'Tebus')."""
    member_id: str
    campaign_id: str
    message: str = "TEBUS"
    quantity: int = 1


class WhatsAppBooking(BaseModel):
    """Schema for a direct WhatsApp booking."""
    product_id: str
    member_id: str
    quantity: int = 1
    customer_name: Optional[str] = None


@router.get("/campaigns")
async def list_whatsapp_campaigns():
    """
    Get active campaigns that have been sent (for WhatsApp to display as blast messages).

    Example: GET /api/whatsapp/campaigns
    """
    campaigns = await campaign_service.get_all_campaigns()
    # Only return sent campaigns
    return [c for c in campaigns if c.get("status") in ("Sent", "Completed")]


@router.post("/reply")
async def handle_reply(reply: WhatsAppReply):
    """
    Handle a member's "Tebus" reply to a campaign blast.
    Creates a booking through the gateway.

    Request Body:
    {
        "member_id": "mem-001",
        "campaign_id": "camp-abc123",
        "message": "TEBUS",
        "quantity": 1
    }

    Response:
    {
        "success": true,
        "message": "Booking created from WhatsApp reply",
        "booking": {...},
        "confirmation_text": "✅ Terima kasih..."
    }
    """
    await increment_metric("total_requests")

    # Get campaign details
    campaign = await campaign_service.get_campaign_by_id(reply.campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Get member
    member = await db.get_by_id("members", reply.member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    # Create idempotency key for this reply
    idem_key = generate_idempotency_key()

    # Create booking
    booking = await booking_service.create_booking(
        product_id=campaign["product_id"],
        member_id=reply.member_id,
        quantity=reply.quantity,
        idempotency_key=idem_key,
    )

    if not booking:
        raise HTTPException(status_code=400, detail="Booking failed — product unavailable or insufficient stock")

    # Enqueue for processing
    await booking_queue.enqueue(booking["id"])

    # Update campaign bookings count
    current_count = campaign.get("bookings_generated", 0)
    await db.update("campaigns", reply.campaign_id, {"bookings_generated": current_count + 1})

    # Build confirmation text for WhatsApp
    confirmation = (
        f"✅ Terima kasih atas pesanan Anda, {member['name']}.\n"
        f"Pesanan sedang diproses oleh koperasi.\n\n"
        f"📦 {campaign['product_name']} x{reply.quantity}\n"
        f"💰 Total: Rp{booking['total_price']:,}\n"
        f"🔖 Kode Booking: #{booking['booking_code']}\n\n"
        f"Silakan melakukan pembayaran atau mengambil barang sesuai instruksi petugas."
    ).replace(",", ".")

    # Send confirmation via WebSocket
    await event_bus.publish(EVENT_WHATSAPP_MESSAGE, {
        "type": "booking_confirmation",
        "member_id": reply.member_id,
        "member_name": member["name"],
        "booking_id": booking["id"],
        "booking_code": booking["booking_code"],
        "product_name": campaign["product_name"],
        "total_price": booking["total_price"],
        "quantity": reply.quantity,
        "confirmation_text": confirmation,
        "timestamp": now_iso(),
    })

    await increment_metric("successful_requests")

    return {
        "success": True,
        "message": "Booking created from WhatsApp reply",
        "booking": booking,
        "confirmation_text": confirmation,
        "idempotency_key": idem_key,
    }


@router.get("/bookings/{member_id}")
async def get_member_bookings(member_id: str):
    """
    Get all bookings for a specific member.

    Example: GET /api/whatsapp/bookings/mem-001
    """
    return await booking_service.get_bookings_by_member(member_id)


@router.get("/products")
async def get_product_catalog():
    """
    Get product catalog for WhatsApp catalog display.
    Includes promo pricing from campaigns.

    Example: GET /api/whatsapp/products
    """
    products = await db.get_all("products")
    # Transform to WhatsApp-friendly format
    catalog = []
    for p in products:
        catalog.append({
            "id": p["id"],
            "name": p["name"],
            "price": p["selling_price"],
            "promoPrice": p.get("promo_price"),
            "unit": p["unit"],
            "category": p["category"],
            "stock": p["stock"],
            "description": f"{p['name']} - {p['category']}",
            "imageUrl": "",  # Frontend uses its own images
            "isPromo": p.get("promo_price") is not None and p.get("promo_price", 0) > 0,
        })
    return catalog


@router.post("/book")
async def whatsapp_direct_book(booking_req: WhatsAppBooking):
    """
    Direct booking from WhatsApp catalog (not from campaign reply).

    Request Body:
    {
        "product_id": "prod-001",
        "member_id": "mem-001",
        "quantity": 1,
        "customer_name": "Budi Santoso"
    }
    """
    await increment_metric("total_requests")

    idem_key = generate_idempotency_key()

    booking = await booking_service.create_booking(
        product_id=booking_req.product_id,
        member_id=booking_req.member_id,
        quantity=booking_req.quantity,
        idempotency_key=idem_key,
    )

    if not booking:
        raise HTTPException(status_code=400, detail="Booking failed")

    await booking_queue.enqueue(booking["id"])

    return {
        "success": True,
        "booking": booking,
        "idempotency_key": idem_key,
    }
