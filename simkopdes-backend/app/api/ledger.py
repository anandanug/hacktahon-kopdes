"""
Ledger & Transaction Log API Endpoints
"""
from fastapi import APIRouter

from app.services import ledger_service
from app.models.ledger import LedgerEntryCreate

router = APIRouter(prefix="/api", tags=["Ledger"])


@router.get("/ledger")
async def list_ledger_entries():
    """
    Get all ledger entries (newest first).

    Example: GET /api/ledger
    Response: [{"id": "ledger-001", "timestamp": "...", "description": "Kas Koperasi", "debit": 60000, "credit": null}]
    """
    return await ledger_service.get_all_ledger_entries()


@router.get("/ledger/summary")
async def ledger_summary():
    """
    Get aggregated ledger summary.

    Response:
    {
        "total_debit": 500000,
        "total_credit": 500000,
        "net_balance": 0,
        "entry_count": 12,
        "last_sync_time": "2026-07-04T14:30:00+07:00"
    }
    """
    return await ledger_service.get_ledger_summary()


@router.post("/ledger", status_code=201)
async def create_ledger_entry(entry: LedgerEntryCreate):
    """
    Manually create a ledger entry (double-entry bookkeeping).

    Example Request Body:
    {
        "description": "Kas Koperasi (Setoran Simpanan Wajib)",
        "debit": 10000,
        "reference_type": "deposit"
    }
    """
    return await ledger_service.create_ledger_entry(
        description=entry.description,
        debit=entry.debit,
        credit=entry.credit,
        reference_type=entry.reference_type,
        reference_id=entry.reference_id,
    )


@router.get("/transaction-logs")
async def list_transaction_logs():
    """
    Get transaction logs (used by demand engine for rolling-window analysis).

    Example: GET /api/transaction-logs
    Response: [{"id": "txlog-001", "product_name": "Tepung Terigu", "quantity": 2, ...}]
    """
    return await ledger_service.get_transaction_logs()
