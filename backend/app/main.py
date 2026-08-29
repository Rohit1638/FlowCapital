from fastapi import FastAPI, HTTPException, Request

from fastapi.exceptions import RequestValidationError

from fastapi.middleware.cors import CORSMiddleware

from fastapi.responses import JSONResponse



from app.api.routes import ai_routes, auth, documents, exposure, health, integrations, instruments, lender, manufacturer, notifications, production_requests, reassessments, simulation

from app.core.config import get_settings

from app.core.logging import get_logger



logger = get_logger("api")





def create_app() -> FastAPI:

    settings = get_settings()

    application = FastAPI(

        title="FlowCapital AI Backend",

        description="Manufacturer/lender platform API — demo store, simulation, reassessment, and integrations.",

        version="0.8.0",

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

    application.include_router(auth.router, prefix="/api/v1")

    application.include_router(manufacturer.router, prefix="/api/v1")

    application.include_router(lender.router, prefix="/api/v1")

    application.include_router(production_requests.router, prefix="/api/v1")

    application.include_router(documents.router, prefix="/api/v1")

    application.include_router(ai_routes.router, prefix="/api/v1")

    application.include_router(notifications.router, prefix="/api/v1")

    application.include_router(simulation.router, prefix="/api/v1")

    application.include_router(integrations.router, prefix="/api/v1/integrations")  # n8n webhooks

    application.include_router(exposure.router, prefix="/api/v1")

    application.include_router(instruments.router, prefix="/api/v1")

    application.include_router(reassessments.router, prefix="/api/v1")



    @application.exception_handler(HTTPException)

    async def http_error(_request: Request, exc: HTTPException):

        message = exc.detail if isinstance(exc.detail, str) else str(exc.detail)

        return JSONResponse(status_code=exc.status_code, content={"error": {"code": str(exc.status_code), "message": message}})



    @application.exception_handler(RequestValidationError)

    async def validation_error(_request: Request, exc: RequestValidationError):
        errors = exc.errors()
        first = errors[0] if errors else None
        message = "Validation error"
        if first:
            field = first.get("loc", ["field"])[-1]
            detail = first.get("msg", "")
            if "password" in str(field).lower():
                message = "Password must be at least 8 characters."
            elif "phone" in str(field).lower():
                message = "Enter a valid phone number (10 digits or +91…)."
            elif detail:
                message = f"{field}: {detail}"
        return JSONResponse(status_code=422, content={"error": {"code": "422", "message": message, "details": {"errors": errors}}})



    @application.exception_handler(Exception)

    async def unhandled(_request: Request, exc: Exception):

        logger.exception("unhandled error: %s", exc.__class__.__name__)

        return JSONResponse(status_code=500, content={"error": {"code": "500", "message": "Unexpected server error"}})



    return application





app = create_app()


@app.on_event("startup")
def on_startup() -> None:
    from app.services.platform_repository import platform_repository

    platform_repository.bootstrap()

