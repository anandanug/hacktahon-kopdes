"""
Reliability Simulation API Endpoints
Trigger and view results of reliability simulation scenarios.
"""
from fastapi import APIRouter, HTTPException

from app.services import reliability_service
from app.services.gateway_service import get_metrics
from app.database.json_db import db

router = APIRouter(prefix="/api/simulate", tags=["Reliability Simulation"])

VALID_SCENARIOS = [
    "duplicate_request",
    "retry_request",
    "network_delay",
    "concurrent_booking",
    "optimistic_lock_conflict",
    "idempotency_success",
    "queue_backlog",
]


@router.post("/{scenario}")
async def run_simulation(scenario: str):
    """
    Run a reliability simulation scenario.

    Valid scenarios:
    - duplicate_request: Send 2 identical requests, second should be blocked
    - retry_request: First request fails, retry succeeds
    - network_delay: Simulate 2-5 second network delay
    - concurrent_booking: 5 concurrent bookings for product with stock=3
    - optimistic_lock_conflict: 2 simultaneous updates cause version conflict
    - idempotency_success: Same key returns cached response
    - queue_backlog: Flood queue with 10 bookings for FIFO demo

    Example: POST /api/simulate/duplicate_request

    Response:
    {
        "scenario": "duplicate_request",
        "success": true,
        "message": "Duplicate request successfully blocked",
        "events": [...],
        "metrics": {...},
        "duration_ms": 150.5
    }
    """
    if scenario not in VALID_SCENARIOS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown scenario: {scenario}. Valid: {', '.join(VALID_SCENARIOS)}"
        )

    result = await reliability_service.run_simulation(scenario)
    return result


@router.get("/results")
async def list_simulation_results():
    """
    Get all reliability events recorded from simulations.

    Example: GET /api/simulate/results
    """
    events = await db.get_all("reliability_events")
    return sorted(events, key=lambda e: e.get("timestamp", ""), reverse=True)


@router.get("/metrics")
async def simulation_metrics():
    """
    Get aggregated reliability metrics from gateway.

    Example: GET /api/simulate/metrics
    """
    gateway_metrics = await get_metrics()
    events = await db.get_all("reliability_events")

    # Count by type
    event_counts = {}
    for e in events:
        t = e.get("event_type", "unknown")
        event_counts[t] = event_counts.get(t, 0) + 1

    return {
        "gateway_metrics": gateway_metrics,
        "event_counts": event_counts,
        "total_events": len(events),
    }


@router.get("/scenarios")
async def list_scenarios():
    """
    List all available simulation scenarios with descriptions.

    Example: GET /api/simulate/scenarios
    """
    return [
        {
            "id": "duplicate_request",
            "name": "Duplicate Request",
            "description": "Kirim 2 booking identik → yang kedua ditolak karena idempotency key",
        },
        {
            "id": "retry_request",
            "name": "Retry Request",
            "description": "Request pertama timeout, retry kedua berhasil",
        },
        {
            "id": "network_delay",
            "name": "Network Delay",
            "description": "Simulasi delay jaringan 2-5 detik pada booking",
        },
        {
            "id": "concurrent_booking",
            "name": "Concurrent Booking",
            "description": "5 booking simultan untuk produk dengan stok 3 → 3 berhasil, 2 gagal",
        },
        {
            "id": "optimistic_lock_conflict",
            "name": "Optimistic Lock Conflict",
            "description": "2 update stok bersamaan → yang kedua terdeteksi version conflict",
        },
        {
            "id": "idempotency_success",
            "name": "Idempotency Success",
            "description": "Retry dengan key yang sama → return cached response tanpa re-processing",
        },
        {
            "id": "queue_backlog",
            "name": "Queue Backlog",
            "description": "10 booking sekaligus → queue memproses secara FIFO berurutan",
        },
    ]
