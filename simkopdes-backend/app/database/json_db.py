"""
JSON In-Memory Database
Thread-safe in-memory database using Python dicts.
Supports optional file persistence for demo continuity.
"""
import json
import asyncio
import logging
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional
from copy import deepcopy

from app.core import config

logger = logging.getLogger(__name__)


class JsonDatabase:
    """
    In-memory document database backed by Python dicts.
    Each 'collection' is a list of dicts keyed by collection name.
    Thread-safe via asyncio.Lock for concurrent access.
    """

    def __init__(self):
        self._data: Dict[str, List[Dict[str, Any]]] = {}
        self._lock = asyncio.Lock()
        self._initialized = False

    # ------------------------------------------------------------------
    # Initialization
    # ------------------------------------------------------------------

    async def initialize(self, seed_file: Optional[Path] = None):
        """
        Initialize database with empty collections and optionally load seed data.
        Tries to load from snapshot first, then falls back to seed file.
        """
        async with self._lock:
            # Define all collections
            collections = [
                "products", "bookings", "members", "ledger",
                "campaigns", "transaction_logs", "queue_items",
                "reliability_events", "activity_logs",
            ]
            for col in collections:
                self._data[col] = []

            # Try loading from snapshot first
            snapshot_loaded = False
            if config.DB_SNAPSHOT_FILE.exists():
                try:
                    with open(config.DB_SNAPSHOT_FILE, "r", encoding="utf-8") as f:
                        snapshot = json.load(f)
                    for col_name, col_data in snapshot.items():
                        if col_name in self._data:
                            self._data[col_name] = col_data
                    snapshot_loaded = True
                    logger.info("Database loaded from snapshot file")
                except Exception as e:
                    logger.warning(f"Failed to load snapshot: {e}")

            # If no snapshot, load seed data
            if not snapshot_loaded and seed_file and seed_file.exists():
                try:
                    with open(seed_file, "r", encoding="utf-8") as f:
                        seed = json.load(f)
                    for col_name, col_data in seed.items():
                        if col_name in self._data:
                            self._data[col_name] = col_data
                    logger.info(f"Database seeded from {seed_file}")
                except Exception as e:
                    logger.error(f"Failed to load seed data: {e}")

            self._initialized = True
            total = sum(len(v) for v in self._data.values())
            logger.info(f"Database initialized with {total} total records across {len(self._data)} collections")

    # ------------------------------------------------------------------
    # CRUD Operations
    # ------------------------------------------------------------------

    async def get_all(self, collection: str) -> List[Dict[str, Any]]:
        """Get all documents in a collection."""
        async with self._lock:
            return deepcopy(self._data.get(collection, []))

    async def get_by_id(self, collection: str, doc_id: str) -> Optional[Dict[str, Any]]:
        """Get a single document by its 'id' field."""
        async with self._lock:
            for doc in self._data.get(collection, []):
                if doc.get("id") == doc_id:
                    return deepcopy(doc)
            return None

    async def insert(self, collection: str, document: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a new document into a collection. Returns the inserted document."""
        async with self._lock:
            if collection not in self._data:
                self._data[collection] = []
            self._data[collection].append(deepcopy(document))
            return deepcopy(document)

    async def insert_many(self, collection: str, documents: List[Dict[str, Any]]) -> int:
        """Insert multiple documents. Returns count of inserted."""
        async with self._lock:
            if collection not in self._data:
                self._data[collection] = []
            for doc in documents:
                self._data[collection].append(deepcopy(doc))
            return len(documents)

    async def update(self, collection: str, doc_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update a document by ID. Merges updates into existing document.
        Returns the updated document or None if not found.
        """
        async with self._lock:
            for i, doc in enumerate(self._data.get(collection, [])):
                if doc.get("id") == doc_id:
                    self._data[collection][i] = {**doc, **updates}
                    return deepcopy(self._data[collection][i])
            return None

    async def update_with_version(
        self, collection: str, doc_id: str, updates: Dict[str, Any], expected_version: int
    ) -> Optional[Dict[str, Any]]:
        """
        Optimistic locking update. Only updates if current version matches expected_version.
        Automatically increments the version field.
        Returns updated document or None on version conflict.
        """
        async with self._lock:
            for i, doc in enumerate(self._data.get(collection, [])):
                if doc.get("id") == doc_id:
                    current_version = doc.get("version", 1)
                    if current_version != expected_version:
                        return None  # Version conflict!
                    updates["version"] = current_version + 1
                    self._data[collection][i] = {**doc, **updates}
                    return deepcopy(self._data[collection][i])
            return None

    async def delete(self, collection: str, doc_id: str) -> bool:
        """Delete a document by ID. Returns True if deleted, False if not found."""
        async with self._lock:
            col = self._data.get(collection, [])
            original_len = len(col)
            self._data[collection] = [doc for doc in col if doc.get("id") != doc_id]
            return len(self._data[collection]) < original_len

    async def query(
        self, collection: str, filter_fn: Callable[[Dict[str, Any]], bool]
    ) -> List[Dict[str, Any]]:
        """Query documents using a filter function."""
        async with self._lock:
            results = [
                deepcopy(doc)
                for doc in self._data.get(collection, [])
                if filter_fn(doc)
            ]
            return results

    async def count(self, collection: str) -> int:
        """Count documents in a collection."""
        async with self._lock:
            return len(self._data.get(collection, []))

    # ------------------------------------------------------------------
    # Persistence (Optional snapshot for demo continuity)
    # ------------------------------------------------------------------

    async def save_snapshot(self):
        """Save current database state to a JSON file."""
        async with self._lock:
            try:
                config.DATA_DIR.mkdir(parents=True, exist_ok=True)
                with open(config.DB_SNAPSHOT_FILE, "w", encoding="utf-8") as f:
                    json.dump(self._data, f, indent=2, ensure_ascii=False, default=str)
                logger.info("Database snapshot saved successfully")
            except Exception as e:
                logger.error(f"Failed to save snapshot: {e}")

    async def clear_collection(self, collection: str):
        """Clear all documents in a collection."""
        async with self._lock:
            self._data[collection] = []

    async def get_stats(self) -> Dict[str, int]:
        """Get document counts per collection."""
        async with self._lock:
            return {col: len(docs) for col, docs in self._data.items()}


# Global singleton database instance
db = JsonDatabase()
