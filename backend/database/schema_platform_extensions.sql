-- Platform runtime extensions (intelligence events + app login users)

CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('MANUFACTURER', 'LENDER')),
    company_name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    designation TEXT NOT NULL DEFAULT 'Member',
    phone TEXT,
    profile_id UUID REFERENCES profiles (id) ON DELETE SET NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users (role);

CREATE TABLE IF NOT EXISTS platform_intelligence_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    financing_request_id UUID NOT NULL REFERENCES production_requests (id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    source_type TEXT NOT NULL DEFAULT 'SYSTEM',
    actor_id UUID,
    severity TEXT NOT NULL DEFAULT 'info',
    previous_value TEXT,
    new_value TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID
);

CREATE INDEX IF NOT EXISTS idx_platform_intel_events_request ON platform_intelligence_events (financing_request_id, created_at DESC);

-- Extended reassessment fields stored alongside financing_action_ledger via evidence_snapshot;
-- add lender review columns for UI actions
ALTER TABLE financing_action_ledger ADD COLUMN IF NOT EXISTS impact_level TEXT;
ALTER TABLE financing_action_ledger ADD COLUMN IF NOT EXISTS trigger_type TEXT;
ALTER TABLE financing_action_ledger ADD COLUMN IF NOT EXISTS lender_action TEXT;
ALTER TABLE financing_action_ledger ADD COLUMN IF NOT EXISTS lender_action_notes TEXT;
ALTER TABLE financing_action_ledger ADD COLUMN IF NOT EXISTS lender_action_at TIMESTAMPTZ;
