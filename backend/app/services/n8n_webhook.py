from __future__ import annotations

import httpx

from app.core.config import get_settings
from app.core.logging import get_logger
from app.services.n8n_payload import build_telemetry_risk_payload, resolve_alert_phone

logger = get_logger("n8n")


def _normalize_payload(payload: dict) -> dict:
    # Structured project risk alerts are complete — do not override recipient phone.
    if payload.get("project_id") and payload.get("recipient_phone"):
        return dict(payload)

    if payload.get("phone") and payload.get("sms_message") and payload.get("alert") is not None:
        normalized = dict(payload)
        phone = resolve_alert_phone(user_phone=payload.get("phone") or payload.get("recipient_phone"))
        normalized["phone"] = phone
        normalized["to_phone"] = phone
        normalized["recipient_phone"] = phone
        return normalized

    return build_telemetry_risk_payload(
        source=payload.get("source", "flowcapital"),
        asset_id=payload.get("asset_id", "DA-2026-001"),
        request_id=payload.get("request_id"),
        simulation_id=payload.get("simulation_id"),
        confidence_score=payload.get("confidence_score", 32),
        risk_level=payload.get("risk_level") or payload.get("risk_level_code"),
        message=payload.get("message", "High risk telemetry event"),
        manufacturer=payload.get("manufacturer", "VoltRide Mobility Pvt. Ltd."),
        product_name=payload.get("product_name"),
        project_name=payload.get("project_name"),
        current_stage=payload.get("current_stage"),
        production_progress=payload.get("production_progress"),
        trigger_event=payload.get("trigger_event"),
        user_id=payload.get("user_id"),
        user_phone=payload.get("phone") or payload.get("recipient_phone") or payload.get("to_phone"),
        force_alert=bool(payload.get("alert", True)),
    )


async def notify_telemetry_risk(payload: dict) -> bool:
    """POST a telemetry/risk event to the n8n webhook (Telemetry Risk Event node)."""
    settings = get_settings()
    url = settings.n8n_risk_alert_webhook_url or settings.n8n_telemetry_webhook_url
    if not url:
        logger.debug("N8N_RISK_ALERT_WEBHOOK_URL / N8N_TELEMETRY_WEBHOOK_URL not set — skipping webhook")
        return False

    normalized = _normalize_payload(payload)

    headers = {"Content-Type": "application/json", "User-Agent": "FlowCapital-Backend/1.0"}
    if settings.n8n_webhook_secret:
        headers["X-N8N-Secret"] = settings.n8n_webhook_secret

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, json=normalized, headers=headers)
            response.raise_for_status()
        logger.info(
            "n8n telemetry webhook delivered status=%s phone=%s confidence=%s risk=%s",
            response.status_code,
            normalized["phone"],
            normalized["confidence_score"],
            normalized.get("risk_level"),
        )
        return True
    except Exception as exc:
        logger.warning("n8n telemetry webhook failed phone=%s error=%s", normalized.get("phone"), exc)
        return False


async def send_test_alert() -> tuple[bool, dict]:
    """Send a guaranteed high-risk test payload to n8n."""
    payload = build_telemetry_risk_payload(
        source="flowcapital_test",
        confidence_score=32,
        risk_level="HIGH",
        message="Test high-risk telemetry event from FlowCapital",
        manufacturer="VoltRide Mobility Pvt. Ltd.",
        project_name="Electric Bike Series X — Batch 1000",
        product_name="Electric Bike Series X",
        force_alert=True,
    )
    delivered = await notify_telemetry_risk(payload)
    return delivered, payload
