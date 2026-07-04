"""
Product Models
Pydantic schemas for product management, stock movements, and inventory status.
"""
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


class ProductBase(BaseModel):
    """Base product fields shared across create/update operations."""
    name: str = Field(..., description="Product name", example="Beras Pandanwangi 5kg")
    category: str = Field(..., description="Product category", example="Sembako")
    stock: int = Field(..., ge=0, description="Current stock quantity")
    unit: str = Field(..., description="Unit of measure", example="Karung")
    purchase_price: int = Field(..., ge=0, description="Purchase/cost price in Rupiah")
    selling_price: int = Field(..., ge=0, description="Selling price in Rupiah")
    promo_price: Optional[int] = Field(None, ge=0, description="Promotional price (if active)")


class ProductCreate(ProductBase):
    """Schema for creating a new product."""
    pass


class ProductUpdate(BaseModel):
    """Schema for updating product fields (all optional)."""
    name: Optional[str] = None
    category: Optional[str] = None
    stock: Optional[int] = Field(None, ge=0)
    unit: Optional[str] = None
    purchase_price: Optional[int] = Field(None, ge=0)
    selling_price: Optional[int] = Field(None, ge=0)
    promo_price: Optional[int] = Field(None, ge=0)
    discount_ai: Optional[int] = Field(None, ge=0, le=100)
    stagnant_days: Optional[int] = Field(None, ge=0)
    priority: Optional[Literal["Tinggi", "Sedang", "Rendah"]] = None
    is_dead_stock: Optional[bool] = None


class Product(ProductBase):
    """Full product model with computed/system fields."""
    id: str
    discount_ai: int = Field(0, ge=0, le=100, description="AI-recommended discount percentage")
    stagnant_days: int = Field(0, ge=0, description="Days since last transaction")
    priority: Literal["Tinggi", "Sedang", "Rendah"] = "Rendah"
    is_dead_stock: bool = False
    last_transaction_date: Optional[str] = None
    created_at: str = ""
    version: int = Field(1, description="Version for optimistic locking")

    class Config:
        from_attributes = True


class StockMovement(BaseModel):
    """Schema for stock adjustment operations."""
    product_id: str
    quantity: int = Field(..., description="Positive to add, negative to deduct")
    reason: str = Field(..., description="Reason for stock movement")
    reference_id: Optional[str] = Field(None, description="Related booking/campaign ID")


class InventoryStatus(BaseModel):
    """Aggregated inventory KPIs for dashboard."""
    total_products: int
    dead_stock_count: int
    stagnant_count: int
    total_stock_value: float
    dead_stock_value: float
    potential_recovery_value: float
    categories: dict
