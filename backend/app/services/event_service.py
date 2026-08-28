from __future__ import annotations

import uuid
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.asset_event import AssetEvent
from app.models.conflict import Conflict
from app.models.verification import Verification
from app.repositories.conflict_repository import ConflictRepository
from app.repositories.event_repository import EventRepository
from app.repositories.verification_repository import VerificationRepository
from app.schemas.common import PaginationMeta
from app.schemas.event import EventCreate, EventIngestResponse, EventListResponse
from app.services.asset_service import AssetService
from app.services.audit_service import AuditService
from app.services.event_impact_service import interpret_event
from app.services.serializers import event_to_read, snapshot_asset, utcnow


class EventService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = EventRepository(db)
        self.assets = AssetService(db)
        self.verifications = VerificationRepository(db)
        self.conflicts = ConflictRepository(db)
        self.audit = AuditService(db)

    def list(self, page: int, page_size: int, asset_ref: str | None = None, event_type: str | None = None) -> EventListResponse:
        asset_id = self.assets.resolve(asset_ref).id if asset_ref else None
        items, total = self.repo.list(page, page_size, asset_id, event_type)
        return EventListResponse(
            items=[event_to_read(item) for item in items],
            pagination=PaginationMeta(page=page, page_size=page_size, total=total),
        )

    def get(self, event_id: str):
        try:
            event = self.repo.get_by_id(UUID(event_id))
        except ValueError:
            event = self.repo.get_by_code(event_id)
        if not event:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Event not found")
        return event_to_read(event)

    def ingest(self, payload: EventCreate) -> EventIngestResponse:
        if not payload.asset_id and not payload.asset_code:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, detail="asset_code or asset_id is required")
        asset = self.assets.resolve(str(payload.asset_id or payload.asset_code))
        event_code = payload.event_code or f"EVT-{uuid.uuid4().hex[:12]}"
        idempotency_key = payload.idempotency_key or event_code

        existing = self.repo.get_by_idempotency(idempotency_key) or self.repo.get_by_code(event_code)
        if existing:
            self.audit.record(
                action="EVENT_DUPLICATE_REJECTED",
                entity_type="event",
                entity_id=str(existing.id),
                asset_id=asset.id,
                metadata={"idempotency_key": idempotency_key},
            )
            return EventIngestResponse(
                duplicate=True,
                event=event_to_read(existing, asset.asset_code, duplicate=True),
                message="Duplicate detected. No additional event impact was applied.",
                effects={},
            )

        event = AssetEvent(
            event_code=event_code,
            asset_id=asset.id,
            event_type=payload.event_type,
            source=payload.source,
            event_timestamp=payload.event_timestamp or utcnow(),
            payload=payload.payload,
            severity=payload.severity or "info",
            status="RECEIVED",
            idempotency_key=idempotency_key,
            processed=False,
        )
        self.repo.add(event)
        self.audit.record(action="EVENT_RECEIVED", entity_type="event", entity_id=str(event.id), asset_id=asset.id, new_state={"event_code": event_code})

        previous = snapshot_asset(asset)
        effects = interpret_event(payload.event_type, payload.payload)
        self._apply_effects(asset, event, effects)
        self.repo.mark_processed(event, "APPLIED")
        self.audit.record(
            action="EVENT_PROCESSED",
            entity_type="event",
            entity_id=str(event.id),
            asset_id=asset.id,
            previous_state=previous,
            new_state=snapshot_asset(asset),
            metadata={"effects": effects},
        )
        return EventIngestResponse(
            duplicate=False,
            event=event_to_read(event, asset.asset_code),
            message="Event processed.",
            effects=effects,
        )

    def _apply_effects(self, asset, event: AssetEvent, effects: dict) -> None:
        updates = effects.get("asset_updates") or {}
        twin = dict(asset.metadata_ or {})
        physical = dict(twin.get("physical") or {})
        if "lifecycle_stage" in updates:
            asset.lifecycle_stage = updates["lifecycle_stage"]
            twin["currentStage"] = updates["lifecycle_stage"]
            physical["stage"] = updates["lifecycle_stage"]
        if "current_location" in updates:
            asset.current_location = updates["current_location"]
            twin["location"] = updates["current_location"]
            physical["location"] = updates["current_location"]
        if "status" in updates:
            asset.status = updates["status"]
            twin["status"] = updates["status"]
        if "metadata_production_completion" in updates:
            physical["productionCompletion"] = updates["metadata_production_completion"]
        if "metadata_current_value" in updates:
            twin["currentValue"] = updates["metadata_current_value"]
        if "metadata_verification_status" in updates:
            physical["verificationStatus"] = updates["metadata_verification_status"]
        if "metadata_shipment_status" in updates:
            physical["shipmentStatus"] = updates["metadata_shipment_status"]
        if physical:
            twin["physical"] = physical
        asset.metadata_ = twin
        asset.updated_at = utcnow()

        verification = effects.get("create_verification")
        if verification:
            record = Verification(
                asset_id=asset.id,
                verification_type=verification["verification_type"],
                source=event.source,
                status=verification["status"],
                confidence_score=max(0, min(100, int(verification["confidence_score"]))),
                evidence_reference=event.event_code,
                verified_at=utcnow() if verification["status"] == "VERIFIED" else None,
                metadata_={"event_id": str(event.id)},
            )
            self.verifications.add(record)
            self.audit.record(action="VERIFICATION_CREATED", entity_type="verification", entity_id=str(record.id), asset_id=asset.id)

        conflict_spec = effects.get("create_conflict")
        if conflict_spec:
            open_conflict = self.conflicts.get_open(asset.id, conflict_spec["conflict_type"])
            if open_conflict:
                open_conflict.severity = conflict_spec["severity"]
                open_conflict.description = conflict_spec["description"]
                open_conflict.expected_value = conflict_spec["expected_value"]
                open_conflict.actual_value = conflict_spec["actual_value"]
                open_conflict.difference_value = conflict_spec["difference_value"]
                open_conflict.updated_at = utcnow()
            else:
                created = Conflict(
                    conflict_code=f"CFL-{asset.asset_code}-{conflict_spec['conflict_type']}-{uuid.uuid4().hex[:8]}",
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
                self.conflicts.add(created)
                self.audit.record(action="CONFLICT_DETECTED", entity_type="conflict", entity_id=str(created.id), asset_id=asset.id)

        resolve_type = effects.get("resolve_conflict_type")
        if resolve_type:
            open_conflict = self.conflicts.get_open(asset.id, str(resolve_type))
            if open_conflict:
                open_conflict.status = "RESOLVED"
                open_conflict.resolved_at = utcnow()
                open_conflict.resolution_notes = f"Resolved by event {event.event_code}"
                open_conflict.updated_at = utcnow()
                self.audit.record(action="CONFLICT_RESOLVED", entity_type="conflict", entity_id=str(open_conflict.id), asset_id=asset.id)
