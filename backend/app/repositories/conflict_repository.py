from __future__ import annotations

from uuid import UUID

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.models.conflict import Conflict


class ConflictRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, conflict_id: UUID) -> Conflict | None:
        return self.db.get(Conflict, conflict_id)

    def get_open(self, asset_id: UUID, conflict_type: str) -> Conflict | None:
        return self.db.scalar(
            select(Conflict).where(
                Conflict.asset_id == asset_id,
                Conflict.conflict_type == conflict_type,
                Conflict.status.in_(("OPEN", "IN_REVIEW")),
            )
        )

    def list(self, page: int, page_size: int, asset_id: UUID | None = None, status: str | None = None) -> tuple[list[Conflict], int]:
        stmt: Select[tuple[Conflict]] = select(Conflict)
        count_stmt = select(func.count()).select_from(Conflict)
        if asset_id:
            stmt = stmt.where(Conflict.asset_id == asset_id)
            count_stmt = count_stmt.where(Conflict.asset_id == asset_id)
        if status:
            stmt = stmt.where(Conflict.status == status)
            count_stmt = count_stmt.where(Conflict.status == status)
        total = int(self.db.scalar(count_stmt) or 0)
        items = list(
            self.db.scalars(stmt.order_by(Conflict.detected_at.desc()).offset((page - 1) * page_size).limit(page_size)).all()
        )
        return items, total

    def add(self, conflict: Conflict) -> Conflict:
        self.db.add(conflict)
        self.db.flush()
        return conflict
