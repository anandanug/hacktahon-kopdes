"""
Gateway Service
Handles idempotency, optimistic locking, duplicate prevention, and rate limiting.
Acts as the reliability layer between frontend requests and backend processing.
"""
import asyncio
import time
import logging
from typing import Optional, Dict, Any, Tuple

from app.utils.idempotency import idempotency_store
from app.utils.helpers import generate_idempotency_key, generate_id, now_iso
from app.database.json_db import db
from app.core.events import event_bus, EVENT_RELIABILITY_EVENT, EVENT_ACTIVITY_LOG

logger = logging.getLogger(__name__)

# Simple in-memory rate limiter: endpoint -> {client_key: last_request_time}
_rate_limit_store: Dict[str, Dict[str, float]] = {}
_rate_limit_lock = asyncio.Lock()

# Metrics counters
_metrics = {
    "total_requests": 0,
    "successful_requests": 0,
    "failed_requests": 0,
    "duplicate_blocked": 0,
    "retries_succeeded": 0,
    "optimistic_lock_conflicts": 0,
    "idempotency_hits": 0,
    "start_time": time.time(),
}
_metrics_lock = asyncio.Lock()


async def increment_metric(key: str, amount: int = 1):
    """Thread-safe metric increment."""
    async with _metrics_lock:
        _metrics[key] = _metrics.get(key, 0) + amount


async def get_metrics() -> dict:
    """Get current gateway reliability metrics."""
    async with _metrics_lock:
        uptime = time.time() - _metrics["start_time"]
        total = _metrics["total_requests"]
        successful = _metrics["successful_requests"]
        return {
            **_metrics,
            "uptime_seconds": round(uptime, 1),
            "success_rate": round(successful / total * 100, 1) if total > 0 else 100.0,
            "avg_latency_ms": 12.0,  # Simulated metric
        }


async def check_idempotency(key: Optional[str]) -> Tuple[bool, Optional[Any], str]:
    """
    Check if a request is a duplicate via idempotency key.
    Returns: (is_duplicate, cached_response, key_used)
    """
    if not key:
        # Generate a new key if none provided
        key = generate_idempotency_key()
        return False, None, key

    is_dup, cached = await idempotency_store.check_and_set(key, None)

    if is_dup:
        await increment_metric("duplicate_blocked")
        await increment_metric("idempotency_hits")
        await _record_reliability_event(
            "idempotency_success",
            f"Duplicate request blocked with key {key}",
            {"key": key}
        )
        logger.info(f"Gateway: Duplicate request blocked [{key}]")
        return True, cached, key

    return False, None, key


async def store_idempotency_response(key: str, response: Any):
    """Store the response for an idempotency key after successful processing."""
    await idempotency_store.update_response(key, response)


async def check_rate_limit(endpoint: str, client_key: str = "default", min_interval: float = 2.0) -> bool:
    """
    Simple rate limiter. Returns True if request should proceed, False if rate limited.
    """
    async with _rate_limit_lock:
        if endpoint not in _rate_limit_store:
            _rate_limit_store[endpoint] = {}

        now = time.time()
        last_time = _rate_limit_store[endpoint].get(client_key, 0)

        if now - last_time < min_interval:
            await increment_metric("duplicate_blocked")
            logger.info(f"Gateway: Rate limited [{endpoint}] for client [{client_key}]")
            return False

        _rate_limit_store[endpoint][client_key] = now
        return True


async def check_optimistic_lock(collection: str, doc_id: str, expected_version: int) -> Tuple[bool, Optional[Dict]]:
    """
    Check if a document's version matches the expected version.
    Returns: (version_matches, current_document)
    """
    doc = await db.get_by_id(collection, doc_id)
    if not doc:
        return False, None

    current_version = doc.get("version", 1)
    if current_version != expected_version:
        await increment_metric("optimistic_lock_conflicts")
        await _record_reliability_event(
            "optimistic_lock_conflict",
            f"Version conflict on {collection}/{doc_id}: expected v{expected_version}, got v{current_version}",
            {"collection": collection, "doc_id": doc_id, "expected": expected_version, "actual": current_version}
        )
        logger.warning(f"Gateway: Optimistic lock conflict on {collection}/{doc_id}")
        return False, doc

    return True, doc


async def _record_reliability_event(event_type: str, description: str, details: dict = None):
    """Record a reliability event for the tech console."""
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
