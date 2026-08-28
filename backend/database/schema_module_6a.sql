-- Module 6A: Multi-role manufacturer, lender & AI platform extensions

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    organization_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('MANUFACTURER', 'LENDER')),
    company_name TEXT,
    designation TEXT,
    phone TEXT,
    avatar_url TEXT,
    verification_status TEXT NOT NULL DEFAULT 'VERIFIED',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user ON profiles (auth_user_id);

CREATE TABLE IF NOT EXISTS manufacturer_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    industry TEXT,
    registration_number TEXT,
    headquarters TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lender_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    lender_name TEXT NOT NULL,
    risk_appetite TEXT NOT NULL DEFAULT 'BALANCED' CHECK (risk_appetite IN ('CONSERVATIVE', 'BALANCED', 'AGGRESSIVE')),
    minimum_confidence_threshold INTEGER NOT NULL DEFAULT 75 CHECK (minimum_confidence_threshold BETWEEN 0 AND 100),
    max_exposure_per_asset NUMERIC(18, 2) NOT NULL DEFAULT 5000000,
    max_exposure_per_manufacturer NUMERIC(18, 2) NOT NULL DEFAULT 15000000,
    max_risk_level TEXT NOT NULL DEFAULT 'HIGH',
    concentration_limit_pct NUMERIC(5, 2) NOT NULL DEFAULT 25,
    preferred_asset_types JSONB NOT NULL DEFAULT '[]'::jsonb,
    preferred_instruments JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS production_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_code TEXT NOT NULL UNIQUE,
    manufacturer_id UUID NOT NULL REFERENCES profiles (id) ON DELETE RESTRICT,
    project_name TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_category TEXT NOT NULL,
    quantity NUMERIC(18, 4) NOT NULL,
    expected_selling_value NUMERIC(18, 2) NOT NULL DEFAULT 0,
    estimated_production_cost NUMERIC(18, 2) NOT NULL DEFAULT 0,
    required_funding_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
    funding_purpose TEXT,
    expected_start_date DATE,
    expected_completion_date DATE,
    buyer_name TEXT,
    purchase_order_reference TEXT,
    description TEXT,
    current_stage TEXT NOT NULL DEFAULT 'PURCHASE_ORDER',
    progress_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'MORE_INFORMATION_REQUIRED',
        'CONDITIONALLY_APPROVED', 'PARTIALLY_APPROVED', 'APPROVED', 'REJECTED',
        'ACTIVE_FINANCING', 'COMPLETED', 'CANCELLED'
    )),
    confidence_score INTEGER,
    risk_level TEXT,
    verified_value NUMERIC(18, 2),
    financeable_value NUMERIC(18, 2),
    outstanding_exposure NUMERIC(18, 2) NOT NULL DEFAULT 0,
    unclaimed_value NUMERIC(18, 2),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_production_requests_manufacturer ON production_requests (manufacturer_id, status);
CREATE INDEX IF NOT EXISTS idx_production_requests_status ON production_requests (status);

CREATE TABLE IF NOT EXISTS production_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_request_id UUID NOT NULL REFERENCES production_requests (id) ON DELETE CASCADE,
    stage_code TEXT NOT NULL,
    stage_name TEXT NOT NULL,
    sequence_order INTEGER NOT NULL,
    estimated_duration_days INTEGER,
    expected_cost NUMERIC(18, 2),
    actual_start_date DATE,
    actual_end_date DATE,
    progress_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'SKIPPED')),
    dependencies JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (production_request_id, stage_code)
);

CREATE TABLE IF NOT EXISTS collateral_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collateral_code TEXT NOT NULL UNIQUE,
    production_request_id UUID NOT NULL REFERENCES production_requests (id) ON DELETE CASCADE,
    manufacturer_id UUID NOT NULL REFERENCES profiles (id) ON DELETE RESTRICT,
    asset_id UUID REFERENCES assets (id) ON DELETE SET NULL,
    asset_name TEXT NOT NULL,
    asset_type TEXT NOT NULL,
    description TEXT,
    quantity NUMERIC(18, 4) NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'Units',
    estimated_value NUMERIC(18, 2) NOT NULL DEFAULT 0,
    lifecycle_stage TEXT NOT NULL,
    location TEXT,
    ownership_info TEXT,
    existing_financing_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
    existing_lender TEXT,
    already_pledged BOOLEAN NOT NULL DEFAULT FALSE,
    evidence_references JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collateral_manufacturer ON collateral_assets (manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_collateral_request ON collateral_assets (production_request_id);
CREATE INDEX IF NOT EXISTS idx_collateral_asset ON collateral_assets (asset_id);

CREATE TABLE IF NOT EXISTS request_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manufacturer_id UUID NOT NULL REFERENCES profiles (id) ON DELETE RESTRICT,
    production_request_id UUID NOT NULL REFERENCES production_requests (id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets (id) ON DELETE SET NULL,
    document_name TEXT NOT NULL,
    document_type TEXT NOT NULL,
    storage_path TEXT,
    file_size_bytes BIGINT,
    mime_type TEXT,
    status TEXT NOT NULL DEFAULT 'UPLOADED',
    verification_status TEXT NOT NULL DEFAULT 'PENDING',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_request ON request_documents (production_request_id);

CREATE TABLE IF NOT EXISTS financing_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_request_id UUID NOT NULL REFERENCES production_requests (id) ON DELETE CASCADE,
    manufacturer_id UUID NOT NULL REFERENCES profiles (id) ON DELETE RESTRICT,
    requested_amount NUMERIC(18, 2) NOT NULL,
    recommended_min_amount NUMERIC(18, 2),
    recommended_max_amount NUMERIC(18, 2),
    maximum_safe_amount NUMERIC(18, 2),
    confidence_at_submission INTEGER,
    status TEXT NOT NULL DEFAULT 'PENDING',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lender_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    financing_request_id UUID NOT NULL REFERENCES financing_requests (id) ON DELETE CASCADE,
    production_request_id UUID NOT NULL REFERENCES production_requests (id) ON DELETE CASCADE,
    lender_id UUID NOT NULL REFERENCES profiles (id) ON DELETE RESTRICT,
    decision_type TEXT NOT NULL CHECK (decision_type IN (
        'APPROVE', 'PARTIALLY_APPROVE', 'CONDITIONALLY_APPROVE', 'REJECT', 'REQUEST_MORE_INFORMATION'
    )),
    requested_amount NUMERIC(18, 2) NOT NULL,
    approved_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
    instrument TEXT,
    interest_yield NUMERIC(8, 4),
    duration_days INTEGER,
    seniority TEXT,
    reason TEXT,
    notes TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lender_decisions_request ON lender_decisions (production_request_id);
CREATE INDEX IF NOT EXISTS idx_lender_decisions_lender ON lender_decisions (lender_id);

CREATE TABLE IF NOT EXISTS lender_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lender_decision_id UUID NOT NULL REFERENCES lender_decisions (id) ON DELETE CASCADE,
    condition_text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'SATISFIED', 'WAIVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS financing_tranches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tranche_code TEXT NOT NULL UNIQUE,
    production_request_id UUID NOT NULL REFERENCES production_requests (id) ON DELETE RESTRICT,
    financing_request_id UUID NOT NULL REFERENCES financing_requests (id) ON DELETE RESTRICT,
    lender_decision_id UUID REFERENCES lender_decisions (id) ON DELETE SET NULL,
    lender_id UUID NOT NULL REFERENCES profiles (id) ON DELETE RESTRICT,
    approved_amount NUMERIC(18, 2) NOT NULL,
    outstanding_amount NUMERIC(18, 2) NOT NULL,
    instrument TEXT NOT NULL,
    interest_yield NUMERIC(8, 4),
    duration_days INTEGER,
    seniority TEXT NOT NULL DEFAULT 'SENIOR',
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SETTLED', 'FROZEN', 'STEPPED_DOWN')),
    conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS financing_exposures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES assets (id) ON DELETE SET NULL,
    collateral_id UUID REFERENCES collateral_assets (id) ON DELETE SET NULL,
    production_request_id UUID NOT NULL REFERENCES production_requests (id) ON DELETE RESTRICT,
    lender_id UUID NOT NULL REFERENCES profiles (id) ON DELETE RESTRICT,
    financing_request_id UUID REFERENCES financing_requests (id) ON DELETE SET NULL,
    tranche_id UUID REFERENCES financing_tranches (id) ON DELETE SET NULL,
    approved_amount NUMERIC(18, 2) NOT NULL,
    outstanding_amount NUMERIC(18, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    seniority TEXT NOT NULL DEFAULT 'SENIOR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exposures_request ON financing_exposures (production_request_id);
CREATE INDEX IF NOT EXISTS idx_exposures_lender ON financing_exposures (lender_id);
CREATE INDEX IF NOT EXISTS idx_exposures_collateral ON financing_exposures (collateral_id);

CREATE TABLE IF NOT EXISTS financing_action_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_request_id UUID NOT NULL REFERENCES production_requests (id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets (id) ON DELETE SET NULL,
    triggering_event_id UUID REFERENCES asset_events (id) ON DELETE SET NULL,
    manufacturer_id UUID REFERENCES profiles (id) ON DELETE SET NULL,
    recommended_action TEXT NOT NULL,
    actual_action TEXT,
    confidence_before INTEGER,
    confidence_after INTEGER,
    risk_before TEXT,
    risk_after TEXT,
    verified_value_before NUMERIC(18, 2),
    verified_value_after NUMERIC(18, 2),
    financeable_value_before NUMERIC(18, 2),
    financeable_value_after NUMERIC(18, 2),
    outstanding_exposure NUMERIC(18, 2),
    unclaimed_value NUMERIC(18, 2),
    reason TEXT,
    evidence_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    ai_insight_reference TEXT,
    approval_status TEXT,
    human_override BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    category TEXT NOT NULL,
    related_entity_type TEXT,
    related_entity_id TEXT,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications (recipient_id, read, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audience TEXT NOT NULL CHECK (audience IN ('MANUFACTURER', 'LENDER')),
    profile_id UUID REFERENCES profiles (id) ON DELETE SET NULL,
    production_request_id UUID REFERENCES production_requests (id) ON DELETE SET NULL,
    insight_type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    structured_context JSONB NOT NULL DEFAULT '{}'::jsonb,
    provider TEXT,
    fallback_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('MANUFACTURER', 'LENDER')),
    title TEXT,
    production_request_id UUID REFERENCES production_requests (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations (id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS capital_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_request_id UUID NOT NULL REFERENCES production_requests (id) ON DELETE CASCADE,
    manufacturer_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    forecast_type TEXT NOT NULL DEFAULT 'FUNDING_GAP',
    estimated_amount NUMERIC(18, 2) NOT NULL,
    estimated_days INTEGER,
    label TEXT NOT NULL DEFAULT 'FORECAST / SIMULATION',
    rationale JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS instrument_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_request_id UUID NOT NULL REFERENCES production_requests (id) ON DELETE CASCADE,
    tranche_id UUID REFERENCES financing_tranches (id) ON DELETE SET NULL,
    from_instrument TEXT NOT NULL,
    to_instrument TEXT NOT NULL,
    from_stage TEXT NOT NULL,
    to_stage TEXT NOT NULL,
    trigger_event TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Extend assets with optional ownership link
ALTER TABLE assets ADD COLUMN IF NOT EXISTS manufacturer_id UUID REFERENCES profiles (id) ON DELETE SET NULL;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS production_request_id UUID REFERENCES production_requests (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_assets_manufacturer ON assets (manufacturer_id);
