"""
Campaign API Endpoints
"""
from fastapi import APIRouter, HTTPException

from app.services import campaign_service
from app.scheduler import engine_scheduler

router = APIRouter(prefix="/api/campaigns", tags=["Campaigns"])


@router.get("")
async def list_campaigns():
    """
    List all campaigns (newest first).

    Example: GET /api/campaigns
    """
    return await campaign_service.get_all_campaigns()


@router.get("/pending")
async def list_pending_campaigns():
    """
    List campaigns waiting to be sent.

    Example: GET /api/campaigns/pending
    """
    return await campaign_service.get_pending_campaigns()


@router.get("/{campaign_id}")
async def get_campaign(campaign_id: str):
    """
    Get a single campaign by ID.

    Example: GET /api/campaigns/camp-abc123
    """
    campaign = await campaign_service.get_campaign_by_id(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail=f"Campaign {campaign_id} not found")
    return campaign


@router.post("/{campaign_id}/send")
async def send_campaign(campaign_id: str):
    """
    Send a pending campaign to all target members.

    Example: POST /api/campaigns/camp-abc123/send
    """
    result = await campaign_service.send_campaign(campaign_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"Campaign {campaign_id} not found")
    return {"success": True, "message": "Campaign sent", "campaign": result}


@router.post("/run-engine")
async def run_engine_now():
    """
    Trigger a manual demand engine analysis cycle.
    Useful for demo: forces dead stock detection immediately.

    Example: POST /api/campaigns/run-engine
    """
    result = await engine_scheduler.run_once()
    return {
        "success": True,
        "message": f"Engine cycle complete: {result.get('dead_stock_found', 0)} dead stock found",
        "result": result,
    }


@router.post("/trigger-product/{product_id}")
async def trigger_product_campaign(product_id: str):
    """
    Trigger and send a campaign immediately for a given product.
    This is called by the Enterprise Console when 'Flash Sale WA' is clicked.
    """
    result = await campaign_service.trigger_and_send_campaign(product_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found or campaign failed")
    return {"success": True, "message": "Campaign triggered and sent", "campaign": result}
