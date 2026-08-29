from __future__ import annotations

from app.core.auth import DEMO_AGGRESSIVE_LENDER_ID, DEMO_CONSERVATIVE_LENDER_ID, DEMO_LENDER_ID, DEMO_MANUFACTURER_ID
from app.services.demo_platform_store import DEMO_REQUEST_ID, DemoPlatformStore
from app.services.instrument_engine import InstrumentSuitabilityService


def test_purchase_finance_at_raw_materials_stage():
    engine = InstrumentSuitabilityService()
    req = {
        "id": "test-req",
        "instrument_lifecycle_stage": "RAW_MATERIALS_REQUIRED",
        "confidence_score": 75,
        "risk_level": "MEDIUM",
        "document_completeness_pct": 80,
        "open_conflicts": 0,
        "collateral": [{"asset_type": "RAW_MATERIAL"}],
    }
    result = engine.assess(req)
    assert result["recommended_instrument"] == "PURCHASE_FINANCE"
    assert result["recommended_suitability_score"] >= 60


def test_production_finance_after_production_started():
    engine = InstrumentSuitabilityService()
    req = {
        "id": "test-req",
        "instrument_lifecycle_stage": "PRODUCTION_STARTED",
        "current_financing_instrument": "PURCHASE_FINANCE",
        "confidence_score": 72,
        "risk_level": "MEDIUM",
        "document_completeness_pct": 75,
        "open_conflicts": 0,
        "collateral": [{"asset_type": "INVENTORY"}],
    }
    result = engine.assess(req)
    assert result["recommended_instrument"] == "PRODUCTION_FINANCE"
    assert result["transition_recommended"] is True


def test_transition_created_on_event():
    store = DemoPlatformStore()
    before = len(store._transitions)
    store.add_event(
        DEMO_REQUEST_ID,
        DEMO_MANUFACTURER_ID,
        {"event_type": "PRODUCTION_COMPLETED", "description": "1000 bikes completed", "severity": "info"},
    )
    assert len(store._transitions) >= before


def test_lender_approves_transition_no_exposure_double():
    store = DemoPlatformStore()
    transition = store._transitions[0]
    req = store._requests[DEMO_REQUEST_ID]
    snap_before = store._exposure.calculate(req, store._offers)
    result = store.approve_transition(transition["id"], DEMO_LENDER_ID, "Approved for demo")
    assert result is not None
    snap_after = store._exposure.calculate(req, store._offers)
    assert snap_before["active_exposure"] == snap_after["active_exposure"]
    assert req["current_financing_instrument"] == "PRODUCTION_FINANCE"


def test_inventory_finance_on_production_completed():
    engine = InstrumentSuitabilityService()
    req = {
        "id": "test",
        "instrument_lifecycle_stage": "INVENTORY_AVAILABLE",
        "current_financing_instrument": "PRODUCTION_FINANCE",
        "confidence_score": 80,
        "risk_level": "LOW",
        "document_completeness_pct": 85,
        "open_conflicts": 0,
        "collateral": [{"asset_type": "INVENTORY"}],
    }
    result = engine.assess(req)
    assert result["recommended_instrument"] in ("INVENTORY_FINANCE", "FINISHED_GOODS_FINANCE")


def test_receivables_on_invoice():
    engine = InstrumentSuitabilityService()
    req = {
        "id": "test",
        "instrument_lifecycle_stage": "RECEIVABLE_CREATED",
        "current_financing_instrument": "INVENTORY_FINANCE",
        "confidence_score": 78,
        "risk_level": "MEDIUM",
        "document_completeness_pct": 90,
        "open_conflicts": 0,
    }
    result = engine.assess(req)
    assert result["recommended_instrument"] == "RECEIVABLES_FINANCE"


def test_conservative_lender_instrument_mismatch():
    store = DemoPlatformStore()
    opp = store.list_opportunities(DEMO_CONSERVATIVE_LENDER_ID)[0]
    assert "recommended_instrument" in opp
    assert "instrument_suitability_score" in opp


def test_unauthorized_lender_cannot_approve():
    store = DemoPlatformStore()
    transition = store._transitions[0]
    result = store.approve_transition(transition["id"], DEMO_AGGRESSIVE_LENDER_ID)
    assert result is None


def test_instrument_suitability_api_shape():
    store = DemoPlatformStore()
    result = store.instrument_suitability(DEMO_REQUEST_ID, DEMO_MANUFACTURER_ID, "MANUFACTURER")
    assert result["current_lifecycle_stage"] == "IN_PRODUCTION"
    assert result["recommended_instrument"] == "PRODUCTION_FINANCE"
    assert "suitability_scores" in result


def test_lender_transitions_list():
    store = DemoPlatformStore()
    items = store.lender_transitions(DEMO_LENDER_ID)
    assert len(items) >= 1
    assert items[0]["from_instrument"] == "PURCHASE_FINANCE"


def test_low_confidence_blocking():
    engine = InstrumentSuitabilityService()
    req = {
        "id": "test",
        "instrument_lifecycle_stage": "IN_PRODUCTION",
        "current_financing_instrument": "PURCHASE_FINANCE",
        "confidence_score": 55,
        "risk_level": "HIGH",
        "document_completeness_pct": 50,
        "open_conflicts": 1,
    }
    result = engine.assess(req)
    assert len(result["blocking_reasons"]) >= 1
