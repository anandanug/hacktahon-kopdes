"""
Queue Item Models
Pydantic schemas for the FIFO booking queue.
"""
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class QueueItemStatus(str, Enum):
    """Queue item processing states."""
    QUEUED = "Queued"
    PROCESSING = "Processing"
    DONE = "Done"
    FAILED = "Failed"


class QueueItem(BaseModel):
    """A single item in the booking processing queue."""
    id: str
    booking_id: str
    priority: int = Field(0, description="Lower number = higher priority")
    status: QueueItemStatus = QueueItemStatus.QUEUED
    enqueued_at: str = ""
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    retry_count: int = 0
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


class QueueStatus(BaseModel):
    """Current state of the booking queue for dashboard display."""
    queue_size: int
    processing_count: int
    completed_count: int
    failed_count: int
    total_processed: int
    avg_processing_time_ms: float
    is_worker_running: bool
