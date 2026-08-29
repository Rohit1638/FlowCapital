from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.core.auth import AnyPlatformUser, LenderUser, ManufacturerUser
from app.services.demo_platform_store import demo_store

router = APIRouter(tags=["Exposure"])


class CapacityValidationRequest(BaseModel):
    proposed_amount: float = Field(..., gt=0)


@router.get("/financing-requests/{request_id}/exposure")
def get_exposure(request_id: str, user: AnyPlatformUser):
    item = demo_store.get_exposure(request_id, user.id, user.role)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exposure data not found")
    return item


@router.get("/lender/financing-requests/{request_id}/exposure")
def lender_exposure(request_id: str, user: LenderUser):
    item = demo_store.get_exposure(request_id, user.id, user.role, lender_view=True)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exposure data not found")
    return item


@router.get("/manufacturer/financing-requests/{request_id}/exposure")
def manufacturer_exposure(request_id: str, user: ManufacturerUser):
    item = demo_store.get_exposure(request_id, user.id, user.role)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exposure data not found")
    return item


@router.get("/financing-requests/{request_id}/exposure/history")
def exposure_history(request_id: str, user: AnyPlatformUser):
    items = demo_store.exposure_history(request_id, user.id, user.role)
    if items is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exposure history not found")
    return {"items": items}


@router.post("/financing-requests/{request_id}/validate-capacity")
def validate_capacity(request_id: str, payload: CapacityValidationRequest, user: AnyPlatformUser):
    result = demo_store.validate_capacity(request_id, payload.proposed_amount, user.id, user.role)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    return result
