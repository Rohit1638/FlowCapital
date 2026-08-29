from __future__ import annotations

from pydantic import BaseModel, Field


class ProfileRead(BaseModel):
    id: str
    full_name: str
    email: str
    organization_name: str | None = None
    role: str
    company_name: str | None = None
    designation: str | None = None
    username: str | None = None
    phone: str | None = None


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)
    role: str = Field(..., pattern="^(MANUFACTURER|LENDER)$")
    company_name: str | None = None
    phone: str = Field(..., min_length=10, max_length=20, pattern=r"^\+?[0-9]{10,15}$")


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    profile: ProfileRead


class DemoLoginRequest(BaseModel):
    role: str = Field(..., pattern="^(MANUFACTURER|LENDER)$")


class DemoLoginResponse(BaseModel):
    access_token: str
    profile: ProfileRead


class ProductionRequestCreate(BaseModel):
    project_name: str
    product_name: str
    product_category: str
    quantity: float
    expected_selling_value: float = 0
    estimated_production_cost: float = 0
    required_funding_amount: float = 0
    funding_purpose: str | None = None
    expected_start_date: str | None = None
    expected_completion_date: str | None = None
    buyer_name: str | None = None
    purchase_order_reference: str | None = None
    description: str | None = None


class WorkflowEventCreate(BaseModel):
    event_type: str
    description: str
    severity: str = "info"
    expected_value: str | None = None
    actual_value: str | None = None
    notes: str | None = None


class LenderDecisionCreate(BaseModel):
    decision_type: str
    approved_amount: float = 0
    instrument: str | None = None
    interest_yield: float | None = None
    duration_days: int | None = None
    reason: str | None = None
    notes: str | None = None
    conditions: list[str] = Field(default_factory=list)


class FinancingOfferCreate(BaseModel):
    offered_amount: float = Field(..., gt=0)
    interest_rate: float = Field(..., ge=0, le=100)
    tenor_days: int = Field(..., gt=0, le=730)
    instrument_type: str = "PRODUCTION_FINANCE"
    conditions: list[str] = Field(default_factory=list)
    notes: str | None = None
    validity_days: int = Field(default=14, ge=1, le=90)
    valid_until: str | None = None


class FinancingOfferUpdate(BaseModel):
    offered_amount: float = Field(..., gt=0)
    interest_rate: float = Field(..., ge=0, le=100)
    tenor_days: int = Field(..., gt=0, le=730)
    instrument_type: str = "PRODUCTION_FINANCE"
    conditions: list[str] = Field(default_factory=list)
    notes: str | None = None
    validity_days: int = Field(default=14, ge=1, le=90)
    valid_until: str | None = None


class AIQuestionRequest(BaseModel):
    question: str
    production_request_id: str | None = None


class AIChatRequest(BaseModel):
    message: str
    production_request_id: str | None = None
    role: str | None = None
