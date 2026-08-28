from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import ai_routes, assets, audit, auth, conflicts, documents, events, health, lender, manufacturer, notifications, production_requests, verifications
from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger("api")


def create_app() -> FastAPI:
    settings = get_settings()
    application = FastAPI(
        title="FlowCapital AI Backend",
        description="Persistent supply-chain evidence, events, verifications, conflicts, and audit trail.",
        version="0.6.1",
        docs_url="/docs",
        redoc_url="/redoc",
    )
    cors_kwargs: dict = {
        "allow_credentials": True,
        "allow_methods": ["*"],
        "allow_headers": ["*"],
    }
    if settings.app_env == "development":
        cors_kwargs["allow_origin_regex"] = r"http://(localhost|127\.0\.0\.1):\d+"
    else:
        cors_kwargs["allow_origins"] = settings.origin_list
    application.add_middleware(CORSMiddleware, **cors_kwargs)
    application.include_router(health.router, prefix="/api/v1")
    application.include_router(assets.router, prefix="/api/v1/assets")
    application.include_router(events.router, prefix="/api/v1/events")
    application.include_router(verifications.router, prefix="/api/v1/verifications")
    application.include_router(conflicts.router, prefix="/api/v1/conflicts")
    application.include_router(audit.router, prefix="/api/v1/audit")
    application.include_router(auth.router, prefix="/api/v1")
    application.include_router(manufacturer.router, prefix="/api/v1")
    application.include_router(lender.router, prefix="/api/v1")
    application.include_router(production_requests.router, prefix="/api/v1")
    application.include_router(documents.router, prefix="/api/v1")
    application.include_router(ai_routes.router, prefix="/api/v1")
    application.include_router(notifications.router, prefix="/api/v1")

    @application.exception_handler(HTTPException)
    async def http_error(_request: Request, exc: HTTPException):
        message = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
        return JSONResponse(status_code=exc.status_code, content={"error": {"code": str(exc.status_code), "message": message}})

    @application.exception_handler(RequestValidationError)
    async def validation_error(_request: Request, exc: RequestValidationError):
        return JSONResponse(status_code=422, content={"error": {"code": "422", "message": "Validation error", "details": {"errors": exc.errors()}}})

    @application.exception_handler(Exception)
    async def unhandled(_request: Request, exc: Exception):
        logger.exception("unhandled error: %s", exc.__class__.__name__)
        return JSONResponse(status_code=500, content={"error": {"code": "500", "message": "Unexpected server error"}})

    return application


app = create_app()
