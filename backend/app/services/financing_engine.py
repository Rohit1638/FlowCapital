from __future__ import annotations

from dataclasses import dataclass


@dataclass
class ConfidenceBand:
    min_score: int
    max_score: int
    label: str
    financing_factor: float


CONFIDENCE_BANDS: list[ConfidenceBand] = [
    ConfidenceBand(90, 100, "Strong confidence", 0.95),
    ConfidenceBand(80, 89, "High confidence", 0.85),
    ConfidenceBand(70, 79, "Moderate confidence", 0.70),
    ConfidenceBand(60, 69, "Low confidence", 0.50),
    ConfidenceBand(0, 59, "Insufficient confidence", 0.25),
]

RISK_PENALTY = {"LOW": 0, "MEDIUM": 0.08, "HIGH": 0.18, "CRITICAL": 0.30}


def band_for_confidence(score: int) -> ConfidenceBand:
    for band in CONFIDENCE_BANDS:
        if band.min_score <= score <= band.max_score:
            return band
    return CONFIDENCE_BANDS[-1]


@dataclass
class FinancingRecommendation:
    requested_amount: float
    verified_value: float
    financeable_value: float
    outstanding_exposure: float
    unclaimed_value: float
    confidence_score: int
    risk_level: str
    recommended_min: float
    recommended_max: float
    maximum_safe: float
    confidence_band: str
    reason: str
    required_conditions: list[str]
    eligibility_status: str


def compute_financeable_value(
    verified_value: float,
    confidence_score: int,
    risk_level: str,
    open_conflicts: int = 0,
    document_completeness_pct: float = 100,
) -> float:
    band = band_for_confidence(confidence_score)
    risk_penalty = RISK_PENALTY.get(risk_level.upper(), 0.12)
    conflict_penalty = min(0.25, open_conflicts * 0.08)
    doc_factor = max(0.5, document_completeness_pct / 100)
    factor = max(0.1, (band.financing_factor - risk_penalty - conflict_penalty) * doc_factor)
    return round(verified_value * factor, 2)


def compute_recommendation(
    *,
    requested_amount: float,
    verified_value: float,
    confidence_score: int,
    risk_level: str,
    outstanding_exposure: float,
    lender_max_exposure: float,
    lender_min_confidence: int,
    open_conflicts: int = 0,
    document_completeness_pct: float = 100,
) -> FinancingRecommendation:
    financeable = compute_financeable_value(
        verified_value, confidence_score, risk_level, open_conflicts, document_completeness_pct
    )
    unclaimed = max(0.0, financeable - outstanding_exposure)
    maximum_safe = min(requested_amount, unclaimed, lender_max_exposure)
    band = band_for_confidence(confidence_score)

    if confidence_score < lender_min_confidence:
        eligibility = "NOT_ELIGIBLE"
        recommended_max = round(maximum_safe * 0.4, 2) if maximum_safe > 0 else 0
    elif confidence_score < 70:
        eligibility = "CONDITIONAL"
        recommended_max = round(maximum_safe * 0.55, 2)
    elif confidence_score < 80:
        eligibility = "PARTIAL_ELIGIBLE"
        recommended_max = round(maximum_safe * 0.75, 2)
    else:
        eligibility = "ELIGIBLE"
        recommended_max = round(maximum_safe * band.financing_factor, 2)

    recommended_min = round(recommended_max * 0.65, 2) if recommended_max > 0 else 0
    conditions: list[str] = []
    if open_conflicts > 0:
        conditions.append("Resolve open verification conflicts before full exposure")
    if document_completeness_pct < 80:
        conditions.append("Upload missing supporting documents")
    if confidence_score < lender_min_confidence:
        conditions.append(f"Confidence {confidence_score}% is below lender threshold {lender_min_confidence}%")

    reason = (
        f"Financeable value ₹{financeable:,.0f} derived from verified value ₹{verified_value:,.0f}, "
        f"confidence {confidence_score}% ({band.label}), risk {risk_level}. "
        f"Unclaimed capacity ₹{unclaimed:,.0f} after ₹{outstanding_exposure:,.0f} outstanding exposure."
    )

    return FinancingRecommendation(
        requested_amount=requested_amount,
        verified_value=verified_value,
        financeable_value=financeable,
        outstanding_exposure=outstanding_exposure,
        unclaimed_value=unclaimed,
        confidence_score=confidence_score,
        risk_level=risk_level,
        recommended_min=recommended_min,
        recommended_max=recommended_max,
        maximum_safe=maximum_safe,
        confidence_band=band.label,
        reason=reason,
        required_conditions=conditions,
        eligibility_status=eligibility,
    )


def reassess_after_event(
    *,
    confidence_before: int,
    confidence_after: int,
    financeable_before: float,
    financeable_after: float,
    outstanding_exposure: float,
    event_type: str,
) -> dict:
    unclaimed = max(0.0, financeable_after - outstanding_exposure)
    if "MISMATCH" in event_type or "CONFLICT" in event_type:
        action = "STEP_DOWN" if outstanding_exposure > financeable_after else "HOLD"
    elif "DELAY" in event_type:
        action = "CONTINUE" if confidence_after >= 65 else "HOLD"
    elif financeable_after > financeable_before and unclaimed > 0:
        action = "TOP_UP"
    elif financeable_after < financeable_before and outstanding_exposure > financeable_after:
        action = "BLOCK"
    else:
        action = "CONTINUE"

    return {
        "recommended_action": action,
        "confidence_before": confidence_before,
        "confidence_after": confidence_after,
        "financeable_value_before": financeable_before,
        "financeable_value_after": financeable_after,
        "unclaimed_value": unclaimed,
        "reason": f"Event {event_type} triggered {action} based on financeable value movement.",
    }
