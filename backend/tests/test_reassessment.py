from __future__ import annotations

from app.core.auth import DEMO_LENDER_ID, DEMO_MANUFACTURER_ID
from app.services.demo_platform_store import DEMO_REQUEST_ID, DemoPlatformStore


def test_minor_progress_no_full_reassessment():
    store = DemoPlatformStore()
    result = store.simulate_demo_event(
        DEMO_REQUEST_ID, "PRODUCTION_PROGRESS_UPDATED", DEMO_MANUFACTURER_ID, "MANUFACTURER", {"progress_delta": 2}
    )
    assert result["reassessment"]["skipped"] is True


def test_production_delay_triggers_reassessment():
    store = DemoPlatformStore()
    req = store._requests[DEMO_REQUEST_ID]
    before = req["confidence_score"]
    result = store.simulate_demo_event(
        DEMO_REQUEST_ID, "PRODUCTION_DELAYED", DEMO_MANUFACTURER_ID, "MANUFACTURER", {"delay_days": 10}
    )
    assert result["reassessment"]["skipped"] is False
    record = result["reassessment"]["record"]
    assert record["previous_confidence"] == before
    assert record["new_confidence"] < before
    assert len(store._reassessment_records) >= 1


def test_states_preserved_in_record():
    store = DemoPlatformStore()
    store.simulate_demo_event(DEMO_REQUEST_ID, "PRODUCTION_DELAYED", DEMO_MANUFACTURER_ID, "MANUFACTURER", {"delay_days": 10})
    record = store._reassessment_records[0]
    assert record["previous_confidence"] is not None
    assert record["new_confidence"] is not None
    assert record["previous_safe_capacity"] is not None


def test_confidence_threshold_crossing():
    store = DemoPlatformStore()
    store.simulate_demo_event(DEMO_REQUEST_ID, "PRODUCTION_DELAYED", DEMO_MANUFACTURER_ID, "MANUFACTURER", {"delay_days": 10})
    record = store._reassessment_records[0]
    assert record["confidence_change"] <= -15
    assert record.get("confidence_threshold_crossed") is True


def test_risk_low_to_high_impact():
    store = DemoPlatformStore()
    store.simulate_demo_event(DEMO_REQUEST_ID, "PRODUCTION_DELAYED", DEMO_MANUFACTURER_ID, "MANUFACTURER", {"delay_days": 10})
    record = store._reassessment_records[0]
    assert record["previous_risk"] == "HIGH"
    assert record["new_risk"] == "HIGH"
    assert record["impact_level"] in ("HIGH_IMPACT", "MODERATE_IMPACT", "CRITICAL_IMPACT")


def test_capacity_impact_recorded():
    store = DemoPlatformStore()
    store.simulate_demo_event(DEMO_REQUEST_ID, "PRODUCTION_DELAYED", DEMO_MANUFACTURER_ID, "MANUFACTURER", {"delay_days": 10})
    record = store._reassessment_records[0]
    assert "capacity_change" in record


def test_production_completed_runs_instrument():
    store = DemoPlatformStore()
    result = store.simulate_demo_event(
        DEMO_REQUEST_ID, "PRODUCTION_COMPLETED", DEMO_MANUFACTURER_ID, "MANUFACTURER", {}
    )
    record = result["reassessment"]["record"]
    assert record["new_recommended_instrument"] in ("INVENTORY_FINANCE", "FINISHED_GOODS_FINANCE")


def test_lender_acknowledge_audited():
    store = DemoPlatformStore()
    store.simulate_demo_event(DEMO_REQUEST_ID, "PRODUCTION_DELAYED", DEMO_MANUFACTURER_ID, "MANUFACTURER", {"delay_days": 10})
    record_id = store._reassessment_records[0]["id"]
    result = store.lender_reassessment_action(record_id, DEMO_LENDER_ID, "ACKNOWLEDGE", "Reviewed")
    assert result["lender_action"] == "ACKNOWLEDGE"
    assert any(a["action"] == "LENDER_REASSESSMENT_ACTION" for a in store._audit_logs)


def test_unauthorized_manufacturer_reassessment():
    store = DemoPlatformStore()
    store.simulate_demo_event(DEMO_REQUEST_ID, "PRODUCTION_DELAYED", DEMO_MANUFACTURER_ID, "MANUFACTURER", {"delay_days": 10})
    record_id = store._reassessment_records[0]["id"]
    other_mfg = "00000000-0000-4000-8000-000000009999"
    assert store.get_reassessment(record_id, other_mfg, "MANUFACTURER") is None


def test_evidence_improves_confidence():
    store = DemoPlatformStore()
    store.simulate_demo_event(DEMO_REQUEST_ID, "PRODUCTION_DELAYED", DEMO_MANUFACTURER_ID, "MANUFACTURER", {"delay_days": 10})
    before = store._requests[DEMO_REQUEST_ID]["confidence_score"]
    store.simulate_demo_event(
        DEMO_REQUEST_ID, "EVIDENCE_ADDED", DEMO_MANUFACTURER_ID, "MANUFACTURER", {"confidence_boost": 12}
    )
    assert store._requests[DEMO_REQUEST_ID]["confidence_score"] > before


def test_financing_health_endpoint_data():
    store = DemoPlatformStore()
    health = store.financing_health(DEMO_REQUEST_ID, DEMO_MANUFACTURER_ID)
    assert health["confidence_score"] == 68
    assert health["remaining_capacity"] == 3_800_000
