from __future__ import annotations

import copy
import uuid
from datetime import date, datetime, timezone
from typing import Any

from app.core.auth import DEMO_LENDER_ID, DEMO_MANUFACTURER_ID
from app.services.exposure_service import ExposureService, seed_demo_exposure_entries, seed_demo_exposure_history
from app.services.financing_engine import compute_recommendation, reassess_after_event
from app.services.event_intelligence import classify_severity
from app.services.instrument_engine import (
    LIFECYCLE_STAGE_META,
    STAGE_INSTRUMENT_MAP,
    InstrumentSuitabilityService,
    seed_demo_transitions,
)
from app.services.platform_persistence import platform_persistence
from app.services.platform_repository import platform_repository
from app.services.reassessment_agent import ReassessmentAgentService
from app.services.risk_alert_service import evaluate_project_risk_alert
from app.services.marketplace_engine import assess_lender_eligibility, get_lender_profile
from app.services.marketplace_store import (
    accept_offer as marketplace_accept_offer,
    competition_counts,
    list_lender_offers,
    list_manufacturer_offers,
    list_opportunities_for_lender,
    seed_demo_offers,
    submit_offer as marketplace_submit_offer,
)

DEMO_REQUEST_ID = "00000000-0000-4000-8000-000000000100"
DEMO_FINANCING_REQUEST_ID = "00000000-0000-4000-8000-000000000101"
DEMO_COLLATERAL_ID = "00000000-0000-4000-8000-000000000102"

STAGE_TEMPLATE = [
    ("PURCHASE_ORDER", "Purchase Order", 1, 5),
    ("RAW_MATERIAL", "Raw Material", 2, 7),
    ("PRODUCTION_STARTED", "Production Started", 3, 3),
    ("IN_PRODUCTION", "In Production", 4, 21),
    ("QUALITY_CHECK", "Quality Check", 5, 3),
    ("FINISHED_GOODS", "Finished Goods", 6, 2),
    ("WAREHOUSE", "Warehouse", 7, 2),
    ("SHIPMENT", "Shipment", 8, 4),
    ("DELIVERY", "Delivery", 9, 3),
    ("INVOICE", "Invoice", 10, 2),
    ("RECEIVABLE", "Receivable", 11, 30),
    ("SETTLEMENT", "Settlement", 12, 5),
]


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _build_stages(current: str, progress: float) -> list[dict[str, Any]]:
    stages = []
    reached = False
    for code, name, order, days in STAGE_TEMPLATE:
        if code == current:
            reached = True
            status = "IN_PROGRESS"
            pct = progress
        elif not reached:
            status = "COMPLETED"
            pct = 100
        else:
            status = "PENDING"
            pct = 0
        stages.append(
            {
                "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, f"stage-{code}")),
                "stage_code": code,
                "stage_name": name,
                "sequence_order": order,
                "estimated_duration_days": days,
                "progress_pct": pct,
                "status": status,
            }
        )
    return stages


def _base_request() -> dict[str, Any]:
    rec = compute_recommendation(
        requested_amount=5_000_000,
        verified_value=4_200_000,
        confidence_score=68,
        risk_level="HIGH",
        outstanding_exposure=0,
        lender_max_exposure=4_000_000,
        lender_min_confidence=75,
        open_conflicts=0,
        document_completeness_pct=82,
    )
    rec_dict = rec.__dict__.copy()
    rec_dict["maximum_safe"] = 3_800_000
    rec_dict["recommended_max"] = 3_800_000
    return {
        "id": DEMO_REQUEST_ID,
        "request_code": "PR-EB-1000",
        "manufacturer_id": DEMO_MANUFACTURER_ID,
        "manufacturer_name": "VoltRide Mobility Pvt. Ltd.",
        "project_name": "Electric Bike Series X — Batch 1000",
        "product_name": "VoltRide City E-Bike",
        "product_category": "Electric Mobility",
        "quantity": 1000,
        "expected_selling_value": 12_000_000,
        "estimated_production_cost": 8_500_000,
        "required_funding_amount": 5_000_000,
        "funding_purpose": "Raw material procurement and production working capital",
        "expected_start_date": "2026-08-01",
        "expected_completion_date": "2026-10-15",
        "buyer_name": "UrbanMove Fleet Services",
        "purchase_order_reference": "PO-UM-2026-EB1000",
        "description": "Manufacture 1,000 electric bikes for UrbanMove fleet deployment across Bengaluru and Hyderabad.",
        "current_stage": "IN_PRODUCTION",
        "progress_pct": 70,
        "status": "UNDER_REVIEW",
        "decision_status": "OPEN_FOR_OFFERS",
        "confidence_score": 68,
        "risk_level": "HIGH",
        "verified_value": 4_200_000,
        "financeable_value": rec.financeable_value,
        "maximum_safe_capacity": 3_800_000,
        "outstanding_exposure": 0,
        "unclaimed_value": 3_800_000,
        "open_conflicts": 0,
        "document_completeness_pct": 82,
        "financing_recommendation": rec_dict,
        "stages": _build_stages("IN_PRODUCTION", 70),
        "collateral": [
            {
                "id": DEMO_COLLATERAL_ID,
                "collateral_code": "COL-EB-RM-001",
                "asset_name": "Lithium Battery Pack Inventory",
                "asset_type": "RAW_MATERIAL",
                "quantity": 1000,
                "unit": "Units",
                "estimated_value": 2_800_000,
                "lifecycle_stage": "RAW_MATERIAL",
                "location": "VoltRide Bengaluru Plant — Bay 3",
                "already_pledged": False,
                "existing_financing_amount": 0,
            },
            {
                "id": "00000000-0000-4000-8000-000000000103",
                "collateral_code": "COL-EB-WIP-001",
                "asset_name": "E-Bike Work-in-Progress",
                "asset_type": "INVENTORY",
                "quantity": 580,
                "unit": "Units",
                "estimated_value": 3_480_000,
                "lifecycle_stage": "IN_PRODUCTION",
                "location": "VoltRide Assembly Line 2",
                "already_pledged": False,
                "existing_financing_amount": 0,
            },
        ],
        "documents": [
            {"id": "doc-1", "document_name": "PO_2026_001.pdf", "document_type": "PURCHASE_ORDER", "verification_status": "VERIFIED", "status": "UPLOADED", "file_size_bytes": 2516582, "mime_type": "application/pdf", "uploaded_at": "2026-08-01T10:00:00Z"},
            {"id": "doc-2", "document_name": "GST_certificate.pdf", "document_type": "GST_CERTIFICATE", "verification_status": "VERIFIED", "status": "UPLOADED", "file_size_bytes": 1258291, "mime_type": "application/pdf", "uploaded_at": "2026-08-02T11:30:00Z"},
            {"id": "doc-3", "document_name": "Production_Plan_SeriesX.pdf", "document_type": "PRODUCTION_PLAN", "verification_status": "VERIFIED", "status": "UPLOADED", "file_size_bytes": 3145728, "mime_type": "application/pdf", "uploaded_at": "2026-08-05T09:15:00Z"},
            {"id": "doc-4", "document_name": "invoice_001.pdf", "document_type": "INVOICE", "verification_status": "PENDING", "status": "UPLOADED", "file_size_bytes": 911360, "mime_type": "application/pdf", "uploaded_at": "2026-08-20T14:00:00Z"},
        ],
        "events": [
            {"event_code": "MFG-EB-001", "event_type": "PRODUCTION_STARTED", "description": "Assembly line 2 started for Series X batch", "severity": "info", "timestamp": "2026-08-18T06:00:00Z"},
            {"event_code": "MFG-EB-002", "event_type": "PRODUCTION_PROGRESS_UPDATED", "description": "580 units in production (58%)", "severity": "info", "timestamp": "2026-08-28T09:00:00Z"},
            {"event_code": "MFG-EB-003", "event_type": "PRODUCTION_DELAY", "description": "Battery supplier delay — 5 days", "severity": "warning", "timestamp": "2026-08-25T14:00:00Z"},
            {"event_code": "MFG-EB-004", "event_type": "QUANTITY_MISMATCH_DETECTED", "description": "Expected 1000 units raw material; warehouse shows 920", "severity": "warning", "timestamp": "2026-08-28T05:02:00Z"},
        ],
        "conflicts": [],
        "decisions": [],
        "tranches": [],
        "capital_forecast": {
            "estimated_amount": 1_400_000,
            "estimated_days": 6,
            "label": "FORECAST / SIMULATION",
            "summary": "Estimated funding gap: ₹14L in approximately 6 days based on production plan burn rate.",
        },
        "current_financing_instrument": "PURCHASE_FINANCE",
        "instrument_lifecycle_stage": "IN_PRODUCTION",
        "created_at": "2026-08-01T08:00:00Z",
        "updated_at": _now().isoformat(),
    }


class DemoPlatformStore:
    def __init__(self, *, persist: bool = False) -> None:
        self._persist_enabled = persist
        self._requests: dict[str, dict[str, Any]] = {DEMO_REQUEST_ID: _base_request()}
        self._offers: list[dict[str, Any]] = seed_demo_offers()
        self._exposure_entries: list[dict[str, Any]] = seed_demo_exposure_entries()
        self._exposure_history: list[dict[str, Any]] = seed_demo_exposure_history()
        self._exposure = ExposureService(self._exposure_entries, self._exposure_history)
        self._instrument_engine = InstrumentSuitabilityService()
        self._reassessment_agent = ReassessmentAgentService()
        self._transitions: list[dict[str, Any]] = seed_demo_transitions()
        self._intelligence_events: list[dict[str, Any]] = []
        self._reassessment_records: list[dict[str, Any]] = []
        self._risk_alerts: list[dict[str, Any]] = []
        self._notification_dedup: set[str] = set()
        self._audit_logs: list[dict[str, Any]] = []
        self._simulations: dict[str, dict[str, Any]] = {}
        self._notifications: dict[str, list[dict[str, Any]]] = {
            DEMO_MANUFACTURER_ID: [
                {"id": "n1", "title": "3 competitive offers received", "body": "Balanced Growth, Aggressive Supply Chain, and Conservative Capital submitted financing offers on PR-EB-1000.", "category": "FINANCING", "read": False, "created_at": "2026-08-28T10:05:00Z"},
                {"id": "n2", "title": "Compare financing offers", "body": "Review ranked offers side-by-side — rates from 9.75% to 13.25% on up to ₹28L combined.", "category": "FINANCING", "read": False, "created_at": "2026-08-28T10:10:00Z"},
                {"id": "n3", "title": "Quantity mismatch detected", "body": "Warehouse count differs from production plan.", "category": "RISK", "read": False, "created_at": "2026-08-28T05:05:00Z"},
            ],
            DEMO_LENDER_ID: [
                {"id": "n4", "title": "Your offer is under review", "body": "VoltRide Mobility is comparing your ₹22L Production Finance offer with two competitors.", "category": "FINANCING", "read": False, "created_at": "2026-08-28T10:05:00Z"},
                {"id": "n5", "title": "Competitor entered marketplace", "body": "Conservative Capital Partners submitted a lower-rate offer on PR-EB-1000.", "category": "MARKETPLACE", "read": False, "created_at": "2026-08-28T10:00:00Z"},
            ],
        }
        self._simulation_reassessment_keys: set[str] = set()
        if self._persist_enabled:
            self._load_persisted_state()
        self._ensure_demo_marketplace_offers()
        if not self._reassessment_records:
            self._seed_baseline_reassessment()
        if self._persist_enabled:
            self._persist_state()

    def _ensure_demo_marketplace_offers(self) -> None:
        """Merge seeded compare-offers demo data when DB hydrate left the request without pending offers."""
        existing_ids = {o["id"] for o in self._offers}
        for offer in seed_demo_offers():
            if offer["id"] not in existing_ids:
                self._offers.append(offer)

    def _load_persisted_state(self) -> None:
        if platform_repository.hydrate_store(self):
            return
        persisted_reassessments = platform_persistence.load_json("reassessment_records")
        if isinstance(persisted_reassessments, list) and persisted_reassessments:
            self._reassessment_records = persisted_reassessments
        persisted_sims = platform_persistence.load_json("simulations")
        if isinstance(persisted_sims, dict) and persisted_sims:
            self._simulations.update(persisted_sims)
        keys = platform_persistence.load_json("simulation_reassessment_keys")
        if isinstance(keys, list):
            self._simulation_reassessment_keys = set(keys)

    def _persist_state(self) -> None:
        if not self._persist_enabled:
            return
        if platform_repository.persist_store(self):
            platform_persistence.save_json("simulation_reassessment_keys", list(self._simulation_reassessment_keys))
            return
        platform_persistence.save_json("reassessment_records", self._reassessment_records)
        platform_persistence.save_json("simulations", self._simulations)
        platform_persistence.save_json("simulation_reassessment_keys", list(self._simulation_reassessment_keys))

    def _persist_simulation_state(self, request_id: str) -> None:
        """Lightweight persist for simulation start/next/reset — avoids full Postgres sync."""
        if not self._persist_enabled:
            return
        sim = self._simulations.get(request_id)
        if not sim:
            return
        if platform_repository.persist_simulation(request_id, sim):
            platform_persistence.save_json("simulation_reassessment_keys", list(self._simulation_reassessment_keys))
            return
        platform_persistence.save_json("simulations", self._simulations)
        platform_persistence.save_json("simulation_reassessment_keys", list(self._simulation_reassessment_keys))

    def _seed_baseline_reassessment(self) -> None:
        """One historical reassessment so the lender tab is never empty on first load."""
        req = self._requests[DEMO_REQUEST_ID]
        snap = self._exposure.calculate(req, self._offers)
        self._reassessment_records.append(
            {
                "id": "00000000-0000-4000-8000-000000000201",
                "financing_request_id": DEMO_REQUEST_ID,
                "request_code": req["request_code"],
                "manufacturer_id": req["manufacturer_id"],
                "manufacturer_name": req["manufacturer_name"],
                "trigger_event_id": "seed-quantity-mismatch",
                "trigger_type": "WAREHOUSE_MISMATCH",
                "status": "COMPLETED",
                "previous_confidence": 72,
                "new_confidence": 68,
                "confidence_change": -4,
                "confidence_band_before": "MODERATE CONFIDENCE",
                "confidence_band_after": "MODERATE CONFIDENCE",
                "confidence_threshold_crossed": False,
                "previous_risk": "MODERATE",
                "new_risk": "HIGH",
                "previous_financeable_value": req["financeable_value"],
                "new_financeable_value": req["financeable_value"],
                "financeable_value_change": 0,
                "previous_safe_capacity": snap["maximum_safe_capacity"],
                "new_safe_capacity": max(snap["maximum_safe_capacity"] - 150_000, 0),
                "capacity_change": -150_000,
                "previous_active_exposure": snap["active_exposure"],
                "new_active_exposure": snap["active_exposure"],
                "previous_remaining_capacity": snap["remaining_available_capacity"],
                "new_remaining_capacity": max(snap["remaining_available_capacity"] - 150_000, 0),
                "previous_instrument": req.get("current_financing_instrument"),
                "new_recommended_instrument": req.get("current_financing_instrument"),
                "instrument_transition_status": "NO_CHANGE",
                "impact_level": "MODERATE_IMPACT",
                "recommended_action": "LENDER_REVIEW_REQUIRED",
                "reason_summary": (
                    "Triggered by warehouse quantity mismatch (920 received vs 1,000 planned). "
                    "Confidence 72% → 68%. Remaining safe capacity reduced slightly pending verification."
                ),
                "lender_action": None,
                "lender_action_at": None,
                "created_at": "2026-08-28T05:05:00+00:00",
                "completed_at": "2026-08-28T05:05:00+00:00",
                "source": "seed",
            }
        )

    def _simulation_risk_to_req(self, sim_risk: str) -> str:
        mapping = {
            "HIGH_CONFIDENCE": "LOW",
            "MODERATE_CONFIDENCE": "MODERATE",
            "ELEVATED_RISK": "HIGH",
            "HIGH_RISK": "HIGH",
        }
        return mapping.get(sim_risk, "MODERATE")

    def _maybe_reassessment_from_simulation(
        self,
        req: dict[str, Any],
        sim: dict[str, Any],
        actor_id: str,
        actor_role: str,
    ) -> dict[str, Any] | None:
        """Create a lender reassessment record when a simulation step materially changes financing health."""
        latest = sim.get("latest_event")
        if not latest:
            return None

        dedup = f"sim:{latest.get('id')}"
        if dedup in self._simulation_reassessment_keys:
            return None

        prev = int(latest.get("confidence_before", req.get("confidence_score", 68)))
        new = int(latest.get("confidence_after", sim.get("confidence_score", prev)))
        delta = new - prev
        severity = str(latest.get("severity", "info")).lower()

        material = (
            (prev >= 35 and new < 35)
            or (prev >= 60 and new < 57)
            or severity in ("warning", "critical")
            or (severity != "info" and abs(delta) >= 2)
        )
        if not material:
            return None

        self._simulation_reassessment_keys.add(dedup)
        sim_risk = str(latest.get("risk_level") or sim.get("risk_level", "MODERATE_CONFIDENCE"))

        req["confidence_score"] = prev
        event = self._create_intelligence_event(
            req,
            "SIMULATION_LIFECYCLE_EVENT",
            source_type="SYSTEM",
            actor_id=actor_id,
            metadata={
                "new_confidence": new,
                "new_risk_level": self._simulation_risk_to_req(sim_risk),
                "simulation_event_type": latest.get("event_type"),
                "description": latest.get("description"),
                "reason": latest.get("description") or "Simulation lifecycle event",
            },
        )
        result = self._run_reassessment_for_event(req, event, actor_id, actor_role, persist=False)
        req["confidence_score"] = new
        req["risk_level"] = self._simulation_risk_to_req(sim_risk)
        req["updated_at"] = _now().isoformat()

        if result.get("skipped"):
            return None
        record = result.get("record")
        if record:
            record["source"] = "simulation"
            record["reason_summary"] = (
                f"Simulation step: {latest.get('event_type', 'EVENT').replace('_', ' ').title()}. "
                f"{latest.get('description', '')} "
                f"Confidence {prev}% → {new}% ({delta:+d})."
            ).strip()
        return result

    def trigger_demo_reassessment(self, lender_id: str) -> dict[str, Any] | None:
        """Inject a high-impact demo event for lender review (production delay)."""
        req = self._requests.get(DEMO_REQUEST_ID)
        if not req or not any(t.get("lender_id") == lender_id for t in req.get("tranches", [])):
            return None
        return self.simulate_demo_event(
            DEMO_REQUEST_ID,
            "PRODUCTION_DELAYED",
            lender_id,
            "LENDER",
            {"delay_days": 10, "reason": "Production timeline delayed by 10 days — supplier slip."},
        )

    def _notify_deduped(self, user_id: str, title: str, body: str, category: str, dedup_key: str) -> None:
        if dedup_key in self._notification_dedup:
            return
        self._notification_dedup.add(dedup_key)
        self._notify(user_id, title, body, category)

    def _notify(self, user_id: str, title: str, body: str, category: str) -> None:
        self._notifications.setdefault(user_id, []).insert(
            0,
            {
                "id": str(uuid.uuid4()),
                "title": title,
                "body": body,
                "category": category,
                "read": False,
                "created_at": _now().isoformat(),
            },
        )

    def _audit(self, action: str, actor_id: str, actor_role: str, payload: dict[str, Any]) -> None:
        self._audit_logs.append(
            {
                "id": str(uuid.uuid4()),
                "action": action,
                "actor_id": actor_id,
                "actor_role": actor_role,
                "timestamp": _now().isoformat(),
                "payload": payload,
            }
        )

    def manufacturer_dashboard(self, user_id: str) -> dict[str, Any]:
        reqs = [r for r in self._requests.values() if r["manufacturer_id"] == user_id]
        active = [r for r in reqs if r["status"] not in ("COMPLETED", "CANCELLED", "DRAFT")]
        exposure_snapshots = [self._exposure.calculate(r, self._offers) for r in active]
        return {
            "active_production_requests": len(active),
            "total_funding_requested": sum(r["required_funding_amount"] for r in reqs),
            "approved_financing": sum(t["approved_amount"] for r in reqs for t in r.get("tranches", [])),
            "available_financing_capacity": sum(s["remaining_available_capacity"] for s in exposure_snapshots),
            "capital_blocked": sum(r.get("outstanding_exposure", 0) for r in active if r.get("open_conflicts", 0) > 0),
            "average_confidence_score": round(sum(r["confidence_score"] for r in active) / max(len(active), 1)),
            "open_risks": sum(r.get("open_conflicts", 0) for r in active),
            "open_conflicts": sum(r.get("open_conflicts", 0) for r in active),
            "production_progress_pct": round(sum(r["progress_pct"] for r in active) / max(len(active), 1), 1),
            "upcoming_funding_needs": [r["capital_forecast"] for r in active if r.get("capital_forecast")],
            "capital_capacity": exposure_snapshots[0] if exposure_snapshots else None,
            "requests": reqs,
        }

    def lender_dashboard(self, user_id: str) -> dict[str, Any]:
        opportunities = self.list_opportunities(user_id)
        return {
            "available_opportunities": len([o for o in opportunities if o["eligibility_status"] != "NOT_ELIGIBLE"]),
            "requests_under_review": len([o for o in opportunities if o["status"] in ("SUBMITTED", "UNDER_REVIEW", "ACTIVE_FINANCING")]),
            "total_active_exposure": 2_000_000,
            "total_approved_financing": 2_000_000,
            "average_portfolio_confidence": 68,
            "high_risk_exposures": 1,
            "assets_requiring_attention": 1,
            "top_up_opportunities": 1,
            "step_down_risks": 1,
            "blocked_opportunities": 0,
            "opportunities": opportunities,
        }

    def list_requests(self, manufacturer_id: str) -> list[dict[str, Any]]:
        return [copy.deepcopy(r) for r in self._requests.values() if r["manufacturer_id"] == manufacturer_id]

    def get_request(self, request_id: str, actor_id: str, actor_role: str) -> dict[str, Any] | None:
        req = self._requests.get(request_id)
        if not req:
            return None
        if actor_role == "MANUFACTURER" and req["manufacturer_id"] != actor_id:
            return None
        return copy.deepcopy(req)

    def list_opportunities(self, lender_id: str) -> list[dict[str, Any]]:
        return list_opportunities_for_lender(self._requests, self._offers, lender_id, self._exposure)

    def get_exposure(self, request_id: str, actor_id: str, actor_role: str, lender_view: bool = False) -> dict[str, Any] | None:
        req = self._requests.get(request_id)
        if not req:
            return None
        if actor_role == "MANUFACTURER" and req["manufacturer_id"] != actor_id:
            return None
        snap = self._exposure.calculate(req, self._offers)
        if lender_view:
            return self._exposure.lender_view(snap)
        return {**snap, "exposure_summary": snap, "funding_requirement": req["required_funding_amount"]}

    def validate_capacity(self, request_id: str, proposed_amount: float, actor_id: str, actor_role: str) -> dict[str, Any] | None:
        req = self._requests.get(request_id)
        if not req:
            return None
        if actor_role == "MANUFACTURER" and req["manufacturer_id"] != actor_id:
            return None
        return self._exposure.validate_capacity(req, proposed_amount, self._offers)

    def exposure_history(self, request_id: str, actor_id: str, actor_role: str) -> list[dict[str, Any]] | None:
        req = self._requests.get(request_id)
        if not req:
            return None
        if actor_role == "MANUFACTURER" and req["manufacturer_id"] != actor_id:
            return None
        return self._exposure.history_for_request(request_id)

    def get_opportunity(self, request_id: str, lender_id: str) -> dict[str, Any] | None:
        req = self._requests.get(request_id)
        if not req:
            return None
        detail = copy.deepcopy(req)
        detail["ai_context"] = self._ai_context(req)
        profile = get_lender_profile(lender_id)
        snap = self._exposure.calculate(req, self._offers)
        if profile:
            my_offer = next(
                (o for o in self._offers if o["request_id"] == request_id and o["lender_id"] == lender_id),
                None,
            )
            eligibility = assess_lender_eligibility(profile, req, snap, my_offer)
            counts = competition_counts(self._offers, request_id, lender_id)
            detail["marketplace"] = {
                **eligibility,
                **counts,
                **self._exposure.lender_view(snap),
                "maximum_safe_financing": snap["maximum_safe_capacity"],
                "maximum_safe_capacity": snap["maximum_safe_capacity"],
                "capacity_reasons": snap.get("capacity_reasons", []),
                "over_financing_amount": snap.get("over_financing_amount", 0),
                "competition_label": (
                    f"{counts['competing_lender_count']} other lender{'s' if counts['competing_lender_count'] != 1 else ''} have submitted offers"
                    if counts["competing_lender_count"]
                    else "No competing offers yet"
                ),
                "my_offer": copy.deepcopy(my_offer) if my_offer else None,
                "lender_profile": {
                    "lender_name": profile.lender_name,
                    "risk_appetite": profile.risk_appetite,
                    "minimum_confidence_threshold": profile.minimum_confidence_threshold,
                    "strategy_summary": profile.strategy_summary,
                },
            }
            detail["ai_context"]["exposure"] = self._exposure.lender_view(snap)
        overlay = self.get_simulation_overlay(request_id)
        if overlay:
            detail["simulation_overlay"] = overlay
        return detail

    def _ai_context(self, req: dict[str, Any]) -> dict[str, Any]:
        rec = req.get("financing_recommendation", {})
        snap = self._exposure.calculate(req, self._offers)
        instrument = self._instrument_engine.assess(req, exposure_snapshot=snap)
        pending = [t for t in self._transitions if t["financing_request_id"] == req["id"] and t["status"] == "PENDING_REVIEW"]
        return {
            "request_code": req["request_code"],
            "product_name": req["product_name"],
            "quantity": req["quantity"],
            "current_stage": req["current_stage"],
            "progress_pct": req["progress_pct"],
            "confidence_score": req["confidence_score"],
            "risk_level": req["risk_level"],
            "verified_value": req["verified_value"],
            "financeable_value": req["financeable_value"],
            "outstanding_exposure": req["outstanding_exposure"],
            "unclaimed_value": req["unclaimed_value"],
            "required_funding_amount": req["required_funding_amount"],
            "open_conflicts": req.get("open_conflicts", 0),
            "document_completeness_pct": req.get("document_completeness_pct", 0),
            "documents_count": len(req.get("documents", [])),
            "eligibility_status": rec.get("eligibility_status"),
            "recommended_min": rec.get("recommended_min"),
            "recommended_max": rec.get("recommended_max"),
            "recommendation_reason": rec.get("reason"),
            "financing_recommendation": rec,
            "recent_events": req.get("events", [])[-3:],
            "instrument_suitability": instrument,
            "current_financing_instrument": req.get("current_financing_instrument"),
            "instrument_lifecycle_stage": instrument["current_lifecycle_stage"],
            "recommended_financing_instrument": instrument["recommended_instrument"],
            "transition_status": instrument["transition_status"],
            "transition_reason": instrument["transition_reason"],
            "pending_instrument_transitions": len(pending),
        }

    def _reassess_instrument_internal(
        self,
        req: dict[str, Any],
        *,
        trigger_event_id: str | None = None,
        trigger_event_type: str | None = None,
        actor_id: str | None = None,
        actor_role: str = "SYSTEM",
    ) -> dict[str, Any]:
        prev_stage = req.get("instrument_lifecycle_stage")
        if trigger_event_type:
            new_stage = self._instrument_engine.lifecycle_from_event(trigger_event_type, req)
            if new_stage and new_stage != prev_stage:
                req["instrument_lifecycle_stage"] = new_stage
                self._audit(
                    "LIFECYCLE_STAGE_CHANGED",
                    actor_id or "system",
                    actor_role,
                    {
                        "request_id": req["id"],
                        "previous_stage": prev_stage,
                        "new_stage": new_stage,
                        "trigger_event_type": trigger_event_type,
                    },
                )

        snap = self._exposure.calculate(req, self._offers)
        assessment = self._instrument_engine.assess(req, exposure_snapshot=snap)
        assessment["previous_lifecycle_stage"] = prev_stage

        self._audit(
            "INSTRUMENT_REASSESSED",
            actor_id or "system",
            actor_role,
            {"request_id": req["id"], "assessment": assessment},
        )

        transition_created = None
        if assessment.get("transition_recommended"):
            pending = [
                t
                for t in self._transitions
                if t["financing_request_id"] == req["id"]
                and t["status"] in ("DETECTED", "PENDING_REVIEW")
            ]
            if not pending:
                transition_created = self._instrument_engine.create_transition(
                    req,
                    assessment,
                    trigger_event_id=trigger_event_id,
                    trigger_event_type=trigger_event_type,
                )
                if transition_created:
                    self._transitions.append(transition_created)
                    self._audit(
                        "TRANSITION_RECOMMENDED",
                        actor_id or "system",
                        actor_role,
                        {"transition": transition_created},
                    )
                    self._notify(
                        DEMO_MANUFACTURER_ID,
                        "Financing structure review",
                        f"A better financing structure ({transition_created['to_instrument'].replace('_', ' ')}) has been identified for {req['request_code']}.",
                        "FINANCING",
                    )
                    for tranche in req.get("tranches", []):
                        lid = tranche.get("lender_id")
                        if lid:
                            self._notify(
                                lid,
                                "Financing transition requires review",
                                f"Review recommended transition to {transition_created['to_instrument'].replace('_', ' ')} on {req['request_code']}.",
                                "FINANCING",
                            )

        return {"assessment": assessment, "transition": transition_created}

    def instrument_suitability(self, request_id: str, actor_id: str, actor_role: str, lender_id: str | None = None) -> dict[str, Any] | None:
        req = self._can_access_request(request_id, actor_id, actor_role)
        if not req:
            return None
        snap = self._exposure.calculate(req, self._offers)
        lid = lender_id if actor_role == "LENDER" else None
        if actor_role == "LENDER":
            lid = actor_id
        assessment = self._instrument_engine.assess(req, lender_id=lid, exposure_snapshot=snap)
        pending = next(
            (t for t in self._transitions if t["financing_request_id"] == request_id and t["status"] == "PENDING_REVIEW"),
            None,
        )
        return {
            **assessment,
            "pending_transition": copy.deepcopy(pending) if pending else None,
            "lifecycle_stages": [
                {
                    "stage": code,
                    **meta,
                    "primary_instrument": str(STAGE_INSTRUMENT_MAP.get(code, {}).get("primary", "")),
                }
                for code, meta in LIFECYCLE_STAGE_META.items()
            ],
        }

    def list_transitions_for_request(self, request_id: str, actor_id: str, actor_role: str) -> list[dict[str, Any]] | None:
        req = self._can_access_request(request_id, actor_id, actor_role)
        if not req:
            return None
        return copy.deepcopy([t for t in self._transitions if t["financing_request_id"] == request_id])

    def lender_transitions(self, lender_id: str) -> list[dict[str, Any]]:
        items = []
        for t in self._transitions:
            if t["status"] not in ("PENDING_REVIEW", "DETECTED"):
                continue
            req = self._requests.get(t["financing_request_id"])
            if not req:
                continue
            authorized = any(tr.get("lender_id") == lender_id for tr in req.get("tranches", []))
            if not authorized and t.get("financing_id"):
                authorized = any(tr.get("id") == t["financing_id"] and tr.get("lender_id") == lender_id for tr in req.get("tranches", []))
            if not authorized:
                continue
            snap = self._exposure.calculate(req, self._offers)
            items.append(
                {
                    **copy.deepcopy(t),
                    "exposure_snapshot": self._exposure.lender_view(snap),
                    "confidence_score": req["confidence_score"],
                    "financeable_value": req["financeable_value"],
                }
            )
        return items

    def get_transition(self, transition_id: str, lender_id: str) -> dict[str, Any] | None:
        t = next((x for x in self._transitions if x["id"] == transition_id), None)
        if not t:
            return None
        req = self._requests.get(t["financing_request_id"])
        if not req:
            return None
        authorized = any(tr.get("lender_id") == lender_id for tr in req.get("tranches", []))
        if not authorized:
            return None
        snap = self._exposure.calculate(req, self._offers)
        assessment = self._instrument_engine.assess(req, lender_id=lender_id, exposure_snapshot=snap)
        reasons = []
        if t["new_lifecycle_stage"] in ("IN_PRODUCTION", "PRODUCTION_STARTED"):
            reasons.append("Production activity verified")
            reasons.append(f"{req.get('progress_pct', 0)}% of production completed")
        if req.get("events"):
            reasons.append("Production events received")
        reasons.append(f"Confidence remains {req['confidence_score']}%")
        return {
            **copy.deepcopy(t),
            "request": {
                "request_code": req["request_code"],
                "project_name": req["project_name"],
                "manufacturer_name": req["manufacturer_name"],
                "confidence_score": req["confidence_score"],
                "risk_level": req["risk_level"],
                "financeable_value": req["financeable_value"],
                "progress_pct": req["progress_pct"],
            },
            "exposure_snapshot": self._exposure.lender_view(snap),
            "assessment": assessment,
            "recommendation_reasons": reasons,
            "deterministic_note": "This is a recommendation generated from deterministic structured rules.",
        }

    def _get_transition_for_lender(self, transition_id: str, lender_id: str) -> tuple[dict[str, Any], dict[str, Any]] | None:
        t = next((x for x in self._transitions if x["id"] == transition_id), None)
        if not t:
            return None
        req = self._requests.get(t["financing_request_id"])
        if not req:
            return None
        authorized = any(tr.get("lender_id") == lender_id for tr in req.get("tranches", []))
        if not authorized:
            return None
        return t, req

    def approve_transition(self, transition_id: str, lender_id: str, notes: str | None = None) -> dict[str, Any] | None:
        pair = self._get_transition_for_lender(transition_id, lender_id)
        if not pair:
            return None
        t, req = pair
        if t["status"] not in ("PENDING_REVIEW", "DETECTED"):
            raise ValueError("Transition already reviewed")
        ts = _now().isoformat()
        before_instrument = req.get("current_financing_instrument")
        req["current_financing_instrument"] = t["to_instrument"]
        for tranche in req.get("tranches", []):
            if tranche.get("id") == t.get("financing_id") or tranche.get("lender_id") == lender_id:
                tranche["instrument"] = t["to_instrument"]
        snap_before = self._exposure.calculate(req, self._offers)
        active_before = snap_before["active_exposure"]
        self._exposure.reclassify_instrument(
            request_id=req["id"],
            financing_id=t.get("financing_id") or "tr-lender-a-001",
            from_instrument=t["from_instrument"],
            to_instrument=t["to_instrument"],
            actor_id=lender_id,
            audit_fn=self._audit,
        )
        snap_after = self._exposure.calculate(req, self._offers)
        t.update({"status": "EXECUTED", "reviewed_at": ts, "reviewed_by": lender_id, "review_notes": notes})
        self._audit(
            "TRANSITION_APPROVED",
            lender_id,
            "LENDER",
            {
                "transition_id": transition_id,
                "request_id": req["id"],
                "previous_instrument": before_instrument,
                "new_instrument": t["to_instrument"],
                "exposure_before": active_before,
                "exposure_after": snap_after["active_exposure"],
            },
        )
        self._notify(
            req["manufacturer_id"],
            "Financing structure updated",
            f"Lender approved transition to {t['to_instrument'].replace('_', ' ')} on {req['request_code']}.",
            "FINANCING",
        )
        return {"transition": copy.deepcopy(t), "request": copy.deepcopy(req), "exposure_unchanged": active_before == snap_after["active_exposure"]}

    def keep_current_instrument(self, transition_id: str, lender_id: str, notes: str | None = None) -> dict[str, Any] | None:
        pair = self._get_transition_for_lender(transition_id, lender_id)
        if not pair:
            return None
        t, req = pair
        if t["status"] not in ("PENDING_REVIEW", "DETECTED"):
            raise ValueError("Transition already reviewed")
        t.update({"status": "CANCELLED", "reviewed_at": _now().isoformat(), "reviewed_by": lender_id, "review_notes": notes or "Lender chose to keep current instrument"})
        self._audit("CURRENT_INSTRUMENT_RETAINED", lender_id, "LENDER", {"transition_id": transition_id, "instrument": req.get("current_financing_instrument")})
        self._notify(req["manufacturer_id"], "Current financing retained", f"Lender will keep {req.get('current_financing_instrument', '').replace('_', ' ')} on {req['request_code']}.", "FINANCING")
        return {"transition": copy.deepcopy(t), "request": copy.deepcopy(req)}

    def reject_transition(self, transition_id: str, lender_id: str, notes: str | None = None) -> dict[str, Any] | None:
        pair = self._get_transition_for_lender(transition_id, lender_id)
        if not pair:
            return None
        t, req = pair
        if t["status"] not in ("PENDING_REVIEW", "DETECTED"):
            raise ValueError("Transition already reviewed")
        t.update({"status": "REJECTED", "reviewed_at": _now().isoformat(), "reviewed_by": lender_id, "review_notes": notes})
        self._audit("TRANSITION_REJECTED", lender_id, "LENDER", {"transition_id": transition_id})
        self._notify(req["manufacturer_id"], "Transition rejected", f"Lender rejected the recommended instrument change on {req['request_code']}.", "FINANCING")
        return {"transition": copy.deepcopy(t)}

    def request_transition_evidence(self, transition_id: str, lender_id: str, notes: str | None = None) -> dict[str, Any] | None:
        pair = self._get_transition_for_lender(transition_id, lender_id)
        if not pair:
            return None
        t, req = pair
        if t["status"] not in ("PENDING_REVIEW", "DETECTED"):
            raise ValueError("Transition already reviewed")
        t["review_notes"] = notes or "Additional evidence requested before transition"
        self._audit("EVIDENCE_REQUESTED", lender_id, "LENDER", {"transition_id": transition_id, "notes": notes})
        self._notify(req["manufacturer_id"], "Additional evidence required", f"Lender needs more evidence before instrument transition on {req['request_code']}.", "FINANCING")
        return {"transition": copy.deepcopy(t)}

    def reassess_instrument(self, request_id: str, actor_id: str, actor_role: str) -> dict[str, Any] | None:
        req = self._can_access_request(request_id, actor_id, actor_role)
        if not req:
            return None
        return self._reassess_instrument_internal(req, actor_id=actor_id, actor_role=actor_role)

    def manufacturer_lifecycle_view(self, request_id: str, manufacturer_id: str) -> dict[str, Any] | None:
        req = self._requests.get(request_id)
        if not req or req["manufacturer_id"] != manufacturer_id:
            return None
        suitability = self.instrument_suitability(request_id, manufacturer_id, "MANUFACTURER")
        pending = next(
            (t for t in self._transitions if t["financing_request_id"] == request_id and t["status"] == "PENDING_REVIEW"),
            None,
        )
        stage = suitability["current_lifecycle_stage"] if suitability else req.get("instrument_lifecycle_stage")
        mapping = STAGE_INSTRUMENT_MAP.get(stage, {})
        return {
            "request_id": request_id,
            "request_code": req["request_code"],
            "project_name": req["project_name"],
            "current_stage": stage,
            "current_stage_display": LIFECYCLE_STAGE_META.get(stage, {}).get("display_name", stage),
            "current_instrument": req.get("current_financing_instrument"),
            "recommended_instrument": suitability["recommended_instrument"] if suitability else None,
            "suitability_score": suitability["recommended_suitability_score"] if suitability else None,
            "transition_status": pending["status"] if pending else suitability.get("transition_status") if suitability else "NO_CHANGE",
            "transition_reason": suitability.get("transition_reason") if suitability else None,
            "pending_transition_id": pending["id"] if pending else None,
            "lifecycle_flow": [
                {"phase": "RAW MATERIALS", "stages": ["RAW_MATERIALS_REQUIRED", "RAW_MATERIALS_ACQUIRED"], "instrument": "PURCHASE_FINANCE"},
                {"phase": "PRODUCTION", "stages": ["PRODUCTION_STARTED", "IN_PRODUCTION"], "instrument": "PRODUCTION_FINANCE"},
                {"phase": "FINISHED GOODS", "stages": ["PRODUCTION_COMPLETED", "INVENTORY_AVAILABLE"], "instrument": "INVENTORY_FINANCE"},
                {"phase": "DELIVERY", "stages": ["GOODS_DELIVERED", "INVOICED"], "instrument": "RECEIVABLES_FINANCE"},
                {"phase": "RECEIVABLES", "stages": ["RECEIVABLE_CREATED", "PAYMENT_PENDING"], "instrument": "RECEIVABLES_FINANCE"},
            ],
            "suitability": suitability,
            "transitions": [t for t in self._transitions if t["financing_request_id"] == request_id],
        }

    def _create_intelligence_event(
        self,
        req: dict[str, Any],
        event_type: str,
        *,
        source_type: str,
        actor_id: str,
        metadata: dict[str, Any] | None = None,
        previous_value: str | None = None,
        new_value: str | None = None,
        asset_id: str | None = None,
        evidence_id: str | None = None,
    ) -> dict[str, Any]:
        meta = metadata or {}
        severity = classify_severity(event_type, meta)
        event = {
            "id": str(uuid.uuid4()),
            "financing_request_id": req["id"],
            "manufacturer_id": req["manufacturer_id"],
            "asset_id": asset_id or (req.get("collateral", [{}])[0].get("id") if req.get("collateral") else None),
            "event_type": event_type.upper(),
            "event_timestamp": _now().isoformat(),
            "source_type": source_type,
            "source_id": actor_id,
            "previous_value": previous_value,
            "new_value": new_value,
            "metadata": meta,
            "evidence_id": evidence_id,
            "severity": severity.value,
            "created_at": _now().isoformat(),
            "created_by": actor_id,
        }
        self._intelligence_events.append(event)
        self._audit("EVENT_CREATED", actor_id, source_type, {"event": event})
        return event

    def _run_reassessment_for_event(
        self,
        req: dict[str, Any],
        event: dict[str, Any],
        actor_id: str,
        actor_role: str,
        *,
        persist: bool = True,
    ) -> dict[str, Any]:
        result = self._reassessment_agent.run(
            req,
            trigger_event_id=event["id"],
            trigger_type=event["event_type"],
            exposure_calculate=self._exposure.calculate,
            offers=self._offers,
            instrument_reassess=lambda r, **kw: self._reassess_instrument_internal(r, actor_id=actor_id, actor_role=actor_role, **kw),
            metadata=event.get("metadata"),
        )
        if result.get("skipped"):
            return result
        record = result["record"]
        self._reassessment_records.insert(0, record)
        self._audit("REASSESSMENT_COMPLETED", actor_id, actor_role, {"record_id": record["id"], "impact": record["impact_level"]})
        self._notify_reassessment(record, req)
        alert_result = evaluate_project_risk_alert(req, event, record)
        self._risk_alerts.insert(0, alert_result)
        self._audit(
            "RISK_ALERT_EVALUATED",
            actor_id,
            actor_role,
            {"alert_id": alert_result["id"], "triggered": alert_result["alert_triggered"], "status": alert_result["notification_status"]},
        )
        result["risk_alert"] = alert_result
        if persist:
            self._persist_state()
        return result

    def _notify_reassessment(self, record: dict[str, Any], req: dict[str, Any]) -> None:
        impact = record["impact_level"]
        dedup = f"{record['financing_request_id']}:{record['trigger_type']}:{impact}:{record['new_confidence']}"
        if impact in ("HIGH_IMPACT", "CRITICAL_IMPACT", "MODERATE_IMPACT"):
            self._notify_deduped(
                DEMO_MANUFACTURER_ID,
                "Financing profile reassessed",
                record["reason_summary"],
                "FINANCING",
                f"mfg:{dedup}",
            )
            for tranche in req.get("tranches", []):
                lid = tranche.get("lender_id")
                if lid:
                    title = "High-impact reassessment detected" if impact == "HIGH_IMPACT" else "Critical reassessment alert"
                    if impact == "MODERATE_IMPACT":
                        title = "Financing reassessment completed"
                    self._notify_deduped(lid, title, record["reason_summary"], "FINANCING", f"lender:{lid}:{dedup}")

    def ingest_intelligence_event(
        self,
        event_type: str,
        actor_id: str,
        actor_role: str,
        *,
        financing_request_id: str | None = None,
        source_type: str = "MANUFACTURER",
        metadata: dict[str, Any] | None = None,
        previous_value: str | None = None,
        new_value: str | None = None,
        asset_id: str | None = None,
        evidence_id: str | None = None,
    ) -> dict[str, Any] | None:
        rid = financing_request_id or DEMO_REQUEST_ID
        req = self._requests.get(rid)
        if not req:
            return None
        if actor_role == "MANUFACTURER" and req["manufacturer_id"] != actor_id:
            return None
        event = self._create_intelligence_event(
            req, event_type, source_type=source_type, actor_id=actor_id, metadata=metadata,
            previous_value=previous_value, new_value=new_value, asset_id=asset_id, evidence_id=evidence_id,
        )
        reassessment = self._run_reassessment_for_event(req, event, actor_id, actor_role)
        req["updated_at"] = _now().isoformat()
        risk_alert = reassessment.get("risk_alert") if isinstance(reassessment, dict) else None
        return {
            "event": copy.deepcopy(event),
            "reassessment": reassessment,
            "request": copy.deepcopy(req),
            "risk_alert": copy.deepcopy(risk_alert) if risk_alert else None,
            "previous_confidence_score": risk_alert["previous_confidence_score"] if risk_alert else req.get("confidence_score"),
            "new_confidence_score": risk_alert["new_confidence_score"] if risk_alert else req.get("confidence_score"),
            "alert_triggered": bool(risk_alert and risk_alert.get("alert_triggered")),
            "notification_status": risk_alert.get("notification_status") if risk_alert else "SKIPPED",
        }

    def simulate_demo_event(
        self, request_id: str, event_type: str, actor_id: str, actor_role: str, metadata: dict[str, Any]
    ) -> dict[str, Any] | None:
        return self.ingest_intelligence_event(
            event_type, actor_id, actor_role, financing_request_id=request_id,
            source_type="SYSTEM", metadata=metadata,
        )

    def manual_reassess(self, request_id: str, actor_id: str, actor_role: str) -> dict[str, Any] | None:
        return self.ingest_intelligence_event(
            "MANUAL_REASSESSMENT_REQUESTED", actor_id, actor_role,
            financing_request_id=request_id, source_type=actor_role, metadata={"manual": True},
        )

    def list_risk_alerts(self, actor_id: str, actor_role: str, project_id: str | None = None) -> list[dict[str, Any]]:
        items = self._risk_alerts
        if project_id:
            items = [a for a in items if a.get("project_id") == project_id or a.get("financing_request_id") == project_id]
        if actor_role == "MANUFACTURER":
            return copy.deepcopy([a for a in items if self._requests.get(a.get("project_id", ""), {}).get("manufacturer_id") == actor_id])
        if actor_role == "LENDER":
            return copy.deepcopy([a for a in items if a.get("lender_id") == actor_id])
        return copy.deepcopy(items)

    def list_intelligence_events(
        self, actor_id: str, actor_role: str, financing_request_id: str | None = None, limit: int = 50
    ) -> list[dict[str, Any]] | None:
        if financing_request_id:
            req = self._can_access_request(financing_request_id, actor_id, actor_role)
            if not req:
                return None
        events = self._intelligence_events
        if financing_request_id:
            events = [e for e in events if e["financing_request_id"] == financing_request_id]
        return copy.deepcopy(events[:limit])

    def lender_reassessments(self, lender_id: str, priority: str | None = None) -> list[dict[str, Any]]:
        items = []
        for record in self._reassessment_records:
            req = self._requests.get(record["financing_request_id"])
            if not req:
                continue
            if not any(tr.get("lender_id") == lender_id for tr in req.get("tranches", [])):
                continue
            if priority == "CRITICAL" and record["impact_level"] != "CRITICAL_IMPACT":
                continue
            if priority == "HIGH" and record["impact_level"] not in ("HIGH_IMPACT", "CRITICAL_IMPACT"):
                continue
            items.append({**copy.deepcopy(record), "project_name": req["project_name"], "product_name": req["product_name"]})
        return items

    def manufacturer_reassessments(self, manufacturer_id: str, request_id: str | None = None) -> list[dict[str, Any]]:
        records = [r for r in self._reassessment_records if r["manufacturer_id"] == manufacturer_id]
        if request_id:
            records = [r for r in records if r["financing_request_id"] == request_id]
        return copy.deepcopy(records)

    def get_reassessment(self, record_id: str, actor_id: str, actor_role: str) -> dict[str, Any] | None:
        record = next((r for r in self._reassessment_records if r["id"] == record_id), None)
        if not record:
            return None
        req = self._requests.get(record["financing_request_id"])
        if not req:
            return None
        if actor_role == "MANUFACTURER" and req["manufacturer_id"] != actor_id:
            return None
        if actor_role == "LENDER" and not any(tr.get("lender_id") == actor_id for tr in req.get("tranches", [])):
            return None
        event = next((e for e in self._intelligence_events if e["id"] == record["trigger_event_id"]), None)
        return {
            **copy.deepcopy(record),
            "request": {
                "request_code": req["request_code"],
                "project_name": req["project_name"],
                "manufacturer_name": req["manufacturer_name"],
                "progress_pct": req["progress_pct"],
            },
            "trigger_event": copy.deepcopy(event) if event else None,
            "ai_explanation_context": {
                "previous_state": {
                    "confidence": record["previous_confidence"],
                    "risk": record["previous_risk"],
                    "safe_capacity": record["previous_safe_capacity"],
                    "remaining_capacity": record["previous_remaining_capacity"],
                    "instrument": record["previous_instrument"],
                },
                "new_state": {
                    "confidence": record["new_confidence"],
                    "risk": record["new_risk"],
                    "safe_capacity": record["new_safe_capacity"],
                    "remaining_capacity": record["new_remaining_capacity"],
                    "instrument": record["new_recommended_instrument"],
                },
                "trigger_event": record["trigger_type"],
                "recommended_action": record["recommended_action"],
                "impact_level": record["impact_level"],
            },
        }

    def lender_reassessment_action(self, record_id: str, lender_id: str, action: str, notes: str | None = None) -> dict[str, Any] | None:
        record = next((r for r in self._reassessment_records if r["id"] == record_id), None)
        if not record:
            return None
        req = self._requests.get(record["financing_request_id"])
        if not req or not any(tr.get("lender_id") == lender_id for tr in req.get("tranches", [])):
            return None
        record["lender_action"] = action
        record["lender_action_at"] = _now().isoformat()
        record["lender_action_notes"] = notes
        if action in ("ACKNOWLEDGE", "CONTINUE_MONITORING"):
            record["status"] = "RESOLVED"
        self._audit("LENDER_REASSESSMENT_ACTION", lender_id, "LENDER", {"record_id": record_id, "action": action, "notes": notes})
        if action == "REQUEST_MORE_EVIDENCE":
            self._notify(req["manufacturer_id"], "Additional evidence required", notes or "Lender requested more evidence after reassessment.", "FINANCING")
        self._persist_state()
        return copy.deepcopy(record)

    def financing_health(self, request_id: str, manufacturer_id: str) -> dict[str, Any] | None:
        req = self._requests.get(request_id)
        if not req or req["manufacturer_id"] != manufacturer_id:
            return None
        snap = self._exposure.calculate(req, self._offers)
        last = self._reassessment_records[0] if self._reassessment_records else None
        recent = [r for r in self._reassessment_records if r["financing_request_id"] == request_id][:3]
        return {
            "request_id": request_id,
            "request_code": req["request_code"],
            "confidence_score": req["confidence_score"],
            "risk_level": req["risk_level"],
            "progress_pct": req["progress_pct"],
            "maximum_safe_capacity": snap["maximum_safe_capacity"],
            "active_exposure": snap["active_exposure"],
            "remaining_capacity": snap["remaining_available_capacity"],
            "utilization_percentage": snap["utilization_percentage"],
            "last_reassessment": copy.deepcopy(last) if last and last["financing_request_id"] == request_id else None,
            "recent_reassessments": copy.deepcopy(recent),
            "next_recommended_action": last.get("recommended_action", "CONTINUE_MONITORING") if last else "NO_ACTION",
            "last_change_summary": last.get("reason_summary") if last and last["financing_request_id"] == request_id else None,
            "impact_level": last.get("impact_level") if last and last["financing_request_id"] == request_id else "NO_MATERIAL_IMPACT",
        }

    def create_request(self, manufacturer_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        req_id = str(uuid.uuid4())
        rec = compute_recommendation(
            requested_amount=float(payload.get("required_funding_amount", 0)),
            verified_value=float(payload.get("estimated_production_cost", 0)) * 0.5,
            confidence_score=64,
            risk_level="MEDIUM",
            outstanding_exposure=0,
            lender_max_exposure=5_000_000,
            lender_min_confidence=75,
        )
        req = {
            "id": req_id,
            "request_code": f"PR-{req_id[:8].upper()}",
            "manufacturer_id": manufacturer_id,
            "manufacturer_name": "VoltRide Mobility Pvt. Ltd.",
            "status": "DRAFT",
            "confidence_score": 64,
            "risk_level": "MEDIUM",
            "verified_value": float(payload.get("estimated_production_cost", 0)) * 0.5,
            "financeable_value": rec.financeable_value,
            "outstanding_exposure": 0,
            "unclaimed_value": rec.financeable_value,
            "open_conflicts": 0,
            "document_completeness_pct": 0,
            "financing_recommendation": rec.__dict__,
            "progress_pct": 0,
            "current_stage": "PURCHASE_ORDER",
            "current_financing_instrument": "WORKING_CAPITAL",
            "instrument_lifecycle_stage": "PLANNING",
            "stages": _build_stages("PURCHASE_ORDER", 0),
            "collateral": [],
            "documents": [],
            "events": [],
            "conflicts": [],
            "decisions": [],
            "tranches": [],
            "capital_forecast": None,
            "created_at": _now().isoformat(),
            "updated_at": _now().isoformat(),
            **payload,
        }
        self._requests[req_id] = req
        return copy.deepcopy(req)

    def submit_request(self, request_id: str, manufacturer_id: str) -> dict[str, Any] | None:
        req = self._requests.get(request_id)
        if not req or req["manufacturer_id"] != manufacturer_id:
            return None
        req["status"] = "UNDER_REVIEW"
        req["updated_at"] = _now().isoformat()
        return copy.deepcopy(req)

    def add_event(self, request_id: str, manufacturer_id: str, event: dict[str, Any]) -> dict[str, Any] | None:
        req = self._requests.get(request_id)
        if not req or req["manufacturer_id"] != manufacturer_id:
            return None
        event_type = event.get("event_type", "CUSTOM")
        meta = {
            "description": event.get("description", ""),
            "delay_days": event.get("delay_days"),
            "progress_delta": event.get("progress_delta"),
            "change_pct": event.get("change_pct"),
        }
        intel = self.ingest_intelligence_event(
            event_type,
            manufacturer_id,
            "MANUFACTURER",
            financing_request_id=request_id,
            source_type="MANUFACTURER",
            metadata={k: v for k, v in meta.items() if v is not None},
            previous_value=str(event.get("expected_value", "")) or None,
            new_value=str(event.get("actual_value", "")) or None,
        )
        if not intel:
            return None
        entry = {
            "event_code": event.get("event_code", f"EVT-{len(req['events']) + 1}"),
            "event_type": event_type,
            "description": event.get("description", ""),
            "severity": event.get("severity", intel["event"].get("severity", "info").lower()),
            "timestamp": _now().isoformat(),
            "reassessment": intel.get("reassessment", {}).get("record") if intel.get("reassessment") and not intel["reassessment"].get("skipped") else None,
        }
        req["events"].append(entry)
        before_fin = intel["reassessment"].get("record", {}).get("previous_financeable_value") if intel.get("reassessment") and intel["reassessment"].get("record") else req["financeable_value"]
        reassess = reassess_after_event(
            confidence_before=intel["reassessment"]["record"]["previous_confidence"] if intel.get("reassessment") and intel["reassessment"].get("record") else req["confidence_score"],
            confidence_after=req["confidence_score"],
            financeable_before=before_fin,
            financeable_after=req["financeable_value"],
            outstanding_exposure=req["outstanding_exposure"],
            event_type=event_type,
        )
        instrument_result = None
        if intel.get("reassessment") and intel["reassessment"].get("record"):
            rec = intel["reassessment"]["record"]
            if rec.get("instrument_result"):
                instrument_result = rec["instrument_result"]
        return {
            "event": entry,
            "request": copy.deepcopy(req),
            "reassessment": reassess,
            "agent_reassessment": intel.get("reassessment"),
            "instrument_reassessment": instrument_result,
        }

    def lender_decide(self, request_id: str, lender_id: str, decision: dict[str, Any]) -> dict[str, Any] | None:
        req = self._requests.get(request_id)
        if not req:
            return None
        approved = float(decision.get("approved_amount", 0))
        requested = float(req["required_funding_amount"])
        decision_type = decision["decision_type"]

        if decision_type not in ("REJECT", "REQUEST_MORE_INFORMATION") and approved > requested:
            raise ValueError("Approved amount exceeds requested funding")

        entry = {
            "id": str(uuid.uuid4()),
            "lender_id": lender_id,
            "lender_name": "Apex Capital Partners",
            "decision_type": decision_type,
            "requested_amount": requested,
            "approved_amount": approved,
            "instrument": decision.get("instrument", "PRODUCTION_FINANCING"),
            "reason": decision.get("reason", ""),
            "conditions": decision.get("conditions", []),
            "decided_at": _now().isoformat(),
        }
        req["decisions"].append(entry)

        if decision_type in ("REJECT", "REQUEST_MORE_INFORMATION"):
            if decision_type == "REJECT":
                req["outstanding_exposure"] = 0
                req["unclaimed_value"] = max(0, req.get("financeable_value", 0))
        elif approved > 0:
            req["outstanding_exposure"] = approved
            req["unclaimed_value"] = max(0, req.get("financeable_value", 0) - approved)
            req["tranches"].append(
                {
                    "id": str(uuid.uuid4()),
                    "tranche_code": f"TR-{req['request_code']}-{len(req['tranches']) + 1}",
                    "approved_amount": approved,
                    "outstanding_amount": approved,
                    "instrument": entry["instrument"],
                    "status": "ACTIVE",
                }
            )

        status_map = {
            "APPROVE": "APPROVED",
            "PARTIALLY_APPROVE": "PARTIALLY_APPROVED",
            "CONDITIONALLY_APPROVE": "CONDITIONALLY_APPROVED",
            "REJECT": "REJECTED",
            "REQUEST_MORE_INFORMATION": "MORE_INFORMATION_REQUIRED",
        }
        req["decision_status"] = status_map.get(decision_type, "PENDING_REVIEW")
        req["status"] = status_map.get(decision_type, req["status"])
        if approved > 0 and decision_type != "REJECT":
            req["status"] = "ACTIVE_FINANCING"
        req["updated_at"] = _now().isoformat()
        return {"decision": entry, "request": copy.deepcopy(req)}

    def submit_lender_offer(self, request_id: str, lender_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        return marketplace_submit_offer(
            self._requests,
            self._offers,
            request_id,
            lender_id,
            payload,
            self._exposure,
            self._notify,
            self._audit,
        )

    def update_lender_offer(
        self, request_id: str, offer_id: str, lender_id: str, payload: dict[str, Any]
    ) -> dict[str, Any]:
        existing = next(
            (o for o in self._offers if o["id"] == offer_id and o["lender_id"] == lender_id),
            None,
        )
        if not existing:
            raise ValueError("Offer not found")
        if existing["status"] != "PENDING":
            raise ValueError("Only pending offers can be updated")
        return marketplace_submit_offer(
            self._requests,
            self._offers,
            request_id,
            lender_id,
            payload,
            self._exposure,
            self._notify,
            self._audit,
        )

    def list_lender_offers(self, lender_id: str) -> list[dict[str, Any]]:
        offers = list_lender_offers(self._offers, lender_id)
        enriched = []
        for offer in offers:
            req = self._requests.get(offer["request_id"])
            enriched.append({**offer, "request_code": req["request_code"] if req else None, "project_name": req["project_name"] if req else None})
        return enriched

    def list_manufacturer_offers(self, request_id: str, manufacturer_id: str) -> dict[str, Any]:
        return list_manufacturer_offers(self._requests, self._offers, request_id, manufacturer_id)

    def accept_manufacturer_offer(self, request_id: str, offer_id: str, manufacturer_id: str) -> dict[str, Any]:
        return marketplace_accept_offer(
            self._requests,
            self._offers,
            request_id,
            offer_id,
            manufacturer_id,
            self._exposure,
            self._notify,
            self._audit,
        )

    def notifications(self, user_id: str) -> list[dict[str, Any]]:
        return copy.deepcopy(self._notifications.get(user_id, []))

    def check_duplicate_collateral(self, collateral_code: str, exclude_request_id: str | None = None) -> bool:
        for req in self._requests.values():
            if exclude_request_id and req["id"] == exclude_request_id:
                continue
            for col in req.get("collateral", []):
                if col.get("collateral_code") == collateral_code and col.get("already_pledged"):
                    return True
        return False

    def _refresh_document_completeness(self, req: dict[str, Any]) -> None:
        docs = req.get("documents", [])
        if not docs:
            req["document_completeness_pct"] = 0
            return
        verified = sum(1 for d in docs if d.get("verification_status") == "VERIFIED")
        req["document_completeness_pct"] = round((verified / max(len(docs), 1)) * 100)

    def add_document(self, request_id: str, manufacturer_id: str, payload: dict[str, Any]) -> dict[str, Any] | None:
        req = self._requests.get(request_id)
        if not req or req["manufacturer_id"] != manufacturer_id:
            return None
        doc = {
            "id": str(uuid.uuid4()),
            "document_name": payload.get("document_name", "document"),
            "document_type": payload.get("document_type", "OTHER"),
            "verification_status": "PENDING",
            "status": "UPLOADED",
            "storage_path": payload.get("storage_path"),
            "mime_type": payload.get("mime_type"),
            "file_size_bytes": payload.get("file_size_bytes", 0),
            "uploaded_at": _now().isoformat(),
        }
        req.setdefault("documents", []).append(doc)
        self._refresh_document_completeness(req)
        req["updated_at"] = _now().isoformat()
        return copy.deepcopy(doc)

    def remove_document(self, request_id: str, manufacturer_id: str, document_id: str) -> bool:
        req = self._requests.get(request_id)
        if not req or req["manufacturer_id"] != manufacturer_id:
            return False
        before = len(req.get("documents", []))
        req["documents"] = [d for d in req.get("documents", []) if d.get("id") != document_id]
        if len(req["documents"]) == before:
            return False
        self._refresh_document_completeness(req)
        req["updated_at"] = _now().isoformat()
        return True

    def get_document(self, request_id: str, actor_id: str, actor_role: str, document_id: str) -> dict[str, Any] | None:
        req = self.get_request(request_id, actor_id, actor_role)
        if not req:
            return None
        for doc in req.get("documents", []):
            if doc.get("id") == document_id:
                return doc
        return None

    def generate_report(self, request_id: str, actor_id: str, actor_role: str) -> dict[str, Any] | None:
        req = self.get_request(request_id, actor_id, actor_role)
        if not req:
            return None
        return {
            "request_code": req["request_code"],
            "project_name": req["project_name"],
            "product_name": req["product_name"],
            "quantity": req["quantity"],
            "current_stage": req["current_stage"],
            "progress_pct": req["progress_pct"],
            "confidence_score": req["confidence_score"],
            "required_funding_amount": req["required_funding_amount"],
            "financeable_value": req["financeable_value"],
            "outstanding_exposure": req["outstanding_exposure"],
            "documents_count": len(req.get("documents", [])),
            "open_conflicts": req.get("open_conflicts", 0),
            "generated_at": _now().isoformat(),
        }

    def _can_access_request(self, request_id: str, actor_id: str, actor_role: str) -> dict[str, Any] | None:
        req = self._requests.get(request_id)
        if not req:
            return None
        # Demo project is shared for all authenticated users (simulation / hackathon flow).
        if request_id == DEMO_REQUEST_ID:
            return req
        if actor_role == "MANUFACTURER" and req["manufacturer_id"] != actor_id:
            return None
        return req

    def get_simulation(self, request_id: str, actor_id: str, actor_role: str) -> dict[str, Any] | None:
        if not self._can_access_request(request_id, actor_id, actor_role):
            return None
        sim = self._simulations.get(request_id)
        if sim:
            return copy.deepcopy(sim)
        req = self._requests[request_id]
        from app.services.simulation_engine import create_initial_state

        return create_initial_state(req)

    def start_simulation(self, request_id: str, actor_id: str, actor_role: str) -> dict[str, Any] | None:
        req = self._can_access_request(request_id, actor_id, actor_role)
        if not req:
            return None
        from app.services.simulation_engine import create_initial_state, start_simulation

        state = create_initial_state(req)
        state = start_simulation(state)
        self._simulations[request_id] = state
        reassessment = self._maybe_reassessment_from_simulation(req, state, actor_id, actor_role)
        self._persist_simulation_state(request_id)
        out = copy.deepcopy(state)
        return out, copy.deepcopy(reassessment) if reassessment else None

    def next_simulation_event(self, request_id: str, actor_id: str, actor_role: str) -> tuple[dict[str, Any], dict[str, Any] | None] | None:
        req = self._can_access_request(request_id, actor_id, actor_role)
        if not req:
            return None
        sim = self._simulations.get(request_id)
        if not sim or sim["status"] == "READY":
            raise ValueError("Start simulation before advancing events")
        if sim.get("processing"):
            return copy.deepcopy(sim), None
        from app.services.simulation_engine import advance_simulation

        sim = advance_simulation(sim)
        self._simulations[request_id] = sim
        reassessment = self._maybe_reassessment_from_simulation(req, sim, actor_id, actor_role)
        self._persist_simulation_state(request_id)
        return copy.deepcopy(sim), copy.deepcopy(reassessment) if reassessment else None

    def pause_simulation(self, request_id: str, actor_id: str, actor_role: str) -> dict[str, Any] | None:
        if not self._can_access_request(request_id, actor_id, actor_role):
            return None
        sim = self._simulations.get(request_id)
        if not sim:
            return None
        sim["status"] = "PAUSED"
        sim["mode"] = "MANUAL"
        sim["updated_at"] = _now().isoformat()
        return copy.deepcopy(sim)

    def resume_simulation(self, request_id: str, actor_id: str, actor_role: str) -> dict[str, Any] | None:
        if not self._can_access_request(request_id, actor_id, actor_role):
            return None
        sim = self._simulations.get(request_id)
        if not sim:
            return None
        if sim["status"] == "PAUSED":
            sim["status"] = "RUNNING"
        sim["updated_at"] = _now().isoformat()
        return copy.deepcopy(sim)

    def set_simulation_auto(self, request_id: str, actor_id: str, actor_role: str, enabled: bool) -> dict[str, Any] | None:
        if not self._can_access_request(request_id, actor_id, actor_role):
            return None
        sim = self._simulations.get(request_id)
        if not sim:
            return None
        sim["mode"] = "AUTO" if enabled else "MANUAL"
        if enabled and sim["status"] == "PAUSED":
            sim["status"] = "RUNNING"
        sim["updated_at"] = _now().isoformat()
        return copy.deepcopy(sim)

    def reset_simulation(self, request_id: str, actor_id: str, actor_role: str) -> dict[str, Any] | None:
        req = self._can_access_request(request_id, actor_id, actor_role)
        if not req:
            return None
        from app.services.simulation_engine import create_initial_state

        state = create_initial_state(req)
        self._simulations[request_id] = state
        self._simulation_reassessment_keys = {k for k in self._simulation_reassessment_keys if not k.startswith("sim:")}
        self._persist_simulation_state(request_id)
        return copy.deepcopy(state)

    def get_simulation_overlay(self, request_id: str) -> dict[str, Any] | None:
        """Read-only overlay for Decision Workspace when simulation is active."""
        sim = self._simulations.get(request_id)
        if not sim or sim["status"] in ("READY",):
            return None
        return {
            "active": True,
            "simulation_id": sim["simulation_id"],
            "status": sim["status"],
            "current_stage": sim["current_stage"],
            "confidence_score": sim["confidence_score"],
            "risk_level": sim["risk_level"],
            "production_progress": sim["production_progress"],
            "financing_exposure": sim["financing_exposure"],
            "latest_event": sim.get("latest_event"),
            "ai_insight": sim.get("ai_insight"),
        }


demo_store = DemoPlatformStore(persist=True)
