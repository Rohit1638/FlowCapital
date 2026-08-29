from __future__ import annotations

from app.core.auth import DEMO_AGGRESSIVE_LENDER_ID, DEMO_CONSERVATIVE_LENDER_ID, DEMO_LENDER_ID, DEMO_MANUFACTURER_ID
from app.services.demo_platform_store import DEMO_REQUEST_ID, DemoPlatformStore, demo_store
from app.services.marketplace_engine import assess_lender_eligibility, get_lender_profile, rank_offers


def test_balanced_lender_conditional_eligibility():
    req = demo_store._requests[DEMO_REQUEST_ID]
    profile = get_lender_profile(DEMO_LENDER_ID)
    snap = demo_store._exposure.calculate(req, demo_store._offers)
    result = assess_lender_eligibility(profile, req, snap)
    assert result["eligible"] is True
    assert result["can_submit_offer"] is True


def test_aggressive_eligible_with_remaining_capacity():
    req = demo_store._requests[DEMO_REQUEST_ID]
    profile = get_lender_profile(DEMO_AGGRESSIVE_LENDER_ID)
    snap = demo_store._exposure.calculate(req, demo_store._offers)
    result = assess_lender_eligibility(profile, req, snap)
    assert result["eligible"] is True


def test_manufacturer_sees_exposure_snapshot():
    data = demo_store.get_exposure(DEMO_REQUEST_ID, DEMO_MANUFACTURER_ID, "MANUFACTURER")
    assert data is not None
    assert data["remaining_available_capacity"] == 3_800_000


def test_lender_cannot_see_competitor_terms_in_opportunities():
    opp = demo_store.list_opportunities(DEMO_AGGRESSIVE_LENDER_ID)[0]
    assert "competing_offer_count" in opp
    assert "interest_rate" not in opp


def test_submit_and_update_offer():
    store = DemoPlatformStore()
    store._offers = [o for o in store._offers if o["lender_id"] != DEMO_AGGRESSIVE_LENDER_ID]
    payload = {
        "offered_amount": 1_500_000,
        "interest_rate": 12.0,
        "tenor_days": 120,
        "instrument_type": "PRODUCTION_FINANCE",
        "conditions": ["Test"],
    }
    before = len(store._offers)
    store.submit_lender_offer(DEMO_REQUEST_ID, DEMO_AGGRESSIVE_LENDER_ID, payload)
    assert len(store._offers) == before + 1
    store.submit_lender_offer(DEMO_REQUEST_ID, DEMO_AGGRESSIVE_LENDER_ID, payload)
    assert len(store._offers) == before + 1


def test_demo_compare_offers_seeded():
    pending = [o for o in demo_store._offers if o["request_id"] == DEMO_REQUEST_ID and o["status"] == "PENDING"]
    assert len(pending) == 3
    comparison = demo_store.list_manufacturer_offers(DEMO_REQUEST_ID, DEMO_MANUFACTURER_ID)
    assert comparison["offer_count"] == 3
    assert comparison["recommended_offer_id"] is not None


def test_rank_offers_deterministic_score():
    offers = [
        {"id": "a", "status": "PENDING", "offered_amount": 1_500_000, "interest_rate": 10.5, "tenor_days": 90, "conditions": ["a"]},
        {"id": "b", "status": "PENDING", "offered_amount": 1_800_000, "interest_rate": 12, "tenor_days": 120, "conditions": ["a", "b"]},
    ]
    ranked = rank_offers(offers, 5_000_000)
    assert ranked[0]["comparison_score"] >= ranked[1]["comparison_score"]
