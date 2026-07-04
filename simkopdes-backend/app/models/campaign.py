"""
Campaign Models
Pydantic schemas for flash sale campaigns and WhatsApp blast.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class CampaignStatus(str, Enum):
    """Campaign lifecycle states."""
    PENDING = "Pending"
    SENDING = "Sending"
    SENT = "Sent"
    COMPLETED = "Completed"
    FAILED = "Failed"


class Campaign(BaseModel):
    """Full campaign model."""
    id: str
    product_id: str
    product_name: str
    campaign_type: str = "flash_sale"
    discount_percentage: int = 0
    original_price: int = 0
    promo_price: int = 0
    urgency_score: float = 0.0
    message_template: str = ""
    target_member_ids: List[str] = []
    target_member_count: int = 0
    status: CampaignStatus = CampaignStatus.PENDING
    bookings_generated: int = 0
    created_at: str = ""
    sent_at: Optional[str] = None

    class Config:
        from_attributes = True


class CampaignTriggerRequest(BaseModel):
    """Schema for manually triggering a flash sale campaign."""
    product_id: str
    discount_percentage: Optional[int] = Field(None, ge=1, le=50)
    target_all_members: bool = True


class CampaignTriggerResponse(BaseModel):
    """Response after triggering a campaign."""
    success: bool
    message: str
    campaign: Optional[Campaign] = None


class EngineAnalysisResult(BaseModel):
    """Result of a single demand engine analysis cycle."""
    cycle_id: str
    timestamp: str
    products_analyzed: int
    dead_stock_found: int
    campaigns_generated: int
    campaigns: List[Campaign] = []
    details: dict = {}
