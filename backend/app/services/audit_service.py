from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.repositories.audit_repository import AuditRepository
from app.schemas.audit import AuditListResponse, AuditRead
from app.schemas.common import PaginationMeta
from app.services.serializers import audit_to_read


class AuditService:
    def __init__(self, db: Session):
        self.repo = AuditRepository(db)

    def record(
        self,
        action: str,
        entity_type: str,
        entity_id: str,
        source: str = "api",
        asset_id: UUID | None = None,
        previous_state: dict[str, Any] | None = None,
        new_state: dict[str, Any] | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> AuditLog:
        log = AuditLog(
            asset_id=asset_id,
            entity_type=entity_type,
            entity_id=str(entity_id),
            action=action,
            source=source,
            previous_state=previous_state,
            new_state=new_state,
            metadata_=metadata or {},
        )
        return self.repo.add(log)

    def list(self, page: int, page_size: int, asset_id: UUID | None = None) -> AuditListResponse:
        items, total = self.repo.list(page, page_size, asset_id)
        return AuditListResponse(
            items=[audit_to_read(item) for item in items],
            pagination=PaginationMeta(page=page, page_size=page_size, total=total),
        )
