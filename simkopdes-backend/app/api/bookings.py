"""
Bookings API Endpoints
Read-only endpoints for querying booking data.
(Booking creation goes through /api/gateway/book)
"""
from fastapi import APIRouter, HTTPException

from app.services import booking_service

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])


@router.get("")
async def list_bookings():
    """
    List all bookings (newest first).

    Example: GET /api/bookings
    """
    return await booking_service.get_all_bookings()


@router.get("/active")
async def list_active_bookings():
    """
    List bookings that are currently being processed.

    Example: GET /api/bookings/active
    """
    return await booking_service.get_active_bookings()


@router.get("/{booking_id}")
async def get_booking(booking_id: str):
    """
    Get a single booking by ID.

    Example: GET /api/bookings/book-abc123
    """
    booking = await booking_service.get_booking_by_id(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail=f"Booking {booking_id} not found")
    return booking
