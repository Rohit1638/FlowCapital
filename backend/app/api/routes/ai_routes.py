from fastapi import APIRouter, HTTPException, status

from app.core.auth import AnyPlatformUser, LenderUser, ManufacturerUser
from app.schemas.platform import AIChatRequest, AIQuestionRequest
from app.services.ai.ai_service import AIService
from app.services.demo_platform_store import DEMO_REQUEST_ID, demo_store

router = APIRouter(prefix="/ai", tags=["AI"])
ai_service = AIService()


def _context_for(user, request_id: str | None) -> dict:
    rid = request_id or DEMO_REQUEST_ID
    if user.role == "LENDER":
        req = demo_store.get_opportunity(rid, user.id)
    else:
        req = demo_store.get_request(rid, user.id, user.role)
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found for AI context")
    context = req.get("ai_context") or demo_store._ai_context(req)
    if user.role == "MANUFACTURER":
        try:
            context["marketplace_offers"] = demo_store.list_manufacturer_offers(rid, user.id)
            context["exposure"] = demo_store.get_exposure(rid, user.id, user.role)
        except ValueError:
            pass
    elif user.role == "LENDER" and req.get("marketplace"):
        context["marketplace"] = req["marketplace"]
        exp = demo_store.get_exposure(rid, user.id, user.role, lender_view=True)
        if exp:
            context["exposure"] = exp
    return context


@router.get("/health")
def ai_health():
    return ai_service.health()


@router.post("/manufacturer/insight")
async def manufacturer_insight(payload: AIQuestionRequest, user: ManufacturerUser):
    context = _context_for(user, payload.production_request_id)
    result = await ai_service.manufacturer_guidance(context, payload.question)
    return {"content": result.content, "fallback_used": result.fallback_used, "provider": result.provider}


@router.post("/lender/underwriting-brief")
async def lender_brief(user: LenderUser, payload: AIQuestionRequest | None = None):
    request_id = payload.production_request_id if payload else None
    context = _context_for(user, request_id)
    result = await ai_service.lender_underwriting_brief(context)
    return {"content": result.content, "fallback_used": result.fallback_used, "provider": result.provider}


@router.post("/chat")
async def chat(payload: AIChatRequest, user: AnyPlatformUser):
    context = _context_for(user, payload.production_request_id)
    role = payload.role or user.role
    result = await ai_service.chat(role, context, payload.message)
    return {"content": result.content, "fallback_used": result.fallback_used, "provider": result.provider}
