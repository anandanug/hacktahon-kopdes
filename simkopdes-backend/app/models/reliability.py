"""
Reliability Models
Pydantic schemas for reliability simulation and metrics tracking.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class ReliabilityEventType(str, Enum):
    """Types of reliability events that can be simulated."""
    DUPLICATE_REQUEST = "duplicate_request"
    RETRY_REQUEST = "retry_request"
    NETWORK_DELAY = "network_delay"
    CONCURRENT_BOOKING = "concurrent_booking"
    OPTIMISTIC_LOCK_CONFLICT = "optimistic_lock_conflict"
    IDEMPOTENCY_SUCCESS = "idempotency_success"
    QUEUE_BACKLOG = "queue_backlog"


class ReliabilityEvent(BaseModel):
    """A single reliability event recorded during simulation."""
    id: str
    event_type: ReliabilityEventType
    description: str
    status: str = "recorded"  # recorded, resolved, failed
    details: dict = {}
    timestamp: str = ""

    class Config:
        from_attributes = True


class SimulationRequest(BaseModel):
    """Request to run a reliability simulation scenario."""
    scenario: ReliabilityEventType
    params: dict = Field(default_factory=dict, description="Extra scenario params")


class SimulationResult(BaseModel):
    """Result of a reliability simulation run."""
    scenario: str
    success: bool
    message: str
    events: List[ReliabilityEvent] = []
    metrics: dict = {}
    duration_ms: float = 0


class ReliabilityMetrics(BaseModel):
    """Aggregated reliability metrics for the tech console."""
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    duplicate_blocked: int = 0
    retries_succeeded: int = 0
    avg_latency_ms: float = 0
    optimistic_lock_conflicts: int = 0
    idempotency_hits: int = 0
    queue_backlog_peak: int = 0
    uptime_seconds: float = 0
