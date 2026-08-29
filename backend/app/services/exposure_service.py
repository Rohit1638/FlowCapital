"""Deterministic exposure ledger — duplicate financing and over-financing protection."""

from __future__ import annotations

import copy
import uuid
from datetime import datetime, timezone
from typing import Any

CONSUMING_STATUSES = frozenset({"PENDING", "RESERVED", "ACTIVE"})
TERMINAL_STATUSES = frozenset({"REPAID", "RELEASED", "CANCELLED", "DEFAULTED"})

UTILIZATION_LOW = 60
UTILIZATION_MODERATE = 80
UTILIZATION_HIGH = 95


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _risk_status(utilization: float, over_financing: float) -> str:
    if over_financing > 0:
        return "OVER_FINANCED"
    if utilization > UTILIZATION_HIGH:
        return "CRITICAL"
    if utilization > UTILIZATION_MODERATE:
        return "HIGH_UTILIZATION"
    if utilization > UTILIZATION_LOW:
        return "MODERATE"
    return "HEALTHY"


def maximum_safe_capacity(req: dict[str, Any]) -> float:
    rec = req.get("financing_recommendation") or {}
    explicit = req.get("maximum_safe_capacity")
    if explicit is not None:
        return float(explicit)
    return float(rec.get("maximum_safe", rec.get("recommended_max", req.get("financeable_value", 0))))


def seed_demo_exposure_entries() -> list[dict[str, Any]]:
    """No pre-allocated exposure — compare-offers demo starts with full verified capacity."""
    return []


def seed_demo_exposure_history() -> list[dict[str, Any]]:
    return []


class ExposureService:
    def __init__(self, entries: list[dict[str, Any]], history: list[dict[str, Any]] | None = None) -> None:
        self._entries = entries
        self._history = history if history is not None else []

    def entries_for_request(self, request_id: str) -> list[dict[str, Any]]:
        return [e for e in self._entries if e["financing_request_id"] == request_id]

    def calculate(self, req: dict[str, Any], offers: list[dict[str, Any]] | None = None) -> dict[str, Any]:
        request_id = req["id"]
        max_cap = maximum_safe_capacity(req)
        entries = self.entries_for_request(request_id)

        active = sum(e["amount"] for e in entries if e["status"] == "ACTIVE")
        reserved = sum(e["amount"] for e in entries if e["status"] == "RESERVED")
        pending_exposure = sum(e["amount"] for e in entries if e["status"] == "PENDING")

        if offers:
            for offer in offers:
                if offer["request_id"] != request_id or offer["status"] != "PENDING":
                    continue
                if any(e.get("offer_id") == offer["id"] for e in entries):
                    continue
                pending_exposure += float(offer["offered_amount"])

        total_consumed = active + reserved + pending_exposure
        remaining = max(0.0, max_cap - (active + reserved))
        over = max(0.0, (active + reserved) - max_cap) if max_cap > 0 else 0.0
        utilization = round(((active + reserved) / max_cap) * 100, 1) if max_cap > 0 else 0.0

        by_lender: dict[str, float] = {}
        for e in entries:
            if e["status"] in ("ACTIVE", "RESERVED"):
                by_lender[e["lender_id"]] = by_lender.get(e["lender_id"], 0) + e["amount"]

        return {
            "financing_request_id": request_id,
            "request_code": req.get("request_code"),
            "maximum_safe_capacity": max_cap,
            "active_exposure": active,
            "reserved_exposure": reserved,
            "pending_exposure": pending_exposure,
            "total_consumed_capacity": active + reserved,
            "remaining_available_capacity": remaining,
            "utilization_percentage": utilization,
            "over_financing_amount": over,
            "risk_status": _risk_status(utilization, over),
            "exposure_by_lender": [
                {"lender_id": lid, "active_and_reserved": amt} for lid, amt in by_lender.items()
            ],
            "capacity_reasons": _capacity_reasons(req, max_cap, active + reserved, remaining),
        }

    def lender_view(self, snapshot: dict[str, Any]) -> dict[str, Any]:
        return {
            "maximum_safe_capacity": snapshot["maximum_safe_capacity"],
            "active_exposure": snapshot["active_exposure"],
            "reserved_exposure": snapshot["reserved_exposure"],
            "remaining_available_capacity": snapshot["remaining_available_capacity"],
            "utilization_percentage": snapshot["utilization_percentage"],
            "risk_status": snapshot["risk_status"],
            "over_financing_amount": snapshot["over_financing_amount"],
            "competition_exposure_note": (
                f"₹{snapshot['active_exposure'] / 100_000:.1f}L of verified capacity is already allocated"
                if snapshot["active_exposure"] > 0
                else "No active financing exposure on this opportunity yet"
            ),
        }

    def validate_capacity(
        self,
        req: dict[str, Any],
        proposed_amount: float,
        offers: list[dict[str, Any]] | None = None,
        exclude_offer_id: str | None = None,
        exclude_lender_id: str | None = None,
    ) -> dict[str, Any]:
        snapshot = self.calculate(req, offers)
        remaining = snapshot["remaining_available_capacity"]

        if exclude_offer_id and offers:
            for offer in offers:
                if offer["id"] == exclude_offer_id and offer["status"] == "PENDING":
                    remaining += float(offer["offered_amount"])
                    break

        max_allowed = remaining
        eligible = proposed_amount > 0 and proposed_amount <= max_allowed + 0.01
        excess = max(0.0, proposed_amount - max_allowed)

        reason = "Proposed amount fits within remaining verified financing capacity."
        if not eligible:
            if max_allowed <= 0:
                reason = "No verified financing capacity remains on this opportunity."
            else:
                reason = (
                    f"The requested offer exceeds the remaining verified financing capacity by ₹{excess:,.0f}."
                )

        return {
            "eligible": eligible,
            "proposed_amount": proposed_amount,
            "maximum_allowed_amount": max_allowed,
            "remaining_capacity": remaining,
            "maximum_safe_capacity": snapshot["maximum_safe_capacity"],
            "active_exposure": snapshot["active_exposure"],
            "reserved_exposure": snapshot["reserved_exposure"],
            "utilization_percentage": snapshot["utilization_percentage"],
            "reason": reason,
            "excess_amount": excess,
        }

    def reserve_for_offer(
        self,
        req: dict[str, Any],
        offer: dict[str, Any],
        actor_id: str,
        audit_fn: Any,
    ) -> dict[str, Any]:
        existing = next((e for e in self._entries if e.get("offer_id") == offer["id"]), None)
        ts = _now().isoformat()
        if existing:
            before = copy.deepcopy(existing)
            existing.update({"status": "RESERVED", "exposure_type": "RESERVED", "amount": offer["offered_amount"], "updated_at": ts})
            audit_fn("EXPOSURE_RESERVED", actor_id, "MANUFACTURER", {"before": before, "after": existing})
            return existing

        entry = {
            "id": str(uuid.uuid4()),
            "manufacturer_id": req["manufacturer_id"],
            "financing_request_id": req["id"],
            "asset_id": req.get("collateral", [{}])[0].get("id") if req.get("collateral") else None,
            "collateral_id": req.get("collateral", [{}])[0].get("id") if req.get("collateral") else None,
            "lender_id": offer["lender_id"],
            "financing_id": None,
            "offer_id": offer["id"],
            "exposure_type": "RESERVED",
            "amount": offer["offered_amount"],
            "currency": "INR",
            "status": "RESERVED",
            "effective_from": ts,
            "effective_until": None,
            "created_at": ts,
            "updated_at": ts,
            "created_by": actor_id,
            "reference_type": "FINANCING_OFFER",
            "reference_id": offer["id"],
            "notes": f"Reserved on offer acceptance — {offer['lender_name']}",
        }
        self._entries.append(entry)
        self._history.append(
            {
                "id": str(uuid.uuid4()),
                "timestamp": ts,
                "action": "EXPOSURE_RESERVED",
                "title": "Exposure reserved on offer acceptance",
                "detail": f"{offer['lender_name']} — ₹{offer['offered_amount'] / 100_000:.1f}L reserved",
                "amount": offer["offered_amount"],
                "lender_id": offer["lender_id"],
                "lender_name": offer["lender_name"],
            }
        )
        audit_fn("EXPOSURE_RESERVED", actor_id, "MANUFACTURER", {"entry": entry})
        return entry

    def activate_reserved(
        self,
        offer_id: str,
        financing_id: str,
        actor_id: str,
        audit_fn: Any,
    ) -> dict[str, Any] | None:
        entry = next((e for e in self._entries if e.get("offer_id") == offer_id and e["status"] == "RESERVED"), None)
        if not entry:
            return None
        ts = _now().isoformat()
        before = copy.deepcopy(entry)
        entry.update(
            {
                "status": "ACTIVE",
                "exposure_type": "ACTIVE",
                "financing_id": financing_id,
                "updated_at": ts,
            }
        )
        self._history.append(
            {
                "id": str(uuid.uuid4()),
                "timestamp": ts,
                "action": "EXPOSURE_ACTIVATED",
                "title": "Financing exposure activated",
                "detail": f"₹{entry['amount'] / 100_000:.1f}L exposure now active",
                "amount": entry["amount"],
                "lender_id": entry["lender_id"],
            }
        )
        audit_fn("EXPOSURE_ACTIVATED", actor_id, "SYSTEM", {"before": before, "after": entry})
        return entry

    def release_offer_exposure(self, offer_id: str, actor_id: str, audit_fn: Any) -> None:
        for entry in self._entries:
            if entry.get("offer_id") == offer_id and entry["status"] in ("PENDING", "RESERVED"):
                before = copy.deepcopy(entry)
                entry["status"] = "CANCELLED"
                entry["exposure_type"] = "CANCELLED"
                entry["updated_at"] = _now().isoformat()
                audit_fn("EXPOSURE_RELEASED", actor_id, "SYSTEM", {"before": before, "after": entry})

    def history_for_request(self, request_id: str) -> list[dict[str, Any]]:
        return copy.deepcopy([h for h in self._history if True])

    def add_history_event(
        self,
        *,
        action: str,
        title: str,
        detail: str,
        amount: float | None = None,
        lender_id: str | None = None,
        lender_name: str | None = None,
    ) -> None:
        self._history.append(
            {
                "id": str(uuid.uuid4()),
                "timestamp": _now().isoformat(),
                "action": action,
                "title": title,
                "detail": detail,
                "amount": amount,
                "lender_id": lender_id,
                "lender_name": lender_name,
            }
        )

    def reclassify_instrument(
        self,
        *,
        request_id: str,
        financing_id: str,
        from_instrument: str,
        to_instrument: str,
        actor_id: str,
        audit_fn: Any,
    ) -> dict[str, Any]:
        """Reclassify exposure instrument without changing amount — no double-count."""
        ts = _now().isoformat()
        updated: list[dict[str, Any]] = []
        for entry in self._entries:
            if entry["financing_request_id"] != request_id:
                continue
            if entry.get("financing_id") == financing_id or entry.get("reference_id") == financing_id:
                before = copy.deepcopy(entry)
                entry["notes"] = (
                    f"Instrument reclassified {from_instrument} → {to_instrument} "
                    f"(amount unchanged ₹{entry['amount'] / 100_000:.1f}L)"
                )
                entry["updated_at"] = ts
                updated.append(entry)
                audit_fn(
                    "INSTRUMENT_RECLASSIFIED",
                    actor_id,
                    "LENDER",
                    {"before": before, "after": entry, "from_instrument": from_instrument, "to_instrument": to_instrument},
                )
        self.add_history_event(
            action="INSTRUMENT_RECLASSIFIED",
            title="Financing instrument reclassified",
            detail=f"{from_instrument} → {to_instrument} (exposure amount unchanged)",
            amount=updated[0]["amount"] if updated else None,
            lender_id=actor_id,
        )
        return {"updated_entries": len(updated), "amount_unchanged": True}


def _capacity_reasons(req: dict[str, Any], max_cap: float, consumed: float, remaining: float) -> list[str]:
    reasons: list[str] = []
    if consumed > 0:
        reasons.append("Existing active financing against this production request reduces available capacity.")
    if req.get("confidence_score", 0) < 75:
        reasons.append("Lower confidence score reduces maximum safe financing capacity.")
    if req.get("open_conflicts", 0) > 0:
        reasons.append("Unresolved evidence conflicts apply a risk adjustment.")
    if remaining < max_cap * 0.2:
        reasons.append("Utilization is high — only limited verified capacity remains.")
    if not reasons:
        reasons.append("Capacity is primarily driven by verified asset value and confidence-adjusted financeable limits.")
    return reasons
