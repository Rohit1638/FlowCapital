"""Autonomous Reassessment Agent — orchestrates existing deterministic engines."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Callable

from app.services.event_intelligence import confidence_band, normalize_risk
from app.services.financing_engine import compute_recommendation
from app.services.instrument_engine import InstrumentSuitabilityService
from app.services.reassessment_trigger import ReassessmentTriggerService


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def compute_impact(
    *,
    confidence_change: float,
    risk_before: str,
    risk_after: str,
    safe_capacity_change: float,
    safe_capacity_before: float,
    active_exposure: float,
    safe_capacity_after: float,
    critical_conflict: bool = False,
) -> tuple[str, str]:
    """Return (impact_level, recommended_action)."""
    rb, ra = normalize_risk(risk_before), normalize_risk(risk_after)
    risk_escalated = {"LOW": 1, "MODERATE": 2, "HIGH": 3, "CRITICAL": 4}.get(ra, 2) > {"LOW": 1, "MODERATE": 2, "HIGH": 3, "CRITICAL": 4}.get(rb, 2)

    over_financed = active_exposure > safe_capacity_after > 0
    cap_pct_change = abs(safe_capacity_change / safe_capacity_before * 100) if safe_capacity_before else 0

    if critical_conflict or over_financed:
        return "CRITICAL_IMPACT", "CRITICAL_ESCALATION"
    if risk_escalated and ra in ("HIGH", "CRITICAL"):
        return "HIGH_IMPACT", "LENDER_REVIEW_REQUIRED"
    if abs(confidence_change) >= 7 or cap_pct_change >= 10:
        return "HIGH_IMPACT" if abs(confidence_change) >= 15 or cap_pct_change >= 20 else "MODERATE_IMPACT", "LENDER_REVIEW_REQUIRED"
    if abs(confidence_change) >= 3:
        return "LOW_IMPACT", "CONTINUE_MONITORING"
    return "NO_MATERIAL_IMPACT", "NO_ACTION"


class ReassessmentAgentService:
    def __init__(self) -> None:
        self._trigger = ReassessmentTriggerService()
        self._instrument = InstrumentSuitabilityService()

    def apply_event_effects(self, req: dict[str, Any], event_type: str, metadata: dict[str, Any] | None = None) -> dict[str, Any]:
        """Apply deterministic state changes from event before engine runs."""
        meta = metadata or {}
        et = event_type.upper()
        effects: dict[str, Any] = {}

        if et == "PRODUCTION_DELAYED" or "DELAY" in et:
            days = int(meta.get("delay_days", meta.get("value", 5)))
            req["confidence_score"] = max(30, req["confidence_score"] - min(45, 6 + days * 3))
            if days >= 7:
                req["risk_level"] = "HIGH"
            elif days >= 3:
                req["risk_level"] = "MODERATE" if req["confidence_score"] >= 70 else "HIGH"
            effects["delay_days"] = days

        elif et == "PRODUCTION_PROGRESS_UPDATED":
            delta = float(meta.get("progress_delta", meta.get("value", 5)))
            req["progress_pct"] = min(100, req["progress_pct"] + delta)
            if delta >= 5:
                req["confidence_score"] = min(95, req["confidence_score"] + 2)

        elif et == "QUANTITY_UPDATED":
            change_pct = float(meta.get("change_pct", -10))
            if change_pct < 0:
                req["confidence_score"] = max(50, req["confidence_score"] + int(change_pct / 2))
                if abs(change_pct) >= 25:
                    req["risk_level"] = "HIGH"
            else:
                req["confidence_score"] = min(95, req["confidence_score"] + 3)

        elif et in ("EVIDENCE_ADDED", "DOCUMENT_VERIFIED", "EVIDENCE_CONFLICT_RESOLVED"):
            boost = int(meta.get("confidence_boost", meta.get("value", 12)))
            req["confidence_score"] = min(95, req["confidence_score"] + boost)
            req["open_conflicts"] = max(0, req.get("open_conflicts", 0) - 1)
            if req["confidence_score"] >= 75:
                req["risk_level"] = "MODERATE" if req["confidence_score"] < 85 else "LOW"

        elif et in ("EVIDENCE_CONFLICT_DETECTED", "WAREHOUSE_MISMATCH", "QUALITY_FAILED"):
            req["open_conflicts"] = req.get("open_conflicts", 0) + 1
            req["confidence_score"] = max(45, req["confidence_score"] - int(meta.get("confidence_penalty", 15)))
            req["risk_level"] = "HIGH"

        elif et == "ASSET_VALUE_UPDATED":
            factor = float(meta.get("value_factor", 0.9))
            req["verified_value"] = round(req["verified_value"] * factor, 2)

        elif et == "PRODUCTION_COMPLETED":
            req["progress_pct"] = 100
            req["current_stage"] = "FINISHED_GOODS"
            req["instrument_lifecycle_stage"] = "INVENTORY_AVAILABLE"
            req["confidence_score"] = min(95, req["confidence_score"] + 5)

        elif et in ("INVOICE_CREATED", "GOODS_DELIVERED"):
            req["instrument_lifecycle_stage"] = "RECEIVABLE_CREATED" if et == "INVOICE_CREATED" else "GOODS_DELIVERED"

        elif et == "PAYMENT_RECEIVED":
            req["confidence_score"] = min(98, req["confidence_score"] + 8)
            req["risk_level"] = "LOW"

        elif et == "SIMULATION_LIFECYCLE_EVENT":
            meta = metadata or {}
            if meta.get("new_confidence") is not None:
                req["confidence_score"] = int(meta["new_confidence"])
            if meta.get("new_risk_level"):
                req["risk_level"] = meta["new_risk_level"]
            if meta.get("open_conflicts_delta"):
                req["open_conflicts"] = max(0, req.get("open_conflicts", 0) + int(meta["open_conflicts_delta"]))

        return effects

    def run(
        self,
        req: dict[str, Any],
        *,
        trigger_event_id: str,
        trigger_type: str,
        exposure_calculate: Callable[..., dict[str, Any]],
        offers: list[dict[str, Any]],
        instrument_reassess: Callable[..., dict[str, Any]] | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        trigger = self._trigger.evaluate(trigger_type, metadata)
        if not trigger["requires_reassessment"]:
            return {"skipped": True, "trigger": trigger}

        snap_before = exposure_calculate(req, offers)
        prev = {
            "confidence_score": req["confidence_score"],
            "risk_level": req["risk_level"],
            "financeable_value": req["financeable_value"],
            "maximum_safe_capacity": snap_before["maximum_safe_capacity"],
            "active_exposure": snap_before["active_exposure"],
            "remaining_capacity": snap_before["remaining_available_capacity"],
            "instrument": req.get("current_financing_instrument"),
            "confidence_band": confidence_band(req["confidence_score"]),
        }

        self.apply_event_effects(req, trigger_type, metadata)

        rec = compute_recommendation(
            requested_amount=req["required_funding_amount"],
            verified_value=req["verified_value"],
            confidence_score=req["confidence_score"],
            risk_level=req["risk_level"],
            outstanding_exposure=req["outstanding_exposure"],
            lender_max_exposure=4_000_000,
            lender_min_confidence=75,
            open_conflicts=req.get("open_conflicts", 0),
            document_completeness_pct=req.get("document_completeness_pct", 75),
        )
        req["financeable_value"] = rec.financeable_value
        req["unclaimed_value"] = rec.unclaimed_value
        req["financing_recommendation"] = rec.__dict__
        req["maximum_safe_capacity"] = max(rec.maximum_safe, req.get("maximum_safe_capacity", rec.maximum_safe))

        snap_after = exposure_calculate(req, offers)
        instrument_result = None
        if "instrument_suitability" in trigger["affected_engines"] and instrument_reassess:
            instrument_result = instrument_reassess(req, trigger_event_id=trigger_event_id, trigger_event_type=trigger_type)

        assessment = self._instrument.assess(req, exposure_snapshot=snap_after)
        new_instrument = assessment["recommended_instrument"]
        transition_status = assessment.get("transition_status", "NO_CHANGE")

        conf_change = req["confidence_score"] - prev["confidence_score"]
        cap_change = snap_after["maximum_safe_capacity"] - prev["maximum_safe_capacity"]
        impact_level, recommended_action = compute_impact(
            confidence_change=conf_change,
            risk_before=prev["risk_level"],
            risk_after=req["risk_level"],
            safe_capacity_change=cap_change,
            safe_capacity_before=prev["maximum_safe_capacity"],
            active_exposure=snap_after["active_exposure"],
            safe_capacity_after=snap_after["maximum_safe_capacity"],
            critical_conflict=trigger_type.upper() in ("EVIDENCE_CONFLICT_DETECTED", "ASSET_VERIFICATION_FAILED", "EXPOSURE_THRESHOLD_CROSSED"),
        )

        if trigger.get("recommended_action") == "CRITICAL_ESCALATION":
            recommended_action = "CRITICAL_ESCALATION"
        elif transition_status in ("RECOMMENDED_TRANSITION", "REQUIRED_REVIEW"):
            recommended_action = "REVIEW_INSTRUMENT_TRANSITION"

        band_before = prev["confidence_band"]
        band_after = confidence_band(req["confidence_score"])
        threshold_crossed = band_before != band_after

        record = {
            "id": str(uuid.uuid4()),
            "financing_request_id": req["id"],
            "request_code": req.get("request_code"),
            "manufacturer_id": req["manufacturer_id"],
            "manufacturer_name": req.get("manufacturer_name"),
            "trigger_event_id": trigger_event_id,
            "trigger_type": trigger_type,
            "status": "COMPLETED",
            "previous_confidence": prev["confidence_score"],
            "new_confidence": req["confidence_score"],
            "confidence_change": conf_change,
            "confidence_band_before": band_before,
            "confidence_band_after": band_after,
            "confidence_threshold_crossed": threshold_crossed,
            "previous_risk": normalize_risk(prev["risk_level"]),
            "new_risk": normalize_risk(req["risk_level"]),
            "previous_financeable_value": prev["financeable_value"],
            "new_financeable_value": req["financeable_value"],
            "financeable_value_change": req["financeable_value"] - prev["financeable_value"],
            "previous_safe_capacity": prev["maximum_safe_capacity"],
            "new_safe_capacity": snap_after["maximum_safe_capacity"],
            "capacity_change": cap_change,
            "previous_active_exposure": prev["active_exposure"],
            "new_active_exposure": snap_after["active_exposure"],
            "previous_remaining_capacity": prev["remaining_capacity"],
            "new_remaining_capacity": snap_after["remaining_available_capacity"],
            "previous_instrument": prev["instrument"],
            "new_recommended_instrument": new_instrument,
            "instrument_transition_status": transition_status,
            "impact_level": impact_level,
            "recommended_action": recommended_action,
            "reason_summary": self._reason_summary(trigger_type, conf_change, prev, req, snap_after),
            "trigger": trigger,
            "instrument_result": instrument_result,
            "started_at": _now(),
            "completed_at": _now(),
            "created_at": _now(),
            "lender_action": None,
            "lender_action_at": None,
        }
        return {"record": record, "trigger": trigger, "skipped": False}

    def _reason_summary(self, trigger_type: str, conf_change: float, prev: dict, req: dict, snap: dict) -> str:
        parts = [f"Triggered by {trigger_type.replace('_', ' ').lower()}."]
        if conf_change:
            parts.append(f"Confidence {prev['confidence_score']}% → {req['confidence_score']}% ({conf_change:+d}).")
        if prev["risk_level"] != req["risk_level"]:
            parts.append(f"Risk {prev['risk_level']} → {req['risk_level']}.")
        if snap["remaining_available_capacity"] != prev["remaining_capacity"]:
            parts.append(
                f"Remaining capacity ₹{prev['remaining_capacity'] / 100_000:.1f}L → ₹{snap['remaining_available_capacity'] / 100_000:.1f}L."
            )
        return " ".join(parts)
