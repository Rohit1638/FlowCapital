# FlowCapital AI Backend (Module 6)

Persistent FastAPI + Supabase PostgreSQL foundation. Modules 4 and 5 intelligence stay on the frontend.

## Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

If `db.PROJECT.supabase.co` only resolves to IPv6, use the **Session/Transaction pooler** URL from Supabase (IPv4), typically:

`postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?sslmode=require`

Username is `postgres.PROJECT_REF`. Port 6543 is transaction pooler (this backend disables prepared statements for PgBouncer compatibility).

### Create tables in Supabase (required once)

**If you see no tables in Supabase**, your network may block outbound Postgres (ports 5432/6543). Use the SQL Editor — it runs on Supabase servers and does not need a local DB connection:

1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/vastwvtdzaambohbbasj/sql/new)
2. Copy the entire contents of `database/full_setup.sql`
3. Click **Run**

That creates all five tables (`assets`, `asset_events`, `verifications`, `conflicts`, `audit_logs`) and seeds the eight demo assets.

Regenerate `full_setup.sql` after seed changes:

```powershell
$env:PYTHONPATH='.'
python scripts/generate_setup_sql.py
```

**Automated setup** (when Postgres ports work, or after `npx supabase login`):

```powershell
.\scripts\setup_supabase.ps1
```

Schema-only + Python seed (when `DATABASE_URL` connects):

```powershell
python -m app.db_init
python -m app.seed.demo_seed
```

- `DATABASE_URL` — Supabase Postgres connection string (`?sslmode=require`)
- `SUPABASE_URL` — project URL
- `SUPABASE_ANON_KEY` — publishable/anon key

Do not put `SUPABASE_SERVICE_ROLE_KEY` here unless a later module needs it. This backend uses `DATABASE_URL` only.

```powershell
python -m app.db_init
python -m app.seed.demo_seed
uvicorn app.main:app --reload --port 8000
```

Seed is idempotent. Running it twice will not duplicate assets or events.

## Frontend

```powershell
# repo root
copy .env.local.example .env.local
npm run dev
```

- App: http://localhost:3000
- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/api/v1/health

## Module 6A — Multi-role platform

Demo login (no Supabase Auth required for hackathon):

```powershell
# Frontend: http://localhost:3000/login
# Backend must be running on :8000
```

- **Manufacturer demo:** `POST /api/v1/auth/demo-login` `{ "role": "MANUFACTURER" }` → token `demo-manufacturer`
- **Lender demo:** `{ "role": "LENDER" }` → token `demo-lender`

Apply extended schema (when Postgres connects):

```powershell
python -m app.db_init   # applies schema.sql + schema_module_6a.sql
```

AI (backend only — never expose keys to frontend):

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-2.0-flash
```

If AI is unavailable, deterministic fallback explanations are returned automatically.

New API groups: `/auth`, `/manufacturer`, `/lender`, `/production-requests`, `/ai`, `/notifications`.

Frontend portals: `/login`, `/manufacturer/*`, `/lender/*` (Modules 1–6 routes under `/dashboard` unchanged).

