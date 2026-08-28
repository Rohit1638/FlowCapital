from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.verification import Verification
from app.repositories.verification_repository import VerificationRepository
from app.schemas.common import PaginationMeta
from app.schemas.verification import VerificationCreate, VerificationListResponse, VerificationUpdate
from app.services.asset_service import AssetService
from app.services.audit_service import AuditService
from app.services.serializers import utcnow, verification_to_read


class VerificationService:
    def __init__(self, db: Session):
        self.repo = VerificationRepository(db)
        self.assets = AssetService(db)
        self.audit = AuditService(db)

    def create(self, payload: VerificationCreate):
        if not payload.asset_id and not payload.asset_code:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, detail="asset_code or asset_id is required")
        asset = self.assets.resolve(str(payload.asset_id or payload.asset_code))
        record = Verification(
            asset_id=asset.id,
            verification_type=payload.verification_type,
            source=payload.source,
            status=payload.status,
            confidence_score=payload.confidence_score,
            evidence_reference=payload.evidence_reference,
            verified_at=payload.verified_at or (utcnow() if payload.status == "VERIFIED" else None),
            metadata_=payload.metadata,
        )
        self.repo.add(record)
        self.audit.record(action="VERIFICATION_CREATED", entity_type="verification", entity_id=str(record.id), asset_id=asset.id)
        return verification_to_read(record)

    def list(self, page: int, page_size: int, asset_ref: str | None = None):
        asset_id = self.assets.resolve(asset_ref).id if asset_ref else None
        items, total = self.repo.list(page, page_size, asset_id)
        return VerificationListResponse(
            items=[verification_to_read(item) for item in items],
            pagination=PaginationMeta(page=page, page_size=page_size, total=total),
        )

    def get(self, verification_id: UUID):
        item = self.repo.get_by_id(verification_id)
        if not item:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Verification not found")
        return verification_to_read(item)

    def update(self, verification_id: UUID, payload: VerificationUpdate):
        item = self.repo.get_by_id(verification_id)
        if not item:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Verification not found")
        previous = verification_to_read(item).model_dump(mode="json")
        data = payload.model_dump(exclude_unset=True)
        if "metadata" in data:
            item.metadata_ = data.pop("metadata") or {}
        for key, value in data.items():
            setattr(item, key, value)
        self.audit.record(
            action="VERIFICATION_UPDATED",
            entity_type="verification",
            entity_id=str(item.id),
            asset_id=item.asset_id,
            previous_state=previous,
            new_state=verification_to_read(item).model_dump(mode="json"),
        )
        return verification_to_read(item)
