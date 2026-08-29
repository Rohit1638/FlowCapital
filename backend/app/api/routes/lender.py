from fastapi import APIRouter, HTTPException, status

from app.core.auth import LenderUser
from app.schemas.platform import FinancingOfferCreate, FinancingOfferUpdate, LenderDecisionCreate
from app.services.demo_platform_store import demo_store

router = APIRouter(prefix="/lender", tags=["Lender"])


@router.get("/dashboard")
def lender_dashboard(user: LenderUser):
    return demo_store.lender_dashboard(user.id)


@router.get("/opportunities")
def list_opportunities(user: LenderUser):
    return {"items": demo_store.list_opportunities(user.id)}


@router.get("/opportunities/{request_id}")
def get_opportunity(request_id: str, user: LenderUser):
    item = demo_store.get_opportunity(request_id, user.id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found")
    return item


@router.post("/requests/{request_id}/decide")
def decide(request_id: str, payload: LenderDecisionCreate, user: LenderUser):
    try:
        result = demo_store.lender_decide(request_id, user.id, payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    return result


@router.post("/requests/{request_id}/offer", status_code=status.HTTP_201_CREATED)
def submit_offer(request_id: str, payload: FinancingOfferCreate, user: LenderUser):
    try:
        offer = demo_store.submit_lender_offer(request_id, user.id, payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return offer


@router.patch("/requests/{request_id}/offer/{offer_id}")
def update_offer(request_id: str, offer_id: str, payload: FinancingOfferUpdate, user: LenderUser):
    try:
        offer = demo_store.update_lender_offer(request_id, offer_id, user.id, payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return offer


@router.get("/offers")
def list_my_offers(user: LenderUser):
    return {"items": demo_store.list_lender_offers(user.id)}
