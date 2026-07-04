"""
Ledger Models
Pydantic schemas for double-entry bookkeeping ledger.
"""
from pydantic import BaseModel, Field
from typing import Optional


class LedgerEntry(BaseModel):
    """A single ledger journal entry (debit or credit)."""
    id: str
    timestamp: str
    description: str
    debit: Optional[int] = Field(None, description="Debit amount (asset increase)")
    credit: Optional[int] = Field(None, description="Credit amount (asset decrease)")
    reference_type: Optional[str] = Field(None, description="E.g., 'sale', 'booking', 'deposit'")
    reference_id: Optional[str] = Field(None, description="ID of related booking/transaction")
    balance_after: Optional[float] = None

    class Config:
        from_attributes = True


class LedgerEntryCreate(BaseModel):
    """Schema for manually creating a ledger entry."""
    description: str
    debit: Optional[int] = None
    credit: Optional[int] = None
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None


class LedgerSummary(BaseModel):
    """Aggregated ledger summary for dashboard."""
    total_debit: int
    total_credit: int
    net_balance: int
    entry_count: int
    last_sync_time: str


class TransactionLog(BaseModel):
    """Record of a product sale transaction (used by demand engine)."""
    id: str
    timestamp: str
    product_id: str
    product_name: str
    member_id: Optional[str] = None
    member_name: Optional[str] = None
    quantity: int
    unit_price: int
    total_amount: int
    transaction_type: str = "sale"

    class Config:
        from_attributes = True
