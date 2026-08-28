from __future__ import annotations

from uuid import UUID

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


class AuditRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(self, page: int, page_size: int, asset_id: UUID | None = None) -> tuple[list[AuditLog], int]:
        stmt: Select[tuple[AuditLog]] = select(AuditLog)
        count_stmt = select(func.count()).select_from(AuditLog)
        if asset_id:
            stmt = stmt.where(AuditLog.asset_id == asset_id)
            count_stmt = count_stmt.where(AuditLog.asset_id == asset_id)
        total = int(self.db.scalar(count_stmt) or 0)
        items = list(
            self.db.scalars(stmt.order_by(AuditLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size)).all()
        )
        return items, total

    def add(self, log: AuditLog) -> AuditLog:
        self.db.add(log)
        self.db.flush()
        return log
