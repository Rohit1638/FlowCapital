from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.asset_event import AssetEvent
from app.repositories.conflict_repository import ConflictRepository
from app.repositories.event_repository import EventRepository
from app.schemas.common import PaginationMeta
from app.schemas.conflict import ConflictListResponse, ConflictResolve
from app.services.asset_service import AssetService
from app.services.audit_service import AuditService
from app.services.serializers import conflict_to_read, utcnow


class ConflictService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ConflictRepository(db)
        self.events = EventRepository(db)
        self.assets = AssetService(db)
        self.audit = AuditService(db)

    def list(self, page: int, page_size: int, asset_ref: str | None = None, status_filter: str | None = None):
        asset_id = self.assets.resolve(asset_ref).id if asset_ref else None
        items, total = self.repo.list(page, page_size, asset_id, status_filter)
        return ConflictListResponse(
            items=[conflict_to_read(item) for item in items],
            pagination=PaginationMeta(page=page, page_size=page_size, total=total),
        )

    def get(self, conflict_id: UUID):
        item = self.repo.get_by_id(conflict_id)
        if not item:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Conflict not found")
        return conflict_to_read(item)

    def resolve(self, conflict_id: UUID, payload: ConflictResolve):
        item = self.repo.get_by_id(conflict_id)
        if not item:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Conflict not found")
        if item.status == "RESOLVED":
            return conflict_to_read(item)
        previous = conflict_to_read(item).model_dump(mode="json")
        item.status = "RESOLVED"
        item.resolved_at = utcnow()
        item.resolution_notes = payload.resolution_notes
        item.updated_at = utcnow()
        event = AssetEvent(
            event_code=f"EVT-RESOLVE-{item.conflict_code}",
            asset_id=item.asset_id,
            event_type="CONFLICT_RESOLVED",
            source="VERIFICATION",
            event_timestamp=utcnow(),
            payload={"conflictCode": item.conflict_code, "notes": payload.resolution_notes},
            severity="info",
            status="APPLIED",
            idempotency_key=f"resolve:{item.id}",
            processed=True,
            processed_at=utcnow(),
        )
        existing = self.events.get_by_idempotency(event.idempotency_key)
        if not existing:
            self.events.add(event)
        self.audit.record(
            action="CONFLICT_RESOLVED",
            entity_type="conflict",
            entity_id=str(item.id),
            asset_id=item.asset_id,
            previous_state=previous,
            new_state=conflict_to_read(item).model_dump(mode="json"),
        )
        return conflict_to_read(item)
