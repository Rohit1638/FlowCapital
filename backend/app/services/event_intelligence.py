"""Event classification and severity for the Reassessment Agent."""

from __future__ import annotations

from enum import StrEnum
from typing import Any


class EventType(StrEnum):
    PRODUCTION_STARTED = "PRODUCTION_STARTED"
    PRODUCTION_PROGRESS_UPDATED = "PRODUCTION_PROGRESS_UPDATED"
    PRODUCTION_DELAYED = "PRODUCTION_DELAYED"
    PRODUCTION_COMPLETED = "PRODUCTION_COMPLETED"
    QUANTITY_UPDATED = "QUANTITY_UPDATED"
    QUALITY_VERIFIED = "QUALITY_VERIFIED"
    QUALITY_FAILED = "QUALITY_FAILED"
    ASSET_VALUE_UPDATED = "ASSET_VALUE_UPDATED"
    ASSET_VERIFIED = "ASSET_VERIFIED"
    ASSET_VERIFICATION_FAILED = "ASSET_VERIFICATION_FAILED"
    DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED"
    DOCUMENT_EXPIRED = "DOCUMENT_EXPIRED"
    DOCUMENT_VERIFIED = "DOCUMENT_VERIFIED"
    DOCUMENT_REJECTED = "DOCUMENT_REJECTED"
    EVIDENCE_ADDED = "EVIDENCE_ADDED"
    EVIDENCE_CONFLICT_DETECTED = "EVIDENCE_CONFLICT_DETECTED"
    EVIDENCE_CONFLICT_RESOLVED = "EVIDENCE_CONFLICT_RESOLVED"
    WAREHOUSE_VERIFIED = "WAREHOUSE_VERIFIED"
    WAREHOUSE_MISMATCH = "WAREHOUSE_MISMATCH"
    INVENTORY_UPDATED = "INVENTORY_UPDATED"
    INVENTORY_SHORTAGE = "INVENTORY_SHORTAGE"
    GOODS_SHIPPED = "GOODS_SHIPPED"
    GOODS_DELIVERED = "GOODS_DELIVERED"
    INVOICE_CREATED = "INVOICE_CREATED"
    RECEIVABLE_CREATED = "RECEIVABLE_CREATED"
    PAYMENT_RECEIVED = "PAYMENT_RECEIVED"
    PAYMENT_DELAYED = "PAYMENT_DELAYED"
    COLLATERAL_UPDATED = "COLLATERAL_UPDATED"
    COLLATERAL_RELEASED = "COLLATERAL_RELEASED"
    RISK_THRESHOLD_CROSSED = "RISK_THRESHOLD_CROSSED"
    CONFIDENCE_THRESHOLD_CROSSED = "CONFIDENCE_THRESHOLD_CROSSED"
    EXPOSURE_THRESHOLD_CROSSED = "EXPOSURE_THRESHOLD_CROSSED"
    MANUAL_REASSESSMENT_REQUESTED = "MANUAL_REASSESSMENT_REQUESTED"
    SIMULATION_LIFECYCLE_EVENT = "SIMULATION_LIFECYCLE_EVENT"
    SYSTEM_DATA_CORRECTION = "SYSTEM_DATA_CORRECTION"


class EventSeverity(StrEnum):
    INFO = "INFO"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


SEVERITY_RULES: dict[str, EventSeverity] = {
    EventType.PRODUCTION_PROGRESS_UPDATED: EventSeverity.INFO,
    EventType.DOCUMENT_UPLOADED: EventSeverity.LOW,
    EventType.EVIDENCE_ADDED: EventSeverity.LOW,
    EventType.QUALITY_VERIFIED: EventSeverity.LOW,
    EventType.PRODUCTION_DELAYED: EventSeverity.MEDIUM,
    EventType.QUANTITY_UPDATED: EventSeverity.MEDIUM,
    EventType.ASSET_VALUE_UPDATED: EventSeverity.MEDIUM,
    EventType.DOCUMENT_EXPIRED: EventSeverity.MEDIUM,
    EventType.INVENTORY_SHORTAGE: EventSeverity.HIGH,
    EventType.WAREHOUSE_MISMATCH: EventSeverity.HIGH,
    EventType.QUALITY_FAILED: EventSeverity.HIGH,
    EventType.EVIDENCE_CONFLICT_DETECTED: EventSeverity.CRITICAL,
    EventType.ASSET_VERIFICATION_FAILED: EventSeverity.CRITICAL,
    EventType.EXPOSURE_THRESHOLD_CROSSED: EventSeverity.CRITICAL,
}


def classify_severity(event_type: str, metadata: dict[str, Any] | None = None) -> EventSeverity:
    meta = metadata or {}
    if event_type in SEVERITY_RULES:
        base = SEVERITY_RULES[event_type]
        if event_type == EventType.PRODUCTION_DELAYED.value:
            days = int(meta.get("delay_days", meta.get("value", 0)) or 0)
            if days >= 7:
                return EventSeverity.HIGH
        if event_type == EventType.QUANTITY_UPDATED.value:
            pct = abs(float(meta.get("change_pct", 0) or 0))
            if pct >= 25:
                return EventSeverity.HIGH
        return base
    if "CRITICAL" in event_type or "FAIL" in event_type:
        return EventSeverity.CRITICAL
    if "DELAY" in event_type or "MISMATCH" in event_type or "CONFLICT" in event_type:
        return EventSeverity.HIGH
    if "COMPLETED" in event_type or "VERIFIED" in event_type:
        return EventSeverity.LOW
    return EventSeverity.MEDIUM


CONFIDENCE_BANDS = [
    (90, "VERY_HIGH"),
    (75, "HIGH"),
    (60, "MODERATE"),
    (40, "LOW"),
    (0, "CRITICAL"),
]


def confidence_band(score: int) -> str:
    for threshold, label in CONFIDENCE_BANDS:
        if score >= threshold:
            return label
    return "CRITICAL"


RISK_ORDER = {"LOW": 1, "MODERATE": 2, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4, "ELEVATED": 2}


def normalize_risk(risk: str) -> str:
    r = str(risk).upper()
    if r in ("MODERATE", "MEDIUM"):
        return "MODERATE"
    if r in ("ELEVATED",):
        return "MODERATE"
    return r if r in ("LOW", "HIGH", "CRITICAL") else "MODERATE"
