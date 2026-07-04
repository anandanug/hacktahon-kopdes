"""
Simkopdes Backend — Main Application Entry Point
FastAPI app with CORS, lifespan events, and route registration.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import (
    APP_TITLE, APP_VERSION, APP_DESCRIPTION, CORS_ORIGINS, SEED_FILE
)
from app.database.json_db import db
from app.websocket.ws_manager import ws_manager
from app.queue.booking_queue import booking_queue
from app.scheduler.engine_scheduler import start_scheduler, stop_scheduler

# Import API routers
from app.api import (
    products,
    ledger,
    members,
    bookings,
    campaigns,
    gateway,
    whatsapp,
    dashboard,
    reliability,
    ws_routes,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


# =====================================================================
# Lifespan: Startup & Shutdown Events
# =====================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    - Startup: Initialize database, start queue worker, start engine scheduler, setup WS events.
    - Shutdown: Stop workers, save database snapshot.
    """
    # === STARTUP ===
    logger.info("=" * 60)
    logger.info(f"  {APP_TITLE} v{APP_VERSION}")
    logger.info("=" * 60)

    # 1. Initialize JSON In-Memory Database with seed data
    await db.initialize(seed_file=SEED_FILE)

    # 2. Setup WebSocket event handlers
    ws_manager.setup_event_handlers()
    logger.info("WebSocket event handlers registered")

    # 3. Start the booking queue worker
    await booking_queue.start_worker()
    logger.info("Booking queue worker started")

    # 4. Start the demand engine scheduler
    await start_scheduler()
    logger.info("Demand engine scheduler started")

    logger.info("-" * 60)
    logger.info("  All systems online. Ready to accept connections.")
    logger.info("-" * 60)

    yield  # Application runs here

    # === SHUTDOWN ===
    logger.info("Shutting down...")

    # Stop engine scheduler
    await stop_scheduler()

    # Stop queue worker
    await booking_queue.stop_worker()

    # Save database snapshot
    await db.save_snapshot()

    logger.info("Shutdown complete.")


# =====================================================================
# FastAPI App Instance
# =====================================================================

app = FastAPI(
    title=APP_TITLE,
    version=APP_VERSION,
    description=APP_DESCRIPTION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware — allow frontend dev servers
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================================
# Register API Routers
# =====================================================================

# REST API routes
app.include_router(products.router)
app.include_router(ledger.router)
app.include_router(members.router)
app.include_router(bookings.router)
app.include_router(campaigns.router)
app.include_router(gateway.router)
app.include_router(whatsapp.router)
app.include_router(dashboard.router)
app.include_router(reliability.router)

# WebSocket routes
app.include_router(ws_routes.router)


# =====================================================================
# Root Health Check
# =====================================================================

@app.get("/api/health", tags=["Health"])
async def health_check():
    """
    Root health check endpoint.

    Example: GET /api/health
    Response: {"status": "ok", "service": "Simkopdes Backend API", "version": "1.0.0"}
    """
    stats = await db.get_stats()
    return {
        "status": "ok",
        "service": APP_TITLE,
        "version": APP_VERSION,
        "database": stats,
    }
