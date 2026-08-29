from fastapi import APIRouter, HTTPException, status

from app.core.auth import ManufacturerUser
from app.services.demo_platform_store import demo_store

router = APIRouter(prefix="/manufacturer", tags=["Manufacturer"])


@router.get("/dashboard")
def manufacturer_dashboard(user: ManufacturerUser):
    return demo_store.manufacturer_dashboard(user.id)


@router.get("/production-requests")
def list_production_requests(user: ManufacturerUser):
    return {"items": demo_store.list_requests(user.id)}


@router.get("/requests/{request_id}/offers")
def list_request_offers(request_id: str, user: ManufacturerUser):
    try:
        return demo_store.list_manufacturer_offers(request_id, user.id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/requests/{request_id}/offers/{offer_id}/accept")
def accept_offer(request_id: str, offer_id: str, user: ManufacturerUser):
    try:
        return demo_store.accept_manufacturer_offer(request_id, offer_id, user.id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
