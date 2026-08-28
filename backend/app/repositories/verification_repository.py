from __future__ import annotations

from uuid import UUID

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.models.verification import Verification


class VerificationRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, verification_id: UUID) -> Verification | None:
        return self.db.get(Verification, verification_id)

    def list(self, page: int, page_size: int, asset_id: UUID | None = None) -> tuple[list[Verification], int]:
        stmt: Select[tuple[Verification]] = select(Verification)
        count_stmt = select(func.count()).select_from(Verification)
        if asset_id:
            stmt = stmt.where(Verification.asset_id == asset_id)
            count_stmt = count_stmt.where(Verification.asset_id == asset_id)
        total = int(self.db.scalar(count_stmt) or 0)
        items = list(
            self.db.scalars(stmt.order_by(Verification.created_at.desc()).offset((page - 1) * page_size).limit(page_size)).all()
        )
        return items, total

    def add(self, verification: Verification) -> Verification:
        self.db.add(verification)
        self.db.flush()
        return verification
