from datetime import datetime, timezone

from fastapi import APIRouter

from app.core.database import ping_database, resolve_database_url
from app.core.logging import get_logger
from app.services.platform_persistence import SQLITE_PATH
from app.schemas.common import HealthResponse

router = APIRouter(tags=["Health"])
logger = get_logger("health")


@router.get("/health", response_model=HealthResponse)
def health():
    database = "disconnected"
    status_value = "degraded"
    storage = "sqlite" if SQLITE_PATH.exists() else "memory"
    resolved = resolve_database_url()
    try:
        if ping_database():
            database = "connected"
            status_value = "healthy"
            storage = "postgres"
            if SQLITE_PATH.exists():
                storage = "postgres+sqlite"
    except Exception:
        logger.warning("health database check failed — using local sqlite at %s", SQLITE_PATH)
        if SQLITE_PATH.exists():
            status_value = "degraded"
            database = "sqlite_only"
    return HealthResponse(
        status=status_value,
        service="FlowCapital AI Backend",
        database=database,
        storage=storage,
        timestamp=datetime.now(timezone.utc),
    )
