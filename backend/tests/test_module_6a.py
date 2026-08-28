from __future__ import annotations

from app.services.financing_engine import compute_recommendation, reassess_after_event


def test_low_confidence_reduces_recommended_financing():
    rec = compute_recommendation(
        requested_amount=5_000_000,
        verified_value=4_000_000,
        confidence_score=62,
        risk_level="MEDIUM",
        outstanding_exposure=0,
        lender_max_exposure=4_000_000,
        lender_min_confidence=75,
        open_conflicts=1,
    )
    assert rec.eligibility_status in ("NOT_ELIGIBLE", "CONDITIONAL")
    assert rec.recommended_max < rec.requested_amount


def test_exposure_never_exceeds_financeable():
    rec = compute_recommendation(
        requested_amount=5_000_000,
        verified_value=4_000_000,
        confidence_score=85,
        risk_level="LOW",
        outstanding_exposure=1_500_000,
        lender_max_exposure=5_000_000,
        lender_min_confidence=75,
    )
    assert rec.unclaimed_value <= rec.financeable_value
    assert rec.maximum_safe <= rec.unclaimed_value


def test_quantity_mismatch_triggers_step_down():
    result = reassess_after_event(
        confidence_before=72,
        confidence_after=64,
        financeable_before=3_000_000,
        financeable_after=2_400_000,
        outstanding_exposure=2_000_000,
        event_type="QUANTITY_MISMATCH_DETECTED",
    )
    assert result["recommended_action"] in ("STEP_DOWN", "HOLD", "BLOCK")
