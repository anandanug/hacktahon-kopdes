"""
Idempotency Key Store
In-memory store for tracking idempotency keys to prevent duplicate request processing.
"""
import asyncio
import time
import logging
from typing import Any, Dict, Optional, Tuple

from app.core.config import IDEMPOTENCY_TTL_SECONDS

logger = logging.getLogger(__name__)


class IdempotencyStore:
    """
    Stores idempotency keys with their cached responses and expiration times.
    Keys expire after TTL seconds and are cleaned up periodically.
    """

    def __init__(self):
        # key -> (response_data, expiry_timestamp)
        self._store: Dict[str, Tuple[Any, float]] = {}
        self._lock = asyncio.Lock()

    async def check_and_set(self, key: str, response: Any) -> Tuple[bool, Optional[Any]]:
        """
        Check if a key already exists.
        - If exists and not expired: returns (True, cached_response) — duplicate!
        - If not exists or expired: stores the key and returns (False, None) — proceed.
        """
        async with self._lock:
            now = time.time()

            if key in self._store:
                cached_response, expiry = self._store[key]
                if now < expiry:
                    logger.info(f"Idempotency: Duplicate key detected [{key}]")
                    return True, cached_response
                else:
                    # Key expired, remove and allow re-use
                    del self._store[key]

            # Store new key with TTL
            self._store[key] = (response, now + IDEMPOTENCY_TTL_SECONDS)
            return False, None

    async def update_response(self, key: str, response: Any):
        """Update the cached response for an existing key (after processing completes)."""
        async with self._lock:
            if key in self._store:
                _, expiry = self._store[key]
                self._store[key] = (response, expiry)

    async def exists(self, key: str) -> bool:
        """Check if a key exists and is not expired."""
        async with self._lock:
            if key in self._store:
                _, expiry = self._store[key]
                if time.time() < expiry:
                    return True
                del self._store[key]
            return False

    async def get_cached_response(self, key: str) -> Optional[Any]:
        """Get the cached response for a key if it exists and isn't expired."""
        async with self._lock:
            if key in self._store:
                response, expiry = self._store[key]
                if time.time() < expiry:
                    return response
            return None

    async def cleanup_expired(self):
        """Remove all expired keys."""
        async with self._lock:
            now = time.time()
            expired_keys = [k for k, (_, exp) in self._store.items() if now >= exp]
            for k in expired_keys:
                del self._store[k]
            if expired_keys:
                logger.debug(f"Idempotency: Cleaned up {len(expired_keys)} expired keys")

    async def get_stats(self) -> dict:
        """Get store statistics."""
        async with self._lock:
            now = time.time()
            active = sum(1 for _, (_, exp) in self._store.items() if now < exp)
            return {
                "total_keys": len(self._store),
                "active_keys": active,
                "expired_keys": len(self._store) - active,
            }


# Global singleton
idempotency_store = IdempotencyStore()
