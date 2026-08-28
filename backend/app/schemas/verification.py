from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.schemas.common import APIModel, PaginationMeta


class VerificationCreate(APIModel):
    asset_code: str | None = None
    asset_id: UUID | None = None
    verification_type: str
    source: str
    status: str
    confidence_score: int = Field(..., ge=0, le=100)
    evidence_reference: str | None = None
    verified_at: datetime | None = None
    metadata: dict = Field(default_factory=dict)


class VerificationUpdate(APIModel):
    status: str | None = None
    confidence_score: int | None = Field(default=None, ge=0, le=100)
    evidence_reference: str | None = None
    metadata: dict | None = None


class VerificationRead(APIModel):
    id: UUID
    asset_id: UUID
    verification_type: str
    source: str
    status: str
    confidence_score: int
    evidence_reference: str | None
    verified_at: datetime | None
    created_at: datetime
    metadata: dict


class VerificationListResponse(APIModel):
    items: list[VerificationRead]
    pagination: PaginationMeta
