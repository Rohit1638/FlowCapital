"""Financing offer storage and marketplace operations for the demo platform store."""

from __future__ import annotations

import copy
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Callable

from app.core.auth import (
    DEMO_AGGRESSIVE_LENDER_ID,
    DEMO_CONSERVATIVE_LENDER_ID,
    DEMO_LENDER_ID,
    DEMO_MANUFACTURER_ID,
)
from app.services.exposure_service import ExposureService
from app.services.instrument_engine import InstrumentSuitabilityService
from app.services.marketplace_engine import (
    LENDER_PROFILES,
    OPEN_REQUEST_STATUSES,
    assess_lender_eligibility,
    get_lender_profile,
    rank_offers,
)

DEMO_REQUEST_ID = "00000000-0000-4000-8000-000000000100"

NotifyFn = Callable[[str, str, str, str], None]
AuditFn = Callable[[str, str, str, dict[str, Any]], None]


def _now() -> datetime:
    return datetime.now(timezone.utc)


def seed_demo_offers() -> list[dict[str, Any]]:
    """Three competing pending offers on PR-EB-1000 for manufacturer compare demo."""
    created = "2026-08-28T08:30:00+00:00"
    valid_until = (_now() + timedelta(days=14)).isoformat()
    return [
        {
            "id": "00000000-0000-4000-8000-000000000301",
            "request_id": DEMO_REQUEST_ID,
            "production_request_id": DEMO_REQUEST_ID,
            "lender_id": DEMO_LENDER_ID,
            "lender_name": "Balanced Growth Capital",
            "offered_amount": 2_200_000,
            "interest_rate": 11.5,
            "tenor_days": 120,
            "instrument_type": "PRODUCTION_FINANCE",
            "conditions": [
                "Warehouse audit before first disbursement",
                "PO re-verification at 70% production milestone",
            ],
            "notes": "Recommended balance of cost, coverage, and flexible tenor for Series X batch.",
            "status": "PENDING",
            "valid_until": valid_until,
            "created_at": created,
            "updated_at": created,
        },
        {
            "id": "00000000-0000-4000-8000-000000000302",
            "request_id": DEMO_REQUEST_ID,
            "production_request_id": DEMO_REQUEST_ID,
            "lender_id": DEMO_AGGRESSIVE_LENDER_ID,
            "lender_name": "Aggressive Supply Chain Capital",
            "offered_amount": 2_800_000,
            "interest_rate": 13.25,
            "tenor_days": 150,
            "instrument_type": "PRODUCTION_FINANCE",
            "conditions": [
                "Weekly production milestone reporting",
            ],
            "notes": "Highest funding amount — covers 56% of requested capital with minimal conditions.",
            "status": "PENDING",
            "valid_until": valid_until,
            "created_at": "2026-08-28T09:15:00+00:00",
            "updated_at": "2026-08-28T09:15:00+00:00",
        },
        {
            "id": "00000000-0000-4000-8000-000000000303",
            "request_id": DEMO_REQUEST_ID,
            "production_request_id": DEMO_REQUEST_ID,
            "lender_id": DEMO_CONSERVATIVE_LENDER_ID,
            "lender_name": "Conservative Capital Partners",
            "offered_amount": 1_800_000,
            "interest_rate": 9.75,
            "tenor_days": 90,
            "instrument_type": "INVENTORY_FINANCE",
            "conditions": [
                "Independent collateral inspection required",
                "Buyer confirmation letter from UrbanMove Fleet",
                "Quantity reconciliation before disbursement",
            ],
            "notes": "Lowest interest rate — best for cost-sensitive manufacturers accepting stricter covenants.",
            "status": "PENDING",
            "valid_until": valid_until,
            "created_at": "2026-08-28T10:00:00+00:00",
            "updated_at": "2026-08-28T10:00:00+00:00",
        },
    ]


def competition_counts(offers: list[dict[str, Any]], request_id: str, exclude_lender_id: str | None = None) -> dict[str, int]:
    pending = [
        o
        for o in offers
        if o["request_id"] == request_id and o["status"] == "PENDING" and o["lender_id"] != exclude_lender_id
    ]
    lenders = {o["lender_id"] for o in pending}
    return {
        "competing_offer_count": len(pending),
        "competing_lender_count": len(lenders),
    }


def list_opportunities_for_lender(
    requests: dict[str, dict[str, Any]],
    offers: list[dict[str, Any]],
    lender_id: str,
    exposure: ExposureService,
) -> list[dict[str, Any]]:
    profile = get_lender_profile(lender_id)
    engine = InstrumentSuitabilityService()
    items: list[dict[str, Any]] = []
    for req in requests.values():
        if req["status"] in ("DRAFT", "CANCELLED", "COMPLETED"):
            continue
        rec = req.get("financing_recommendation", {})
        snap = exposure.calculate(req, offers)
        my_offer = next(
            (
                o
                for o in offers
                if o["request_id"] == req["id"] and o["lender_id"] == lender_id and o["status"] in ("PENDING", "DRAFT")
            ),
            None,
        )
        eligibility = assess_lender_eligibility(profile, req, snap, my_offer) if profile else {
            "eligible": False,
            "eligibility_status": "NOT_ELIGIBLE",
            "eligibility_reason": "Lender profile not configured.",
            "can_submit_offer": False,
        }
        counts = competition_counts(offers, req["id"], lender_id)
        max_safe = float(snap["maximum_safe_capacity"])
        instrument_assessment = engine.assess(req, lender_id=lender_id, exposure_snapshot=snap)
        recommended_instrument = instrument_assessment["recommended_instrument"]
        instrument_suitability = instrument_assessment["recommended_suitability_score"]
        lender_instrument_match = instrument_assessment.get("lender_instrument_match", True)
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
                "maximum_safe_financing": max_safe,
                "remaining_available_capacity": snap["remaining_available_capacity"],
                "utilization_percentage": snap["utilization_percentage"],
                "outstanding_exposure": snap["active_exposure"],
                "unclaimed_value": snap["remaining_available_capacity"],
                "funding_readiness": "CONDITIONAL" if req["confidence_score"] < 75 else "READY",
                "open_conflicts": req.get("open_conflicts", 0),
                "document_completeness_pct": req.get("document_completeness_pct", 0),
                "recommended_instrument": recommended_instrument,
                "instrument_suitability_score": instrument_suitability,
                "instrument_lifecycle_stage": instrument_assessment["current_lifecycle_stage"],
                "lender_instrument_match": lender_instrument_match,
                "instrument_policy_note": instrument_assessment.get("lender_policy_note"),
                "recommended_min": rec.get("recommended_min", 0),
                "recommended_max": eligibility.get("recommended_amount_max", snap["remaining_available_capacity"]),
                "eligibility_status": eligibility["eligibility_status"],
                "eligibility_reason": eligibility.get("eligibility_reason"),
                "eligible": eligibility.get("eligible", False),
                "can_submit_offer": eligibility.get("can_submit_offer", eligibility.get("eligible", False)),
                "competing_offer_count": counts["competing_offer_count"],
                "competing_lender_count": counts["competing_lender_count"],
                "competition_label": (
                    f"{counts['competing_lender_count']} other lender{'s' if counts['competing_lender_count'] != 1 else ''} reviewing"
                    if counts["competing_lender_count"]
                    else "Be the first to submit an offer"
                ),
                "has_pending_offer": my_offer is not None,
                "my_offer_id": my_offer["id"] if my_offer else None,
                "status": req["status"],
            }
        )
    return items


def submit_offer(
    requests: dict[str, dict[str, Any]],
    offers: list[dict[str, Any]],
    request_id: str,
    lender_id: str,
    payload: dict[str, Any],
    exposure: ExposureService,
    notify: NotifyFn,
    audit: AuditFn,
) -> dict[str, Any]:
    req = requests.get(request_id)
    profile = get_lender_profile(lender_id)
    if not req or not profile:
        raise ValueError("Request or lender profile not found")
    if req.get("decision_status") not in ("OPEN_FOR_OFFERS", "PARTIALLY_FINANCED") and req["status"] not in OPEN_REQUEST_STATUSES | {"ACTIVE_FINANCING"}:
        raise ValueError("Request is not open for financing offers")

    snap = exposure.calculate(req, offers)
    existing = next(
        (o for o in offers if o["request_id"] == request_id and o["lender_id"] == lender_id and o["status"] == "PENDING"),
        None,
    )
    eligibility = assess_lender_eligibility(profile, req, snap, existing)
    if not eligibility.get("can_submit_offer"):
        raise ValueError(eligibility.get("eligibility_reason", "Lender is not eligible for this opportunity"))

    amount = float(payload["offered_amount"])
    cap_check = exposure.validate_capacity(
        req, amount, offers, exclude_offer_id=existing["id"] if existing else None
    )
    if not cap_check["eligible"]:
        audit("CAPACITY_VALIDATION_FAILED", lender_id, "LENDER", {"request_id": request_id, "check": cap_check})
        exposure.add_history_event(
            action="OFFER_BLOCKED_CAPACITY",
            title="Offer blocked — exceeds capacity",
            detail=cap_check["reason"],
            amount=amount,
            lender_id=lender_id,
            lender_name=profile.lender_name,
        )
        raise ValueError(cap_check["reason"])

    max_allowed = float(cap_check["maximum_allowed_amount"])
    if amount <= 0:
        raise ValueError("Offered amount must be greater than zero")
    if amount > max_allowed + 0.01:
        raise ValueError(f"Offered amount exceeds remaining verified capacity (₹{max_allowed:,.0f})")

    ts = _now().isoformat()
    valid_until = payload.get("valid_until") or (_now() + timedelta(days=int(payload.get("validity_days", 14)))).isoformat()

    if existing:
        before = copy.deepcopy(existing)
        existing.update(
            {
                "offered_amount": amount,
                "interest_rate": float(payload["interest_rate"]),
                "tenor_days": int(payload["tenor_days"]),
                "instrument_type": payload.get("instrument_type", "PRODUCTION_FINANCE"),
                "conditions": payload.get("conditions", []),
                "notes": payload.get("notes"),
                "valid_until": valid_until,
                "updated_at": ts,
            }
        )
        audit("OFFER_UPDATED", lender_id, "LENDER", {"offer_id": existing["id"], "before": before, "after": existing})
        notify(req["manufacturer_id"], "Offer updated", f"{profile.lender_name} updated their financing offer.", "FINANCING")
        return copy.deepcopy(existing)

    offer = {
        "id": str(uuid.uuid4()),
        "request_id": request_id,
        "production_request_id": request_id,
        "lender_id": lender_id,
        "lender_name": profile.lender_name,
        "offered_amount": amount,
        "interest_rate": float(payload["interest_rate"]),
        "tenor_days": int(payload["tenor_days"]),
        "instrument_type": payload.get("instrument_type", "PRODUCTION_FINANCE"),
        "conditions": payload.get("conditions", []),
        "notes": payload.get("notes"),
        "status": "PENDING",
        "valid_until": valid_until,
        "created_at": ts,
        "updated_at": ts,
    }
    offers.append(offer)
    audit("OFFER_CREATED", lender_id, "LENDER", {"offer_id": offer["id"], "request_id": request_id, "offer": offer})
    notify(
        req["manufacturer_id"],
        "New competitive offer received",
        f"{profile.lender_name} submitted a financing offer for {req['request_code']}.",
        "FINANCING",
    )
    for other in LENDER_PROFILES:
        if other != lender_id:
            notify(other, "Competitor entered", f"A new offer was submitted on {req['request_code']}.", "MARKETPLACE")
    return copy.deepcopy(offer)


def list_lender_offers(offers: list[dict[str, Any]], lender_id: str) -> list[dict[str, Any]]:
    return copy.deepcopy([o for o in offers if o["lender_id"] == lender_id])


def list_manufacturer_offers(
    requests: dict[str, dict[str, Any]],
    offers: list[dict[str, Any]],
    request_id: str,
    manufacturer_id: str,
) -> dict[str, Any]:
    req = requests.get(request_id)
    if not req or req["manufacturer_id"] != manufacturer_id:
        raise ValueError("Request not found")
    req_offers = [o for o in offers if o["request_id"] == request_id and o["status"] not in ("DRAFT", "WITHDRAWN")]
    ranked = rank_offers(copy.deepcopy(req_offers), float(req["required_funding_amount"]))
    pending = [o for o in ranked if o.get("status") == "PENDING"]
    return {
        "request_id": request_id,
        "request_code": req["request_code"],
        "status": req["status"],
        "requested_amount": req["required_funding_amount"],
        "offer_count": len(pending),
        "best_rate": min((o["interest_rate"] for o in pending), default=None),
        "highest_amount": max((o["offered_amount"] for o in pending), default=None),
        "recommended_offer_id": pending[0]["id"] if pending else None,
        "offers": ranked,
    }


def accept_offer(
    requests: dict[str, dict[str, Any]],
    offers: list[dict[str, Any]],
    request_id: str,
    offer_id: str,
    manufacturer_id: str,
    exposure: ExposureService,
    notify: NotifyFn,
    audit: AuditFn,
) -> dict[str, Any]:
    req = requests.get(request_id)
    if not req or req["manufacturer_id"] != manufacturer_id:
        raise ValueError("Request not found")

    winner = next((o for o in offers if o["id"] == offer_id and o["request_id"] == request_id), None)
    if not winner:
        raise ValueError("Offer not found")
    if winner["status"] != "PENDING":
        raise ValueError("Offer is no longer available")

    cap_check = exposure.validate_capacity(req, float(winner["offered_amount"]), offers, exclude_offer_id=offer_id)
    if not cap_check["eligible"]:
        audit("OFFER_ACCEPT_BLOCKED", manufacturer_id, "MANUFACTURER", {"offer_id": offer_id, "check": cap_check})
        raise ValueError(cap_check["reason"])

    ts = _now().isoformat()
    winner["status"] = "WON"
    winner["updated_at"] = ts
    winner["won_at"] = ts

    for offer in offers:
        if offer["request_id"] != request_id or offer["id"] == offer_id:
            continue
        if offer["status"] == "PENDING":
            offer["status"] = "LOST"
            offer["updated_at"] = ts
            notify(
                offer["lender_id"],
                "Offer not selected",
                f"Another financing offer was selected for {req['request_code']}.",
                "FINANCING",
            )

    financing_id = str(uuid.uuid4())
    reserved = exposure.reserve_for_offer(req, winner, manufacturer_id, audit)
    exposure.activate_reserved(winner["id"], financing_id, manufacturer_id, audit)

    snap = exposure.calculate(req, offers)
    req["status"] = "ACTIVE_FINANCING"
    req["decision_status"] = "PARTIALLY_FINANCED" if snap["remaining_available_capacity"] > 0 else "FINANCED"
    req["outstanding_exposure"] = snap["active_exposure"]
    req["unclaimed_value"] = snap["remaining_available_capacity"]
    req.setdefault("tranches", []).append(
        {
            "id": str(uuid.uuid4()),
            "tranche_code": f"TR-{req['request_code']}-{len(req['tranches']) + 1}",
            "approved_amount": winner["offered_amount"],
            "outstanding_amount": winner["offered_amount"],
            "instrument": winner["instrument_type"],
            "status": "ACTIVE",
            "lender_id": winner["lender_id"],
            "lender_name": winner["lender_name"],
        }
    )
    req["updated_at"] = ts

    audit(
        "OFFER_ACCEPTED",
        manufacturer_id,
        "MANUFACTURER",
        {"offer_id": offer_id, "request_id": request_id, "winner": winner, "exposure": reserved},
    )
    notify(
        winner["lender_id"],
        "Offer accepted",
        f"Your financing offer for {req['request_code']} was accepted.",
        "FINANCING",
    )
    notify(
        manufacturer_id,
        "Financing secured",
        f"₹{winner['offered_amount'] / 100_000:.1f}L secured from {winner['lender_name']}.",
        "FINANCING",
    )
    return {"offer": copy.deepcopy(winner), "request": copy.deepcopy(req), "exposure": snap}
