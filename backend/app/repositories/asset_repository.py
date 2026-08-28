from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.models.asset import Asset


class AssetRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, asset_id: UUID) -> Asset | None:
        return self.db.get(Asset, asset_id)

    def get_by_code(self, asset_code: str) -> Asset | None:
        return self.db.scalar(select(Asset).where(Asset.asset_code == asset_code))

    def get_by_id_or_code(self, value: str) -> Asset | None:
        try:
            return self.get_by_id(UUID(value))
        except ValueError:
            return self.get_by_code(value)

    def list(
        self,
        page: int,
        page_size: int,
        lifecycle_stage: str | None = None,
        status: str | None = None,
        asset_type: str | None = None,
    ) -> tuple[list[Asset], int]:
        stmt: Select[tuple[Asset]] = select(Asset)
        count_stmt = select(func.count()).select_from(Asset)
        if lifecycle_stage:
            stmt = stmt.where(Asset.lifecycle_stage == lifecycle_stage)
            count_stmt = count_stmt.where(Asset.lifecycle_stage == lifecycle_stage)
        if status:
            stmt = stmt.where(Asset.status == status)
            count_stmt = count_stmt.where(Asset.status == status)
        if asset_type:
            stmt = stmt.where(Asset.asset_type == asset_type)
            count_stmt = count_stmt.where(Asset.asset_type == asset_type)
        total = int(self.db.scalar(count_stmt) or 0)
        items = list(
            self.db.scalars(stmt.order_by(Asset.asset_code).offset((page - 1) * page_size).limit(page_size)).all()
        )
        return items, total

    def add(self, asset: Asset) -> Asset:
        self.db.add(asset)
        self.db.flush()
        return asset
