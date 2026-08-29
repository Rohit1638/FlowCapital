from __future__ import annotations

from unittest.mock import patch

from app.services.demo_platform_store import DEMO_REQUEST_ID, DemoPlatformStore
from app.services.risk_alert_service import should_trigger_risk_alert, confidence_to_risk_level
from app.core.auth import DEMO_MANUFACTURER_ID


def test_threshold_cross_triggers():
    ok, code = should_trigger_risk_alert(
        previous_score=68,
        new_score=32,
        previous_risk_level="HIGH",
        new_risk_level="CRITICAL",
        event_type="PRODUCTION_DELAYED",
        project_id="test-proj",
    )
    assert ok is True
    assert code == "THRESHOLD_CROSSED"


def test_moderate_drop_no_critical_alert():
    ok, _ = should_trigger_risk_alert(
        previous_score=68,
        new_score=55,
        previous_risk_level="HIGH",
        new_risk_level="HIGH",
        event_type="PRODUCTION_PROGRESS_UPDATED",
        project_id="test-proj-2",
    )
    assert ok is False


def test_confidence_bands():
    assert confidence_to_risk_level(85) == "LOW"
    assert confidence_to_risk_level(70) == "MODERATE"
    assert confidence_to_risk_level(40) == "HIGH"
    assert confidence_to_risk_level(32) == "CRITICAL"


@patch("app.services.risk_alert_service.trigger_risk_alert_sync", return_value=(True, None))
def test_production_delay_triggers_n8n(mock_trigger):
    store = DemoPlatformStore()
    req = store._requests[DEMO_REQUEST_ID]
    assert req["confidence_score"] == 68
    result = store.simulate_demo_event(
        DEMO_REQUEST_ID,
        "PRODUCTION_DELAYED",
        DEMO_MANUFACTURER_ID,
        "MANUFACTURER",
        {"delay_days": 10, "reason": "Production timeline was delayed by 10 days."},
    )
    assert result["alert_triggered"] is True
    assert result["new_confidence_score"] < 35
    assert mock_trigger.called
    assert len(store._risk_alerts) >= 1
    assert store._risk_alerts[0]["notification_status"] == "SENT"


@patch("app.services.risk_alert_service.trigger_risk_alert_sync", return_value=(False, "connection error"))
def test_n8n_failure_does_not_block_update(mock_trigger):
    store = DemoPlatformStore()
    result = store.simulate_demo_event(
        DEMO_REQUEST_ID,
        "PRODUCTION_DELAYED",
        DEMO_MANUFACTURER_ID,
        "MANUFACTURER",
        {"delay_days": 10},
    )
    assert result is not None
    assert result["request"]["confidence_score"] < 68
    assert store._risk_alerts[0]["notification_status"] == "FAILED"


def test_no_lender_skips_notification():
    store = DemoPlatformStore()
    req = store._requests[DEMO_REQUEST_ID]
    req["tranches"] = []
    from app.services.risk_alert_service import evaluate_project_risk_alert

    alert = evaluate_project_risk_alert(
        req,
        {"id": "e1", "event_type": "PRODUCTION_DELAYED", "metadata": {"delay_days": 10}},
        {"previous_confidence": 68, "new_confidence": 32, "previous_risk": "HIGH", "new_risk": "CRITICAL", "reason_summary": "delay", "recommended_action": "LENDER_REVIEW_REQUIRED"},
    )
    assert alert["notification_status"] == "NO_LENDER_PHONE"


@patch("app.services.risk_alert_service.trigger_risk_alert", return_value=(True, None))
def test_simulation_partial_completion_triggers_lender_alert(mock_trigger):
    import asyncio
    from app.services.risk_alert_service import evaluate_simulation_risk_alert

    store = DemoPlatformStore()
    req = store._requests[DEMO_REQUEST_ID]
    state = {
        "simulation_id": "sim-1",
        "request_id": DEMO_REQUEST_ID,
        "project_name": req.get("project_name"),
        "manufacturer_name": req.get("manufacturer_name"),
        "latest_event": {
            "id": "evt-1",
            "event_type": "PARTIAL_COMPLETION",
            "description": "Partial completion — 920 units passed quality check.",
            "confidence_before": 68,
            "confidence_after": 32,
            "timestamp": "2026-08-29T00:00:00+00:00",
        },
    }
    alert = asyncio.run(evaluate_simulation_risk_alert(req, state))
    assert alert["alert_triggered"] is True
    assert alert["notification_status"] == "SENT"
    assert mock_trigger.called
    payload = mock_trigger.call_args[0][0]
    from app.services.risk_alert_service import resolve_active_lender

    lender = resolve_active_lender(req)
    assert lender and lender["phone"]
    assert payload["recipient_phone"] == lender["phone"]
    assert payload["confidence_score"] == 32
