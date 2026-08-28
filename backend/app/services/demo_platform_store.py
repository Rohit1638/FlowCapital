from __future__ import annotations

import copy
import uuid
from datetime import date, datetime, timezone
from typing import Any

from app.core.auth import DEMO_LENDER_ID, DEMO_MANUFACTURER_ID
from app.services.financing_engine import compute_recommendation, reassess_after_event

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
        risk_level="MEDIUM",
        outstanding_exposure=2_000_000,
        lender_max_exposure=4_000_000,
        lender_min_confidence=75,
        open_conflicts=1,
        document_completeness_pct=75,
    )
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
        "progress_pct": 58,
        "status": "ACTIVE_FINANCING",
        "decision_status": "CONDITIONALLY_APPROVED",
        "confidence_score": 68,
        "risk_level": "MEDIUM",
        "verified_value": 4_200_000,
        "financeable_value": rec.financeable_value,
        "outstanding_exposure": 2_000_000,
        "unclaimed_value": rec.unclaimed_value,
        "open_conflicts": 1,
        "document_completeness_pct": 75,
        "financing_recommendation": rec.__dict__,
        "stages": _build_stages("IN_PRODUCTION", 58),
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
        "conflicts": [
            {
                "conflict_code": "CFL-EB-QTY-001",
                "conflict_type": "QUANTITY_MISMATCH",
                "severity": "HIGH",
                "status": "OPEN",
                "description": "80-unit discrepancy between production plan (1,000) and warehouse count (920).",
                "expected_value": "1000",
                "actual_value": "920",
            }
        ],
        "decisions": [
            {
                "id": "dec-1",
                "lender_id": DEMO_LENDER_ID,
                "lender_name": "Apex Capital Partners",
                "decision_type": "CONDITIONALLY_APPROVE",
                "requested_amount": 5_000_000,
                "approved_amount": 2_000_000,
                "instrument": "PRODUCTION_FINANCING",
                "reason": "Confidence below full threshold; partial conditional approval recommended.",
                "conditions": ["Independent warehouse verification required", "Resolve quantity mismatch before top-up"],
                "decided_at": "2026-08-20T10:00:00Z",
            }
        ],
        "tranches": [
            {
                "id": "tr-1",
                "tranche_code": "TR-EB-001",
                "approved_amount": 2_000_000,
                "outstanding_amount": 2_000_000,
                "instrument": "PRODUCTION_FINANCING",
                "status": "ACTIVE",
            }
        ],
        "capital_forecast": {
            "estimated_amount": 1_400_000,
            "estimated_days": 6,
            "label": "FORECAST / SIMULATION",
            "summary": "Estimated funding gap: ₹14L in approximately 6 days based on production plan burn rate.",
        },
        "created_at": "2026-08-01T08:00:00Z",
        "updated_at": _now().isoformat(),
    }


class DemoPlatformStore:
    def __init__(self) -> None:
        self._requests: dict[str, dict[str, Any]] = {DEMO_REQUEST_ID: _base_request()}
        self._notifications: dict[str, list[dict[str, Any]]] = {
            DEMO_MANUFACTURER_ID: [
                {"id": "n1", "title": "Conditional financing approved", "body": "Apex Capital approved ₹20L with conditions.", "category": "FINANCING", "read": False, "created_at": "2026-08-20T10:00:00Z"},
                {"id": "n2", "title": "Quantity mismatch detected", "body": "Warehouse count differs from production plan.", "category": "RISK", "read": False, "created_at": "2026-08-28T05:05:00Z"},
            ],
            DEMO_LENDER_ID: [
                {"id": "n3", "title": "Step-down review recommended", "body": "PR-EB-1000 confidence decreased after quantity mismatch.", "category": "RISK", "read": False, "created_at": "2026-08-28T05:10:00Z"},
            ],
        }

    def manufacturer_dashboard(self, user_id: str) -> dict[str, Any]:
        reqs = [r for r in self._requests.values() if r["manufacturer_id"] == user_id]
        active = [r for r in reqs if r["status"] not in ("COMPLETED", "CANCELLED", "DRAFT")]
        return {
            "active_production_requests": len(active),
            "total_funding_requested": sum(r["required_funding_amount"] for r in reqs),
            "approved_financing": sum(t["approved_amount"] for r in reqs for t in r.get("tranches", [])),
            "available_financing_capacity": sum(r.get("unclaimed_value", 0) for r in active),
            "capital_blocked": sum(r.get("outstanding_exposure", 0) for r in active if r.get("open_conflicts", 0) > 0),
            "average_confidence_score": round(sum(r["confidence_score"] for r in active) / max(len(active), 1)),
            "open_risks": sum(r.get("open_conflicts", 0) for r in active),
            "open_conflicts": sum(r.get("open_conflicts", 0) for r in active),
            "production_progress_pct": round(sum(r["progress_pct"] for r in active) / max(len(active), 1), 1),
            "upcoming_funding_needs": [r["capital_forecast"] for r in active if r.get("capital_forecast")],
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
        items = []
        for req in self._requests.values():
            if req["status"] in ("DRAFT", "CANCELLED"):
                continue
            rec = req.get("financing_recommendation", {})
            items.append(
                {
                    "id": req["id"],
                    "request_code": req["request_code"],
                    "manufacturer_name": req["manufacturer_name"],
                    "project_name": req["project_name"],
                    "product_name": req["product_name"],
                    "quantity": req["quantity"],
                    "current_stage": req["current_stage"],
                    "requested_funding": req["required_funding_amount"],
                    "verified_value": req["verified_value"],
                    "confidence_score": req["confidence_score"],
                    "risk_level": req["risk_level"],
                    "financeable_value": req["financeable_value"],
                    "outstanding_exposure": req["outstanding_exposure"],
                    "unclaimed_value": req["unclaimed_value"],
                    "funding_readiness": "CONDITIONAL" if req["confidence_score"] < 75 else "READY",
                    "open_conflicts": req.get("open_conflicts", 0),
                    "document_completeness_pct": req.get("document_completeness_pct", 0),
                    "recommended_min": rec.get("recommended_min", 0),
                    "recommended_max": rec.get("recommended_max", 0),
                    "eligibility_status": rec.get("eligibility_status", "REVIEW"),
                    "status": req["status"],
                }
            )
        return items

    def get_opportunity(self, request_id: str, lender_id: str) -> dict[str, Any] | None:
        req = self._requests.get(request_id)
        if not req:
            return None
        detail = copy.deepcopy(req)
        detail["ai_context"] = self._ai_context(req)
        return detail

    def _ai_context(self, req: dict[str, Any]) -> dict[str, Any]:
        rec = req.get("financing_recommendation", {})
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
        before_conf = req["confidence_score"]
        before_fin = req["financeable_value"]
        if "MISMATCH" in event_type:
            req["open_conflicts"] = req.get("open_conflicts", 0) + 1
            req["confidence_score"] = max(55, before_conf - 8)
            req["conflicts"].append(
                {
                    "conflict_code": f"CFL-{req['request_code']}-AUTO",
                    "conflict_type": "QUANTITY_MISMATCH",
                    "severity": "HIGH",
                    "status": "OPEN",
                    "description": event.get("description", "Quantity mismatch detected"),
                    "expected_value": str(event.get("expected_value", "")),
                    "actual_value": str(event.get("actual_value", "")),
                }
            )
        elif "DELAY" in event_type:
            req["confidence_score"] = max(60, before_conf - 3)
        elif "FINISHED" in event_type or "VERIFIED" in event_type:
            req["confidence_score"] = min(95, before_conf + 10)
            req["progress_pct"] = min(100, req["progress_pct"] + 15)

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
        reassess = reassess_after_event(
            confidence_before=before_conf,
            confidence_after=req["confidence_score"],
            financeable_before=before_fin,
            financeable_after=req["financeable_value"],
            outstanding_exposure=req["outstanding_exposure"],
            event_type=event_type,
        )
        entry = {
            "event_code": event.get("event_code", f"EVT-{len(req['events']) + 1}"),
            "event_type": event_type,
            "description": event.get("description", ""),
            "severity": event.get("severity", "info"),
            "timestamp": _now().isoformat(),
            "reassessment": reassess,
        }
        req["events"].append(entry)
        req["updated_at"] = _now().isoformat()
        return {"event": entry, "request": copy.deepcopy(req), "reassessment": reassess}

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


demo_store = DemoPlatformStore()
