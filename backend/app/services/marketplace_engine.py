"""Deterministic lender eligibility and offer comparison for the capital marketplace."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class LenderProfileConfig:
    id: str
    username: str
    lender_name: str
    risk_appetite: str
    minimum_confidence_threshold: int
    max_exposure_per_asset: float
    max_exposure_per_manufacturer: float
    max_risk_level: str
    preferred_instruments: tuple[str, ...]
    strategy_summary: str


LENDER_PROFILES: dict[str, LenderProfileConfig] = {
    "00000000-0000-4000-8000-000000000002": LenderProfileConfig(
        id="00000000-0000-4000-8000-000000000002",
        username="lender_demo",
        lender_name="Balanced Growth Capital",
        risk_appetite="BALANCED",
        minimum_confidence_threshold=75,
        max_exposure_per_asset=4_000_000,
        max_exposure_per_manufacturer=15_000_000,
        max_risk_level="HIGH",
        preferred_instruments=("PRODUCTION_FINANCE", "INVENTORY_FINANCE"),
        strategy_summary="Medium/high funding with competitive rates and moderate conditions.",
    ),
    "00000000-0000-4000-8000-000000000004": LenderProfileConfig(
        id="00000000-0000-4000-8000-000000000004",
        username="conservative_demo",
        lender_name="Conservative Capital Partners",
        risk_appetite="CONSERVATIVE",
        minimum_confidence_threshold=85,
        max_exposure_per_asset=2_500_000,
        max_exposure_per_manufacturer=8_000_000,
        max_risk_level="MEDIUM",
        preferred_instruments=("INVENTORY_FINANCE", "RECEIVABLES_FINANCE"),
        strategy_summary="Lower amounts, lower rates, stricter verification conditions.",
    ),
    "00000000-0000-4000-8000-000000000005": LenderProfileConfig(
        id="00000000-0000-4000-8000-000000000005",
        username="aggressive_demo",
        lender_name="Aggressive Supply Chain Capital",
        risk_appetite="AGGRESSIVE",
        minimum_confidence_threshold=65,
        max_exposure_per_asset=5_000_000,
        max_exposure_per_manufacturer=20_000_000,
        max_risk_level="HIGH",
        preferred_instruments=("PRODUCTION_FINANCE", "BRIDGE_FINANCE"),
        strategy_summary="Higher funding amounts with fewer conditions and enhanced monitoring.",
    ),
}

RISK_RANK = {"LOW": 1, "MEDIUM": 2, "MODERATE": 2, "ELEVATED": 3, "HIGH": 4}

OFFER_STATUSES = frozenset(
    {"DRAFT", "PENDING", "ACCEPTED", "WITHDRAWN", "EXPIRED", "REJECTED", "WON", "LOST"}
)

OPEN_REQUEST_STATUSES = frozenset({"SUBMITTED", "UNDER_REVIEW", "MORE_INFORMATION_REQUIRED", "CONDITIONALLY_APPROVED"})


def get_lender_profile(lender_id: str) -> LenderProfileConfig | None:
    return LENDER_PROFILES.get(lender_id)


def _risk_value(level: str) -> int:
    return RISK_RANK.get(str(level).upper(), 2)


def assess_lender_eligibility(
    profile: LenderProfileConfig,
    req: dict[str, Any],
    exposure: dict[str, Any] | None = None,
    existing_offer: dict[str, Any] | None = None,
) -> dict[str, Any]:
    confidence = int(req.get("confidence_score", 0))
    risk = str(req.get("risk_level", "MEDIUM"))
    financeable = float(req.get("financeable_value", 0))
    rec = req.get("financing_recommendation") or {}
    max_safe = float(rec.get("maximum_safe", rec.get("recommended_max", financeable)))
    if req.get("maximum_safe_capacity") is not None:
        max_safe = float(req["maximum_safe_capacity"])
    open_conflicts = int(req.get("open_conflicts", 0))
    critical_conflicts = any(
        c.get("severity") == "HIGH" and c.get("status") == "OPEN" for c in req.get("conflicts", [])
    )

    remaining = float(exposure["remaining_available_capacity"]) if exposure else max_safe
    policy_block_reason: str | None = None

    if confidence < profile.minimum_confidence_threshold:
        if profile.risk_appetite in ("BALANCED", "AGGRESSIVE") and confidence >= 65:
            policy_block_reason = (
                f"Confidence ({confidence}%) is below preferred threshold ({profile.minimum_confidence_threshold}%) "
                "— conditional marketplace access granted."
            )
        else:
            return {
                "eligible": False,
                "eligibility_status": "NOT_ELIGIBLE",
                "eligibility_reason": (
                    f"Current confidence ({confidence}%) is below this lender's minimum "
                    f"threshold ({profile.minimum_confidence_threshold}%)."
                ),
                "can_submit_offer": existing_offer is not None,
            }

    if _risk_value(risk) > _risk_value(profile.max_risk_level):
        return {
            "eligible": False,
            "eligibility_status": "NOT_ELIGIBLE",
            "eligibility_reason": f"Asset risk level ({risk}) exceeds this lender's maximum appetite.",
            "can_submit_offer": existing_offer is not None,
        }

    if financeable <= 0 or max_safe <= 0:
        return {
            "eligible": False,
            "eligibility_status": "NOT_ELIGIBLE",
            "eligibility_reason": "Financeable value is insufficient for this lender's policy.",
            "can_submit_offer": False,
        }

    if profile.risk_appetite == "CONSERVATIVE" and critical_conflicts:
        return {
            "eligible": False,
            "eligibility_status": "NOT_ELIGIBLE",
            "eligibility_reason": "Unresolved high-severity conflicts block conservative lending.",
            "can_submit_offer": existing_offer is not None,
        }

    if open_conflicts > 0 and profile.risk_appetite == "CONSERVATIVE":
        return {
            "eligible": False,
            "eligibility_status": "NOT_ELIGIBLE",
            "eligibility_reason": "Open operational conflicts must be resolved before conservative financing.",
            "can_submit_offer": existing_offer is not None,
        }

    if remaining <= 0 and not existing_offer:
        return {
            "eligible": False,
            "eligibility_status": "NOT_ELIGIBLE",
            "eligibility_reason": "No verified financing capacity remains on this opportunity.",
            "can_submit_offer": False,
            "remaining_available_capacity": 0,
        }

    lender_max = min(max_safe, profile.max_exposure_per_asset)
    if exposure:
        lender_max = min(lender_max, remaining)

    status = "ELIGIBLE"
    reason = "Opportunity meets this lender's confidence, risk, and policy thresholds."
    if policy_block_reason:
        status = "CONDITIONAL"
        reason = policy_block_reason

    return {
        "eligible": True,
        "eligibility_status": status,
        "eligibility_reason": reason,
        "can_submit_offer": True,
        "maximum_safe_financing": max_safe,
        "remaining_available_capacity": remaining,
        "recommended_amount_min": float(rec.get("recommended_min", lender_max * 0.4)),
        "recommended_amount_max": lender_max,
    }


def effective_cost_score(offered_amount: float, interest_rate: float, tenor_days: int) -> float:
    if offered_amount <= 0:
        return float("inf")
    annual_rate = interest_rate / 100
    tenor_years = max(tenor_days, 1) / 365
    estimated_cost = offered_amount * annual_rate * tenor_years
    return estimated_cost / offered_amount * 100


def rank_offers(offers: list[dict[str, Any]], requested_amount: float) -> list[dict[str, Any]]:
    if not offers:
        return []

    pending = [o for o in offers if o.get("status") == "PENDING"]
    if not pending:
        return offers

    max_amount = max(o["offered_amount"] for o in pending)
    min_rate = min(o["interest_rate"] for o in pending)
    costs = [effective_cost_score(o["offered_amount"], o["interest_rate"], o["tenor_days"]) for o in pending]
    min_cost = min(costs)
    max_tenor = max(o["tenor_days"] for o in pending)
    min_conditions = min(len(o.get("conditions") or []) for o in pending)

    ranked = []
    for offer in pending:
        amount_norm = offer["offered_amount"] / max(max_amount, 1)
        rate_norm = 1 - (offer["interest_rate"] - min_rate) / max(max(min_rate, 0.01), 0.01) if len(pending) > 1 else 1
        cost = effective_cost_score(offer["offered_amount"], offer["interest_rate"], offer["tenor_days"])
        cost_norm = 1 - (cost - min_cost) / max(min_cost, 0.01) if len(pending) > 1 else 1
        tenor_norm = offer["tenor_days"] / max(max_tenor, 1)
        conditions_norm = 1 - (len(offer.get("conditions") or []) - min_conditions) / max(len(offer.get("conditions") or [""]), 1)
        funding_fit = min(offer["offered_amount"] / max(requested_amount, 1), 1)

        comparison_score = round(
            cost_norm * 35
            + amount_norm * 25
            + tenor_norm * 15
            + conditions_norm * 15
            + funding_fit * 10,
            1,
        )

        reasons = []
        if cost_norm >= 0.9:
            reasons.append("lowest estimated effective cost among eligible offers")
        if amount_norm >= 0.85:
            reasons.append("strong funding amount relative to peers")
        if funding_fit >= 0.6:
            reasons.append(f"covers {int(funding_fit * 100)}% of requested capital")

        ranked.append(
            {
                **offer,
                "effective_cost_pct": round(cost, 3),
                "estimated_financing_cost_inr": round(offer["offered_amount"] * (offer["interest_rate"] / 100) * (offer["tenor_days"] / 365)),
                "comparison_score": comparison_score,
                "comparison_rank_reason": (
                    "Recommended because it provides "
                    + (reasons[0] if reasons else "a balanced mix of cost, amount, and conditions")
                    + "."
                ),
            }
        )

    ranked.sort(key=lambda x: x["comparison_score"], reverse=True)
    for idx, item in enumerate(ranked, start=1):
        item["comparison_rank"] = idx
    return ranked + [o for o in offers if o.get("status") != "PENDING"]
