from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.asset import Asset
from app.repositories.asset_repository import AssetRepository
from app.repositories.audit_repository import AuditRepository
from app.repositories.conflict_repository import ConflictRepository
from app.repositories.event_repository import EventRepository
from app.repositories.verification_repository import VerificationRepository
from app.schemas.asset import AssetCreate, AssetListResponse, AssetRead, AssetUpdate, HistoryItem
from app.schemas.common import PaginationMeta
from app.services.audit_service import AuditService
from app.services.serializers import asset_to_read, snapshot_asset, utcnow


class AssetService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = AssetRepository(db)
        self.events = EventRepository(db)
        self.verifications = VerificationRepository(db)
        self.conflicts = ConflictRepository(db)
        self.audit = AuditService(db)

    def resolve(self, asset_ref: str) -> Asset:
        asset = self.repo.get_by_id_or_code(asset_ref)
        if not asset:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Asset not found")
        return asset

    def create(self, payload: AssetCreate) -> AssetRead:
        if self.repo.get_by_code(payload.asset_code):
            raise HTTPException(status.HTTP_409_CONFLICT, detail="Duplicate asset code")
        asset = Asset(
            asset_code=payload.asset_code,
            asset_name=payload.asset_name,
            asset_type=payload.asset_type,
            owner_name=payload.owner_name,
            description=payload.description,
            quantity=payload.quantity,
            unit=payload.unit,
            current_location=payload.current_location,
            lifecycle_stage=payload.lifecycle_stage,
            status=payload.status,
            metadata_=payload.metadata,
        )
        self.repo.add(asset)
        self.audit.record(
            action="ASSET_CREATED",
            entity_type="asset",
            entity_id=str(asset.id),
            asset_id=asset.id,
            new_state=snapshot_asset(asset),
        )
        return asset_to_read(asset)

    def list(self, page: int, page_size: int, lifecycle_stage: str | None, status: str | None, asset_type: str | None) -> AssetListResponse:
        items, total = self.repo.list(page, page_size, lifecycle_stage, status, asset_type)
        return AssetListResponse(
            items=[asset_to_read(item) for item in items],
            pagination=PaginationMeta(page=page, page_size=page_size, total=total),
        )

    def get(self, asset_ref: str) -> AssetRead:
        return asset_to_read(self.resolve(asset_ref))

    def update(self, asset_ref: str, payload: AssetUpdate) -> AssetRead:
        asset = self.resolve(asset_ref)
        previous = snapshot_asset(asset)
        data = payload.model_dump(exclude_unset=True)
        if "metadata" in data:
            asset.metadata_ = data.pop("metadata") or {}
        for key, value in data.items():
            setattr(asset, key, value)
        asset.updated_at = utcnow()
        self.db.flush()
        self.audit.record(
            action="ASSET_UPDATED",
            entity_type="asset",
            entity_id=str(asset.id),
            asset_id=asset.id,
            previous_state=previous,
            new_state=snapshot_asset(asset),
        )
        return asset_to_read(asset)

    def history(self, asset_ref: str) -> list[HistoryItem]:
        asset = self.resolve(asset_ref)
        items: list[HistoryItem] = [
            HistoryItem(kind="asset", occurred_at=asset.created_at, title="ASSET_CREATED", detail=asset.asset_code, entity_id=str(asset.id))
        ]
        events, _ = self.events.list(1, 200, asset.id)
        for event in events:
            items.append(
                HistoryItem(
                    kind="event",
                    occurred_at=event.event_timestamp,
                    title=event.event_type,
                    detail=event.status,
                    entity_id=str(event.id),
                )
            )
        verifications, _ = self.verifications.list(1, 200, asset.id)
        for item in verifications:
            items.append(
                HistoryItem(
                    kind="verification",
                    occurred_at=item.created_at,
                    title=item.verification_type,
                    detail=item.status,
                    entity_id=str(item.id),
                )
            )
        conflicts, _ = self.conflicts.list(1, 200, asset.id)
        for item in conflicts:
            items.append(
                HistoryItem(
                    kind="conflict",
                    occurred_at=item.detected_at,
                    title=item.conflict_type,
                    detail=item.status,
                    entity_id=str(item.id),
                )
            )
        audits, _ = AuditRepository(self.db).list(1, 200, asset.id)
        for item in audits:
            items.append(
                HistoryItem(
                    kind="audit",
                    occurred_at=item.created_at,
                    title=item.action,
                    detail=item.entity_type,
                    entity_id=str(item.id),
                )
            )
        items.sort(key=lambda row: row.occurred_at)
        return items
