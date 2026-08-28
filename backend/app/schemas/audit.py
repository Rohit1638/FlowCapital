from datetime import datetime
from typing import Any
from uuid import UUID

from app.schemas.common import APIModel, PaginationMeta


class AuditRead(APIModel):
    id: UUID
    asset_id: UUID | None
    entity_type: str
    entity_id: str
    action: str
    source: str
    previous_state: dict[str, Any] | None
    new_state: dict[str, Any] | None
    metadata: dict[str, Any]
    created_at: datetime


class AuditListResponse(APIModel):
    items: list[AuditRead]
    pagination: PaginationMeta
