from fastapi import APIRouter, HTTPException, status

from app.core.auth import AnyPlatformUser, ManufacturerUser
from app.schemas.platform import ProductionRequestCreate, WorkflowEventCreate
from app.services.demo_platform_store import DEMO_REQUEST_ID, demo_store

router = APIRouter(prefix="/production-requests", tags=["Production Requests"])


@router.post("", status_code=status.HTTP_201_CREATED)
def create_request(payload: ProductionRequestCreate, user: ManufacturerUser):
    return demo_store.create_request(user.id, payload.model_dump())


@router.get("/{request_id}")
def get_request(request_id: str, user: AnyPlatformUser):
    item = demo_store.get_request(request_id, user.id, user.role)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    return item


@router.post("/{request_id}/submit")
def submit_request(request_id: str, user: ManufacturerUser):
    item = demo_store.submit_request(request_id, user.id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    return item


@router.post("/{request_id}/events", status_code=status.HTTP_201_CREATED)
def add_event(request_id: str, payload: WorkflowEventCreate, user: ManufacturerUser):
    result = demo_store.add_event(request_id, user.id, payload.model_dump())
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    return result


@router.get("/{request_id}/timeline")
def timeline(request_id: str, user: AnyPlatformUser):
    item = demo_store.get_request(request_id, user.id, user.role)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    return {"stages": item.get("stages", []), "events": item.get("events", [])}


@router.get("/{request_id}/financing-status")
def financing_status(request_id: str, user: AnyPlatformUser):
    item = demo_store.get_request(request_id, user.id, user.role)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    return {
        "status": item["status"],
        "confidence_score": item["confidence_score"],
        "financeable_value": item["financeable_value"],
        "outstanding_exposure": item["outstanding_exposure"],
        "unclaimed_value": item["unclaimed_value"],
        "recommendation": item.get("financing_recommendation"),
        "decisions": item.get("decisions", []),
        "tranches": item.get("tranches", []),
    }


@router.post("/{request_id}/report")
def generate_report(request_id: str, user: AnyPlatformUser):
    report = demo_store.generate_report(request_id, user.id, user.role)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    return report


@router.get("/demo/primary")
def primary_demo_request(user: AnyPlatformUser):
    item = demo_store.get_request(DEMO_REQUEST_ID, user.id, user.role)
    if not item and user.role == "LENDER":
        item = demo_store.get_opportunity(DEMO_REQUEST_ID, user.id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demo request not found")
    return item
