"""
Booking Queue (FIFO)
asyncio.Queue-based FIFO processor that simulates a message broker.
Ensures sequential processing, prevents race conditions on stock deduction,
and handles failures gracefully.
"""
import asyncio
import time
import logging
from typing import Optional, Dict, Any

from app.database.json_db import db
from app.services import booking_service, ledger_service
from app.services.gateway_service import increment_metric
from app.core.events import event_bus, EVENT_QUEUE_STATUS_CHANGED, EVENT_ACTIVITY_LOG, EVENT_WHATSAPP_MESSAGE
from app.core.config import QUEUE_MAX_SIZE, QUEUE_PROCESSING_DELAY
from app.utils.helpers import generate_id, now_iso

logger = logging.getLogger(__name__)


class BookingQueue:
    """
    FIFO booking processor using asyncio.Queue.
    Processes bookings one at a time to prevent race conditions on stock.
    """

    def __init__(self, max_size: int = QUEUE_MAX_SIZE):
        self._queue: asyncio.Queue = asyncio.Queue(maxsize=max_size)
        self._worker_task: Optional[asyncio.Task] = None
        self._is_running = False
        self._stock_lock = asyncio.Lock()  # Lock to prevent race conditions on stock

        # Metrics
        self._total_processed = 0
        self._total_failed = 0
        self._total_completed = 0
        self._processing_times: list = []

    async def start_worker(self):
        """Start the background queue worker."""
        if self._is_running:
            logger.warning("Queue worker already running")
            return

        self._is_running = True
        self._worker_task = asyncio.create_task(self._worker_loop())
        logger.info("Booking queue worker started")

        await _log_activity("Queue worker started. Awaiting booking requests...", "system")

    async def stop_worker(self):
        """Stop the background queue worker."""
        self._is_running = False
        if self._worker_task:
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass
        logger.info("Booking queue worker stopped")

    async def enqueue(self, booking_id: str) -> int:
        """
        Add a booking to the FIFO queue.
        Returns the queue position (1-indexed).
        """
        try:
            await self._queue.put(booking_id)
            position = self._queue.qsize()

            # Update booking status to Queued
            await booking_service.update_booking_status(booking_id, "Queued")
            booking = await db.get_by_id("bookings", booking_id)
            if booking:
                await db.update("bookings", booking_id, {"queue_position": position})

            # Record queue item
            queue_item = {
                "id": generate_id("qi"),
                "booking_id": booking_id,
                "priority": 0,
                "status": "Queued",
                "enqueued_at": now_iso(),
                "started_at": None,
                "completed_at": None,
                "retry_count": 0,
                "error_message": None,
            }
            await db.insert("queue_items", queue_item)

            # Broadcast queue status
            await self._broadcast_status()

            # Log idempotency key generation
            await _log_activity(
                f"FIFO Queue: Position {position} assigned to booking {booking_id}",
                "system"
            )

            logger.info(f"Booking {booking_id} enqueued at position {position}")
            return position

        except asyncio.QueueFull:
            logger.error(f"Queue full! Cannot enqueue booking {booking_id}")
            await booking_service.update_booking_status(booking_id, "Failed")
            return -1

    async def _worker_loop(self):
        """Main worker loop: continuously dequeue and process bookings."""
        logger.info("Queue worker loop started")
        while self._is_running:
            try:
                # Wait for next booking (with timeout to allow graceful shutdown)
                try:
                    booking_id = await asyncio.wait_for(self._queue.get(), timeout=1.0)
                except asyncio.TimeoutError:
                    continue

                await self._process_booking(booking_id)
                self._queue.task_done()

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Queue worker error: {e}")
                await asyncio.sleep(1)

    async def _process_booking(self, booking_id: str):
        """
        Process a single booking:
        1. Validate product & stock
        2. Deduct stock (with lock to prevent race conditions)
        3. Create ledger entries
        4. Update booking status
        5. Send confirmation to WhatsApp
        """
        start_time = time.time()
        self._total_processed += 1

        logger.info(f"Processing booking {booking_id}...")

        # Update status to Processing
        await booking_service.update_booking_status(booking_id, "Processing")
        await self._broadcast_status()

        # Simulated processing delay for demo realism
        await asyncio.sleep(QUEUE_PROCESSING_DELAY)

        booking = await db.get_by_id("bookings", booking_id)
        if not booking:
            logger.error(f"Booking {booking_id} not found during processing")
            self._total_failed += 1
            return

        product = await db.get_by_id("products", booking["product_id"])
        if not product:
            await booking_service.update_booking_status(booking_id, "Failed")
            self._total_failed += 1
            logger.error(f"Product not found for booking {booking_id}")
            return

        # Critical section: deduct stock with lock to prevent race conditions
        async with self._stock_lock:
            # Re-fetch product to get latest stock
            product = await db.get_by_id("products", booking["product_id"])

            if product["stock"] < booking["quantity"]:
                # Insufficient stock — fail the booking
                await booking_service.update_booking_status(
                    booking_id, "Failed"
                )
                self._total_failed += 1
                await _log_activity(
                    f"Booking [{booking['booking_code']}] FAILED: Insufficient stock for {product['name']}",
                    "error"
                )
                await increment_metric("failed_requests")
                return

            # Deduct stock using optimistic locking
            result = await ledger_service.deduct_stock(
                product_id=booking["product_id"],
                quantity=booking["quantity"],
                expected_version=product["version"],
                reason="booking",
                reference_id=booking_id,
            )

            if not result:
                # Optimistic lock conflict — retry once
                product = await db.get_by_id("products", booking["product_id"])
                if product and product["stock"] >= booking["quantity"]:
                    result = await ledger_service.deduct_stock(
                        product_id=booking["product_id"],
                        quantity=booking["quantity"],
                        expected_version=product["version"],
                        reason="booking",
                        reference_id=booking_id,
                    )

                if not result:
                    await booking_service.update_booking_status(booking_id, "Failed")
                    self._total_failed += 1
                    await _log_activity(
                        f"Booking [{booking['booking_code']}] FAILED: Stock conflict",
                        "error"
                    )
                    return

        # Success! Update booking to Confirmed
        await booking_service.update_booking_status(booking_id, "Confirmed")
        self._total_completed += 1
        await increment_metric("successful_requests")

        # Update queue item status
        queue_items = await db.query("queue_items", lambda qi: qi.get("booking_id") == booking_id)
        for qi in queue_items:
            await db.update("queue_items", qi["id"], {
                "status": "Done",
                "completed_at": now_iso(),
            })

        # Record processing time
        elapsed = (time.time() - start_time) * 1000
        self._processing_times.append(elapsed)

        # Send WhatsApp confirmation to member
        await event_bus.publish(EVENT_WHATSAPP_MESSAGE, {
            "type": "booking_confirmation",
            "booking_id": booking["id"],
            "booking_code": booking["booking_code"],
            "product_name": booking["product_name"],
            "quantity": booking["quantity"],
            "total_price": booking["total_price"],
            "member_id": booking["member_id"],
            "member_name": booking["member_name"],
            "status": "Confirmed",
            "timestamp": now_iso(),
        })

        await _log_activity(
            f"SUCCESS: Booking [{booking['booking_code']}] completed. {booking['product_name']} x{booking['quantity']}. Ledger synced.",
            "success"
        )

        await self._broadcast_status()
        logger.info(f"Booking {booking_id} processed successfully in {elapsed:.0f}ms")

    async def _broadcast_status(self):
        """Broadcast current queue status to WebSocket clients."""
        status = await self.get_status()
        await event_bus.publish(EVENT_QUEUE_STATUS_CHANGED, status)

    async def get_status(self) -> dict:
        """Get current queue status for dashboard."""
        avg_time = (
            sum(self._processing_times[-20:]) / len(self._processing_times[-20:])
            if self._processing_times else 0
        )
        return {
            "queue_size": self._queue.qsize(),
            "processing_count": 1 if not self._queue.empty() else 0,
            "completed_count": self._total_completed,
            "failed_count": self._total_failed,
            "total_processed": self._total_processed,
            "avg_processing_time_ms": round(avg_time, 1),
            "is_worker_running": self._is_running,
        }


# Global singleton
booking_queue = BookingQueue()


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
