"""
WebSocket Route Endpoints
Defines WebSocket connection endpoints for dashboard and WhatsApp mock.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import logging

from app.websocket.ws_manager import ws_manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/dashboard")
async def websocket_dashboard(websocket: WebSocket):
    """
    WebSocket endpoint for the SIMKOPDES Command Center dashboard.
    Receives real-time updates for: stock, bookings, campaigns, queue, ledger, logs.

    Connect: ws://localhost:8000/ws/dashboard

    Messages are JSON with format:
    {
        "event": "stock_updated",
        "data": {...},
        "timestamp": "2026-07-04T14:30:00+07:00"
    }
    """
    await ws_manager.connect_dashboard(websocket)

    try:
        while True:
            # Keep connection alive by reading (client can send heartbeats/commands)
            data = await websocket.receive_text()
            # Echo back or process client commands if needed
            if data == "ping":
                await websocket.send_text('{"event": "pong"}')
            logger.debug(f"Dashboard WS received: {data}")
    except WebSocketDisconnect:
        await ws_manager.disconnect_dashboard(websocket)
    except Exception as e:
        logger.error(f"Dashboard WS error: {e}")
        await ws_manager.disconnect_dashboard(websocket)


@router.websocket("/ws/whatsapp/{member_id}")
async def websocket_whatsapp(websocket: WebSocket, member_id: str):
    """
    WebSocket endpoint for WhatsApp mock client per member.
    Receives campaign blasts and booking status updates for this member.

    Connect: ws://localhost:8000/ws/whatsapp/mem-001

    Messages are JSON with format:
    {
        "event": "whatsapp_message",
        "data": {
            "type": "campaign_blast",
            "message": "📢 PROMO SPECIAL...",
            ...
        },
        "timestamp": "..."
    }
    """
    await ws_manager.connect_whatsapp(websocket, member_id)

    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text('{"event": "pong"}')
            logger.debug(f"WhatsApp WS [{member_id}] received: {data}")
    except WebSocketDisconnect:
        await ws_manager.disconnect_whatsapp(websocket, member_id)
    except Exception as e:
        logger.error(f"WhatsApp WS [{member_id}] error: {e}")
        await ws_manager.disconnect_whatsapp(websocket, member_id)
