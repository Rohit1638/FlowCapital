"""Shared risk alert thresholds for simulation, integrations, and n8n webhooks."""

RISK_ALERT_CONFIDENCE_THRESHOLD = 35


def is_risk_alert(confidence_score: int | float | None) -> bool:
    if confidence_score is None:
        return False
    return float(confidence_score) < RISK_ALERT_CONFIDENCE_THRESHOLD
