-- App login users (backend auth — complements Supabase Auth profiles)

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
