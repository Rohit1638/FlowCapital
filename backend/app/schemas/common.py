from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class APIModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ErrorBody(APIModel):
    code: str
    message: str
    details: dict[str, Any] | None = None


class ErrorResponse(APIModel):
    error: ErrorBody


class PaginationMeta(APIModel):
    page: int
    page_size: int
    total: int


class HealthResponse(APIModel):
    status: str = Field(description="healthy or degraded")
    service: str
    database: str
    timestamp: datetime


class DuplicateResponse(APIModel):
    duplicate: bool = True
    message: str
    event_code: str
    status: str
