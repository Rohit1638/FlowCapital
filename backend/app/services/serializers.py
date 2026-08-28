from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from app.models.asset import Asset
from app.models.asset_event import AssetEvent
from app.models.audit_log import AuditLog
from app.models.conflict import Conflict
from app.models.verification import Verification
from app.schemas.asset import AssetRead
from app.schemas.audit import AuditRead
from app.schemas.conflict import ConflictRead
from app.schemas.event import EventRead
from app.schemas.verification import VerificationRead


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def asset_to_read(asset: Asset) -> AssetRead:
    return AssetRead(
        id=asset.id,
        asset_code=asset.asset_code,
        asset_name=asset.asset_name,
        asset_type=asset.asset_type,
        owner_name=asset.owner_name,
        description=asset.description,
        quantity=float(asset.quantity),
        unit=asset.unit,
        current_location=asset.current_location,
        lifecycle_stage=asset.lifecycle_stage,
        status=asset.status,
        metadata=asset.metadata_ or {},
        created_at=asset.created_at,
        updated_at=asset.updated_at,
    )


def event_to_read(event: AssetEvent, asset_code: str | None = None, duplicate: bool = False) -> EventRead:
    return EventRead(
        id=event.id,
        event_code=event.event_code,
        asset_id=event.asset_id,
        asset_code=asset_code,
        event_type=event.event_type,
        source=event.source,
        event_timestamp=event.event_timestamp,
        received_at=event.received_at,
        payload=event.payload or {},
        severity=event.severity,
        status=event.status,
        idempotency_key=event.idempotency_key,
        processed=event.processed,
        processed_at=event.processed_at,
        created_at=event.created_at,
        duplicate=duplicate,
    )


def verification_to_read(item: Verification) -> VerificationRead:
    return VerificationRead(
        id=item.id,
        asset_id=item.asset_id,
        verification_type=item.verification_type,
        source=item.source,
        status=item.status,
        confidence_score=item.confidence_score,
        evidence_reference=item.evidence_reference,
        verified_at=item.verified_at,
        created_at=item.created_at,
        metadata=item.metadata_ or {},
    )


def conflict_to_read(item: Conflict) -> ConflictRead:
    return ConflictRead.model_validate(item)


def audit_to_read(item: AuditLog) -> AuditRead:
    return AuditRead(
        id=item.id,
        asset_id=item.asset_id,
        entity_type=item.entity_type,
        entity_id=item.entity_id,
        action=item.action,
        source=item.source,
        previous_state=item.previous_state,
        new_state=item.new_state,
        metadata=item.metadata_ or {},
        created_at=item.created_at,
    )


def snapshot_asset(asset: Asset) -> dict[str, Any]:
    return asset_to_read(asset).model_dump(mode="json")
