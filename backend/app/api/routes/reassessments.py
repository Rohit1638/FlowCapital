from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.core.auth import AnyPlatformUser, LenderUser, ManufacturerUser
from app.core.config import get_settings
from app.services.demo_platform_store import demo_store

router = APIRouter(tags=["Reassessments"])


class PlatformEventCreate(BaseModel):
    financing_request_id: str | None = None
    event_type: str
    source_type: str = "MANUFACTURER"
    previous_value: str | None = None
    new_value: str | None = None
    metadata: dict | None = None
    severity: str | None = None
    asset_id: str | None = None
    evidence_id: str | None = None
    notes: str | None = None


class ReassessmentActionNotes(BaseModel):
    notes: str | None = None


class DemoSimulateEvent(BaseModel):
    financing_request_id: str = "00000000-0000-4000-8000-000000000100"
    event_type: str
    value: str | float | None = None
    delay_days: int | None = None
    change_pct: float | None = None
    progress_delta: float | None = None
    reason: str | None = None
    evidence_quality: str | None = None
    notes: str | None = None


@router.post("/events")
def create_platform_event(payload: PlatformEventCreate, user: ManufacturerUser):
    meta = dict(payload.metadata or {})
    if payload.notes:
        meta["notes"] = payload.notes
    result = demo_store.ingest_intelligence_event(
        payload.event_type,
        user.id,
        user.role,
        financing_request_id=payload.financing_request_id,
        source_type=payload.source_type,
        metadata=meta,
        previous_value=payload.previous_value,
        new_value=payload.new_value,
        asset_id=payload.asset_id,
        evidence_id=payload.evidence_id,
    )
    if not result:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Event could not be created")
    return result


@router.get("/events")
def list_platform_events(user: AnyPlatformUser, financing_request_id: str | None = None, limit: int = 50):
    return {"items": demo_store.list_intelligence_events(user.id, user.role, financing_request_id, limit)}


@router.get("/financing-requests/{request_id}/events")
def request_events(request_id: str, user: AnyPlatformUser):
    items = demo_store.list_intelligence_events(user.id, user.role, request_id)
    if items is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    return {"items": items}


@router.post("/financing-requests/{request_id}/reassess")
def manual_reassess(request_id: str, user: AnyPlatformUser):
    result = demo_store.manual_reassess(request_id, user.id, user.role)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    return result


@router.get("/lender/reassessments")
def lender_reassessments(user: LenderUser, priority: str | None = None):
    return {"items": demo_store.lender_reassessments(user.id, priority)}


@router.post("/lender/reassessments/trigger-demo")
def trigger_demo_reassessment(user: LenderUser):
    result = demo_store.trigger_demo_reassessment(user.id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demo reassessment could not be triggered")
    return result


@router.get("/lender/reassessments/{record_id}")
def lender_reassessment_detail(record_id: str, user: LenderUser):
    item = demo_store.get_reassessment(record_id, user.id, user.role)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reassessment not found")
    return item


@router.get("/manufacturer/reassessments")
def manufacturer_reassessments(user: ManufacturerUser, request_id: str | None = None):
    return {"items": demo_store.manufacturer_reassessments(user.id, request_id)}


@router.get("/manufacturer/financing-health/{request_id}")
def financing_health(request_id: str, user: ManufacturerUser):
    item = demo_store.financing_health(request_id, user.id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    return item


@router.post("/reassessments/{record_id}/acknowledge")
def acknowledge_reassessment(record_id: str, user: LenderUser, payload: ReassessmentActionNotes | None = None):
    result = demo_store.lender_reassessment_action(record_id, user.id, "ACKNOWLEDGE", payload.notes if payload else None)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reassessment not found")
    return result


@router.post("/reassessments/{record_id}/request-evidence")
def request_evidence(record_id: str, user: LenderUser, payload: ReassessmentActionNotes | None = None):
    result = demo_store.lender_reassessment_action(record_id, user.id, "REQUEST_MORE_EVIDENCE", payload.notes if payload else None)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reassessment not found")
    return result


@router.post("/reassessments/{record_id}/manual-review")
def manual_review(record_id: str, user: LenderUser, payload: ReassessmentActionNotes | None = None):
    result = demo_store.lender_reassessment_action(record_id, user.id, "MARK_FOR_MANUAL_REVIEW", payload.notes if payload else None)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reassessment not found")
    return result


@router.post("/reassessments/{record_id}/continue-monitoring")
def continue_monitoring(record_id: str, user: LenderUser, payload: ReassessmentActionNotes | None = None):
    result = demo_store.lender_reassessment_action(record_id, user.id, "CONTINUE_MONITORING", payload.notes if payload else None)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reassessment not found")
    return result


@router.get("/financing-requests/{request_id}/risk-alerts")
def project_risk_alerts(request_id: str, user: AnyPlatformUser):
    items = demo_store.list_risk_alerts(user.id, user.role, request_id)
    return {"items": items}


@router.post("/demo/simulate-event")
def demo_simulate_event(payload: DemoSimulateEvent, user: AnyPlatformUser):
    settings = get_settings()
    if settings.app_env not in ("development", "demo") and user.role not in ("MANUFACTURER", "LENDER"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Demo simulator not available")
    meta: dict = {"reason": payload.reason, "evidence_quality": payload.evidence_quality}
    if payload.delay_days is not None:
        meta["delay_days"] = payload.delay_days
    if payload.change_pct is not None:
        meta["change_pct"] = payload.change_pct
    if payload.progress_delta is not None:
        meta["progress_delta"] = payload.progress_delta
    if payload.value is not None:
        meta["value"] = payload.value
    result = demo_store.simulate_demo_event(
        payload.financing_request_id,
        payload.event_type,
        user.id,
        user.role,
        meta,
    )
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Simulation failed")
    return result
