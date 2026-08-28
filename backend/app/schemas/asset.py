from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import Field

from app.schemas.common import APIModel, PaginationMeta


class AssetCreate(APIModel):
    asset_code: str = Field(..., description="Stable frontend code such as DA-2026-001")
    asset_name: str
    asset_type: str
    owner_name: str
    description: str | None = None
    quantity: float = 0
    unit: str = "Units"
    current_location: str | None = None
    lifecycle_stage: str
    status: str = "ACTIVE"
    metadata: dict[str, Any] = Field(default_factory=dict, alias="metadata")


class AssetUpdate(APIModel):
    asset_name: str | None = None
    description: str | None = None
    quantity: float | None = None
    unit: str | None = None
    current_location: str | None = None
    lifecycle_stage: str | None = None
    status: str | None = None
    metadata: dict[str, Any] | None = None


class AssetRead(APIModel):
    id: UUID
    asset_code: str
    asset_name: str
    asset_type: str
    owner_name: str
    description: str | None
    quantity: float
    unit: str
    current_location: str | None
    lifecycle_stage: str
    status: str
    metadata: dict[str, Any] = Field(serialization_alias="metadata")
    created_at: datetime
    updated_at: datetime


class AssetListResponse(APIModel):
    items: list[AssetRead]
    pagination: PaginationMeta


class HistoryItem(APIModel):
    kind: str
    occurred_at: datetime
    title: str
    detail: str | None = None
    entity_id: str | None = None
