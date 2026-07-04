"""
WebSocket Connection Manager
Manages WebSocket connections, channels, and real-time broadcasting.
Dashboard and WhatsApp clients connect here to receive live updates.
"""
import asyncio
import json
import logging
from typing import Dict, List, Set, Any
from fastapi import WebSocket

from app.core.events import (
    event_bus,
    EVENT_STOCK_UPDATED,
    EVENT_BOOKING_CREATED,
    EVENT_BOOKING_STATUS_CHANGED,
    EVENT_CAMPAIGN_CREATED,
    EVENT_CAMPAIGN_SENT,
    EVENT_LEDGER_ENTRY_ADDED,
    EVENT_QUEUE_STATUS_CHANGED,
    EVENT_RELIABILITY_EVENT,
    EVENT_ACTIVITY_LOG,
    EVENT_ENGINE_ANALYSIS_COMPLETE,
    EVENT_WHATSAPP_MESSAGE,
    EVENT_SYSTEM_STATUS_CHANGED,
)

logger = logging.getLogger(__name__)


class WebSocketManager:
    """
    Manages WebSocket connections grouped by channel type.
    Subscribes to internal events and broadcasts them to connected clients.
    """

    def __init__(self):
        # channel_name -> set of WebSocket connections
        self._dashboard_connections: Set[WebSocket] = set()
        # member_id -> set of WebSocket connections (for WhatsApp mock)
        self._whatsapp_connections: Dict[str, Set[WebSocket]] = {}

    async def connect_dashboard(self, websocket: WebSocket):
        """Accept and register a dashboard WebSocket connection."""
        await websocket.accept()
        self._dashboard_connections.add(websocket)
        logger.info(f"Dashboard WS connected. Total: {len(self._dashboard_connections)}")

    async def disconnect_dashboard(self, websocket: WebSocket):
        """Remove a dashboard WebSocket connection."""
        self._dashboard_connections.discard(websocket)
        logger.info(f"Dashboard WS disconnected. Total: {len(self._dashboard_connections)}")

    async def connect_whatsapp(self, websocket: WebSocket, member_id: str):
        """Accept and register a WhatsApp mock WebSocket connection for a member."""
        await websocket.accept()
        if member_id not in self._whatsapp_connections:
            self._whatsapp_connections[member_id] = set()
        self._whatsapp_connections[member_id].add(websocket)
        logger.info(f"WhatsApp WS connected for member {member_id}")

    async def disconnect_whatsapp(self, websocket: WebSocket, member_id: str):
        """Remove a WhatsApp mock WebSocket connection."""
        if member_id in self._whatsapp_connections:
            self._whatsapp_connections[member_id].discard(websocket)
            if not self._whatsapp_connections[member_id]:
                del self._whatsapp_connections[member_id]
        logger.info(f"WhatsApp WS disconnected for member {member_id}")

    async def broadcast_to_dashboard(self, event_type: str, data: Any):
        """Send a message to all connected dashboard clients."""
        if not self._dashboard_connections:
            return

        message = json.dumps({
            "event": event_type,
            "data": data,
            "timestamp": _get_timestamp(),
        }, default=str)

        disconnected = set()
        for ws in self._dashboard_connections:
            try:
                await ws.send_text(message)
            except Exception:
                disconnected.add(ws)

        # Clean up disconnected sockets
        self._dashboard_connections -= disconnected

    async def broadcast_to_whatsapp(self, member_id: str, event_type: str, data: Any):
        """Send a message to a specific member's WhatsApp mock client."""
        connections = self._whatsapp_connections.get(member_id, set())
        if not connections:
            return

        message = json.dumps({
            "event": event_type,
            "data": data,
            "timestamp": _get_timestamp(),
        }, default=str)

        disconnected = set()
        for ws in connections:
            try:
                await ws.send_text(message)
            except Exception:
                disconnected.add(ws)

        connections -= disconnected

    async def broadcast_to_all_whatsapp(self, event_type: str, data: Any):
        """Send a message to ALL connected WhatsApp mock clients."""
        for member_id in list(self._whatsapp_connections.keys()):
            await self.broadcast_to_whatsapp(member_id, event_type, data)

    def get_connection_stats(self) -> dict:
        """Get current connection statistics."""
        total_wa = sum(len(conns) for conns in self._whatsapp_connections.values())
        return {
            "dashboard_connections": len(self._dashboard_connections),
            "whatsapp_connections": total_wa,
            "whatsapp_members_online": len(self._whatsapp_connections),
            "total_connections": len(self._dashboard_connections) + total_wa,
        }

    # ------------------------------------------------------------------
    # Event Bus Integration
    # ------------------------------------------------------------------

    def setup_event_handlers(self):
        """Subscribe to all internal events for WebSocket broadcasting."""
        event_bus.subscribe(EVENT_STOCK_UPDATED, self._on_stock_updated)
        event_bus.subscribe(EVENT_BOOKING_CREATED, self._on_booking_created)
        event_bus.subscribe(EVENT_BOOKING_STATUS_CHANGED, self._on_booking_status_changed)
        event_bus.subscribe(EVENT_CAMPAIGN_CREATED, self._on_campaign_created)
        event_bus.subscribe(EVENT_CAMPAIGN_SENT, self._on_campaign_sent)
        event_bus.subscribe(EVENT_LEDGER_ENTRY_ADDED, self._on_ledger_entry)
        event_bus.subscribe(EVENT_QUEUE_STATUS_CHANGED, self._on_queue_status)
        event_bus.subscribe(EVENT_RELIABILITY_EVENT, self._on_reliability_event)
        event_bus.subscribe(EVENT_ACTIVITY_LOG, self._on_activity_log)
        event_bus.subscribe(EVENT_ENGINE_ANALYSIS_COMPLETE, self._on_engine_analysis)
        event_bus.subscribe(EVENT_WHATSAPP_MESSAGE, self._on_whatsapp_message)
        logger.info("WebSocket manager: event handlers registered")

    async def _on_stock_updated(self, data):
        await self.broadcast_to_dashboard("stock_updated", data)

    async def _on_booking_created(self, data):
        await self.broadcast_to_dashboard("booking_created", data)

    async def _on_booking_status_changed(self, data):
        await self.broadcast_to_dashboard("booking_status_changed", data)
        # Also notify the member's WhatsApp
        member_id = data.get("member_id")
        if member_id:
            await self.broadcast_to_whatsapp(member_id, "booking_status_changed", data)

    async def _on_campaign_created(self, data):
        await self.broadcast_to_dashboard("campaign_created", data)

    async def _on_campaign_sent(self, data):
        await self.broadcast_to_dashboard("campaign_sent", data)

    async def _on_ledger_entry(self, data):
        await self.broadcast_to_dashboard("ledger_entry_added", data)

    async def _on_queue_status(self, data):
        await self.broadcast_to_dashboard("queue_status_changed", data)

    async def _on_reliability_event(self, data):
        await self.broadcast_to_dashboard("reliability_event", data)

    async def _on_activity_log(self, data):
        await self.broadcast_to_dashboard("activity_log", data)

    async def _on_engine_analysis(self, data):
        await self.broadcast_to_dashboard("engine_analysis_complete", data)

    async def _on_whatsapp_message(self, data):
        """Route WhatsApp messages to specific member or broadcast to all."""
        member_id = data.get("member_id")
        if member_id:
            await self.broadcast_to_whatsapp(member_id, "whatsapp_message", data)
        else:
            await self.broadcast_to_all_whatsapp("whatsapp_message", data)
        # Also notify dashboard about WhatsApp activity
        await self.broadcast_to_dashboard("whatsapp_activity", data)


def _get_timestamp() -> str:
    """Get current ISO timestamp."""
    from app.utils.helpers import now_iso
    return now_iso()


# Global singleton
ws_manager = WebSocketManager()
