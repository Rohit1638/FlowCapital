from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    auth_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), unique=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    organization_name: Mapped[str | None] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(32), nullable=False)
    company_name: Mapped[str | None] = mapped_column(String(255))
    designation: Mapped[str | None] = mapped_column(String(128))
    phone: Mapped[str | None] = mapped_column(String(64))
    avatar_url: Mapped[str | None] = mapped_column(String(512))
    verification_status: Mapped[str] = mapped_column(String(32), nullable=False, default="VERIFIED")
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class LenderProfile(Base):
    __tablename__ = "lender_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    lender_name: Mapped[str] = mapped_column(String(255), nullable=False)
    risk_appetite: Mapped[str] = mapped_column(String(32), nullable=False, default="BALANCED")
    minimum_confidence_threshold: Mapped[int] = mapped_column(Integer, nullable=False, default=75)
    max_exposure_per_asset: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=5_000_000)
    max_exposure_per_manufacturer: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=15_000_000)
    max_risk_level: Mapped[str] = mapped_column(String(32), nullable=False, default="HIGH")
    concentration_limit_pct: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False, default=25)
    preferred_asset_types: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    preferred_instruments: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class ProductionRequest(Base):
    __tablename__ = "production_requests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    manufacturer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    project_name: Mapped[str] = mapped_column(String(255), nullable=False)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    product_category: Mapped[str] = mapped_column(String(128), nullable=False)
    quantity: Mapped[float] = mapped_column(Numeric(18, 4), nullable=False)
    expected_selling_value: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    estimated_production_cost: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    required_funding_amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    funding_purpose: Mapped[str | None] = mapped_column(Text)
    expected_start_date: Mapped[date | None] = mapped_column(Date)
    expected_completion_date: Mapped[date | None] = mapped_column(Date)
    buyer_name: Mapped[str | None] = mapped_column(String(255))
    purchase_order_reference: Mapped[str | None] = mapped_column(String(128))
    description: Mapped[str | None] = mapped_column(Text)
    current_stage: Mapped[str] = mapped_column(String(64), nullable=False, default="PURCHASE_ORDER")
    progress_pct: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="DRAFT")
    confidence_score: Mapped[int | None] = mapped_column(Integer)
    risk_level: Mapped[str | None] = mapped_column(String(32))
    verified_value: Mapped[float | None] = mapped_column(Numeric(18, 2))
    financeable_value: Mapped[float | None] = mapped_column(Numeric(18, 2))
    outstanding_exposure: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    unclaimed_value: Mapped[float | None] = mapped_column(Numeric(18, 2))
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    stages = relationship("ProductionStage", back_populates="production_request", cascade="all, delete-orphan")
    collateral = relationship("CollateralAsset", back_populates="production_request", cascade="all, delete-orphan")
    documents = relationship("RequestDocument", back_populates="production_request", cascade="all, delete-orphan")


class ProductionStage(Base):
    __tablename__ = "production_stages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    production_request_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("production_requests.id"), nullable=False)
    stage_code: Mapped[str] = mapped_column(String(64), nullable=False)
    stage_name: Mapped[str] = mapped_column(String(128), nullable=False)
    sequence_order: Mapped[int] = mapped_column(Integer, nullable=False)
    estimated_duration_days: Mapped[int | None] = mapped_column(Integer)
    expected_cost: Mapped[float | None] = mapped_column(Numeric(18, 2))
    actual_start_date: Mapped[date | None] = mapped_column(Date)
    actual_end_date: Mapped[date | None] = mapped_column(Date)
    progress_pct: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="PENDING")
    dependencies: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    production_request = relationship("ProductionRequest", back_populates="stages")


class CollateralAsset(Base):
    __tablename__ = "collateral_assets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    collateral_code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    production_request_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("production_requests.id"), nullable=False)
    manufacturer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    asset_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("assets.id"))
    asset_name: Mapped[str] = mapped_column(String(255), nullable=False)
    asset_type: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    quantity: Mapped[float] = mapped_column(Numeric(18, 4), nullable=False, default=0)
    unit: Mapped[str] = mapped_column(String(64), nullable=False, default="Units")
    estimated_value: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    lifecycle_stage: Mapped[str] = mapped_column(String(64), nullable=False)
    location: Mapped[str | None] = mapped_column(String(255))
    ownership_info: Mapped[str | None] = mapped_column(Text)
    existing_financing_amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    existing_lender: Mapped[str | None] = mapped_column(String(255))
    already_pledged: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    evidence_references: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    production_request = relationship("ProductionRequest", back_populates="collateral")


class RequestDocument(Base):
    __tablename__ = "request_documents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    manufacturer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    production_request_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("production_requests.id"), nullable=False)
    asset_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("assets.id"))
    document_name: Mapped[str] = mapped_column(String(255), nullable=False)
    document_type: Mapped[str] = mapped_column(String(64), nullable=False)
    storage_path: Mapped[str | None] = mapped_column(String(512))
    file_size_bytes: Mapped[int | None] = mapped_column()
    mime_type: Mapped[str | None] = mapped_column(String(128))
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="UPLOADED")
    verification_status: Mapped[str] = mapped_column(String(32), nullable=False, default="PENDING")
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    production_request = relationship("ProductionRequest", back_populates="documents")


class FinancingRequest(Base):
    __tablename__ = "financing_requests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    production_request_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("production_requests.id"), nullable=False)
    manufacturer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    requested_amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    recommended_min_amount: Mapped[float | None] = mapped_column(Numeric(18, 2))
    recommended_max_amount: Mapped[float | None] = mapped_column(Numeric(18, 2))
    maximum_safe_amount: Mapped[float | None] = mapped_column(Numeric(18, 2))
    confidence_at_submission: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="PENDING")
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class LenderDecision(Base):
    __tablename__ = "lender_decisions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    financing_request_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("financing_requests.id"), nullable=False)
    production_request_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("production_requests.id"), nullable=False)
    lender_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    decision_type: Mapped[str] = mapped_column(String(32), nullable=False)
    requested_amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    approved_amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    instrument: Mapped[str | None] = mapped_column(String(64))
    interest_yield: Mapped[float | None] = mapped_column(Numeric(8, 4))
    duration_days: Mapped[int | None] = mapped_column(Integer)
    seniority: Mapped[str | None] = mapped_column(String(32))
    reason: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    conditions = relationship("LenderCondition", back_populates="decision", cascade="all, delete-orphan")


class LenderCondition(Base):
    __tablename__ = "lender_conditions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lender_decision_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("lender_decisions.id"), nullable=False)
    condition_text: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="OPEN")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    decision = relationship("LenderDecision", back_populates="conditions")


class FinancingTranche(Base):
    __tablename__ = "financing_tranches"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tranche_code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    production_request_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("production_requests.id"), nullable=False)
    financing_request_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("financing_requests.id"), nullable=False)
    lender_decision_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("lender_decisions.id"))
    lender_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    approved_amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    outstanding_amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    instrument: Mapped[str] = mapped_column(String(64), nullable=False)
    interest_yield: Mapped[float | None] = mapped_column(Numeric(8, 4))
    duration_days: Mapped[int | None] = mapped_column(Integer)
    seniority: Mapped[str] = mapped_column(String(32), nullable=False, default="SENIOR")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="ACTIVE")
    conditions: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class FinancingExposure(Base):
    __tablename__ = "financing_exposures"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("assets.id"))
    collateral_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("collateral_assets.id"))
    production_request_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("production_requests.id"), nullable=False)
    lender_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    financing_request_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("financing_requests.id"))
    tranche_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("financing_tranches.id"))
    approved_amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    outstanding_amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="ACTIVE")
    seniority: Mapped[str] = mapped_column(String(32), nullable=False, default="SENIOR")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class FinancingActionLedger(Base):
    __tablename__ = "financing_action_ledger"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    production_request_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("production_requests.id"), nullable=False)
    asset_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("assets.id"))
    triggering_event_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("asset_events.id"))
    manufacturer_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("profiles.id"))
    recommended_action: Mapped[str] = mapped_column(String(64), nullable=False)
    actual_action: Mapped[str | None] = mapped_column(String(64))
    confidence_before: Mapped[int | None] = mapped_column(Integer)
    confidence_after: Mapped[int | None] = mapped_column(Integer)
    risk_before: Mapped[str | None] = mapped_column(String(32))
    risk_after: Mapped[str | None] = mapped_column(String(32))
    verified_value_before: Mapped[float | None] = mapped_column(Numeric(18, 2))
    verified_value_after: Mapped[float | None] = mapped_column(Numeric(18, 2))
    financeable_value_before: Mapped[float | None] = mapped_column(Numeric(18, 2))
    financeable_value_after: Mapped[float | None] = mapped_column(Numeric(18, 2))
    outstanding_exposure: Mapped[float | None] = mapped_column(Numeric(18, 2))
    unclaimed_value: Mapped[float | None] = mapped_column(Numeric(18, 2))
    reason: Mapped[str | None] = mapped_column(Text)
    evidence_snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    ai_insight_reference: Mapped[str | None] = mapped_column(String(128))
    approval_status: Mapped[str | None] = mapped_column(String(32))
    human_override: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(64), nullable=False)
    related_entity_type: Mapped[str | None] = mapped_column(String(64))
    related_entity_id: Mapped[str | None] = mapped_column(String(128))
    read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class AIInsight(Base):
    __tablename__ = "ai_insights"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audience: Mapped[str] = mapped_column(String(32), nullable=False)
    profile_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("profiles.id"))
    production_request_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("production_requests.id"))
    insight_type: Mapped[str] = mapped_column(String(64), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    structured_context: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    provider: Mapped[str | None] = mapped_column(String(32))
    fallback_used: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class CapitalForecast(Base):
    __tablename__ = "capital_forecasts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    production_request_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("production_requests.id"), nullable=False)
    manufacturer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    forecast_type: Mapped[str] = mapped_column(String(64), nullable=False, default="FUNDING_GAP")
    estimated_amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    estimated_days: Mapped[int | None] = mapped_column(Integer)
    label: Mapped[str] = mapped_column(String(64), nullable=False, default="FORECAST / SIMULATION")
    rationale: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
