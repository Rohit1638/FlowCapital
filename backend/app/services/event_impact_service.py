from typing import Any

from app.core.config import get_settings


def mismatch_severity(difference_pct: float) -> str:
    settings = get_settings()
    if difference_pct < settings.mismatch_low_pct:
        return "LOW"
    if difference_pct < settings.mismatch_medium_pct:
        return "MEDIUM"
    if difference_pct < settings.mismatch_high_pct:
        return "HIGH"
    return "CRITICAL"


def interpret_event(event_type: str, payload: dict[str, Any]) -> dict[str, Any]:
    """Foundational deterministic interpretation only. Full Module 3/4/5 engines stay on the frontend."""
    effects: dict[str, Any] = {
        "event_type": event_type,
        "asset_updates": {},
        "create_verification": None,
        "create_conflict": None,
        "resolve_conflict_type": None,
    }

    if event_type in {"PRODUCTION_PROGRESS_UPDATED", "PRODUCTION_COMPLETED"}:
        completion = payload.get("completionPercentage", payload.get("productionCompletion", payload.get("completion")))
        if isinstance(completion, (int, float)):
            effects["asset_updates"]["metadata_production_completion"] = completion
            if completion >= 100:
                effects["asset_updates"]["lifecycle_stage"] = "FINISHED_GOODS"
        value = payload.get("value", payload.get("currentValue"))
        if isinstance(value, (int, float)):
            effects["asset_updates"]["metadata_current_value"] = value

    if event_type in {"QUALITY_VERIFIED", "QUALITY_CHECK_COMPLETED", "ASSET_VERIFIED", "DOCUMENT_VERIFIED"}:
        effects["create_verification"] = {
            "verification_type": event_type,
            "status": "VERIFIED",
            "confidence_score": int(payload.get("confidence", 92)),
        }
        effects["asset_updates"]["metadata_verification_status"] = "VERIFIED"

    if event_type in {"SHIPMENT_LOCATION_UPDATED", "LOCATION_UPDATED", "LOCATION_VERIFIED"}:
        location = payload.get("location")
        if isinstance(location, str):
            effects["asset_updates"]["current_location"] = location

    if event_type in {"SHIPMENT_DELAY_DETECTED", "SHIPMENT_DELAYED"}:
        hours = payload.get("delayHours", 12)
        effects["asset_updates"]["metadata_shipment_status"] = "Delayed"
        if isinstance(hours, (int, float)) and hours >= 48:
            effects["create_conflict"] = {
                "conflict_type": "LOCATION_MISMATCH",
                "severity": "HIGH",
                "description": "Shipment delay detected on the current logistics path.",
                "expected_value": "On schedule",
                "actual_value": f"Delayed {hours}h",
                "difference_value": str(hours),
            }

    if event_type == "QUANTITY_MISMATCH_DETECTED":
        expected = float(payload.get("expectedQuantity", payload.get("expected", 0)) or 0)
        actual = float(payload.get("actualQuantity", payload.get("actual", 0)) or 0)
        difference = abs(expected - actual)
        pct = (difference / expected * 100) if expected else 100
        effects["create_conflict"] = {
            "conflict_type": "QUANTITY_MISMATCH",
            "severity": mismatch_severity(pct),
            "description": f"Quantity mismatch of {difference:.0f} units ({pct:.1f}%).",
            "expected_value": str(int(expected) if expected == int(expected) else expected),
            "actual_value": str(int(actual) if actual == int(actual) else actual),
            "difference_value": str(int(difference) if difference == int(difference) else difference),
        }
        effects["create_verification"] = {
            "verification_type": "QUANTITY",
            "status": "FAILED",
            "confidence_score": max(20, 80 - int(pct)),
        }
        effects["asset_updates"]["metadata_verification_status"] = "MISMATCH"
        effects["asset_updates"]["status"] = "WATCH"

    if event_type in {"CONFLICT_RESOLVED", "QUANTITY_VERIFIED"}:
        effects["resolve_conflict_type"] = "QUANTITY_MISMATCH" if event_type == "QUANTITY_VERIFIED" else payload.get("conflictType")
        effects["create_verification"] = {
            "verification_type": "QUANTITY",
            "status": "VERIFIED",
            "confidence_score": 90,
        }
        effects["asset_updates"]["metadata_verification_status"] = "VERIFIED"
        effects["asset_updates"]["status"] = "ACTIVE"

    if event_type == "FINISHED_GOODS_CONFIRMED":
        effects["asset_updates"]["lifecycle_stage"] = "FINISHED_GOODS"

    if event_type == "WAREHOUSE_RECEIVED":
        effects["asset_updates"]["lifecycle_stage"] = "WAREHOUSE"

    return effects
