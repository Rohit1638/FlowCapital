from __future__ import annotations

from app.core.auth import DEMO_AGGRESSIVE_LENDER_ID, DEMO_LENDER_ID, DEMO_MANUFACTURER_ID
from app.services.demo_platform_store import DEMO_REQUEST_ID, DemoPlatformStore, demo_store
from app.services.exposure_service import ExposureService


def test_remaining_capacity_without_active_exposure():
    store = DemoPlatformStore()
    req = store._requests[DEMO_REQUEST_ID]
    snap = store._exposure.calculate(req, store._offers)
    assert snap["maximum_safe_capacity"] == 3_800_000
    assert snap["active_exposure"] == 0
    assert snap["remaining_available_capacity"] == 3_800_000
    assert snap["utilization_percentage"] == 0.0


def test_block_offer_exceeding_capacity():
    store = DemoPlatformStore()
    req = store._requests[DEMO_REQUEST_ID]
    check = store._exposure.validate_capacity(req, 4_000_000, store._offers)
    assert check["eligible"] is False
    assert check["maximum_allowed_amount"] == 3_800_000


def test_allow_offer_within_capacity():
    store = DemoPlatformStore()
    req = store._requests[DEMO_REQUEST_ID]
    check = store._exposure.validate_capacity(req, 1_500_000, store._offers)
    assert check["eligible"] is True


def test_aggressive_lender_can_submit_offer():
    store = DemoPlatformStore()
    opp = store.list_opportunities(DEMO_AGGRESSIVE_LENDER_ID)[0]
    assert opp["can_submit_offer"] is True
    assert opp["remaining_available_capacity"] == 3_800_000


def test_accept_increases_active_exposure():
    store = DemoPlatformStore()
    aggressive = next(
        o for o in store._offers if o["lender_id"] == DEMO_AGGRESSIVE_LENDER_ID and o["status"] == "PENDING"
    )
    store.accept_manufacturer_offer(DEMO_REQUEST_ID, aggressive["id"], DEMO_MANUFACTURER_ID)
    snap = store._exposure.calculate(store._requests[DEMO_REQUEST_ID], store._offers)
    assert snap["active_exposure"] == 2_800_000
    assert snap["remaining_available_capacity"] == 1_000_000


def test_no_double_count_reserved_and_active():
    entries = [
        {"financing_request_id": DEMO_REQUEST_ID, "status": "ACTIVE", "amount": 2_000_000, "lender_id": "a"},
    ]
    svc = ExposureService(entries)
    req = demo_store._requests[DEMO_REQUEST_ID]
    snap = svc.calculate(req)
    assert snap["total_consumed_capacity"] == 2_000_000
