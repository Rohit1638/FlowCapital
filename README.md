# FlowCapital AI

**Intelligence that moves with every asset.**

FlowCapital AI is an agentic supply-chain working capital platform. It connects manufacturer production evidence, collateral, lifecycle events, and confidence scoring to lender financing decisions — with AI-assisted underwriting support powered by deterministic finance rules and optional Gemini integration.

---

## Overview

FlowCapital helps manufacturers request production financing backed by verifiable evidence (purchase orders, production plans, collateral, lifecycle events) and gives lenders a structured decision workspace to approve, reject, or modify exposure with full auditability.

The platform is built as a **Next.js frontend** + **FastAPI backend**, with two data layers:

| Layer | Purpose |
|-------|---------|
| **Module 6A (demo store)** | In-memory manufacturer/lender portals for hackathon demos — works without a live database |
| **Modules 1–6 (Supabase)** | Persistent PostgreSQL for assets, events, verifications, conflicts, and audit logs |

Both can run together; the manufacturer and lender portals primarily use Module 6A APIs while the legacy Command Center uses Supabase-backed routes.

---

## Features

### Manufacturer Portal
- Production & financing dashboard with confidence, funding, and lifecycle metrics
- Physical goods lifecycle tracker (PO → Raw Material → Production → Finished Goods → In Transit → Invoiced → Settled)
- Production plan detail with collateral graph and document evidence
- Multi-step financing request wizard with real document upload
- FlowCapital AI Assistant — structured insights on confidence, risks, and next steps

### Lender Portal
- Financing decision dashboard with portfolio metrics and resource cards
- Decision queue with confidence, collateral, and production context
- **Decision Workspace** — approve, reject, or modify financing amount with data-driven recommendations
- Production event timeline, document review, and collateral coverage analysis
- Lender AI intelligence copilot with contextual underwriting briefs
- Decision audit trail for every lender action

### Legacy Intelligence (Modules 1–6)
- Command Center dashboard at `/dashboard`
- Asset passport, event intelligence, decision center, allocation desk, risk views
- Supabase-backed persistence for assets, events, verifications, and conflicts

### AI & Finance Engine
- Deterministic confidence bands, financeable value, and exposure recommendations
- Gemini-powered explanations (backend-only; keys never exposed to the browser)
- Automatic deterministic fallback when AI is unavailable

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Framer Motion, Recharts |
| **Backend** | FastAPI, Python 3.11+, SQLAlchemy, Pydantic |
| **Database** | Supabase PostgreSQL (Modules 1–6) |
| **AI** | Google Gemini (optional), deterministic fallback engine |
| **Auth** | Demo username/password (bcrypt), role-based access (Manufacturer / Lender) |

---

## Project Structure

```
FlowCapital/
├── src/
│   ├── app/
│   │   ├── manufacturer/          # Manufacturer portal routes
│   │   ├── lender/                # Lender portal routes
│   │   ├── login/                 # Authentication
│   │   └── (app)/                 # Legacy Module 1–6 routes
│   ├── components/
│   │   ├── platform/              # Portal UI (shell, lifecycle, decision workspace)
│   │   ├── intelligence/          # Legacy intelligence components
│   │   └── shared/                # Shared UI primitives
│   ├── lib/
│   │   ├── platform/              # API client, hooks, demo fallback
│   │   ├── intelligence/          # Valuation, risk, financing engines
│   │   └── auth/                  # Auth context
│   └── types/                     # TypeScript interfaces
├── backend/
│   ├── app/
│   │   ├── api/routes/            # FastAPI route modules
│   │   ├── services/              # Business logic, demo store, AI, financing engine
│   │   ├── models/                # SQLAlchemy models
│   │   └── core/                  # Config, auth, database
│   ├── database/                  # SQL schemas (schema.sql, schema_module_6a.sql)
│   └── data/                      # Demo user store (users.json)
├── DEMO.md                        # Hackathon demo script
└── README.md
```

---

## Prerequisites

- **Node.js** 20+ and npm
- **Python** 3.11+
- **Supabase** project (optional — required only for Modules 1–6 persistence)
- **Google AI Studio API key** (optional — for Gemini AI responses)

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/Rohit1638/FlowCapital.git
cd FlowCapital
```

### 2. Frontend setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open the URL printed in the terminal (typically http://localhost:3000).

### 3. Backend setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1        # Windows
# source .venv/bin/activate         # macOS/Linux
pip install -r requirements.txt
cp .env.example .env                # Edit with your credentials
uvicorn app.main:app --reload --port 8030
```

Update `.env.local` to point at the backend:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8030/api/v1
```

### 4. Verify

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8030/api/v1 |
| API health | http://localhost:8030/api/v1/health |
| API docs (Swagger) | http://localhost:8030/docs |

---

## Environment Variables

### Frontend (`.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base URL (e.g. `http://localhost:8030/api/v1`) |

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/publishable key |
| `ALLOWED_ORIGINS` | CORS origins (auto-allows all localhost ports in development) |
| `GEMINI_API_KEY` | Google AI Studio API key (optional) |
| `GEMINI_MODEL` | Gemini model name (default: `gemini-2.0-flash`) |

> **Never commit `.env` or `.env.local` files.** Use the provided `.env.example` templates.

---

## Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| **Manufacturer** | `manufacturer_demo` | `FlowDemo@123` |
| **Lender** | `lender_demo` | `FlowDemo@123` |

Login at `/login` — click **Enter as Manufacturer** or **Enter as Lender**, or sign in with the credentials above.

---

## Portal Routes

### Manufacturer

| Page | Route |
|------|-------|
| Dashboard | `/manufacturer/dashboard` |
| Production Plans | `/manufacturer/production-plans` |
| Production Detail | `/manufacturer/production-plans/[id]` |
| Financing Request | `/manufacturer/financing-request` |
| AI Assistant | `/manufacturer/ai-assistant` |

### Lender

| Page | Route |
|------|-------|
| Dashboard | `/lender/dashboard` |
| Financing Requests | `/lender/opportunities` |
| Decision Workspace | `/lender/opportunities/[id]/decision` |
| AI Assistant | `/lender/ai-assistant` |

### Legacy (Modules 1–6)

| Page | Route |
|------|-------|
| Command Center | `/dashboard` |
| Assets | `/assets` |
| Decisions | `/decisions` |
| Intelligence | `/intelligence` |
| Events | `/events` |

---

## Demo Scenario (PR-EB-1000)

The built-in demo scenario showcases the full manufacturer → lender flow:

- **Manufacturer:** VoltRide Mobility Pvt. Ltd.
- **Product:** 1,000 VoltRide City E-Bikes (Electric Mobility)
- **Funding requested:** ₹50L
- **Conditionally approved:** ₹20L
- **Confidence score:** 68 / 100
- **Open conflict:** Quantity mismatch (1,000 planned vs 920 in warehouse)
- **Lifecycle stage:** In Production (58% complete)

**Demo request ID:** `00000000-0000-4000-8000-000000000100`

See [DEMO.md](./DEMO.md) for a full 5-minute hackathon demo script.

---

## API Overview

All API routes are prefixed with `/api/v1`.

| Group | Endpoints | Description |
|-------|-----------|-------------|
| **Auth** | `/auth/login`, `/auth/register`, `/auth/demo-login` | User authentication |
| **Manufacturer** | `/manufacturer/dashboard`, `/manufacturer/production-requests` | Manufacturer data |
| **Lender** | `/lender/dashboard`, `/lender/opportunities`, `/lender/requests/{id}/decide` | Lender underwriting |
| **Production** | `/production-requests/{id}`, `/production-requests/{id}/documents` | Production requests & uploads |
| **AI** | `/ai/manufacturer/insight`, `/ai/lender/underwriting-brief`, `/ai/health` | AI intelligence |
| **Legacy** | `/assets`, `/events`, `/verifications`, `/conflicts`, `/audit` | Module 1–6 persistence |

Interactive API documentation: http://localhost:8030/docs

---

## Database Setup (Optional)

Module 6A demo portals work without a database. To enable Modules 1–6 persistence:

1. Create a [Supabase](https://supabase.com) project
2. Open the **SQL Editor** and run the contents of `backend/database/full_setup.sql`
3. For Module 6A extended schema, also run `backend/database/schema_module_6a.sql`
4. Set `DATABASE_URL` in `backend/.env`

```powershell
cd backend
python -m app.db_init
python -m app.seed.demo_seed
```

---

## AI Integration

FlowCapital AI uses a backend-only Gemini integration:

```
Frontend  →  POST /api/v1/ai/{role}/...  →  Gemini API  →  Structured response
```

- API keys are stored in `backend/.env` only
- If Gemini is unavailable, a deterministic fallback generates contextual summaries from confidence, collateral, funding, and production data
- Health check: `GET /api/v1/ai/health`

To enable Gemini, add to `backend/.env`:

```env
GEMINI_API_KEY=your_google_ai_studio_key
GEMINI_MODEL=gemini-2.0-flash
```

Restart the backend after adding the key.

---

## Development

```bash
# Frontend
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint

# Backend
uvicorn app.main:app --reload --port 8030
python -m pytest backend/tests/   # Run tests
```

### Visual Design

FlowCapital uses a consistent design language across all portals:

- **Colors:** Deep charcoal, warm off-white, neon lime (primary actions), cyan (intelligence/state)
- **Typography:** Strong hierarchy with uppercase labels, display font for metrics
- **Components:** Thin borders, subtle shadows, 18–22px card radius

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Login fails / "Invalid password" | Ensure backend is running on port 8030; refresh after starting |
| Failed to fetch / CORS errors | Check `NEXT_PUBLIC_API_BASE_URL` in `.env.local` matches backend port |
| Port 3000 in use | Use the port shown by `npm run dev` (e.g. 3005) — CORS allows all localhost ports in dev |
| Document upload fails | Install `python-multipart` in the backend venv |
| AI returns fallback only | Set `GEMINI_API_KEY` in `backend/.env` and restart backend |
| Database connection errors | Module 6A demos work without DB; set up Supabase only for Modules 1–6 |

---

## License

Private project — all rights reserved.

---

## Repository

https://github.com/Rohit1638/FlowCapital
