"""Normalize FlowCapital telemetry payloads for n8n + Twilio workflows."""

from __future__ import annotations

from app.core.auth import DEMO_MANUFACTURER_ID
from app.core.config import get_settings
from app.core.risk_constants import RISK_ALERT_CONFIDENCE_THRESHOLD, is_risk_alert
from app.services.user_store import user_store

# n8n Evaluate Risk / Twilio nodes expect these short labels.
_N8N_RISK_MAP = {
    "HIGH_RISK": "HIGH",
    "HIGH": "HIGH",
    "ELEVATED_RISK": "ELEVATED",
    "ELEVATED": "ELEVATED",
    "MODERATE_CONFIDENCE": "MODERATE",
    "MODERATE": "MODERATE",
    "MEDIUM": "MODERATE",
    "HIGH_CONFIDENCE": "LOW",
    "LOW": "LOW",
}


def normalize_risk_level(raw: str | None, confidence_score: int | float | None = None) -> str:
    """Map internal risk codes to n8n-friendly short labels."""
    if confidence_score is not None and is_risk_alert(confidence_score):
        return "HIGH"
    if not raw:
        return "MODERATE"
    key = str(raw).strip().upper().replace(" ", "_")
    if key in _N8N_RISK_MAP:
        return _N8N_RISK_MAP[key]
    if "HIGH" in key and "CONFIDENCE" not in key:
        return "HIGH"
    if "ELEVATED" in key:
        return "ELEVATED"
    if "MODERATE" in key or "MEDIUM" in key:
        return "MODERATE"
    return key.replace("_", " ").title().upper()


def confidence_band_label(score: int | float) -> str:
    """Application risk band for project alerts (80/60/35 thresholds)."""
    s = int(round(float(score)))
    if s >= 80:
        return "LOW"
    if s >= 60:
        return "MODERATE"
    if s >= RISK_ALERT_CONFIDENCE_THRESHOLD:
        return "HIGH"
    return "CRITICAL"


def build_project_risk_alert_payload(
    *,
    project_id: str,
    project_name: str,
    manufacturer_name: str,
    lender_name: str,
    recipient_phone: str,
    confidence_score: int | float,
    previous_confidence_score: int | float,
    risk_level: str,
    previous_risk_level: str,
    event_type: str,
    event_title: str,
    reason: str,
    recommended_action: str,
    project_status: str = "ACTIVE",
    event_timestamp: str | None = None,
) -> dict:
    """Structured payload for n8n WhatsApp Critical Risk Alert workflow."""
    from datetime import datetime, timezone

    confidence = int(round(float(confidence_score)))
    previous = int(round(float(previous_confidence_score)))
    phone = user_store.normalize_phone(recipient_phone) or recipient_phone
    ts = event_timestamp or datetime.now(timezone.utc).isoformat()

    sms_message = (
        f"FLOWCAPITAL CRITICAL RISK ALERT\n\n"
        f"Project: {project_name}\n"
        f"Confidence Score: {confidence}/100\n"
        f"Previous Score: {previous}/100\n"
        f"Risk Level: {risk_level}\n"
        f"Reason: {reason}\n"
        f"Recommended Action: {recommended_action.replace('_', ' ')}"
    )

    return {
        "project_id": project_id,
        "request_id": project_id,
        "project_name": project_name,
        "manufacturer_name": manufacturer_name,
        "lender_name": lender_name,
        "recipient_phone": phone,
        "phone": phone,
        "to_phone": phone,
        "confidence_score": confidence,
        "previous_confidence_score": previous,
        "risk_level": risk_level,
        "previous_risk_level": previous_risk_level,
        "event_type": event_type,
        "event_title": event_title,
        "reason": reason,
        "recommended_action": recommended_action,
        "event_timestamp": ts,
        "project_status": project_status,
        "alert": is_risk_alert(confidence),
        "alert_threshold": RISK_ALERT_CONFIDENCE_THRESHOLD,
        "sms_message": sms_message,
        "message": reason,
        "source": "flowcapital_project_event",
    }


def resolve_alert_phone(user_id: str | None = None, user_phone: str | None = None) -> str:
    """Return an E.164 phone for SMS. Explicit user_phone wins over env default."""
    settings = get_settings()

    candidates = [
        user_phone,
        user_store.get_phone(user_id) if user_id else None,
        settings.n8n_default_alert_phone,
        user_store.get_phone(DEMO_MANUFACTURER_ID),
    ]
    for phone in candidates:
        normalized = user_store.normalize_phone(phone)
        if normalized:
            return normalized

    # Last-resort demo fallback (manufacturer in users.json)
    return "+919943666848"


def build_sms_message(
    *,
    manufacturer: str,
    asset_id: str,
    confidence_score: int | float,
    risk_level: str,
    message: str,
    project_name: str | None = None,
) -> str:
    project = project_name or "production batch"
    return (
        f"FlowCapital ALERT: {manufacturer} — {project} ({asset_id}). "
        f"Confidence {int(confidence_score)}/100 ({risk_level}). {message}"
    )


def build_telemetry_risk_payload(
    *,
    source: str,
    asset_id: str = "DA-2026-001",
    request_id: str | None = None,
    simulation_id: str | None = None,
    confidence_score: int | float,
    risk_level: str | None = None,
    message: str,
    manufacturer: str = "VoltRide Mobility Pvt. Ltd.",
    product_name: str | None = None,
    project_name: str | None = None,
    current_stage: str | None = None,
    production_progress: int | float | None = None,
    trigger_event: str | None = None,
    user_id: str | None = None,
    user_phone: str | None = None,
    force_alert: bool = False,
) -> dict:
    """Build a flat JSON body aligned with n8n Evaluate Risk + Twilio nodes."""
    confidence = int(round(float(confidence_score)))
    n8n_risk = normalize_risk_level(risk_level, confidence)
    internal_risk = str(risk_level or n8n_risk).upper().replace(" ", "_")
    alert = force_alert or is_risk_alert(confidence)
    phone = resolve_alert_phone(user_id, user_phone)
    sms_message = build_sms_message(
        manufacturer=manufacturer,
        asset_id=asset_id,
        confidence_score=confidence,
        risk_level=n8n_risk,
        message=message,
        project_name=project_name or product_name,
    )

    return {
        "event_type": "TELEMETRY_RISK",
        "source": source,
        "asset_id": asset_id,
        "request_id": request_id,
        "simulation_id": simulation_id,
        "confidence_score": confidence,
        "risk_level": n8n_risk,
        "risk_level_code": internal_risk,
        "risk_level_label": n8n_risk,
        "current_stage": str(current_stage or "").replace("_", " ") or None,
        "production_progress": production_progress,
        "message": message,
        "sms_message": sms_message,
        "manufacturer": manufacturer,
        "product_name": product_name,
        "project_name": project_name or product_name,
        "trigger_event": trigger_event,
        "alert": alert,
        "alert_threshold": RISK_ALERT_CONFIDENCE_THRESHOLD,
        "phone": phone,
        "recipient_phone": phone,
        "to_phone": phone,
    }
