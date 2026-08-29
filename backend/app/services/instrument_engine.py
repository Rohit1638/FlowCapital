"""Deterministic financing instrument suitability and lifecycle transition engine."""

from __future__ import annotations

import copy
import uuid
from datetime import datetime, timezone
from enum import StrEnum
from typing import Any

from app.services.marketplace_engine import LENDER_PROFILES, get_lender_profile


class FinancingInstrumentType(StrEnum):
    WORKING_CAPITAL = "WORKING_CAPITAL"
    PURCHASE_FINANCE = "PURCHASE_FINANCE"
    PRODUCTION_FINANCE = "PRODUCTION_FINANCE"
    RAW_MATERIAL_FINANCE = "RAW_MATERIAL_FINANCE"
    INVENTORY_FINANCE = "INVENTORY_FINANCE"
    FINISHED_GOODS_FINANCE = "FINISHED_GOODS_FINANCE"
    RECEIVABLES_FINANCE = "RECEIVABLES_FINANCE"
    ASSET_BACKED_FINANCE = "ASSET_BACKED_FINANCE"
    COLLATERAL_BACKED_FINANCE = "COLLATERAL_BACKED_FINANCE"
    TRANSITION_FINANCE = "TRANSITION_FINANCE"


LIFECYCLE_STAGE_META: dict[str, dict[str, str]] = {
    "PLANNING": {"display_name": "Planning", "description": "Production plan and funding requirement defined."},
    "RAW_MATERIALS_REQUIRED": {"display_name": "Raw Materials Required", "description": "Materials must be procured before production."},
    "RAW_MATERIALS_ACQUIRED": {"display_name": "Raw Materials Acquired", "description": "Materials received and verified at warehouse."},
    "PRODUCTION_STARTED": {"display_name": "Production Started", "description": "Manufacturing activity has begun."},
    "IN_PRODUCTION": {"display_name": "In Production", "description": "Active conversion of materials into finished goods."},
    "PRODUCTION_DELAYED": {"display_name": "Production Delayed", "description": "Production timeline extended due to operational issues."},
    "PRODUCTION_COMPLETED": {"display_name": "Production Completed", "description": "Manufacturing run finished."},
    "QUALITY_VERIFIED": {"display_name": "Quality Verified", "description": "Finished goods passed quality checks."},
    "INVENTORY_AVAILABLE": {"display_name": "Inventory Available", "description": "Finished goods held as verified inventory."},
    "INVENTORY_MOVING": {"display_name": "Inventory Moving", "description": "Goods in transit to buyer or warehouse."},
    "GOODS_DELIVERED": {"display_name": "Goods Delivered", "description": "Buyer has received delivered goods."},
    "INVOICED": {"display_name": "Invoiced", "description": "Invoice issued to buyer."},
    "RECEIVABLE_CREATED": {"display_name": "Receivable Created", "description": "Payment receivable established."},
    "PAYMENT_PENDING": {"display_name": "Payment Pending", "description": "Awaiting buyer settlement."},
    "PAYMENT_RECEIVED": {"display_name": "Payment Received", "description": "Buyer payment received."},
    "COMPLETED": {"display_name": "Completed", "description": "Financing lifecycle complete."},
}

STAGE_INSTRUMENT_MAP: dict[str, dict[str, Any]] = {
    "PLANNING": {"primary": FinancingInstrumentType.WORKING_CAPITAL, "alternatives": [FinancingInstrumentType.PURCHASE_FINANCE]},
    "RAW_MATERIALS_REQUIRED": {"primary": FinancingInstrumentType.PURCHASE_FINANCE, "alternatives": [FinancingInstrumentType.RAW_MATERIAL_FINANCE, FinancingInstrumentType.WORKING_CAPITAL]},
    "RAW_MATERIALS_ACQUIRED": {"primary": FinancingInstrumentType.RAW_MATERIAL_FINANCE, "alternatives": [FinancingInstrumentType.PURCHASE_FINANCE]},
    "PRODUCTION_STARTED": {"primary": FinancingInstrumentType.PRODUCTION_FINANCE, "alternatives": [FinancingInstrumentType.WORKING_CAPITAL]},
    "IN_PRODUCTION": {"primary": FinancingInstrumentType.PRODUCTION_FINANCE, "alternatives": [FinancingInstrumentType.ASSET_BACKED_FINANCE, FinancingInstrumentType.WORKING_CAPITAL]},
    "PRODUCTION_DELAYED": {"primary": FinancingInstrumentType.PRODUCTION_FINANCE, "alternatives": [FinancingInstrumentType.WORKING_CAPITAL]},
    "PRODUCTION_COMPLETED": {"primary": FinancingInstrumentType.INVENTORY_FINANCE, "alternatives": [FinancingInstrumentType.FINISHED_GOODS_FINANCE]},
    "QUALITY_VERIFIED": {"primary": FinancingInstrumentType.FINISHED_GOODS_FINANCE, "alternatives": [FinancingInstrumentType.INVENTORY_FINANCE]},
    "INVENTORY_AVAILABLE": {"primary": FinancingInstrumentType.INVENTORY_FINANCE, "alternatives": [FinancingInstrumentType.FINISHED_GOODS_FINANCE]},
    "INVENTORY_MOVING": {"primary": FinancingInstrumentType.INVENTORY_FINANCE, "alternatives": [FinancingInstrumentType.TRANSITION_FINANCE]},
    "GOODS_DELIVERED": {"primary": FinancingInstrumentType.RECEIVABLES_FINANCE, "alternatives": [FinancingInstrumentType.TRANSITION_FINANCE]},
    "INVOICED": {"primary": FinancingInstrumentType.RECEIVABLES_FINANCE, "alternatives": [FinancingInstrumentType.TRANSITION_FINANCE]},
    "RECEIVABLE_CREATED": {"primary": FinancingInstrumentType.RECEIVABLES_FINANCE, "alternatives": []},
    "PAYMENT_PENDING": {"primary": FinancingInstrumentType.RECEIVABLES_FINANCE, "alternatives": []},
    "PAYMENT_RECEIVED": {"primary": FinancingInstrumentType.RECEIVABLES_FINANCE, "alternatives": []},
    "COMPLETED": {"primary": FinancingInstrumentType.WORKING_CAPITAL, "alternatives": []},
}

REQUEST_STAGE_TO_LIFECYCLE: dict[str, str] = {
    "PURCHASE_ORDER": "PLANNING",
    "RAW_MATERIAL": "RAW_MATERIALS_ACQUIRED",
    "PRODUCTION_STARTED": "PRODUCTION_STARTED",
    "IN_PRODUCTION": "IN_PRODUCTION",
    "QUALITY_CHECK": "QUALITY_VERIFIED",
    "FINISHED_GOODS": "INVENTORY_AVAILABLE",
    "WAREHOUSE": "INVENTORY_AVAILABLE",
    "SHIPMENT": "INVENTORY_MOVING",
    "DELIVERY": "GOODS_DELIVERED",
    "INVOICE": "INVOICED",
    "RECEIVABLE": "RECEIVABLE_CREATED",
    "SETTLEMENT": "PAYMENT_RECEIVED",
}

EVENT_TO_LIFECYCLE: dict[str, str] = {
    "RAW_MATERIAL_RECEIVED": "RAW_MATERIALS_ACQUIRED",
    "PRODUCTION_STARTED": "PRODUCTION_STARTED",
    "PRODUCTION_PROGRESS_UPDATED": "IN_PRODUCTION",
    "PRODUCTION_DELAY": "PRODUCTION_DELAYED",
    "PRODUCTION_COMPLETED": "PRODUCTION_COMPLETED",
    "QUALITY_CHECK_PASSED": "QUALITY_VERIFIED",
    "QUALITY_VERIFIED": "QUALITY_VERIFIED",
    "INVENTORY_VERIFIED": "INVENTORY_AVAILABLE",
    "GOODS_SHIPPED": "INVENTORY_MOVING",
    "GOODS_DELIVERED": "GOODS_DELIVERED",
    "INVOICE_CREATED": "INVOICED",
    "RECEIVABLE_CREATED": "RECEIVABLE_CREATED",
    "PAYMENT_PENDING": "PAYMENT_PENDING",
    "PAYMENT_RECEIVED": "PAYMENT_RECEIVED",
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _suitability_category(score: float) -> str:
    if score >= 80:
        return "HIGHLY_SUITABLE"
    if score >= 60:
        return "SUITABLE"
    if score >= 40:
        return "CONDITIONAL"
    return "NOT_RECOMMENDED"


def _normalize_risk(risk: str) -> int:
    mapping = {"LOW": 1, "MEDIUM": 2, "MODERATE": 2, "ELEVATED": 3, "HIGH": 4, "HIGH_RISK": 4}
    return mapping.get(str(risk).upper(), 2)


class InstrumentSuitabilityService:
    def resolve_lifecycle_stage(self, req: dict[str, Any]) -> str:
        explicit = req.get("instrument_lifecycle_stage")
        if explicit:
            return explicit
        return REQUEST_STAGE_TO_LIFECYCLE.get(req.get("current_stage", ""), "IN_PRODUCTION")

    def lifecycle_from_event(self, event_type: str, req: dict[str, Any]) -> str | None:
        if event_type in EVENT_TO_LIFECYCLE:
            return EVENT_TO_LIFECYCLE[event_type]
        upper = event_type.upper()
        if "DELAY" in upper:
            return "PRODUCTION_DELAYED"
        if "COMPLETED" in upper or "FINISHED" in upper:
            return "PRODUCTION_COMPLETED"
        if "INVOICE" in upper:
            return "INVOICED"
        if "PAYMENT" in upper:
            return "PAYMENT_PENDING" if "PENDING" in upper else "PAYMENT_RECEIVED"
        return None

    def assess(
        self,
        req: dict[str, Any],
        *,
        lender_id: str | None = None,
        exposure_snapshot: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        stage = self.resolve_lifecycle_stage(req)
        mapping = STAGE_INSTRUMENT_MAP.get(stage, STAGE_INSTRUMENT_MAP["IN_PRODUCTION"])
        primary = str(mapping["primary"])
        alternatives = [str(a) for a in mapping.get("alternatives", [])]
        current = str(req.get("current_financing_instrument", primary))

        scores: dict[str, float] = {}
        all_instruments = [primary] + [a for a in alternatives if a != primary]
        for instrument in all_instruments:
            scores[instrument] = self._score_instrument(
                instrument, stage, req, mapping, lender_id, exposure_snapshot
            )

        ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        recommended = ranked[0][0]
        recommended_score = ranked[0][1]

        transition_type = "NO_CHANGE"
        transition_reason = "Current instrument remains aligned with lifecycle stage."
        if current != recommended and recommended_score >= 60:
            transition_type = "RECOMMENDED_TRANSITION"
            transition_reason = (
                f"The underlying value has transitioned to {LIFECYCLE_STAGE_META.get(stage, {}).get('display_name', stage)}. "
                f"{recommended.replace('_', ' ').title()} is now better aligned with the current lifecycle stage."
            )
        elif current != recommended and recommended_score < 40:
            transition_type = "REQUIRED_REVIEW"
            transition_reason = "Lifecycle changed significantly — manual review recommended before changing instrument."
        elif current == recommended:
            transition_type = "NO_CHANGE"

        lender_match = True
        lender_note = None
        if lender_id:
            profile = get_lender_profile(lender_id)
            if profile and recommended not in profile.preferred_instruments:
                supported = [recommended] + [a for a in alternatives if a in profile.preferred_instruments]
                if supported:
                    recommended = supported[0]
                    lender_note = f"Lender policy prefers {recommended.replace('_', ' ').title()} for this stage."
                else:
                    lender_match = False
                    lender_note = "Recommended instrument is not matched to current lender policy."

        blocking: list[str] = []
        if req.get("confidence_score", 0) < 60:
            blocking.append("Confidence below minimum threshold for unconditional instrument transition.")
        if req.get("open_conflicts", 0) > 0:
            blocking.append("Open evidence conflicts require resolution.")

        return {
            "current_lifecycle_stage": stage,
            "lifecycle_display_name": LIFECYCLE_STAGE_META.get(stage, {}).get("display_name", stage),
            "current_instrument": current,
            "recommended_instrument": recommended,
            "alternative_instruments": [{"instrument": k, "suitability_score": v, "category": _suitability_category(v)} for k, v in ranked[1:]],
            "suitability_scores": {k: {"score": v, "category": _suitability_category(v)} for k, v in scores.items()},
            "recommended_suitability_score": round(recommended_score, 1),
            "recommended_category": _suitability_category(recommended_score),
            "transition_status": transition_type,
            "transition_recommended": transition_type in ("RECOMMENDED_TRANSITION", "REQUIRED_REVIEW"),
            "transition_reason": transition_reason,
            "blocking_reasons": blocking,
            "lender_instrument_match": lender_match,
            "lender_policy_note": lender_note,
            "confidence_requirement_met": req.get("confidence_score", 0) >= 65,
            "risk_requirement_met": _normalize_risk(req.get("risk_level", "MEDIUM")) <= 3,
            "capacity_requirement_met": (exposure_snapshot or {}).get("remaining_available_capacity", 1) > 0,
        }

    def _score_instrument(
        self,
        instrument: str,
        stage: str,
        req: dict[str, Any],
        mapping: dict[str, Any],
        lender_id: str | None,
        exposure_snapshot: dict[str, Any] | None,
    ) -> float:
        primary = str(mapping["primary"])
        alternatives = [str(a) for a in mapping.get("alternatives", [])]

        lifecycle_match = 30 if instrument == primary else (18 if instrument in alternatives else 8)
        asset_type = (req.get("collateral") or [{}])[0].get("asset_type", "INVENTORY") if req.get("collateral") else "INVENTORY"
        asset_match = 20 if instrument in ("PRODUCTION_FINANCE", "INVENTORY_FINANCE") and asset_type in ("INVENTORY", "RAW_MATERIAL") else 14

        confidence = int(req.get("confidence_score", 70))
        confidence_pts = min(15, int(confidence / 100 * 15))

        risk_pts = max(0, 15 - (_normalize_risk(req.get("risk_level", "MEDIUM")) - 1) * 4)

        doc_pct = int(req.get("document_completeness_pct", 75))
        evidence_pts = min(10, int(doc_pct / 10))

        policy_pts = 8
        if lender_id:
            profile = get_lender_profile(lender_id)
            if profile:
                policy_pts = 10 if instrument in profile.preferred_instruments else 4

        total = lifecycle_match + asset_match + confidence_pts + risk_pts + evidence_pts + policy_pts
        if req.get("open_conflicts", 0) > 0:
            total -= 8
        return round(min(100, max(0, total)), 1)

    def create_transition(
        self,
        req: dict[str, Any],
        assessment: dict[str, Any],
        *,
        trigger_event_id: str | None = None,
        trigger_event_type: str | None = None,
    ) -> dict[str, Any] | None:
        if not assessment.get("transition_recommended"):
            return None
        if assessment["current_instrument"] == assessment["recommended_instrument"]:
            return None

        return {
            "id": str(uuid.uuid4()),
            "financing_request_id": req["id"],
            "financing_id": req.get("tranches", [{}])[0].get("id") if req.get("tranches") else None,
            "manufacturer_id": req["manufacturer_id"],
            "manufacturer_name": req.get("manufacturer_name"),
            "request_code": req.get("request_code"),
            "from_instrument": assessment["current_instrument"],
            "to_instrument": assessment["recommended_instrument"],
            "previous_lifecycle_stage": assessment.get("previous_lifecycle_stage", assessment["current_lifecycle_stage"]),
            "new_lifecycle_stage": assessment["current_lifecycle_stage"],
            "transition_type": assessment["transition_status"],
            "status": "PENDING_REVIEW",
            "suitability_score": assessment["recommended_suitability_score"],
            "transition_reason": assessment["transition_reason"],
            "trigger_event_id": trigger_event_id,
            "trigger_event_type": trigger_event_type,
            "confidence_snapshot": req.get("confidence_score"),
            "risk_snapshot": req.get("risk_level"),
            "created_at": _now(),
            "reviewed_at": None,
            "reviewed_by": None,
            "review_notes": None,
        }


def seed_demo_transitions() -> list[dict[str, Any]]:
    ts = _now()
    return [
        {
            "id": "trans-demo-production-001",
            "financing_request_id": "00000000-0000-4000-8000-000000000100",
            "financing_id": "tr-lender-a-001",
            "manufacturer_id": "00000000-0000-4000-8000-000000000001",
            "manufacturer_name": "VoltRide Mobility Pvt. Ltd.",
            "request_code": "PR-EB-1000",
            "from_instrument": "PURCHASE_FINANCE",
            "to_instrument": "PRODUCTION_FINANCE",
            "previous_lifecycle_stage": "RAW_MATERIALS_ACQUIRED",
            "new_lifecycle_stage": "IN_PRODUCTION",
            "transition_type": "RECOMMENDED_TRANSITION",
            "status": "PENDING_REVIEW",
            "suitability_score": 91.0,
            "transition_reason": (
                "The underlying value has transitioned from material acquisition to active production. "
                "Production Finance is now better aligned with the current lifecycle stage."
            ),
            "trigger_event_id": "MFG-EB-001",
            "trigger_event_type": "PRODUCTION_STARTED",
            "confidence_snapshot": 68,
            "risk_snapshot": "MEDIUM",
            "created_at": ts,
            "reviewed_at": None,
            "reviewed_by": None,
            "review_notes": None,
        },
    ]
