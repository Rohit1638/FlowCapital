from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_session_factory
from app.db_init import apply_schema
from app.models.asset import Asset
from app.models.asset_event import AssetEvent
from app.models.audit_log import AuditLog
from app.models.conflict import Conflict
from app.models.verification import Verification
from app.repositories.asset_repository import AssetRepository
from app.repositories.conflict_repository import ConflictRepository
from app.repositories.event_repository import EventRepository
from app.repositories.verification_repository import VerificationRepository
from app.seed.demo_assets import DEMO_ASSETS, FOUNDATIONAL_EVENTS, SEED_CONFLICTS
from app.services.serializers import utcnow


def _upsert_asset(db: Session, spec: dict) -> tuple[Asset, bool]:
    repo = AssetRepository(db)
    existing = repo.get_by_code(spec["asset_code"])
    if existing:
        return existing, False
    asset = Asset(
        asset_code=spec["asset_code"],
        asset_name=spec["asset_name"],
        asset_type=spec["asset_type"],
        owner_name=spec["owner_name"],
        description=spec["description"],
        quantity=spec["quantity"],
        unit=spec["unit"],
        current_location=spec["current_location"],
        lifecycle_stage=spec["lifecycle_stage"],
        status=spec["status"],
        metadata_=spec["metadata"],
        created_at=datetime.fromisoformat(spec["created_at"].replace("Z", "+00:00")),
        updated_at=datetime.fromisoformat(spec["updated_at"].replace("Z", "+00:00")),
    )
    repo.add(asset)
    db.add(
        AuditLog(
            asset_id=asset.id,
            entity_type="asset",
            entity_id=str(asset.id),
            action="ASSET_CREATED",
            source="seed",
            new_state={"asset_code": asset.asset_code},
            metadata_={"seed": True},
        )
    )
    return asset, True


def seed_demo(apply_ddl: bool = True) -> dict:
    if apply_ddl:
        apply_schema()
    session = get_session_factory()()
    created_assets = 0
    skipped_assets = 0
    created_events = 0
    created_verifications = 0
    created_conflicts = 0
    try:
        events = EventRepository(session)
        verifications = VerificationRepository(session)
        conflicts = ConflictRepository(session)
        by_code: dict[str, Asset] = {}
        for spec in DEMO_ASSETS:
            asset, created = _upsert_asset(session, spec)
            by_code[asset.asset_code] = asset
            if created:
                created_assets += 1
                verifications.add(
                    Verification(
                        asset_id=asset.id,
                        verification_type="PHYSICAL",
                        source="VERIFICATION",
                        status=spec["verification_status"],
                        confidence_score=spec["confidence_score"],
                        evidence_reference=spec["asset_code"],
                        verified_at=utcnow(),
                        metadata_={"seed": True},
                    )
                )
                created_verifications += 1
            else:
                skipped_assets += 1

        for event_spec in FOUNDATIONAL_EVENTS:
            if events.get_by_idempotency(event_spec["idempotency_key"]):
                continue
            asset = by_code[event_spec["asset_code"]]
            events.add(
                AssetEvent(
                    event_code=event_spec["event_code"],
                    asset_id=asset.id,
                    event_type=event_spec["event_type"],
                    source=event_spec["source"],
                    event_timestamp=datetime.fromisoformat(event_spec["event_timestamp"].replace("Z", "+00:00")),
                    payload=event_spec["payload"],
                    severity=event_spec["severity"],
                    status="APPLIED",
                    idempotency_key=event_spec["idempotency_key"],
                    processed=True,
                    processed_at=utcnow(),
                )
            )
            created_events += 1
            session.add(
                AuditLog(
                    asset_id=asset.id,
                    entity_type="event",
                    entity_id=event_spec["event_code"],
                    action="EVENT_PROCESSED",
                    source="seed",
                    metadata_={"seed": True},
                )
            )

        for conflict_spec in SEED_CONFLICTS:
            asset = by_code[conflict_spec["asset_code"]]
            if conflicts.get_open(asset.id, conflict_spec["conflict_type"]):
                continue
            existing_code = session.scalar(select(Conflict).where(Conflict.conflict_code == conflict_spec["conflict_code"]))
            if existing_code:
                continue
            conflicts.add(
                Conflict(
                    conflict_code=conflict_spec["conflict_code"],
                    asset_id=asset.id,
                    conflict_type=conflict_spec["conflict_type"],
                    severity=conflict_spec["severity"],
                    status="OPEN",
                    description=conflict_spec["description"],
                    expected_value=conflict_spec["expected_value"],
                    actual_value=conflict_spec["actual_value"],
                    difference_value=conflict_spec["difference_value"],
                    detected_at=utcnow(),
                )
            )
            created_conflicts += 1
            session.add(
                AuditLog(
                    asset_id=asset.id,
                    entity_type="conflict",
                    entity_id=conflict_spec["conflict_code"],
                    action="CONFLICT_DETECTED",
                    source="seed",
                    metadata_={"seed": True},
                )
            )

        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

    return {
        "assets_created": created_assets,
        "assets_skipped": skipped_assets,
        "events_created": created_events,
        "verifications_created": created_verifications,
        "conflicts_created": created_conflicts,
    }


if __name__ == "__main__":
    result = seed_demo()
    print(result)
