"""
API Gateway Endpoints
Central gateway for booking operations with idempotency, rate limiting, and optimistic locking.
"""
from fastapi import APIRouter, HTTPException, Request
from typing import Optional

from app.services import gateway_service, booking_service, campaign_service
from app.queue.booking_queue import booking_queue
from app.models.booking import BookingCreate
from app.utils.helpers import generate_idempotency_key

router = APIRouter(prefix="/api/gateway", tags=["Gateway"])


@router.get("/health")
async def gateway_health():
    """
    Gateway health check endpoint.

    Response: {"status": "healthy", "queue_status": {...}, "metrics": {...}}
    """
    queue_status = await booking_queue.get_status()
    metrics = await gateway_service.get_metrics()
    return {
        "status": "healthy",
        "queue_status": queue_status,
        "metrics": metrics,
    }


@router.get("/metrics")
async def gateway_metrics():
    """
    Get gateway reliability metrics.

    Response:
    {
        "total_requests": 150,
        "successful_requests": 145,
        "duplicate_blocked": 3,
        "idempotency_hits": 2,
        ...
    }
    """
    return await gateway_service.get_metrics()


@router.post("/book")
async def gateway_book(booking: BookingCreate):
    """
    Create a booking through the gateway with idempotency protection.
    The booking is enqueued for FIFO processing.

    Request Body:
    {
        "product_id": "prod-001",
        "member_id": "mem-001",
        "quantity": 1,
        "idempotency_key": "IDEM-ABC123" (optional)
    }

    Response:
    {
        "success": true,
        "message": "Booking created and enqueued",
        "booking": {...},
        "idempotency_key": "IDEM-ABC123"
    }

    Error Responses:
    - 409: Duplicate request (idempotency)
    - 429: Rate limited
    - 404: Product/member not found
    - 400: Insufficient stock
    """
    await gateway_service.increment_metric("total_requests")

    # Step 1: Check idempotency
    is_dup, cached_response, key = await gateway_service.check_idempotency(booking.idempotency_key)
    if is_dup:
        return {
            "success": True,
            "message": "Duplicate request — returning cached response",
            "booking": cached_response,
            "idempotency_key": key,
            "is_cached": True,
        }

    # Step 2: Rate limiting
    rate_ok = await gateway_service.check_rate_limit("book", booking.member_id)
    if not rate_ok:
        await gateway_service.increment_metric("failed_requests")
        raise HTTPException(
            status_code=429,
            detail="Rate limited. Please wait before submitting another booking."
        )

    # Step 3: Create the booking
    result = await booking_service.create_booking(
        product_id=booking.product_id,
        member_id=booking.member_id,
        quantity=booking.quantity,
        idempotency_key=key,
    )

    if not result:
        await gateway_service.increment_metric("failed_requests")
        raise HTTPException(
            status_code=400,
            detail="Booking failed. Product not found, member not found, or insufficient stock."
        )

    # Step 4: Enqueue for FIFO processing
    queue_pos = await booking_queue.enqueue(result["id"])

    # Step 5: Cache response for idempotency
    response_data = {
        **result,
        "queue_position": queue_pos,
    }
    await gateway_service.store_idempotency_response(key, response_data)

    return {
        "success": True,
        "message": "Booking created and enqueued for processing",
        "booking": response_data,
        "idempotency_key": key,
    }


@router.post("/cancel-booking/{booking_id}")
async def gateway_cancel_booking(booking_id: str, reason: Optional[str] = None):
    """
    Cancel a booking through the gateway.

    Example: POST /api/gateway/cancel-booking/book-abc123
    """
    await gateway_service.increment_metric("total_requests")

    result = await booking_service.cancel_booking(booking_id, reason or "Cancelled by user")
    if not result:
        raise HTTPException(status_code=404, detail=f"Booking {booking_id} not found")

    return {
        "success": True,
        "message": f"Booking {booking_id} cancelled",
        "booking": result,
    }


@router.post("/confirm-payment/{booking_id}")
async def gateway_confirm_payment(booking_id: str):
    """
    Confirm payment for a booking, moving it to Completed status.

    Example: POST /api/gateway/confirm-payment/book-abc123
    """
    await gateway_service.increment_metric("total_requests")

    result = await booking_service.confirm_payment(booking_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"Booking {booking_id} not found")

    await gateway_service.increment_metric("successful_requests")
    return {
        "success": True,
        "message": f"Payment confirmed for booking {booking_id}",
        "booking": result,
    }


@router.post("/trigger-campaign")
async def gateway_trigger_campaign(product_id: str, discount: Optional[int] = None):
    """
    Trigger a flash sale campaign for a product and immediately send to members.

    Example: POST /api/gateway/trigger-campaign?product_id=prod-001&discount=15
    """
    await gateway_service.increment_metric("total_requests")

    result = await campaign_service.trigger_and_send_campaign(product_id, discount)
    if not result:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found")

    await gateway_service.increment_metric("successful_requests")
    return {
        "success": True,
        "message": f"Campaign triggered and sent for {result['product_name']}",
        "campaign": result,
    }


@router.post("/sync-ledger")
async def gateway_sync_ledger():
    """
    Force a ledger synchronization check.
    Returns current ledger summary.
    """
    from app.services.ledger_service import get_ledger_summary
    summary = await get_ledger_summary()
    return {
        "success": True,
        "message": "Ledger synchronized",
        "summary": summary,
    }
