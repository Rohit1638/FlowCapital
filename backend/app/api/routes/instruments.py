from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.core.auth import AnyPlatformUser, LenderUser, ManufacturerUser
from app.services.demo_platform_store import demo_store

router = APIRouter(tags=["Instruments"])


class TransitionReviewNotes(BaseModel):
    notes: str | None = None


@router.get("/financing-requests/{request_id}/instrument-suitability")
def instrument_suitability(request_id: str, user: AnyPlatformUser):
    result = demo_store.instrument_suitability(request_id, user.id, user.role)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    return result


@router.get("/financing-requests/{request_id}/transitions")
def transition_history(request_id: str, user: AnyPlatformUser):
    items = demo_store.list_transitions_for_request(request_id, user.id, user.role)
    if items is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    return {"items": items}


@router.post("/financing-requests/{request_id}/reassess-instrument")
def reassess_instrument(request_id: str, user: AnyPlatformUser):
    if user.role not in ("MANUFACTURER", "LENDER"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    result = demo_store.reassess_instrument(request_id, user.id, user.role)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    return result


@router.get("/lender/transitions")
def lender_transitions(user: LenderUser):
    return {"items": demo_store.lender_transitions(user.id)}


@router.get("/lender/transitions/{transition_id}")
def lender_transition_detail(transition_id: str, user: LenderUser):
    item = demo_store.get_transition(transition_id, user.id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transition not found")
    return item


@router.post("/lender/transitions/{transition_id}/approve")
def approve_transition(transition_id: str, user: LenderUser, payload: TransitionReviewNotes | None = None):
    try:
        result = demo_store.approve_transition(transition_id, user.id, payload.notes if payload else None)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transition not found")
    return result


@router.post("/lender/transitions/{transition_id}/keep-current")
def keep_current_instrument(transition_id: str, user: LenderUser, payload: TransitionReviewNotes | None = None):
    try:
        result = demo_store.keep_current_instrument(transition_id, user.id, payload.notes if payload else None)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transition not found")
    return result


@router.post("/lender/transitions/{transition_id}/reject")
def reject_transition(transition_id: str, user: LenderUser, payload: TransitionReviewNotes | None = None):
    try:
        result = demo_store.reject_transition(transition_id, user.id, payload.notes if payload else None)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transition not found")
    return result


@router.post("/lender/transitions/{transition_id}/request-evidence")
def request_transition_evidence(transition_id: str, user: LenderUser, payload: TransitionReviewNotes | None = None):
    try:
        result = demo_store.request_transition_evidence(transition_id, user.id, payload.notes if payload else None)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transition not found")
    return result


@router.get("/manufacturer/financing-requests/{request_id}/lifecycle")
def manufacturer_lifecycle(request_id: str, user: ManufacturerUser):
    result = demo_store.manufacturer_lifecycle_view(request_id, user.id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    return result
