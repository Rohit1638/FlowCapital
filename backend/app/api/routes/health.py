from datetime import datetime, timezone

from fastapi import APIRouter

from app.core.database import ping_database
from app.core.logging import get_logger
from app.schemas.common import HealthResponse

router = APIRouter(tags=["Health"])
logger = get_logger("health")


@router.get("/health", response_model=HealthResponse)
def health():
    database = "disconnected"
    status_value = "degraded"
    try:
        ping_database()
        database = "connected"
        status_value = "healthy"
    except Exception:
        logger.warning("health database check failed")
    return HealthResponse(
        status=status_value,
        service="FlowCapital AI Backend",
        database=database,
        timestamp=datetime.now(timezone.utc),
    )
