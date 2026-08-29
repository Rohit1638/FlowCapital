from __future__ import annotations

import copy
import random
import uuid
from datetime import datetime, timezone
from typing import Any

from app.core.risk_constants import RISK_ALERT_CONFIDENCE_THRESHOLD
from app.services.simulation_confidence import (
    band_for_simulation_confidence,
    calculate_simulation_confidence,
    evaluate_simulation_risk,
)

SIMULATION_STAGES = [
    "PO_SIGNED",
    "RAW_MATERIAL",
    "PRODUCTION",
    "FINISHED_GOODS",
    "IN_TRANSIT",
    "INVOICED",
    "SETTLED",
]

STAGE_PROGRESS = {
    "PO_SIGNED": 18,
    "RAW_MATERIAL": 35,
    "PRODUCTION": 58,
    "FINISHED_GOODS": 75,
    "IN_TRANSIT": 85,
    "INVOICED": 95,
    "SETTLED": 100,
}

STAGE_EVENT_POOL: dict[str, list[dict[str, Any]]] = {
    "PO_SIGNED": [
        {"event_type": "PO_VERIFIED", "description": "Purchase order successfully verified.", "severity": "info", "delay_days": 0, "impact_score": 1},
        {"event_type": "PO_AMOUNT_CHANGED", "description": "Purchase order amount adjusted after buyer confirmation.", "severity": "warning", "delay_days": 0, "impact_score": 5},
        {"event_type": "BUYER_CONFIRMATION_DELAYED", "description": "Buyer confirmation delayed by 2 days.", "severity": "warning", "delay_days": 2, "impact_score": 6},
        {"event_type": "PO_DOCUMENT_MISMATCH", "description": "PO document mismatch — buyer terms differ from contract.", "severity": "critical", "delay_days": 4, "impact_score": 10},
    ],
    "RAW_MATERIAL": [
        {"event_type": "RAW_MATERIAL_RECEIVED", "description": "Raw material received — inventory updated.", "severity": "info", "delay_days": 0, "impact_score": 1},
        {"event_type": "PARTIAL_MATERIAL_RECEIVED", "description": "Partial raw material received (920 / 1,000 units).", "severity": "warning", "delay_days": 0, "quantity_pct": 0.92, "impact_score": 5},
        {"event_type": "SUPPLIER_DELAY", "description": "Supplier delay — raw material arrival postponed.", "severity": "warning", "delay_days": 5, "impact_score": 7},
        {"event_type": "MATERIAL_QUANTITY_DISCREPANCY", "description": "Material quantity discrepancy detected at intake.", "severity": "warning", "delay_days": 0, "quantity_pct": 0.88, "impact_score": 8},
        {"event_type": "SUPPLIER_CONTRACT_BREACH", "description": "Supplier failed to deliver contracted batch — intake halted.", "severity": "critical", "delay_days": 11, "quantity_pct": 0.72, "impact_score": 14},
    ],
    "PRODUCTION": [
        {"event_type": "PRODUCTION_PROGRESSING", "description": "Production progressing normally.", "severity": "info", "delay_days": 0, "quantity_pct": 0.58, "impact_score": 1},
        {"event_type": "PRODUCTION_AHEAD", "description": "Production ahead of schedule — 62% complete.", "severity": "info", "delay_days": 0, "quantity_pct": 0.62, "impact_score": 2},
        {"event_type": "PRODUCTION_DELAY", "description": "Production delay detected — progress slowed by 8%.", "severity": "warning", "delay_days": 9, "quantity_pct": 0.50, "impact_score": 9},
        {"event_type": "PRODUCTION_QUANTITY_CHANGED", "description": "Production plan quantity changed from 800 → 1,000 units.", "severity": "warning", "delay_days": 0, "quantity_pct": 0.55, "impact_score": 6},
        {"event_type": "MANUFACTURING_BOTTLENECK", "description": "Manufacturing bottleneck on assembly line.", "severity": "warning", "delay_days": 6, "quantity_pct": 0.52, "impact_score": 8},
        {"event_type": "PRODUCTION_HALT", "description": "Production line halted — critical component shortage.", "severity": "critical", "delay_days": 12, "quantity_pct": 0.38, "impact_score": 16},
        {"event_type": "QUALITY_FAILURE_DETECTED", "description": "Batch quality failure — 18% units rejected.", "severity": "critical", "delay_days": 7, "quantity_pct": 0.45, "impact_score": 13},
    ],
    "FINISHED_GOODS": [
        {"event_type": "PRODUCTION_COMPLETED", "description": "Production completed — finished goods ready.", "severity": "info", "delay_days": 0, "quantity_pct": 1.0},
        {"event_type": "QUALITY_CHECK_PASSED", "description": "Quality check passed for finished goods batch.", "severity": "info", "delay_days": 0, "quantity_pct": 1.0},
        {"event_type": "QUALITY_CHECK_DELAYED", "description": "Quality check delayed pending inspection.", "severity": "warning", "delay_days": 4, "quantity_pct": 0.95},
        {"event_type": "PARTIAL_COMPLETION", "description": "Partial completion — 920 units passed quality check.", "severity": "warning", "delay_days": 0, "quantity_pct": 0.92},
    ],
    "IN_TRANSIT": [
        {"event_type": "SHIPMENT_DISPATCHED", "description": "Shipment dispatched to buyer warehouse.", "severity": "info", "delay_days": 0, "impact_score": 2},
        {"event_type": "SHIPMENT_DELAYED", "description": "Shipment delayed due to logistics constraints.", "severity": "warning", "delay_days": 5, "impact_score": 7},
        {"event_type": "DELIVERY_AHEAD", "description": "Delivery completed ahead of schedule.", "severity": "info", "delay_days": 0, "impact_score": 2},
        {"event_type": "CARGO_DAMAGE_REPORTED", "description": "Cargo damage reported in transit — insurance claim opened.", "severity": "critical", "delay_days": 8, "impact_score": 12},
    ],
    "INVOICED": [
        {"event_type": "INVOICE_ISSUED", "description": "Invoice issued to buyer for delivered goods.", "severity": "info", "delay_days": 0},
        {"event_type": "INVOICE_AMOUNT_CHANGED", "description": "Invoice amount adjusted after final reconciliation.", "severity": "warning", "delay_days": 0},
        {"event_type": "INVOICE_DELAYED", "description": "Invoice issuance delayed pending documentation.", "severity": "warning", "delay_days": 3},
    ],
    "SETTLED": [
        {"event_type": "PAYMENT_RECEIVED", "description": "Full payment received — financing lifecycle closing.", "severity": "info", "delay_days": 0},
        {"event_type": "PARTIAL_PAYMENT_RECEIVED", "description": "Partial payment received from buyer.", "severity": "warning", "delay_days": 0},
        {"event_type": "SETTLEMENT_DELAYED", "description": "Settlement delayed — payment pending.", "severity": "warning", "delay_days": 7},
    ],
}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _financial_impact(event_type: str, state: dict[str, Any]) -> dict[str, Any]:
    event_upper = event_type.upper()
    impact = {"summary": "No material financial impact.", "exposure_change": 0, "completion_shift_days": 0}

    if "DELAY" in event_upper or "BOTTLENECK" in event_upper:
        shift = state.get("delay_days", 0)
        impact = {
            "summary": "Expected completion timeline may shift. Financing exposure remains outstanding longer.",
            "exposure_change": 0,
            "completion_shift_days": shift,
        }
    elif "MISMATCH" in event_upper or "DISCREPANCY" in event_upper or "QUANTITY" in event_upper:
        impact = {
            "summary": "Funding requirement or collateral alignment may require review.",
            "exposure_change": 0,
            "completion_shift_days": 0,
        }
    elif "PRODUCTION_AHEAD" in event_upper or "COMPLETED" in event_upper or "DELIVERY_AHEAD" in event_upper:
        impact = {
            "summary": "Completion estimate improved — confidence in near-term repayment may increase.",
            "exposure_change": 0,
            "completion_shift_days": -3,
        }
    elif "PAYMENT_RECEIVED" in event_upper:
        impact = {
            "summary": "Exposure decreasing — financing lifecycle approaching settlement.",
            "exposure_change": -state.get("financing_exposure", 0) * 0.5,
            "completion_shift_days": 0,
        }
    elif "PRODUCTION_DELAY" in event_upper:
        impact = {
            "summary": "Potential financing exposure increased due to extended production timeline.",
            "exposure_change": state.get("funding_requested", 0) * 0.05,
            "completion_shift_days": state.get("delay_days", 0),
        }

    return impact


def _deterministic_ai_insight(event: dict[str, Any], state: dict[str, Any], role: str) -> str:
    conf_before = event.get("confidence_before", state["confidence_score"])
    conf_after = event.get("confidence_after", state["confidence_score"])
    event_type = event.get("event_type", "")
    band = band_for_simulation_confidence(conf_after)

    if role == "LENDER":
        return (
            f"EVENT IMPACT\n\n"
            f"Latest event: {event_type.replace('_', ' ')}\n"
            f"Confidence: {conf_before} → {conf_after} ({band.label})\n\n"
            f"FINANCING IMPLICATION\n"
            f"{event.get('financial_impact', {}).get('summary', 'Review operational evidence.')}\n\n"
            f"RECOMMENDED NEXT STEP\n"
            f"A lender may consider reviewing updated production evidence before adjusting exposure."
        )

    return (
        f"EVENT IMPACT\n\n"
        f"What changed: {event.get('description', '')}\n"
        f"Confidence: {conf_before} → {conf_after}\n\n"
        f"Why it matters\n"
        f"{event.get('financial_impact', {}).get('summary', 'Operational conditions changed.')}\n\n"
        f"RECOMMENDED NEXT STEP\n"
        f"Update supporting documents and resolve any open operational issues to improve confidence."
    )


def _project_health_score(state: dict[str, Any]) -> float:
    """0–100 health derived from project data — drives positive vs negative event mix."""
    score = 50.0
    score += min(20, state.get("confidence_score", 70) * 0.2)
    score += min(15, state.get("collateral_coverage_pct", 50) * 0.15)
    score += min(10, state.get("production_progress", 0) * 0.1)
    score -= min(20, state.get("delay_days", 0) * 1.5)
    score -= state.get("open_conflicts", 0) * 8
    score -= state.get("critical_events_count", 0) * 5
    doc_factor = state.get("document_completeness_pct", 75)
    score += (doc_factor - 50) * 0.1
    return max(0, min(100, score))


def _request_stage_index(request: dict[str, Any]) -> tuple[str, int]:
    """Map production request stage to simulation stage and index."""
    stage_map = {
        "PURCHASE_ORDER": ("PO_SIGNED", 0),
        "RAW_MATERIAL": ("RAW_MATERIAL", 1),
        "PRODUCTION_STARTED": ("PRODUCTION", 2),
        "IN_PRODUCTION": ("PRODUCTION", 2),
        "QUALITY_CHECK": ("FINISHED_GOODS", 3),
        "FINISHED_GOODS": ("FINISHED_GOODS", 3),
        "WAREHOUSE": ("FINISHED_GOODS", 3),
        "SHIPMENT": ("IN_TRANSIT", 4),
        "DELIVERY": ("IN_TRANSIT", 4),
        "INVOICE": ("INVOICED", 5),
        "RECEIVABLE": ("INVOICED", 5),
        "SETTLEMENT": ("SETTLED", 6),
    }
    current = request.get("current_stage", "PO_SIGNED")
    if current in stage_map:
        return stage_map[current]
    progress = request.get("progress_pct", 0)
    if progress >= 95:
        return ("INVOICED", 5)
    if progress >= 75:
        return ("FINISHED_GOODS", 3)
    if progress >= 40:
        return ("PRODUCTION", 2)
    if progress >= 15:
        return ("RAW_MATERIAL", 1)
    return ("PO_SIGNED", 0)


def create_initial_state(request: dict[str, Any]) -> dict[str, Any]:
    collateral = sum(c.get("estimated_value", 0) for c in request.get("collateral", []))
    funding = request.get("required_funding_amount", 5_000_000)
    coverage = round((collateral / funding) * 100) if funding else 0
    starting_confidence = int(request.get("confidence_score", 72))
    sim_stage, stage_index = _request_stage_index(request)
    progress = request.get("progress_pct", STAGE_PROGRESS.get(sim_stage, 0))
    open_conflicts = int(request.get("open_conflicts", 0))
    doc_pct = int(request.get("document_completeness_pct", 75))

    seed_material = (
        hash(request.get("id", ""))
        ^ int(request.get("quantity", 1000))
        ^ int(request.get("verified_value", 0) // 1000)
        ^ starting_confidence
    ) & 0xFFFFFF

    return {
        "simulation_id": f"SIM-2026-{str(uuid.uuid4())[:4].upper()}",
        "request_id": request["id"],
        "request_code": request.get("request_code", "PR-EB-1000"),
        "manufacturer_name": request.get("manufacturer_name", "VoltRide Mobility Pvt. Ltd."),
        "product_name": request.get("product_name", "Electric Bikes"),
        "project_name": request.get("project_name", ""),
        "quantity_planned": request.get("quantity", 1000),
        "status": "READY",
        "mode": "MANUAL",
        "current_stage": sim_stage,
        "stage_index": stage_index,
        "confidence_score": starting_confidence,
        "starting_confidence": starting_confidence,
        "risk_level": "MODERATE_CONFIDENCE",
        "risk_band_label": "MODERATE CONFIDENCE",
        "production_progress": progress,
        "quantity_completed": int(request.get("quantity", 1000) * progress / 100),
        "delay_days": 0,
        "expected_completion_days": max(14, 60 - int(progress // 2)),
        "funding_requested": funding,
        "collateral_value": collateral,
        "collateral_coverage_pct": coverage,
        "financing_exposure": request.get("outstanding_exposure", 0),
        "starting_exposure": request.get("outstanding_exposure", 0),
        "open_conflicts": open_conflicts,
        "document_completeness_pct": doc_pct,
        "events": [],
        "confidence_history": [],
        "alerts": [],
        "ai_insight": None,
        "latest_event": None,
        "processing": False,
        "risk_events_count": 0,
        "critical_events_count": 0,
        "negative_event_streak": 0,
        "positive_event_streak": 0,
        "rng_seed": seed_material,
        "started_at": None,
        "updated_at": None,
        "completed_at": None,
        "generated_by": "simulation",
    }


def _simulation_rng(state: dict[str, Any]) -> random.Random:
    seed = int(state.get("rng_seed", 42)) + len(state.get("events", []))
    return random.Random(seed)


def _event_weights(pool: list[dict[str, Any]]) -> list[float]:
    weights: list[float] = []
    for event in pool:
        severity = event.get("severity", "info")
        if severity == "critical":
            weights.append(0.35)
        elif severity == "warning":
            weights.append(0.9)
        else:
            weights.append(1.0)
    return weights


def _pick_event_template(state: dict[str, Any], pool: list[dict[str, Any]], rng: random.Random) -> dict[str, Any]:
    """Pick events — mostly positive; critical outcomes are intentionally rare."""
    health = _project_health_score(state)
    confidence = int(state.get("confidence_score", 70))
    positive = [e for e in pool if e.get("severity") == "info"]
    negative = [e for e in pool if e.get("severity") in ("warning", "critical")]

    if not positive and not negative:
        return pool[0]

    # Recovery mode: after stress, strongly favour positive operational events.
    if confidence < 48 and positive:
        return rng.choice(positive)

    positive_prob = 0.93 + (health / 100) * 0.05
    streak = state.get("negative_event_streak", 0)
    if streak >= 1:
        positive_prob = min(0.98, positive_prob + 0.04)
    if state.get("critical_events_count", 0) >= 1:
        positive_prob = min(0.99, positive_prob + 0.03)

    if rng.random() < positive_prob and positive:
        return rng.choice(positive)

    if negative:
        warnings = [e for e in negative if e.get("severity") == "warning"]
        critical = [e for e in negative if e.get("severity") == "critical"]
        if (
            critical
            and health < 25
            and state.get("critical_events_count", 0) == 0
            and confidence >= 72
            and rng.random() < 0.04
        ):
            return rng.choice(critical)
        if warnings and rng.random() < 0.22:
            return rng.choice(warnings)
        if positive:
            return rng.choice(positive)

    return rng.choice(positive) if positive else pool[0]


def start_simulation(state: dict[str, Any]) -> dict[str, Any]:
    state = copy.deepcopy(state)
    state["status"] = "RUNNING"
    state["mode"] = "MANUAL"
    state["rng_seed"] = (state.get("rng_seed", 42) ^ int(_now().timestamp() * 1000)) & 0xFFFFFF
    state["started_at"] = _now().isoformat()
    state["updated_at"] = state["started_at"]

    rng = _simulation_rng(state)
    stage = state["current_stage"]
    pool = STAGE_EVENT_POOL.get(stage, STAGE_EVENT_POOL["PO_SIGNED"])
    positive = [e for e in pool if e.get("severity") == "info"]
    event_template = rng.choice(positive) if positive else _pick_event_template(state, pool, rng)
    event = _build_event(state, event_template, advance_stage=False, rng=rng)
    _track_event_streak(state, event_template)
    state["events"].append(event)
    state["latest_event"] = event
    state["confidence_history"].append({"stage": stage, "confidence": state["confidence_score"]})
    state["ai_insight"] = _deterministic_ai_insight(event, state, "MANUFACTURER")
    return state


def _track_event_streak(state: dict[str, Any], template: dict[str, Any]) -> None:
    if template.get("severity") == "info":
        state["positive_event_streak"] = state.get("positive_event_streak", 0) + 1
        state["negative_event_streak"] = 0
    else:
        state["negative_event_streak"] = state.get("negative_event_streak", 0) + 1
        state["positive_event_streak"] = 0


def advance_simulation(state: dict[str, Any], rng: random.Random | None = None) -> dict[str, Any]:
    """Advance one lifecycle stage and generate an event."""
    state = copy.deepcopy(state)
    if state["status"] == "COMPLETED":
        raise ValueError("Simulation already completed")
    if state["processing"]:
        raise ValueError("Simulation is processing another event")

    state["processing"] = True
    try:
        next_index = state["stage_index"] + 1
        if next_index >= len(SIMULATION_STAGES):
            state["status"] = "COMPLETED"
            state["completed_at"] = _now().isoformat()
            state["production_progress"] = 100
            state["processing"] = False
            state["updated_at"] = _now().isoformat()
            return state

        stage = SIMULATION_STAGES[next_index]
        state["stage_index"] = next_index
        state["current_stage"] = stage
        state["production_progress"] = STAGE_PROGRESS[stage]

        pool = STAGE_EVENT_POOL[stage]
        r = rng or _simulation_rng(state)
        template = _pick_event_template(state, pool, r)

        event = _build_event(state, template, advance_stage=True, rng=r)
        _track_event_streak(state, template)
        state["events"].append(event)
        state["latest_event"] = event
        state["confidence_history"].append({"stage": stage, "confidence": state["confidence_score"]})

        risk = evaluate_simulation_risk(
            confidence_score=state["confidence_score"],
            delay_days=state["delay_days"],
            production_progress=state["production_progress"],
            financing_exposure=state["financing_exposure"],
            funding_requested=state["funding_requested"],
            event_type=event["event_type"],
        )
        state["risk_level"] = risk["risk_level"]
        state["risk_band_label"] = risk["risk_band_label"]

        if state["confidence_score"] < RISK_ALERT_CONFIDENCE_THRESHOLD:
            state["critical_events_count"] += 1
            alert = {
                "id": str(uuid.uuid4()),
                "type": "HIGH_RISK",
                "message": f"High risk event detected — confidence below {RISK_ALERT_CONFIDENCE_THRESHOLD}.",
                "timestamp": _now().isoformat(),
                "status": "GENERATED",
            }
            state["alerts"].append(alert)
        elif state["confidence_score"] < 60 or "DELAY" in event["event_type"]:
            state["risk_events_count"] += 1
            state["alerts"].append(
                {
                    "id": str(uuid.uuid4()),
                    "type": "RISK_EVENT",
                    "message": f"Risk event: {event['event_type'].replace('_', ' ')}",
                    "timestamp": _now().isoformat(),
                    "status": "GENERATED",
                }
            )

        state["ai_insight"] = _deterministic_ai_insight(event, state, "MANUFACTURER")

        if stage == "SETTLED":
            state["status"] = "COMPLETED"
            state["completed_at"] = _now().isoformat()
            state["quantity_completed"] = state["quantity_planned"]

        state["updated_at"] = _now().isoformat()
        return state
    finally:
        state["processing"] = False


def _build_event(
    state: dict[str, Any],
    template: dict[str, Any],
    advance_stage: bool,
    rng: random.Random | None = None,
) -> dict[str, Any]:
    event_type = template["event_type"]
    qty_pct = template.get("quantity_pct")
    if qty_pct is not None:
        state["quantity_completed"] = int(state["quantity_planned"] * qty_pct)
    delay = template.get("delay_days", 0)
    state["delay_days"] = delay
    if delay > 0:
        state["expected_completion_days"] = max(7, state["expected_completion_days"] + delay - 2)

    qty_variance = 0.0
    if qty_pct is not None and qty_pct < 1.0:
        qty_variance = (1.0 - qty_pct) * 100

    conf_result = calculate_simulation_confidence(
        previous_confidence=state["confidence_score"],
        event_type=event_type,
        production_progress=state["production_progress"],
        delay_days=delay,
        quantity_variance_pct=qty_variance,
        document_verified="VERIFIED" in event_type or "PO_VERIFIED" in event_type,
        collateral_coverage_pct=state["collateral_coverage_pct"],
        settlement_progress=100 if event_type == "PAYMENT_RECEIVED" else state["production_progress"],
        event_severity=template.get("severity", "info"),
        impact_score=int(template.get("impact_score", 1)),
        rng=rng or _simulation_rng(state),
        allow_critical_zone=template.get("severity") == "critical",
        recovery_mode=state.get("confidence_score", 100) < 52 or state.get("negative_event_streak", 0) >= 1,
    )

    state["confidence_score"] = max(58, min(94, int(conf_result["confidence_score"])))
    state["risk_level"] = conf_result["risk_level"]
    state["risk_band_label"] = conf_result["confidence_band"]

    financial = _financial_impact(event_type, state)
    exposure_change = financial.get("exposure_change", 0)
    if exposure_change:
        state["financing_exposure"] = max(0, state["financing_exposure"] + exposure_change)

    return {
        "id": str(uuid.uuid4()),
        "simulation_id": state["simulation_id"],
        "request_id": state["request_id"],
        "stage": state["current_stage"],
        "event_type": event_type,
        "timestamp": _now().isoformat(),
        "description": template["description"],
        "severity": template.get("severity", "info"),
        "confidence_before": conf_result["confidence_before"],
        "confidence_after": state["confidence_score"],
        "confidence_delta": conf_result["confidence_delta"],
        "confidence_factors": conf_result["factors"],
        "risk_level": conf_result["risk_level"],
        "production_progress": state["production_progress"],
        "quantity_completed": state["quantity_completed"],
        "quantity_planned": state["quantity_planned"],
        "delay_days": delay,
        "financial_impact": financial,
        "generated_by": "simulation",
        "metadata": {"advance_stage": advance_stage},
    }


def reset_simulation(request: dict[str, Any]) -> dict[str, Any]:
    return create_initial_state(request)
