from __future__ import annotations

import random
from dataclasses import dataclass

from app.core.risk_constants import RISK_ALERT_CONFIDENCE_THRESHOLD


@dataclass(frozen=True)
class ConfidenceBandConfig:
    min_score: int
    max_score: int
    label: str
    risk_level: str


SIMULATION_CONFIDENCE_BANDS: list[ConfidenceBandConfig] = [
    ConfidenceBandConfig(80, 100, "HIGH CONFIDENCE", "HIGH_CONFIDENCE"),
    ConfidenceBandConfig(60, 79, "MODERATE CONFIDENCE", "MODERATE_CONFIDENCE"),
    ConfidenceBandConfig(40, 59, "ELEVATED RISK", "ELEVATED_RISK"),
    ConfidenceBandConfig(0, 39, "HIGH RISK", "HIGH_RISK"),
]


def band_for_simulation_confidence(score: int) -> ConfidenceBandConfig:
    clamped = max(0, min(100, score))
    for band in SIMULATION_CONFIDENCE_BANDS:
        if band.min_score <= clamped <= band.max_score:
            return band
    return SIMULATION_CONFIDENCE_BANDS[-1]


def _lifecycle_target(production_progress: float) -> int:
    """Gradual upward drift — demo confidence trends stable-to-positive through the lifecycle."""
    return min(92, max(68, 68 + int(production_progress * 0.22)))


def _cap_step_change(previous: int, candidate: int) -> int:
    """Hard limit per step: at most −1 / +3 points — keeps demo runs stable."""
    return max(previous - 1, min(previous + 3, candidate))


def _apply_soft_floor(score: int, *, severity: str, allow_critical: bool) -> int:
    if score >= RISK_ALERT_CONFIDENCE_THRESHOLD:
        return score
    if allow_critical and severity == "critical":
        return max(32, score)
    if severity == "warning":
        return max(48, score)
    return max(52, score)


def calculate_simulation_confidence(
    *,
    previous_confidence: int,
    event_type: str,
    production_progress: float,
    delay_days: int,
    quantity_variance_pct: float,
    document_verified: bool,
    collateral_coverage_pct: float,
    settlement_progress: float,
    event_severity: str = "info",
    impact_score: int = 1,
    rng: random.Random | None = None,
    allow_critical_zone: bool = False,
    recovery_mode: bool = False,
) -> dict:
    """Demo-stable simulation confidence — EMA-smoothed, small per-step moves."""
    factors: list[str] = []
    severity = event_severity or "info"
    target = _lifecycle_target(production_progress)

    if severity == "critical":
        delta = -1
        factors.append("Critical operational event: -1")
    elif severity == "warning":
        delta = 0
        factors.append("Operational warning: no change")
    else:
        delta = 2
        factors.append("Positive operational signal: +2")

    if recovery_mode and previous_confidence < 58:
        delta += 1
        factors.append("Recovery trend: +1")
    if document_verified:
        delta += 1
        factors.append("Verified evidence: +1")
    if settlement_progress >= 100:
        delta += 1
        factors.append("Settlement complete: +1")

    # Exponential smoothing toward lifecycle target — reduces visible jitter.
    blended = round(0.82 * previous_confidence + 0.18 * target + delta * 0.35)
    stepped = _cap_step_change(previous_confidence, blended)
    final = _apply_soft_floor(stepped, severity=severity, allow_critical=allow_critical_zone)
    final = max(58, min(94, final))
    band = band_for_simulation_confidence(final)

    return {
        "confidence_score": final,
        "confidence_before": previous_confidence,
        "confidence_delta": final - previous_confidence,
        "confidence_band": band.label,
        "risk_level": band.risk_level,
        "factors": factors,
    }


def evaluate_simulation_risk(
    *,
    confidence_score: int,
    delay_days: int,
    production_progress: float,
    financing_exposure: float,
    funding_requested: float,
    event_type: str,
) -> dict:
    band = band_for_simulation_confidence(confidence_score)
    risk_factors: list[str] = []

    if delay_days >= 8:
        risk_factors.append("Production delay exceeds 7 days")
    if confidence_score < RISK_ALERT_CONFIDENCE_THRESHOLD:
        risk_factors.append("Confidence below high-risk threshold")
    if financing_exposure > funding_requested * 0.8 and production_progress < 70:
        risk_factors.append("Funding exposure increased relative to progress")
    if "MISMATCH" in event_type.upper() or "DISCREPANCY" in event_type.upper():
        risk_factors.append("Quantity or evidence discrepancy detected")
    if "DELAY" in event_type.upper():
        risk_factors.append("Operational delay detected")

    recommendation = "Continue monitoring production evidence."
    if band.risk_level == "HIGH_RISK":
        recommendation = "Review updated production evidence before additional financing exposure."
    elif band.risk_level == "ELEVATED_RISK":
        recommendation = "Consider partial exposure until operational risks are resolved."
    elif band.risk_level == "MODERATE_CONFIDENCE":
        recommendation = "Monitor lifecycle progression and collateral alignment."

    return {
        "risk_level": band.risk_level,
        "risk_band_label": band.label,
        "risk_factors": risk_factors,
        "recommendation": recommendation,
    }
