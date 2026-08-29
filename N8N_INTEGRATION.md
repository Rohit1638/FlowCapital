# n8n + ngrok + WhatsApp Integration Guide

## Prerequisites

1. **ngrok account** (free): https://dashboard.ngrok.com/signup  
2. **Authtoken**: https://dashboard.ngrok.com/get-started/your-authtoken  
3. **Backend running** on port **8030**  
4. **n8n workflow active** (both paths enabled)

---

## Step 1 — Authenticate ngrok (one-time)

```powershell
ngrok config add-authtoken YOUR_NGROK_AUTHTOKEN
```

---

## Step 2 — Start backend + tunnel

**Terminal 1 — Backend**
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --host 0.0.0.0 --port 8030 --reload
```

**Terminal 2 — ngrok**
```powershell
ngrok http 8030
```

Or use the helper script from repo root:
```powershell
.\scripts\start-ngrok.ps1
```

Copy the **Forwarding** HTTPS URL, e.g.:
```
https://abc123.ngrok-free.app
```

**Verify:**
```
https://YOUR-NGROK-URL/api/v1/health
https://YOUR-NGROK-URL/api/v1/integrations/asset-status/DA-2026-001
```

---

## Step 3 — Where to place URLs in your n8n workflow

Based on your workflow screenshot:

### Path 1 — Telemetry Risk Event → SMS Alert

| Node | What URL to use |
|------|-----------------|
| **Telemetry Risk Event** (Webhook) | **n8n generates this URL** — NOT the ngrok URL. Copy the **Production URL** from this webhook node. |
| **Evaluate Risk** | `{{ $json.confidence_score }}` **is less than** `35` OR `{{ $json.alert }}` **is true** |
| **Send Risk Alert** (Twilio SMS) | **To:** `{{ $json.phone }}` or `{{ $json.to_phone }}` — **Body:** `{{ $json.sms_message }}` |

**FlowCapital → n8n direction:** When simulation confidence drops below **35**, the backend POSTs to your n8n webhook with `phone` / `recipient_phone` from the user's registration.

Add to `backend/.env`:
```env
## Environment variables

```env
N8N_RISK_ALERT_WEBHOOK_URL=https://YOUR-N8N-INSTANCE/webhook/your-production-webhook-id
N8N_TELEMETRY_WEBHOOK_URL=https://YOUR-N8N-INSTANCE/webhook/telemetry-risk-event
N8N_WEBHOOK_SECRET=optional-shared-secret
N8N_DEFAULT_ALERT_PHONE=+919XXXXXXXXX
```

**Project events (Module 4):** When a manufacturer reports a production delay or other risk event and confidence drops below **35**, the backend POSTs to `N8N_RISK_ALERT_WEBHOOK_URL` with the **assigned lender's phone** as `recipient_phone`.

**Simulation telemetry:** Falls back to `N8N_TELEMETRY_WEBHOOK_URL` if the risk alert URL is not set.
```

**Test webhook delivery:**
```powershell
Invoke-RestMethod -Method POST -Uri "https://YOUR-NGROK-URL/api/v1/integrations/telemetry-risk/test"
```

> **Important:** Twilio incoming WhatsApp webhooks go to **n8n's webhook URL**, not FlowCapital ngrok.

---

### Path 2 — AI Status Chat (Chat Trigger + get_asset_status tool)

| Node | What URL to use |
|------|-----------------|
| **Chat Trigger** | n8n provides its own chat URL — no ngrok needed for the trigger |
| **get_asset_status** (HTTP Request Tool) | **YOUR ngrok URL:** |
| | `GET https://YOUR-NGROK-URL/api/v1/integrations/asset-status/DA-2026-001` |

**Tool configuration in n8n HTTP Request node:**
- Method: `GET`
- URL: `https://YOUR-NGROK-URL/api/v1/integrations/asset-status/{{ $fromAI("asset_id", "DA-2026-001", "string") }}`
- Or fixed demo URL: `.../asset-status/DA-2026-001`

**Response fields available:**
- `confidence_score`, `risk_level`, `current_stage`, `production_progress_pct`
- `summary` — plain-text for the AI agent
- `alert` — `true` when confidence < 35
- `phone`, `recipient_phone` — E.164 number from user registration (for Twilio To field)

---

## Step 4 — Optional env vars

Add to `backend/.env`:

```env
PUBLIC_BASE_URL=https://YOUR-NGROK-URL
N8N_TELEMETRY_WEBHOOK_URL=https://YOUR-N8N-INSTANCE/webhook/XXXXX
N8N_WEBHOOK_SECRET=your-secret
```

Restart backend after editing `.env`.

---

## Will it work properly?

| Check | Status |
|-------|--------|
| ngrok exposes backend | After authtoken configured |
| get_asset_status tool | Works via `/api/v1/integrations/asset-status/{id}` |
| Simulation → n8n SMS alerts | When `N8N_TELEMETRY_WEBHOOK_URL` is set + confidence < 35 |
| Twilio WhatsApp inbound | Point Twilio to **n8n webhook**, not ngrok |
| Data loss | Supabase unchanged; in-memory demo resets only on backend restart |
| ngrok URL changes | Free tier URL changes each restart — update n8n tool URL |

### Additional configuration needed

1. **ngrok authtoken** — required (install alone is not enough)
2. **n8n workflow Active** — toggle ON in n8n
3. **Twilio credentials** in n8n Send Risk Alert node
4. **Gemini API key** in n8n for AI Assistant node
5. **Evaluate Risk** node — condition on `confidence_score` or `alert`

---

## n8n node configuration (copy exactly)

### Telemetry Risk Event (Webhook)
- **Production URL** → `N8N_TELEMETRY_WEBHOOK_URL` in `backend/.env`
- **Respond:** Using Respond to Webhook Node

### Evaluate Risk (OR, Convert types ON)
1. `{{ $json.confidence_score }}` is less than `35`
2. `{{ $json.alert }}` is true
3. `{{ $json.risk_level }}` equals `HIGH`

### Send Risk Alert (Twilio)
- **To:** `{{ $json.phone }}`
- **Message/Body:** `{{ $json.sms_message }}`

### Respond Alert Sent (true branch)
```javascript
{{
  {
    "status": "alert_sent",
    "asset_id": $json.asset_id,
    "confidence_score": $json.confidence_score,
    "phone": $json.phone
  }
}}
```

### Respond OK (false branch)
```javascript
{{ { "status": "ok", "message": "No alert required" } }}
```

### Payload fields FlowCapital always sends
`confidence_score`, `risk_level` (HIGH/ELEVATED/MODERATE), `alert`, `phone`, `to_phone`, `recipient_phone`, `sms_message`, `asset_id`, `manufacturer`, `message`

---

Users interact with the **Chat Trigger** inside your active n8n workflow — not through the FlowCapital website.

### For end users

1. Open the **Chat URL** shown on the n8n **Chat Trigger** node (or embed it if n8n provides a share link).
2. Type questions in plain English, for example:
   - `What is the status of asset DA-2026-001?`
   - `What is the confidence score?`
   - `Is there a risk alert?`
3. The AI agent calls `get_asset_status` (HTTP tool or Code tool) and replies with confidence, risk level, stage, and progress.

### Demo without backend

If `get_asset_status` is a **Code Tool** with sample JSON, the chat works with no ngrok/backend running.

### Demo with live backend

Set the HTTP Request tool URL to:

```
https://YOUR-NGROK-URL/api/v1/integrations/asset-status/DA-2026-001
```

Backend must be running and ngrok tunnel open.

---

## SMS alert checklist

1. User registers with phone in E.164 format (`+919943666848`) **or** demo user phone is set in `backend/data/users.json`
2. `N8N_TELEMETRY_WEBHOOK_URL` is set in `backend/.env` and backend restarted
3. n8n workflow **Active**
4. **Evaluate Risk:** `{{ $json.confidence_score }}` < `35` OR `{{ $json.alert }}` is true
5. **Twilio To:** `{{ $json.phone }}`
6. Run Simulation → **Reset** → **Start** → **Next event** until confidence drops below 35

---

```
Simulation (FlowCapital) ──POST──► n8n Telemetry Risk Event webhook
                                         │
                                         ▼
                                    Evaluate Risk ──► Twilio SMS

User chat ──► n8n Chat Trigger ──► AI Agent ──GET──► ngrok ──► FlowCapital API
                                              (get_asset_status)
```
