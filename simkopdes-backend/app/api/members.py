"""
Member API Endpoints
"""
from fastapi import APIRouter, HTTPException

from app.database.json_db import db
from app.models.member import MemberCreate, DepositRequest
from app.services.ledger_service import create_ledger_entry
from app.utils.helpers import generate_id, now_iso
from app.core.events import event_bus, EVENT_ACTIVITY_LOG

router = APIRouter(prefix="/api/members", tags=["Members"])


@router.get("")
async def list_members():
    """
    List all cooperative members.

    Example: GET /api/members
    """
    return await db.get_all("members")


@router.get("/{member_id}")
async def get_member(member_id: str):
    """
    Get a single member by ID.

    Example: GET /api/members/mem-001
    """
    member = await db.get_by_id("members", member_id)
    if not member:
        raise HTTPException(status_code=404, detail=f"Member {member_id} not found")
    return member


@router.post("", status_code=201)
async def create_member(member: MemberCreate):
    """
    Create a new cooperative member.

    Example Request Body:
    {
        "name": "Dewi Lestari",
        "member_code": "SB-005",
        "phone": "628123456005",
        "savings_pokok": 100000
    }
    """
    data = member.model_dump()
    data["id"] = generate_id("mem")
    return await db.insert("members", data)


@router.post("/deposit")
async def record_deposit(req: DepositRequest):
    """
    Record a savings deposit for a member (Wajib or Sukarela).
    Creates corresponding ledger entries.

    Example Request Body:
    {
        "member_id": "mem-001",
        "amount": 10000,
        "deposit_type": "Wajib"
    }
    """
    member = await db.get_by_id("members", req.member_id)
    if not member:
        raise HTTPException(status_code=404, detail=f"Member {req.member_id} not found")

    # Update member savings
    field = "savings_wajib" if req.deposit_type == "Wajib" else "savings_sukarela"
    new_amount = member.get(field, 0) + req.amount
    await db.update("members", req.member_id, {field: new_amount})

    # Create debit ledger entry (Kas Koperasi increases)
    await create_ledger_entry(
        description=f"Kas Koperasi (Setoran Simpanan {req.deposit_type} - {member['name']})",
        debit=req.amount,
        reference_type="deposit",
        reference_id=req.member_id,
    )

    # Create credit ledger entry (Simpanan Anggota increases)
    await create_ledger_entry(
        description=f"Simpanan Anggota ({member['name']})",
        credit=req.amount,
        reference_type="deposit",
        reference_id=req.member_id,
    )

    # Log activity
    log_entry = {
        "id": generate_id("log"),
        "timestamp": now_iso(),
        "message": f"Deposit recorded: {member['name']} - Simpanan {req.deposit_type} Rp{req.amount:,}",
        "type": "success",
    }
    await db.insert("activity_logs", log_entry)
    await event_bus.publish(EVENT_ACTIVITY_LOG, log_entry)

    return {
        "success": True,
        "message": f"Deposit Rp{req.amount:,} recorded for {member['name']}",
        "member_id": req.member_id,
        "deposit_type": req.deposit_type,
        "new_balance": new_amount,
    }
