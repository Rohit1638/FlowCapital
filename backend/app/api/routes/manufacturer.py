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
