from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.schemas.common import APIModel, PaginationMeta


class ConflictRead(APIModel):
    id: UUID
    conflict_code: str
    asset_id: UUID
    conflict_type: str
    severity: str
    status: str
    description: str
    expected_value: str | None
    actual_value: str | None
    difference_value: str | None
    detected_at: datetime
    resolved_at: datetime | None
    resolution_notes: str | None
    created_at: datetime
    updated_at: datetime


class ConflictResolve(APIModel):
    resolution_notes: str = Field(..., min_length=3)


class ConflictListResponse(APIModel):
    items: list[ConflictRead]
    pagination: PaginationMeta
