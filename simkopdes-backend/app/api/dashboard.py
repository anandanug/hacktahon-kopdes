"""
Dashboard API Endpoints
Aggregated data endpoints for the SIMKOPDES Command Center dashboard.
"""
from fastapi import APIRouter
import time

from app.database.json_db import db
from app.services import ledger_service, campaign_service, booking_service
from app.queue.booking_queue import booking_queue
from app.services.gateway_service import get_metrics as get_gateway_metrics
from app.websocket.ws_manager import ws_manager
from app.scheduler import engine_scheduler

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

_start_time = time.time()


@router.get("/inventory-insights")
async def inventory_insights():
    """
    Get inventory insights for the Command Center dashboard.
    Includes KPIs, stagnant products, and dead stock alerts.

    Response:
    {
        "kpis": {"total_products": 8, "dead_stock_count": 2, ...},
        "stagnant_products": [...],
        "dead_stock_products": [...]
    }
    """
    kpis = await ledger_service.get_inventory_status()
    stagnant = await ledger_service.get_stagnant_products()
    dead_stock = await ledger_service.get_dead_stock_products()

    return {
        "kpis": kpis,
        "stagnant_products": stagnant,
        "dead_stock_products": dead_stock,
    }


@router.get("/booking-queue")
async def booking_queue_data():
    """
    Get active booking queue data for the live booking panel.

    Response:
    {
        "active_bookings": [...],
        "queue_status": {"queue_size": 0, "completed_count": 5, ...}
    }
    """
    bookings = await booking_service.get_all_bookings()
    queue_status = await booking_queue.get_status()

    return {
        "bookings": bookings,
        "queue_status": queue_status,
    }


@router.get("/ledger-sync")
async def ledger_sync_data():
    """
    Get ledger data for the live ledger sync panel.

    Response:
    {
        "entries": [...],
        "summary": {"total_debit": ..., "total_credit": ..., ...}
    }
    """
    entries = await ledger_service.get_all_ledger_entries()
    summary = await ledger_service.get_ledger_summary()

    return {
        "entries": entries[:50],  # Last 50 entries
        "summary": summary,
    }


@router.get("/system-status")
async def system_status():
    """
    Get overall system health status for the status bar.

    Response:
    {
        "api_gateway": "healthy",
        "database_latency_ms": 12,
        "whatsapp_connected": true,
        "queue_pending": 0,
        "ws_connections": {...},
        "uptime_seconds": 3600,
        ...
    }
    """
    queue_status = await booking_queue.get_status()
    ws_stats = ws_manager.get_connection_stats()
    gateway_metrics = await get_gateway_metrics()
    db_stats = await db.get_stats()

    return {
        "api_gateway": "healthy",
        "database_latency_ms": 12,  # Simulated — in-memory is <1ms
        "ledger_synced": True,
        "whatsapp_connected": ws_stats["whatsapp_connections"] > 0 or True,  # Always true for demo
        "queue_pending": queue_status["queue_size"],
        "queue_status": queue_status,
        "ws_connections": ws_stats,
        "gateway_metrics": gateway_metrics,
        "db_stats": db_stats,
        "uptime_seconds": round(time.time() - _start_time, 1),
        "engine_interval_seconds": 30,
    }


@router.get("/members")
async def dashboard_members():
    """
    Get member list with savings summary for the dashboard.
    """
    members = await db.get_all("members")
    return members


@router.get("/activity-logs")
async def activity_logs(limit: int = 50):
    """
    Get recent activity logs for the tech console.

    Example: GET /api/dashboard/activity-logs?limit=20
    """
    logs = await db.get_all("activity_logs")
    # Sort newest first, limit
    sorted_logs = sorted(logs, key=lambda l: l.get("timestamp", ""), reverse=True)
    return sorted_logs[:limit]


@router.post("/trigger-flash-sale")
async def trigger_flash_sale(product_id: str, discount: int = None):
    """
    Manually trigger a flash sale from the Command Center.
    Creates and immediately sends a campaign.

    Example: POST /api/dashboard/trigger-flash-sale?product_id=prod-001&discount=10
    """
    campaign = await campaign_service.trigger_and_send_campaign(product_id, discount)
    if not campaign:
        return {"success": False, "message": "Failed to trigger flash sale"}

    return {
        "success": True,
        "message": f"Flash sale triggered for {campaign['product_name']}",
        "campaign": campaign,
    }


@router.post("/run-engine")
async def dashboard_run_engine():
    """
    Manually trigger the demand engine from the dashboard.
    """
    result = await engine_scheduler.run_once()
    return {
        "success": True,
        "message": "Engine analysis complete",
        "result": result,
    }


@router.post("/reload-db")
async def reload_db():
    """
    Reload database from seed.json, discarding current in-memory status and snapshot.
    """
    from app.core.config import SEED_FILE
    import os
    from app.core import config
    
    # Remove snapshot file to prevent loading old state on reboot
    if config.DB_SNAPSHOT_FILE.exists():
        try:
            os.remove(config.DB_SNAPSHOT_FILE)
        except Exception:
            pass
            
    # Clear collections
    for col in list(db._data.keys()):
        db._data[col] = []
        
    # Re-initialize from seed
    await db.initialize(seed_file=SEED_FILE)
    stats = await db.get_stats()
    
    return {
        "success": True,
        "message": "Database reloaded from seed.json",
        "database": stats
    }

