"""
Utility Helpers
Common utility functions: ID generation, time formatting, etc.
"""
import uuid
import random
import string
from typing import Union
from datetime import datetime, timezone, timedelta


# WIB timezone (UTC+7)
WIB = timezone(timedelta(hours=7))


def generate_id(prefix: str = "") -> str:
    """Generate a unique ID with optional prefix. Example: 'prod-a1b2c3d4'"""
    short_uuid = uuid.uuid4().hex[:8]
    return f"{prefix}-{short_uuid}" if prefix else short_uuid


def generate_booking_code() -> str:
    """Generate a human-readable booking code. Example: 'BK-847'"""
    return f"BK-{random.randint(100, 999)}"


def generate_idempotency_key() -> str:
    """Generate a unique idempotency key. Example: 'IDEM-A1B2C3D4E5F6'"""
    chars = string.ascii_uppercase + string.digits
    key = "".join(random.choices(chars, k=12))
    return f"IDEM-{key}"


def now_wib() -> datetime:
    """Get current datetime in WIB timezone."""
    return datetime.now(WIB)


def now_iso() -> str:
    """Get current time as ISO 8601 string in WIB."""
    return now_wib().isoformat()


def now_time_str() -> str:
    """Get current time as HH:MM:SS string. Example: '14:30:45'"""
    t = now_wib()
    return f"{t.hour:02d}:{t.minute:02d}:{t.second:02d}"


def now_date_str() -> str:
    """Get current date as DD/MM/YYYY string. Example: '04/07/2026'"""
    t = now_wib()
    return f"{t.day:02d}/{t.month:02d}/{t.year}"


def format_rupiah(amount: Union[int, float]) -> str:
    """Format number as Rupiah string. Example: 'Rp12.000'"""
    return f"Rp{int(amount):,}".replace(",", ".")


def format_rupiah_short(amount: Union[int, float]) -> str:
    """Format number as short Rupiah. Example: 'Rp12k', 'Rp1.2M'"""
    if amount >= 1_000_000_000:
        return f"Rp{amount / 1_000_000_000:.1f}B"
    if amount >= 1_000_000:
        return f"Rp{amount / 1_000_000:.1f}M"
    if amount >= 1_000:
        return f"Rp{amount / 1_000:.0f}k"
    return f"Rp{int(amount)}"
