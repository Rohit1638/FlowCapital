# FlowCapital AI — Hackathon Demo Guide

## Currently running (verified)

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3005 |
| **Backend API** | http://localhost:8030/api/v1 |
| **API health** | http://localhost:8030/api/v1/health |
| **API docs** | http://localhost:8030/docs |

> Port 3000 may already be in use on your machine. Use whatever port `npm run dev` prints (e.g. 3005). Backend CORS allows all localhost ports in development.

---

## Start servers (if not running)

**Terminal 1 — Backend**
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pip install bcrypt python-multipart
uvicorn app.main:app --reload --port 8030
```

**Terminal 2 — Frontend**
```powershell
cd FlowCapital
npm run dev
# Or fixed port: npx next dev -p 3005
```

Ensure `.env.local` contains:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8030/api/v1
```

---

## Demo credentials

| Role | Username | Password |
|------|----------|----------|
| **Manufacturer** | `manufacturer_demo` | `FlowDemo@123` |
| **Lender** | `lender_demo` | `FlowDemo@123` |

Login: http://localhost:3005/login → click **Enter as Manufacturer** or **Enter as Lender**.

---

## 5-minute demo script

### 1. Manufacturer login (30 sec)
- Open http://localhost:3005/login
- **Enter as Manufacturer**
- Lands on **Production & Financing Command** dashboard

### 2. Overview dashboard (1 min)
- Row 1: Active production, funding requested, approved financing, capacity
- Row 2: Confidence 68, open conflicts, production progress
- **Active Production** card → click **View Production**

### 3. Production detail (2 min)
- **Physical Goods Lifecycle** stepper (7 stages, current: Production ~58%)
- Production summary, collateral graph, financial position
- **Documents & Evidence** — verified PO, GST, production plan
- Scroll to bottom → **Generate Report**

### 4. Financing request (1 min)
- Sidebar → **Financing Request**
- Walk through wizard steps; step 4 uploads real PDF/images
- Submit → redirects to new production plan

### 5. AI Assistant (30 sec)
- Sidebar → **AI Assistant**
- Ask: *"Why is my confidence score 68?"*
- Shows structured insight (Gemini if key set, else deterministic fallback)

### 6. Lender flow (1 min)
- Sign out → login as **Lender**
- **Opportunities** → open PR-EB-1000 (electric bike scenario)
- Review confidence, conflicts, quantity mismatch
- Approve / conditionally approve financing

---

## Key demo URLs (Manufacturer)

| Page | URL |
|------|-----|
| Login | http://localhost:3005/login |
| Dashboard | http://localhost:3005/manufacturer/dashboard |
| Production plan (demo) | http://localhost:3005/manufacturer/production-plans/00000000-0000-4000-8000-000000000100 |
| Financing request | http://localhost:3005/manufacturer/financing-request |
| AI Assistant | http://localhost:3005/manufacturer/ai-assistant |

## Key demo URLs (Lender)

| Page | URL |
|------|-----|
| Dashboard | http://localhost:3005/lender/dashboard |
| Demo opportunity | http://localhost:3005/lender/opportunities/00000000-0000-4000-8000-000000000100 |

## Legacy Module 1–6
- Command Center: http://localhost:3005/dashboard

---

## Demo scenario (PR-EB-1000)

- **VoltRide Mobility** — 1,000 electric bikes
- **₹50L** funding requested, **₹20L** conditionally approved
- **68%** confidence, **1 open conflict** (quantity mismatch 1000 vs 920)
- Lifecycle stage: **In Production**

---

## Gemini AI (optional)

Add to `backend/.env`:
```
GEMINI_API_KEY=your_google_ai_studio_key
GEMINI_MODEL=gemini-2.0-flash
```
Restart backend. Never put the key in frontend code.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Login fails / "Invalid password" | Backend must be on **8030**; refresh page after starting backend |
| Failed to fetch | Start backend; check `.env.local` API URL |
| Port 3000 in use | Use the port shown by `npm run dev` (e.g. 3005) |
| Document upload fails | `pip install python-multipart` in backend venv |
