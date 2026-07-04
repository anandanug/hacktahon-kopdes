"""
Product API Endpoints
CRUD operations for product management and inventory status.
"""
from fastapi import APIRouter, HTTPException
from typing import Optional

from app.services import ledger_service
from app.models.product import ProductCreate, ProductUpdate

router = APIRouter(prefix="/api/products", tags=["Products"])


@router.get("")
async def list_products(category: Optional[str] = None):
    """
    List all products.
    Optional filter by category query param.

    Example: GET /api/products?category=Sembako
    """
    products = await ledger_service.get_all_products()
    if category:
        products = [p for p in products if p.get("category") == category]
    return products


@router.get("/dead-stock")
async def list_dead_stock():
    """
    List products flagged as dead stock by the demand engine.

    Example: GET /api/products/dead-stock
    Response: [{"id": "prod-001", "name": "Beras Pandanwangi", ...}]
    """
    return await ledger_service.get_dead_stock_products()


@router.get("/stagnant")
async def list_stagnant():
    """
    List stagnant products (stagnant_days > 0), sorted by urgency.

    Example: GET /api/products/stagnant
    """
    return await ledger_service.get_stagnant_products()


@router.get("/{product_id}")
async def get_product(product_id: str):
    """
    Get a single product by ID.

    Example: GET /api/products/prod-001
    Error: 404 if not found
    """
    product = await ledger_service.get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found")
    return product


@router.post("", status_code=201)
async def create_product(product: ProductCreate):
    """
    Create a new product.

    Example Request Body:
    {
        "name": "Mie Instan",
        "category": "Sembako",
        "stock": 100,
        "unit": "Dus",
        "purchase_price": 85000,
        "selling_price": 95000
    }
    """
    return await ledger_service.create_product(product.model_dump())


@router.put("/{product_id}")
async def update_product(product_id: str, updates: ProductUpdate):
    """
    Update a product's fields.

    Example Request Body:
    {
        "stock": 200,
        "selling_price": 62000
    }
    """
    result = await ledger_service.update_product(product_id, updates.model_dump(exclude_unset=True))
    if not result:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found")
    return result


@router.delete("/{product_id}")
async def delete_product(product_id: str):
    """
    Delete a product.

    Example: DELETE /api/products/prod-001
    """
    deleted = await ledger_service.delete_product(product_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found")
    return {"success": True, "message": f"Product {product_id} deleted"}


@router.get("/inventory/status")
async def inventory_status():
    """
    Get aggregated inventory KPIs for dashboard.

    Response:
    {
        "total_products": 8,
        "dead_stock_count": 2,
        "stagnant_count": 3,
        "total_stock_value": 12500000,
        "dead_stock_value": 3200000,
        "potential_recovery_value": 8100000,
        "categories": {...}
    }
    """
    return await ledger_service.get_inventory_status()
