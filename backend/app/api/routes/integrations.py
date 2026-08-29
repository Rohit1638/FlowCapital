"""Public integration endpoints for n8n / Twilio workflows."""



from __future__ import annotations



from fastapi import APIRouter, HTTPException



from app.core.auth import DEMO_MANUFACTURER_ID

from app.core.risk_constants import is_risk_alert

from app.services.demo_platform_store import DEMO_REQUEST_ID, demo_store

from app.services.n8n_payload import normalize_risk_level, resolve_alert_phone

from app.services.n8n_webhook import send_test_alert



router = APIRouter(tags=["Integrations"])





def _demo_asset_status(asset_id: str) -> dict:

    """Return n8n-friendly status for demo assets / production requests."""

    request_id = asset_id if asset_id.startswith("00000000") else DEMO_REQUEST_ID

    req = demo_store.get_request(request_id, DEMO_MANUFACTURER_ID, "MANUFACTURER")

    if not req:

        raise HTTPException(status_code=404, detail="Asset or request not found")



    sim = demo_store.get_simulation(request_id, DEMO_MANUFACTURER_ID, "MANUFACTURER")

    confidence = sim["confidence_score"] if sim else req.get("confidence_score", 68)

    raw_risk = sim["risk_level"] if sim else req.get("risk_level", "MODERATE")

    stage = sim["current_stage"] if sim else req.get("current_stage", "RAW_MATERIAL")

    progress = sim["production_progress"] if sim else req.get("progress_pct", 35)

    n8n_risk = normalize_risk_level(str(raw_risk), confidence)



    return {

        "asset_id": asset_id,

        "request_id": request_id,

        "request_code": req.get("request_code", "PR-EB-1000"),

        "manufacturer": req.get("manufacturer_name", "VoltRide Mobility Pvt. Ltd."),

        "project_name": req.get("project_name", "Electric Bike Series X"),

        "confidence_score": confidence,

        "risk_level": n8n_risk,

        "risk_level_code": str(raw_risk).replace("_", " "),

        "current_stage": str(stage).replace("_", " "),

        "production_progress_pct": progress,

        "required_funding_inr": req.get("required_funding_amount", 5_000_000),

        "outstanding_exposure_inr": req.get("outstanding_exposure", 2_000_000),

        "open_conflicts": req.get("open_conflicts", 1),

        "alert": is_risk_alert(confidence),

        "summary": (

            f"Confidence {confidence}/100 — {n8n_risk} risk. "

            f"Stage: {str(stage).replace('_', ' ')} ({progress}% complete)."

        ),

    }





@router.get("/asset-status/{asset_id}")

def get_asset_status(asset_id: str):

    """

    Tool endpoint for n8n AI agent `get_asset_status`.

    Use: GET {NGROK_URL}/api/v1/integrations/asset-status/DA-2026-001

    """

    return _demo_asset_status(asset_id)





@router.get("/production-request/{request_id}/status")

def get_production_request_status(request_id: str):

    """Alternate status endpoint keyed by production request UUID."""

    return _demo_asset_status(request_id)





@router.post("/telemetry-risk/test")

async def test_telemetry_risk_webhook():

    """

    Sends a guaranteed high-risk sample payload to your n8n Telemetry Risk Event webhook.

    Always includes phone, alert=true, confidence=32, risk_level=HIGH.

    """

    delivered, payload = await send_test_alert()

    if not delivered:

        raise HTTPException(

            status_code=503,

            detail="Webhook not delivered. Set N8N_TELEMETRY_WEBHOOK_URL in backend/.env to your n8n Telemetry Risk Event production URL.",

        )

    return {

        "ok": True,

        "delivered": True,

        "payload": payload,

        "n8n_hint": {

            "evaluate_risk": "confidence_score < 35 OR alert is true",

            "twilio_to": "{{ $json.phone }} or {{ $json.to_phone }}",

            "twilio_body": "{{ $json.sms_message }}",

            "default_phone": resolve_alert_phone(),

        },

    }


