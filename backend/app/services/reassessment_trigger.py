"""Determines whether an event requires reassessment and which engines to run."""

from __future__ import annotations

from typing import Any

from app.services.event_intelligence import EventSeverity, EventType, classify_severity


FULL_REASSESSMENT = frozenset(
    {
        EventType.PRODUCTION_DELAYED,
        EventType.QUANTITY_UPDATED,
        EventType.QUALITY_FAILED,
        EventType.ASSET_VALUE_UPDATED,
        EventType.ASSET_VERIFICATION_FAILED,
        EventType.DOCUMENT_EXPIRED,
        EventType.DOCUMENT_REJECTED,
        EventType.EVIDENCE_CONFLICT_DETECTED,
        EventType.WAREHOUSE_MISMATCH,
        EventType.INVENTORY_SHORTAGE,
        EventType.PAYMENT_DELAYED,
        EventType.COLLATERAL_UPDATED,
        EventType.RISK_THRESHOLD_CROSSED,
        EventType.CONFIDENCE_THRESHOLD_CROSSED,
        EventType.EXPOSURE_THRESHOLD_CROSSED,
        EventType.MANUAL_REASSESSMENT_REQUESTED,
        EventType.PRODUCTION_COMPLETED,
        EventType.EVIDENCE_CONFLICT_RESOLVED,
        EventType.EVIDENCE_ADDED,
        EventType.DOCUMENT_VERIFIED,
        EventType.PAYMENT_RECEIVED,
        EventType.GOODS_DELIVERED,
        EventType.INVOICE_CREATED,
        EventType.SIMULATION_LIFECYCLE_EVENT,
    }
)

MINOR_EVENTS = frozenset(
    {
        EventType.PRODUCTION_PROGRESS_UPDATED,
    }
)

ENGINE_MAP: dict[str, list[str]] = {
    EventType.PRODUCTION_DELAYED: ["confidence", "risk", "financeable_value", "exposure", "instrument_suitability"],
    EventType.PRODUCTION_PROGRESS_UPDATED: ["confidence"],
    EventType.QUANTITY_UPDATED: ["confidence", "risk", "financeable_value", "exposure"],
    EventType.EVIDENCE_CONFLICT_DETECTED: ["confidence", "risk", "financeable_value", "exposure", "instrument_suitability"],
    EventType.EVIDENCE_CONFLICT_RESOLVED: ["confidence", "risk", "financeable_value"],
    EventType.EVIDENCE_ADDED: ["confidence", "evidence"],
    EventType.ASSET_VALUE_UPDATED: ["financeable_value", "exposure", "instrument_suitability"],
    EventType.PRODUCTION_COMPLETED: ["confidence", "lifecycle", "instrument_suitability"],
    EventType.PAYMENT_RECEIVED: ["lifecycle", "exposure", "instrument_suitability"],
    EventType.MANUAL_REASSESSMENT_REQUESTED: ["confidence", "risk", "financeable_value", "exposure", "instrument_suitability"],
    EventType.SIMULATION_LIFECYCLE_EVENT: ["confidence", "risk", "financeable_value", "exposure", "instrument_suitability"],
}


class ReassessmentTriggerService:
    def evaluate(self, event_type: str, metadata: dict[str, Any] | None = None) -> dict[str, Any]:
        meta = metadata or {}
        severity = classify_severity(event_type, meta)
        et = event_type.upper()

        if et in {e.value for e in MINOR_EVENTS}:
            progress_delta = abs(float(meta.get("progress_delta", meta.get("value", 0)) or 0))
            if progress_delta < 5:
                return {
                    "requires_reassessment": False,
                    "priority": "LOW",
                    "reason": "Minor progress update — no full reassessment required.",
                    "affected_engines": [],
                    "recommended_action": "NO_ACTION",
                    "severity": severity.value,
                }

        requires = et in {e.value for e in FULL_REASSESSMENT} or severity in (EventSeverity.HIGH, EventSeverity.CRITICAL)
        if "DELAY" in et or "MISMATCH" in et or "CONFLICT" in et:
            requires = True

        engines = ENGINE_MAP.get(et, ["confidence", "risk", "financeable_value", "exposure", "instrument_suitability"])
        priority = "CRITICAL" if severity == EventSeverity.CRITICAL else "HIGH" if severity == EventSeverity.HIGH else "MEDIUM" if requires else "LOW"

        action = "NO_ACTION"
        if requires:
            if severity == EventSeverity.CRITICAL:
                action = "CRITICAL_ESCALATION"
            elif et in (EventType.PRODUCTION_COMPLETED.value, EventType.INVOICE_CREATED.value):
                action = "REVIEW_INSTRUMENT_TRANSITION"
            elif "DELAY" in et or "CONFLICT" in et:
                action = "LENDER_REVIEW_REQUIRED"
            elif et == EventType.EVIDENCE_ADDED.value:
                action = "CONTINUE_MONITORING"
            else:
                action = "LENDER_REVIEW_REQUIRED" if severity in (EventSeverity.HIGH, EventSeverity.CRITICAL) else "CONTINUE_MONITORING"

        return {
            "requires_reassessment": requires,
            "priority": priority,
            "reason": f"Event {et} classified as {severity.value} — reassessment {'required' if requires else 'not required'}.",
            "affected_engines": engines if requires else [],
            "recommended_action": action,
            "severity": severity.value,
        }
