from fastapi import APIRouter

from app.api.routes import assets, audit, conflicts, events, health, verifications

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(assets.router, prefix="/assets")
api_router.include_router(events.router, prefix="/events")
api_router.include_router(verifications.router, prefix="/verifications")
api_router.include_router(conflicts.router, prefix="/conflicts")
api_router.include_router(audit.router, prefix="/audit")
