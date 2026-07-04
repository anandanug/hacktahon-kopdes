"""
Member Models
Pydantic schemas for cooperative member management.
"""
from pydantic import BaseModel, Field
from typing import Optional


class MemberBase(BaseModel):
    """Base member fields."""
    name: str
    member_code: str
    phone: str = ""
    savings_pokok: int = Field(0, ge=0)
    savings_wajib: int = Field(0, ge=0)
    savings_sukarela: int = Field(0, ge=0)
    active_status: bool = True
    joined_date: str = ""


class MemberCreate(MemberBase):
    """Schema for creating a new member."""
    pass


class Member(MemberBase):
    """Full member model."""
    id: str

    class Config:
        from_attributes = True


class DepositRequest(BaseModel):
    """Schema for recording a savings deposit."""
    member_id: str
    amount: int = Field(..., gt=0, description="Deposit amount in Rupiah")
    deposit_type: str = Field(..., description="Wajib or Sukarela")
