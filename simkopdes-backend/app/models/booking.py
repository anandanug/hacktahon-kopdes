"""
Booking Models
Pydantic schemas for booking lifecycle management.
"""
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class BookingStatus(str, Enum):
    """Booking lifecycle states."""
    PENDING = "Pending"
    QUEUED = "Queued"
    PROCESSING = "Processing"
    CONFIRMED = "Confirmed"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"
    FAILED = "Failed"


class BookingCreate(BaseModel):
    """Schema for creating a new booking from WhatsApp or dashboard."""
    product_id: str = Field(..., description="Product to book")
    member_id: str = Field(..., description="Member making the booking")
    quantity: int = Field(1, ge=1, description="Number of units to book")
    idempotency_key: Optional[str] = Field(None, description="Client-generated idempotency key")


class BookingCancel(BaseModel):
    """Schema for cancelling a booking."""
    reason: Optional[str] = Field("Cancelled by user", description="Cancellation reason")


class Booking(BaseModel):
    """Full booking model with all lifecycle data."""
    id: str
    booking_code: str
    product_id: str
    product_name: str
    member_id: str
    member_name: str
    quantity: int
    unit: str
    unit_price: int
    total_price: int
    status: BookingStatus = BookingStatus.PENDING
    idempotency_key: Optional[str] = None
    queue_position: Optional[int] = None
    created_at: str = ""
    updated_at: str = ""
    version: int = 1

    class Config:
        from_attributes = True


class BookingResponse(BaseModel):
    """API response for booking operations."""
    success: bool
    message: str
    booking: Optional[Booking] = None
    idempotency_key: Optional[str] = None
