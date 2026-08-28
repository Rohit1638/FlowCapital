from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.models.asset_event import AssetEvent


class EventRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, event_id: UUID) -> AssetEvent | None:
        return self.db.get(AssetEvent, event_id)

    def get_by_code(self, event_code: str) -> AssetEvent | None:
        return self.db.scalar(select(AssetEvent).where(AssetEvent.event_code == event_code))

    def get_by_idempotency(self, key: str) -> AssetEvent | None:
        return self.db.scalar(select(AssetEvent).where(AssetEvent.idempotency_key == key))

    def list(
        self,
        page: int,
        page_size: int,
        asset_id: UUID | None = None,
        event_type: str | None = None,
    ) -> tuple[list[AssetEvent], int]:
        stmt: Select[tuple[AssetEvent]] = select(AssetEvent)
        count_stmt = select(func.count()).select_from(AssetEvent)
        if asset_id:
            stmt = stmt.where(AssetEvent.asset_id == asset_id)
            count_stmt = count_stmt.where(AssetEvent.asset_id == asset_id)
        if event_type:
            stmt = stmt.where(AssetEvent.event_type == event_type)
            count_stmt = count_stmt.where(AssetEvent.event_type == event_type)
        total = int(self.db.scalar(count_stmt) or 0)
        items = list(
            self.db.scalars(
                stmt.order_by(AssetEvent.event_timestamp.desc()).offset((page - 1) * page_size).limit(page_size)
            ).all()
        )
        return items, total

    def add(self, event: AssetEvent) -> AssetEvent:
        self.db.add(event)
        self.db.flush()
        return event

    def mark_processed(self, event: AssetEvent, status: str) -> AssetEvent:
        event.processed = True
        event.status = status
        event.processed_at = datetime.now(timezone.utc)
        self.db.flush()
        return event
