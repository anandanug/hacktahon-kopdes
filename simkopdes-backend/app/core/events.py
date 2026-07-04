"""
Internal Event Bus
Simple pub/sub event system for decoupled communication between services.
Services publish events (e.g., "stock_updated") and WebSocket manager subscribes
to broadcast them to connected clients.
"""
import asyncio
from typing import Any, Callable, Coroutine, Dict, List
import logging

logger = logging.getLogger(__name__)


class EventBus:
    """
    Lightweight async event bus.
    Supports multiple subscribers per event type.
    """

    def __init__(self):
        self._subscribers: Dict[str, List[Callable[..., Coroutine]]] = {}

    def subscribe(self, event_type: str, handler: Callable[..., Coroutine]):
        """Register an async handler for a specific event type."""
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(handler)
        logger.debug(f"EventBus: Subscribed handler to '{event_type}'")

    def unsubscribe(self, event_type: str, handler: Callable[..., Coroutine]):
        """Remove a handler from an event type."""
        if event_type in self._subscribers:
            self._subscribers[event_type] = [
                h for h in self._subscribers[event_type] if h != handler
            ]

    async def publish(self, event_type: str, data: Any = None):
        """
        Publish an event to all subscribers.
        Each subscriber is called concurrently via asyncio.gather.
        """
        handlers = self._subscribers.get(event_type, [])
        if not handlers:
            return

        logger.debug(f"EventBus: Publishing '{event_type}' to {len(handlers)} handlers")
        tasks = [handler(data) for handler in handlers]
        await asyncio.gather(*tasks, return_exceptions=True)


# === Event Type Constants ===
# Use these constants to avoid typos when subscribing/publishing events.

EVENT_STOCK_UPDATED = "stock_updated"
EVENT_BOOKING_CREATED = "booking_created"
EVENT_BOOKING_STATUS_CHANGED = "booking_status_changed"
EVENT_CAMPAIGN_CREATED = "campaign_created"
EVENT_CAMPAIGN_SENT = "campaign_sent"
EVENT_LEDGER_ENTRY_ADDED = "ledger_entry_added"
EVENT_QUEUE_STATUS_CHANGED = "queue_status_changed"
EVENT_RELIABILITY_EVENT = "reliability_event"
EVENT_ACTIVITY_LOG = "activity_log"
EVENT_ENGINE_ANALYSIS_COMPLETE = "engine_analysis_complete"
EVENT_WHATSAPP_MESSAGE = "whatsapp_message"
EVENT_SYSTEM_STATUS_CHANGED = "system_status_changed"


# Global singleton event bus instance
event_bus = EventBus()
