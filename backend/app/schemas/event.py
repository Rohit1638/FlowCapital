from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import Field

from app.schemas.common import APIModel, PaginationMeta


class EventCreate(APIModel):
    event_code: str | None = Field(default=None, description="Client event id. Used as idempotency key when one is not supplied.")
    asset_code: str | None = None
    asset_id: UUID | None = None
    event_type: str
    source: str
    event_timestamp: datetime | None = None
    payload: dict[str, Any] = Field(default_factory=dict)
    severity: str | None = None
    idempotency_key: str | None = None


class EventRead(APIModel):
    id: UUID
    event_code: str
    asset_id: UUID
    asset_code: str | None = None
    event_type: str
    source: str
    event_timestamp: datetime
    received_at: datetime
    payload: dict[str, Any]
    severity: str
    status: str
    idempotency_key: str
    processed: bool
    processed_at: datetime | None
    created_at: datetime
    duplicate: bool = False


class EventIngestResponse(APIModel):
    duplicate: bool
    event: EventRead
    message: str
    effects: dict[str, Any] = Field(default_factory=dict)


class EventListResponse(APIModel):
    items: list[EventRead]
    pagination: PaginationMeta
