CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_code TEXT NOT NULL UNIQUE,
    asset_name TEXT NOT NULL,
    asset_type TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    description TEXT,
    quantity NUMERIC(18, 4) NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'Units',
    current_location TEXT,
    lifecycle_stage TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_lifecycle ON assets (lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets (status);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets (asset_type);

CREATE TABLE IF NOT EXISTS asset_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_code TEXT NOT NULL UNIQUE,
    asset_id UUID NOT NULL REFERENCES assets (id) ON DELETE RESTRICT,
    event_type TEXT NOT NULL,
    source TEXT NOT NULL,
    event_timestamp TIMESTAMPTZ NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    severity TEXT NOT NULL DEFAULT 'info',
    status TEXT NOT NULL DEFAULT 'RECEIVED',
    idempotency_key TEXT NOT NULL UNIQUE,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_asset ON asset_events (asset_id, event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_type ON asset_events (event_type);
CREATE INDEX IF NOT EXISTS idx_events_status ON asset_events (status);

CREATE TABLE IF NOT EXISTS verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets (id) ON DELETE RESTRICT,
    verification_type TEXT NOT NULL,
    source TEXT NOT NULL,
    status TEXT NOT NULL,
    confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
    evidence_reference TEXT,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_verifications_asset ON verifications (asset_id, created_at DESC);

CREATE TABLE IF NOT EXISTS conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conflict_code TEXT NOT NULL UNIQUE,
    asset_id UUID NOT NULL REFERENCES assets (id) ON DELETE RESTRICT,
    conflict_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN',
    description TEXT NOT NULL,
    expected_value TEXT,
    actual_value TEXT,
    difference_value TEXT,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conflicts_asset ON conflicts (asset_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_conflicts_status ON conflicts (status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_conflicts_open_issue
    ON conflicts (asset_id, conflict_type)
    WHERE status IN ('OPEN', 'IN_REVIEW');

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID REFERENCES assets (id) ON DELETE SET NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'api',
    previous_state JSONB,
    new_state JSONB,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_asset ON audit_logs (asset_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs (created_at DESC);
