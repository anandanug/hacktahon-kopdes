"""
Engine Scheduler
Runs the Coop-Demand Engine periodically as a background task.
"""
import asyncio
import logging

from app.services.demand_engine import run_analysis_cycle
from app.core.config import ENGINE_INTERVAL_SECONDS, ENGINE_AUTO_RUN

logger = logging.getLogger(__name__)

_scheduler_task = None
_is_running = False


async def start_scheduler():
    """Start the periodic demand engine scheduler."""
    global _scheduler_task, _is_running

    if _is_running:
        logger.warning("Engine scheduler already running")
        return

    if not ENGINE_AUTO_RUN:
        logger.info("Engine scheduler auto-run is disabled by configuration")
        return

    _is_running = True
    _scheduler_task = asyncio.create_task(_scheduler_loop())
    logger.info(f"Engine scheduler started (interval: {ENGINE_INTERVAL_SECONDS}s)")


async def stop_scheduler():
    """Stop the scheduler."""
    global _scheduler_task, _is_running

    _is_running = False
    if _scheduler_task:
        _scheduler_task.cancel()
        try:
            await _scheduler_task
        except asyncio.CancelledError:
            pass
    logger.info("Engine scheduler stopped")


async def _scheduler_loop():
    """Main scheduler loop: run analysis, sleep, repeat."""
    # Wait a bit on startup to let everything initialize
    await asyncio.sleep(3)

    while _is_running:
        try:
            logger.info("Engine scheduler: triggering analysis cycle...")
            result = await run_analysis_cycle()
            logger.info(
                f"Engine scheduler: cycle complete — "
                f"{result.get('dead_stock_found', 0)} dead stock, "
                f"{result.get('campaigns_generated', 0)} campaigns"
            )
        except Exception as e:
            logger.error(f"Engine scheduler error: {e}")

        # Wait for next cycle
        try:
            await asyncio.sleep(ENGINE_INTERVAL_SECONDS)
        except asyncio.CancelledError:
            break


async def run_once():
    """Run a single analysis cycle on demand (for API trigger)."""
    return await run_analysis_cycle()
