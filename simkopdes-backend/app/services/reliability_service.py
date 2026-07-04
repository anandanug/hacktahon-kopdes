"""
Reliability Simulation Service
Implements 7 simulation scenarios for demonstrating system reliability features.
Each scenario generates observable events for the tech console dashboard.
"""
import asyncio
import time
import random
import logging
from typing import Dict, Any, List

from app.database.json_db import db
from app.services import booking_service, gateway_service
from app.services.ledger_service import deduct_stock
from app.queue.booking_queue import booking_queue
from app.utils.helpers import generate_id, generate_idempotency_key, now_iso
from app.utils.idempotency import idempotency_store
from app.core.events import event_bus, EVENT_RELIABILITY_EVENT, EVENT_ACTIVITY_LOG
from app.core.config import (
    SIMULATION_NETWORK_DELAY_MIN,
    SIMULATION_NETWORK_DELAY_MAX,
    SIMULATION_CONCURRENT_COUNT,
    SIMULATION_BACKLOG_COUNT,
)

logger = logging.getLogger(__name__)


async def run_simulation(scenario: str, params: dict = None) -> dict:
    """
    Execute a reliability simulation scenario.
    Returns result with events generated and metrics.
    """
    params = params or {}
    start_time = time.time()

    handlers = {
        "duplicate_request": _sim_duplicate_request,
        "retry_request": _sim_retry_request,
        "network_delay": _sim_network_delay,
        "concurrent_booking": _sim_concurrent_booking,
        "optimistic_lock_conflict": _sim_optimistic_lock_conflict,
        "idempotency_success": _sim_idempotency_success,
        "queue_backlog": _sim_queue_backlog,
    }

    handler = handlers.get(scenario)
    if not handler:
        return {
            "scenario": scenario,
            "success": False,
            "message": f"Unknown scenario: {scenario}",
            "events": [],
            "metrics": {},
            "duration_ms": 0,
        }

    await _log_activity(f"SIMULATION: Starting '{scenario}' scenario...", "warning")

    result = await handler(params)
    duration = (time.time() - start_time) * 1000

    result["duration_ms"] = round(duration, 1)
    await _log_activity(
        f"SIMULATION: '{scenario}' completed in {duration:.0f}ms — {result['message']}",
        "success" if result["success"] else "error"
    )

    return result


# =====================================================================
# Simulation Scenarios
# =====================================================================

async def _sim_duplicate_request(params: dict) -> dict:
    """
    Simulate sending 2 identical booking requests.
    The second one should be blocked by idempotency.
    """
    events = []
    key = generate_idempotency_key()

    # First request
    is_dup, cached, _ = await gateway_service.check_idempotency(key)
    events.append(await _record_event(
        "duplicate_request",
        f"First request with key {key}: {'blocked' if is_dup else 'accepted'}",
        {"attempt": 1, "key": key, "blocked": is_dup}
    ))

    # Store a mock response
    await gateway_service.store_idempotency_response(key, {"status": "confirmed", "booking_code": "BK-SIM"})

    # Second request with same key
    is_dup2, cached2, _ = await gateway_service.check_idempotency(key)
    events.append(await _record_event(
        "duplicate_request",
        f"Second request with key {key}: {'BLOCKED (duplicate)' if is_dup2 else 'accepted'}",
        {"attempt": 2, "key": key, "blocked": is_dup2, "cached_response": cached2}
    ))

    return {
        "scenario": "duplicate_request",
        "success": is_dup2,  # Success if second was blocked
        "message": f"Duplicate request {'successfully blocked' if is_dup2 else 'NOT blocked (error)'}",
        "events": events,
        "metrics": {"attempts": 2, "blocked": 1 if is_dup2 else 0},
    }


async def _sim_retry_request(params: dict) -> dict:
    """
    Simulate a request that fails on first attempt and succeeds on retry.
    """
    events = []

    # First attempt: simulate failure
    events.append(await _record_event(
        "retry_request",
        "First attempt: Connection timeout (simulated)",
        {"attempt": 1, "status": "timeout", "delay_ms": 5000}
    ))
    await asyncio.sleep(0.5)  # Brief delay to simulate

    # Second attempt: success
    events.append(await _record_event(
        "retry_request",
        "Retry attempt: Request processed successfully",
        {"attempt": 2, "status": "success", "delay_ms": 150}
    ))

    await gateway_service.increment_metric("retries_succeeded")

    return {
        "scenario": "retry_request",
        "success": True,
        "message": "Request failed on first attempt, succeeded on retry",
        "events": events,
        "metrics": {"total_attempts": 2, "final_status": "success"},
    }


async def _sim_network_delay(params: dict) -> dict:
    """
    Simulate network delay on a booking request.
    """
    events = []
    delay = random.uniform(SIMULATION_NETWORK_DELAY_MIN, SIMULATION_NETWORK_DELAY_MAX)

    events.append(await _record_event(
        "network_delay",
        f"Simulating network delay: {delay:.1f} seconds",
        {"delay_seconds": round(delay, 1), "status": "delayed"}
    ))

    await asyncio.sleep(delay)

    events.append(await _record_event(
        "network_delay",
        f"Request completed after {delay:.1f}s delay",
        {"delay_seconds": round(delay, 1), "status": "completed"}
    ))

    return {
        "scenario": "network_delay",
        "success": True,
        "message": f"Request completed with {delay:.1f}s network delay",
        "events": events,
        "metrics": {"delay_seconds": round(delay, 1)},
    }


async def _sim_concurrent_booking(params: dict) -> dict:
    """
    Simulate N concurrent bookings for a product with limited stock.
    Some should succeed and some should fail due to insufficient stock.
    """
    events = []
    products = await db.get_all("products")
    if not products:
        return {"scenario": "concurrent_booking", "success": False, "message": "No products available", "events": [], "metrics": {}}

    # Pick a product and set limited stock for demo
    product = products[0]
    original_stock = product["stock"]
    limited_stock = 3  # Only 3 available
    await db.update("products", product["id"], {"stock": limited_stock})

    members = await db.get_all("members")
    count = min(SIMULATION_CONCURRENT_COUNT, len(members) + 1)

    events.append(await _record_event(
        "concurrent_booking",
        f"Starting {count} concurrent bookings for {product['name']} (stock: {limited_stock})",
        {"product": product["name"], "stock": limited_stock, "concurrent_count": count}
    ))

    # Create concurrent booking tasks
    results = {"success": 0, "failed": 0}

    async def _attempt_booking(idx: int, member_id: str):
        booking = await booking_service.create_booking(
            product_id=product["id"],
            member_id=member_id,
            quantity=1,
        )
        if booking:
            # Try to process through queue
            await booking_queue.enqueue(booking["id"])
            # Wait a bit for processing
            await asyncio.sleep(1.5)
            # Check final status
            updated = await db.get_by_id("bookings", booking["id"])
            if updated and updated["status"] in ("Confirmed", "Completed"):
                results["success"] += 1
                return True
            else:
                results["failed"] += 1
                return False
        else:
            results["failed"] += 1
            return False

    # Run concurrently
    member_ids = [m["id"] for m in members[:count]]
    # Pad with first member if not enough members
    while len(member_ids) < count:
        member_ids.append(members[0]["id"])

    tasks = [_attempt_booking(i, mid) for i, mid in enumerate(member_ids)]
    await asyncio.gather(*tasks)

    # Wait for queue to finish processing
    await asyncio.sleep(2)

    events.append(await _record_event(
        "concurrent_booking",
        f"Results: {results['success']} succeeded, {results['failed']} failed (stock: {limited_stock})",
        {"results": results}
    ))

    # Restore original stock
    await db.update("products", product["id"], {"stock": original_stock})

    return {
        "scenario": "concurrent_booking",
        "success": True,
        "message": f"{results['success']}/{count} bookings succeeded with stock={limited_stock}",
        "events": events,
        "metrics": results,
    }


async def _sim_optimistic_lock_conflict(params: dict) -> dict:
    """
    Simulate two simultaneous stock updates that cause a version conflict.
    """
    events = []
    products = await db.get_all("products")
    if not products:
        return {"scenario": "optimistic_lock_conflict", "success": False, "message": "No products", "events": [], "metrics": {}}

    product = products[0]
    current_version = product.get("version", 1)

    events.append(await _record_event(
        "optimistic_lock_conflict",
        f"Attempting two concurrent updates on {product['name']} (version: {current_version})",
        {"product": product["name"], "version": current_version}
    ))

    # First update (should succeed)
    result1 = await db.update_with_version(
        "products", product["id"],
        {"stock": product["stock"] - 1},
        current_version
    )

    events.append(await _record_event(
        "optimistic_lock_conflict",
        f"Update 1: {'SUCCESS' if result1 else 'CONFLICT'}",
        {"update": 1, "success": result1 is not None}
    ))

    # Second update with SAME old version (should fail — version conflict)
    result2 = await db.update_with_version(
        "products", product["id"],
        {"stock": product["stock"] - 2},
        current_version  # Using stale version!
    )

    events.append(await _record_event(
        "optimistic_lock_conflict",
        f"Update 2 (stale version): {'SUCCESS (BUG!)' if result2 else 'CONFLICT DETECTED ✓'}",
        {"update": 2, "success": result2 is not None, "expected_conflict": True}
    ))

    # Restore stock
    if result1:
        await db.update("products", product["id"], {"stock": product["stock"]})

    return {
        "scenario": "optimistic_lock_conflict",
        "success": result1 is not None and result2 is None,
        "message": "First update succeeded, second correctly detected version conflict",
        "events": events,
        "metrics": {"updates_attempted": 2, "conflicts_detected": 1 if result2 is None else 0},
    }


async def _sim_idempotency_success(params: dict) -> dict:
    """
    Simulate sending the same request with the same idempotency key.
    The second should return the cached response.
    """
    events = []
    key = generate_idempotency_key()
    mock_response = {"booking_code": "BK-IDEM", "status": "Confirmed", "product": "Beras Pandanwangi"}

    # First request
    is_dup1, _, _ = await gateway_service.check_idempotency(key)
    await gateway_service.store_idempotency_response(key, mock_response)
    events.append(await _record_event(
        "idempotency_success",
        f"Request 1 with key {key}: Processed and cached",
        {"attempt": 1, "key": key, "response": mock_response}
    ))

    # Second request (retry)
    is_dup2, cached, _ = await gateway_service.check_idempotency(key)
    events.append(await _record_event(
        "idempotency_success",
        f"Request 2 (retry) with key {key}: Returned cached response",
        {"attempt": 2, "key": key, "cached": cached}
    ))

    return {
        "scenario": "idempotency_success",
        "success": is_dup2 and cached is not None,
        "message": "Retry returned cached response without re-processing",
        "events": events,
        "metrics": {"requests": 2, "cache_hits": 1},
    }


async def _sim_queue_backlog(params: dict) -> dict:
    """
    Flood the queue with many bookings to demonstrate FIFO processing.
    """
    events = []
    products = await db.get_all("products")
    members = await db.get_all("members")

    if not products or not members:
        return {"scenario": "queue_backlog", "success": False, "message": "No data", "events": [], "metrics": {}}

    product = products[0]
    count = SIMULATION_BACKLOG_COUNT

    # Ensure enough stock
    await db.update("products", product["id"], {"stock": product["stock"] + count + 5})

    events.append(await _record_event(
        "queue_backlog",
        f"Flooding queue with {count} bookings for {product['name']}",
        {"count": count, "product": product["name"]}
    ))

    # Enqueue many bookings
    booking_ids = []
    for i in range(count):
        member = members[i % len(members)]
        booking = await booking_service.create_booking(
            product_id=product["id"],
            member_id=member["id"],
            quantity=1,
        )
        if booking:
            await booking_queue.enqueue(booking["id"])
            booking_ids.append(booking["id"])

    # Get queue status
    status = await booking_queue.get_status()
    events.append(await _record_event(
        "queue_backlog",
        f"Queue backlog: {status['queue_size']} items pending, processing sequentially (FIFO)",
        {"queue_status": status, "bookings_enqueued": len(booking_ids)}
    ))

    return {
        "scenario": "queue_backlog",
        "success": True,
        "message": f"{count} bookings enqueued. Queue processing FIFO sequentially.",
        "events": events,
        "metrics": {"enqueued": len(booking_ids), "queue_size": status["queue_size"]},
    }


# =====================================================================
# Helpers
# =====================================================================

async def _record_event(event_type: str, description: str, details: dict = None) -> dict:
    """Record a reliability event in the database and broadcast it."""
    event = {
        "id": generate_id("rel"),
        "event_type": event_type,
        "description": description,
        "status": "recorded",
        "details": details or {},
        "timestamp": now_iso(),
    }
    await db.insert("reliability_events", event)
    await event_bus.publish(EVENT_RELIABILITY_EVENT, event)
    return event


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


def now_iso():
    from app.utils.helpers import now_iso as _now_iso
    return _now_iso()
