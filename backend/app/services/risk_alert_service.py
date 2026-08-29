"""WhatsApp risk alert integration — backend → n8n → Twilio."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

import httpx

from app.core.config import get_settings
from app.core.logging import get_logger
from app.core.risk_constants import RISK_ALERT_CONFIDENCE_THRESHOLD, is_risk_alert
from app.services.n8n_payload import build_project_risk_alert_payload
from app.services.user_store import user_store

logger = get_logger("risk_alert")

# In-memory deduplication for demo / hackathon (persisted copy also stored on demo_store)
_recent_alert_state: dict[str, dict[str, Any]] = {}

SIGNIFICANT_DROP_POINTS = 15
ALERT_COOLDOWN_MINUTES = 30


def confidence_to_risk_level(score: int | float) -> str:
    s = int(round(float(score)))
    if s >= 80:
        return "LOW"
    if s >= 60:
        return "MODERATE"
    if s >= RISK_ALERT_CONFIDENCE_THRESHOLD:
        return "HIGH"
    return "CRITICAL"


def should_trigger_risk_alert(
    *,
    previous_score: int | float,
    new_score: int | float,
    previous_risk_level: str,
    new_risk_level: str,
    event_type: str,
    project_id: str,
) -> tuple[bool, str]:
    """
    Determine whether to POST to n8n for a WhatsApp critical alert.
    Returns (should_trigger, reason_code).
    """
    prev = int(round(float(previous_score)))
    new = int(round(float(new_score)))
    state = _recent_alert_state.get(project_id, {})
    last_sent_score = state.get("last_sent_score")
    last_sent_at = state.get("last_sent_at")

    # CASE 1: Crossed critical threshold
    if prev >= RISK_ALERT_CONFIDENCE_THRESHOLD and new < RISK_ALERT_CONFIDENCE_THRESHOLD:
        return True, "THRESHOLD_CROSSED"

    # CASE 2: Already critical + risk worsened
    risk_order = {"LOW": 1, "MODERATE": 2, "HIGH": 3, "CRITICAL": 4}
    prev_r = risk_order.get(str(previous_risk_level).upper(), 2)
    new_r = risk_order.get(str(new_risk_level).upper(), 2)
    if new < RISK_ALERT_CONFIDENCE_THRESHOLD and new_r > prev_r:
        if last_sent_score is not None and new >= last_sent_score:
            return False, "DUPLICATE_SAME_OR_HIGHER_SCORE"
        return True, "RISK_ESCALATED"

    # CASE 3: Significant drop (even if still above 35)
    if prev - new >= SIGNIFICANT_DROP_POINTS and new < 50:
        return True, "SIGNIFICANT_DROP"

    # CASE 4: Already below 35 — avoid spam unless materially worse
    if new < RISK_ALERT_CONFIDENCE_THRESHOLD:
        if last_sent_score is None:
            return True, "CRITICAL_INITIAL"
        if new <= last_sent_score - 5:
            return True, "CRITICAL_WORSENED"
        if last_sent_at:
            elapsed = (datetime.now(timezone.utc) - last_sent_at).total_seconds() / 60
            if elapsed >= ALERT_COOLDOWN_MINUTES and new < last_sent_score:
                return True, "COOLDOWN_EXPIRED_WORSE"
        return False, "DUPLICATE_SUPPRESSED"

    return False, "NO_ALERT"


def resolve_active_lender(req: dict[str, Any]) -> dict[str, Any] | None:
    """Return active lender from financing tranches."""
    tranches = req.get("tranches") or []
    active = [t for t in tranches if t.get("status") == "ACTIVE" and t.get("lender_id")]
    if not active:
        return None
    tranche = active[0]
    lender_id = tranche["lender_id"]
    phone = user_store.get_phone(lender_id)
    normalized = user_store.normalize_phone(phone) if phone else None
    return {
        "lender_id": lender_id,
        "lender_name": tranche.get("lender_name", "Assigned Lender"),
        "financing_id": tranche.get("id"),
        "phone": normalized,
    }


def _webhook_url() -> str | None:
    settings = get_settings()
    return settings.n8n_risk_alert_webhook_url or settings.n8n_telemetry_webhook_url


async def trigger_risk_alert(payload: dict[str, Any]) -> tuple[bool, str | None]:
    """POST structured risk alert to n8n production webhook."""
    url = _webhook_url()
    if not url:
        logger.debug("N8N_RISK_ALERT_WEBHOOK_URL not configured — skipping alert")
        return False, "WEBHOOK_NOT_CONFIGURED"

    settings = get_settings()
    headers = {"Content-Type": "application/json", "User-Agent": "FlowCapital-Backend/1.0"}
    if settings.n8n_webhook_secret:
        headers["X-N8N-Secret"] = settings.n8n_webhook_secret

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
        logger.info(
            "n8n risk alert delivered project=%s confidence=%s phone=%s",
            payload.get("project_id"),
            payload.get("confidence_score"),
            payload.get("recipient_phone"),
        )
        return True, None
    except Exception as exc:
        logger.warning("n8n risk alert failed project=%s error=%s", payload.get("project_id"), exc)
        return False, str(exc)


def trigger_risk_alert_sync(payload: dict[str, Any]) -> tuple[bool, str | None]:
    """Synchronous variant for in-process demo store calls."""
    url = _webhook_url()
    if not url:
        return False, "WEBHOOK_NOT_CONFIGURED"
    settings = get_settings()
    headers = {"Content-Type": "application/json", "User-Agent": "FlowCapital-Backend/1.0"}
    if settings.n8n_webhook_secret:
        headers["X-N8N-Secret"] = settings.n8n_webhook_secret
    try:
        with httpx.Client(timeout=15.0) as client:
            response = client.post(url, json=payload, headers=headers)
            response.raise_for_status()
        return True, None
    except Exception as exc:
        logger.warning("n8n risk alert sync failed: %s", exc)
        return False, str(exc)


def mark_alert_sent(project_id: str, new_score: int) -> None:
    _recent_alert_state[project_id] = {
        "last_sent_score": new_score,
        "last_sent_at": datetime.now(timezone.utc),
    }


def evaluate_project_risk_alert(
    req: dict[str, Any],
    event: dict[str, Any],
    reassessment_record: dict[str, Any] | None,
) -> dict[str, Any]:
    """
    Evaluate whether to trigger n8n WhatsApp alert after a project event.
    Returns structured result for API response and alert log.
    """
    prev_score = int(reassessment_record["previous_confidence"]) if reassessment_record else int(req.get("confidence_score", 0))
    new_score = int(reassessment_record["new_confidence"]) if reassessment_record else int(req.get("confidence_score", 0))
    prev_risk = confidence_to_risk_level(prev_score) if not reassessment_record else str(reassessment_record.get("previous_risk", confidence_to_risk_level(prev_score)))
    new_risk = confidence_to_risk_level(new_score) if not reassessment_record else str(reassessment_record.get("new_risk", confidence_to_risk_level(new_score)))

    if reassessment_record:
        prev_risk = str(reassessment_record.get("previous_risk", prev_risk)).upper()
        new_risk = str(reassessment_record.get("new_risk", new_risk)).upper()

    project_id = req["id"]
    event_type = event.get("event_type", "PROJECT_UPDATE")
    should_send, reason_code = should_trigger_risk_alert(
        previous_score=prev_score,
        new_score=new_score,
        previous_risk_level=prev_risk,
        new_risk_level=new_risk,
        event_type=event_type,
        project_id=project_id,
    )

    lender = resolve_active_lender(req)
    alert_id = str(uuid.uuid4())
    base_log = {
        "id": alert_id,
        "project_id": project_id,
        "financing_request_id": project_id,
        "manufacturer_id": req.get("manufacturer_id"),
        "lender_id": lender["lender_id"] if lender else None,
        "event_id": event.get("id"),
        "previous_confidence_score": prev_score,
        "new_confidence_score": new_score,
        "previous_risk_level": prev_risk,
        "new_risk_level": new_risk,
        "event_type": event_type,
        "reason": reassessment_record.get("reason_summary") if reassessment_record else event.get("metadata", {}).get("reason", ""),
        "recommended_action": reassessment_record.get("recommended_action") if reassessment_record else "LENDER_REVIEW_REQUIRED",
        "trigger_reason_code": reason_code,
        "alert_triggered": False,
        "n8n_triggered": False,
        "notification_sent": False,
        "notification_status": "SKIPPED",
        "notification_error": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    if not should_send:
        base_log["notification_status"] = f"SKIPPED_{reason_code}"
        return base_log

    if not lender or not lender.get("phone"):
        base_log["notification_status"] = "NO_LENDER_PHONE"
        base_log["notification_error"] = "No active lender with phone assigned to this project"
        return base_log

    meta = event.get("metadata") or {}
    event_title = meta.get("reason") or event_type.replace("_", " ").title()
    if event_type == "PRODUCTION_DELAYED":
        days = meta.get("delay_days", meta.get("value"))
        if days:
            event_title = f"Production Timeline Delayed ({days} days)"

    payload = build_project_risk_alert_payload(
        project_id=project_id,
        project_name=req.get("project_name", req.get("product_name", "Production Project")),
        manufacturer_name=req.get("manufacturer_name", "Manufacturer"),
        lender_name=lender["lender_name"],
        recipient_phone=lender["phone"],
        confidence_score=new_score,
        previous_confidence_score=prev_score,
        risk_level=new_risk,
        previous_risk_level=prev_risk,
        event_type=event_type,
        event_title=event_title,
        reason=base_log["reason"] or f"Confidence changed from {prev_score} to {new_score}",
        recommended_action=base_log["recommended_action"],
        project_status=req.get("status", "ACTIVE"),
    )

    base_log["alert_triggered"] = True
    base_log["n8n_triggered"] = True
    delivered, error = trigger_risk_alert_sync(payload)
    base_log["notification_sent"] = delivered
    base_log["notification_status"] = "SENT" if delivered else "FAILED"
    base_log["notification_error"] = error

    if delivered:
        mark_alert_sent(project_id, new_score)

    return base_log


async def evaluate_simulation_risk_alert(req: dict[str, Any], state: dict[str, Any]) -> dict[str, Any]:
    """
    Evaluate whether to trigger n8n WhatsApp alert after a simulation step.
    Uses lender phone and the structured project-risk payload (not telemetry).
    """
    latest = state.get("latest_event") or {}
    if not latest:
        return {"alert_triggered": False, "notification_status": "SKIPPED_NO_EVENT"}

    prev_score = int(latest.get("confidence_before", state.get("starting_confidence", req.get("confidence_score", 0))))
    new_score = int(latest.get("confidence_after", state.get("confidence_score", req.get("confidence_score", 0))))
    prev_risk = confidence_to_risk_level(prev_score)
    new_risk = confidence_to_risk_level(new_score)
    project_id = req["id"]
    event_type = latest.get("event_type", "SIMULATION_EVENT")

    should_send, reason_code = should_trigger_risk_alert(
        previous_score=prev_score,
        new_score=new_score,
        previous_risk_level=prev_risk,
        new_risk_level=new_risk,
        event_type=event_type,
        project_id=project_id,
    )

    lender = resolve_active_lender(req)
    alert_id = str(uuid.uuid4())
    reason = latest.get("description") or f"Simulation event: {event_type.replace('_', ' ').title()}"
    base_log = {
        "id": alert_id,
        "project_id": project_id,
        "financing_request_id": project_id,
        "manufacturer_id": req.get("manufacturer_id"),
        "lender_id": lender["lender_id"] if lender else None,
        "event_id": latest.get("id"),
        "simulation_id": state.get("simulation_id"),
        "previous_confidence_score": prev_score,
        "new_confidence_score": new_score,
        "previous_risk_level": prev_risk,
        "new_risk_level": new_risk,
        "event_type": event_type,
        "reason": reason,
        "recommended_action": "LENDER_REVIEW_REQUIRED",
        "trigger_reason_code": reason_code,
        "alert_triggered": False,
        "n8n_triggered": False,
        "notification_sent": False,
        "notification_status": "SKIPPED",
        "notification_error": None,
        "source": "simulation",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    if not should_send:
        base_log["notification_status"] = f"SKIPPED_{reason_code}"
        return base_log

    if not lender or not lender.get("phone"):
        base_log["notification_status"] = "NO_LENDER_PHONE"
        base_log["notification_error"] = "No active lender with phone assigned to this project"
        return base_log

    event_title = event_type.replace("_", " ").title()
    payload = build_project_risk_alert_payload(
        project_id=project_id,
        project_name=state.get("project_name") or req.get("project_name", req.get("product_name", "Production Project")),
        manufacturer_name=state.get("manufacturer_name") or req.get("manufacturer_name", "Manufacturer"),
        lender_name=lender["lender_name"],
        recipient_phone=lender["phone"],
        confidence_score=new_score,
        previous_confidence_score=prev_score,
        risk_level=new_risk,
        previous_risk_level=prev_risk,
        event_type=event_type,
        event_title=event_title,
        reason=reason,
        recommended_action=base_log["recommended_action"],
        project_status=req.get("status", "ACTIVE"),
        event_timestamp=latest.get("timestamp"),
    )

    base_log["alert_triggered"] = True
    base_log["n8n_triggered"] = True
    delivered, error = await trigger_risk_alert(payload)
    base_log["notification_sent"] = delivered
    base_log["notification_status"] = "SENT" if delivered else "FAILED"
    base_log["notification_error"] = error

    if delivered:
        mark_alert_sent(project_id, new_score)

    return base_log
