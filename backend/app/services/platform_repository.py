"""Postgres repository — maps DemoPlatformStore state to Supabase schema tables."""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, TYPE_CHECKING

from sqlalchemy import text

from app.core.auth import (
    DEMO_AGGRESSIVE_LENDER_ID,
    DEMO_CONSERVATIVE_LENDER_ID,
    DEMO_LENDER_ID,
    DEMO_MANUFACTURER_ID,
)
from app.core.database import get_session_factory, ping_database, resolve_database_url
from app.core.logging import get_logger

if TYPE_CHECKING:
    from app.services.demo_platform_store import DemoPlatformStore

logger = get_logger("platform_repository")
DB_DIR = Path(__file__).resolve().parents[2] / "database"
DEMO_REQUEST_ID = "00000000-0000-4000-8000-000000000100"

SCHEMA_FILES = (
    "schema_module_6a.sql",
    "schema_platform_extensions.sql",
)


def _json(value: Any) -> str:
    return json.dumps(value, default=str)


def _uuid(value: str | None) -> str | None:
    if not value:
        return None
    try:
        return str(uuid.UUID(str(value)))
    except ValueError:
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, str(value)))


class PlatformRepository:
    def __init__(self) -> None:
        self._bootstrapped = False

    def is_available(self) -> bool:
        return ping_database()

    def bootstrap(self) -> bool:
        if not self.is_available():
            logger.warning("Postgres unavailable — using local fallback storage")
            return False
        if self._bootstrapped:
            return True
        session = get_session_factory()()
        try:
            has_platform = session.execute(
                text("SELECT to_regclass('public.production_requests') IS NOT NULL")
            ).scalar()
            if not has_platform:
                conn = session.connection()
                for name in SCHEMA_FILES:
                    path = DB_DIR / name
                    if not path.exists():
                        continue
                    conn.exec_driver_sql(path.read_text(encoding="utf-8"))
                session.commit()
            self._seed_demo_profiles(session)
            self._seed_demo_request_if_empty(session)
            session.commit()
            self._bootstrapped = True
            logger.info("Postgres bootstrap complete (%s)", resolve_database_url().split("@")[-1] if resolve_database_url() else "")
            return True
        except Exception as exc:
            session.rollback()
            logger.warning("Postgres bootstrap failed: %s", exc)
            return False
        finally:
            session.close()

    def _seed_demo_profiles(self, session) -> None:
        profiles = [
            (DEMO_MANUFACTURER_ID, "Demo Manufacturer", "manufacturer_demo@flowcapital.internal", "MANUFACTURER", "VoltRide Mobility Pvt. Ltd.", "+919943666848"),
            (DEMO_LENDER_ID, "Demo Lender", "lender_demo@flowcapital.internal", "LENDER", "Balanced Growth Capital", "+919043775875"),
            (DEMO_CONSERVATIVE_LENDER_ID, "Conservative Lender", "conservative_demo@flowcapital.internal", "LENDER", "Conservative Capital Partners", "+919943666848"),
            (DEMO_AGGRESSIVE_LENDER_ID, "Aggressive Lender", "aggressive_demo@flowcapital.internal", "LENDER", "Aggressive Supply Chain Capital", "+919943666848"),
        ]
        for pid, name, email, role, company, phone in profiles:
            session.execute(
                text(
                    """
                    INSERT INTO profiles (id, full_name, email, organization_name, role, company_name, designation, phone)
                    VALUES (CAST(:id AS uuid), :name, :email, :company, :role, :company, 'Member', :phone)
                    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, updated_at = NOW()
                    """
                ),
                {"id": pid, "name": name, "email": email, "role": role, "company": company, "phone": phone},
            )
            if role == "LENDER":
                session.execute(
                    text(
                        """
                        INSERT INTO lender_profiles (profile_id, lender_name)
                        SELECT CAST(:id AS uuid), :company
                        WHERE NOT EXISTS (SELECT 1 FROM lender_profiles lp WHERE lp.profile_id = CAST(:id AS uuid))
                        """
                    ),
                    {"id": pid, "company": company},
                )

    def _ensure_financing_request(self, session, req: dict[str, Any]) -> str:
        fin_id = "00000000-0000-4000-8000-000000000101"
        session.execute(
            text(
                """
                INSERT INTO financing_requests (
                    id, production_request_id, manufacturer_id, requested_amount, status
                ) VALUES (CAST(:id AS uuid), CAST(:req AS uuid), CAST(:mfg AS uuid), :amount, 'PENDING')
                ON CONFLICT (id) DO NOTHING
                """
            ),
            {"id": fin_id, "req": _uuid(req["id"]), "mfg": _uuid(req["manufacturer_id"]), "amount": req["required_funding_amount"]},
        )
        return fin_id

    def _seed_demo_request_if_empty(self, session) -> None:
        count = session.execute(text("SELECT COUNT(*) FROM production_requests")).scalar() or 0
        if count > 0:
            return
        from app.services.demo_platform_store import _base_request

        req = _base_request()
        self._upsert_request(session, req, skip_tranches=True)
        fin_id = self._ensure_financing_request(session, req)
        for tr in req.get("tranches", []):
            session.execute(
                text(
                    """
                    INSERT INTO financing_tranches (
                        id, tranche_code, production_request_id, financing_request_id, lender_id,
                        approved_amount, outstanding_amount, instrument, status, metadata
                    ) VALUES (
                        CAST(:id AS uuid), :code, CAST(:req AS uuid), CAST(:fin AS uuid), CAST(:lender AS uuid),
                        :approved, :outstanding, :instrument, :status, CAST(:meta AS jsonb)
                    )
                    ON CONFLICT (tranche_code) DO UPDATE SET
                        outstanding_amount = EXCLUDED.outstanding_amount,
                        status = EXCLUDED.status,
                        updated_at = NOW()
                    """
                ),
                {
                    "id": _uuid(tr.get("id", str(uuid.uuid4()))),
                    "code": tr.get("tranche_code", f"TR-{uuid.uuid4().hex[:8]}"),
                    "req": _uuid(req["id"]),
                    "fin": fin_id,
                    "lender": _uuid(tr["lender_id"]),
                    "approved": tr.get("approved_amount", 0),
                    "outstanding": tr.get("outstanding_amount", 0),
                    "instrument": tr.get("instrument", "PURCHASE_FINANCE"),
                    "status": tr.get("status", "ACTIVE"),
                    "meta": _json({"lender_name": tr.get("lender_name")}),
                },
            )

    def hydrate_store(self, store: "DemoPlatformStore") -> bool:
        if not self.bootstrap():
            return False
        session = get_session_factory()()
        try:
            rows = session.execute(text("SELECT id::text FROM production_requests")).fetchall()
            if rows:
                store._requests = {}
                for (rid,) in rows:
                    loaded = self._load_request(session, rid)
                    if loaded:
                        store._requests[rid] = loaded
            store._offers = self._load_offers(session)
            store._exposure_entries = self._load_exposure_entries(session)
            store._exposure_history = self._load_exposure_history(session)
            store._exposure = store._exposure.__class__(store._exposure_entries, store._exposure_history)
            store._transitions = self._load_transitions(session)
            store._reassessment_records = self._load_reassessments(session)
            store._intelligence_events = self._load_intelligence_events(session)
            store._simulations = self._load_simulations(session)
            store._notifications = self._load_notifications(session)
            store._risk_alerts = self._load_risk_alerts(session)
            if not store._reassessment_records:
                store._seed_baseline_reassessment()
            return True
        except Exception as exc:
            logger.warning("hydrate_store failed: %s", exc)
            return False
        finally:
            session.close()

    def persist_simulation(self, request_id: str, sim: dict[str, Any]) -> bool:
        """Fast path — upsert one simulation session without syncing the whole store."""
        if not self.bootstrap():
            return False
        session = get_session_factory()()
        try:
            rid = _uuid(request_id)
            session.execute(
                text(
                    """
                    DELETE FROM simulation_events
                    WHERE simulation_session_id IN (
                        SELECT id FROM simulation_sessions WHERE production_request_id = CAST(:req AS uuid)
                    )
                    """
                ),
                {"req": rid},
            )
            session.execute(
                text("DELETE FROM simulation_sessions WHERE production_request_id = CAST(:req AS uuid)"),
                {"req": rid},
            )
            meta = {k: v for k, v in sim.items() if k not in (
                "simulation_id", "request_id", "status", "mode", "current_stage", "stage_index",
                "confidence_score", "starting_confidence", "risk_level", "production_progress",
                "quantity_planned", "quantity_completed", "delay_days", "expected_completion_days",
                "funding_requested", "financing_exposure",
            )}
            sid = str(uuid.uuid4())
            session.execute(
                text(
                    """
                    INSERT INTO simulation_sessions (
                        id, simulation_code, production_request_id, status, mode, current_stage, stage_index,
                        confidence_score, starting_confidence, risk_level, production_progress,
                        quantity_planned, quantity_completed, delay_days, expected_completion_days,
                        funding_requested, financing_exposure, metadata, started_at, completed_at
                    ) VALUES (
                        CAST(:id AS uuid), :code, CAST(:req AS uuid), :status, :mode, :stage, :idx,
                        :conf, :start_conf, :risk, :progress,
                        :qty_p, :qty_c, :delay, :exp_days,
                        :fund, :exposure, CAST(:meta AS jsonb), CAST(:started AS timestamptz), CAST(:completed AS timestamptz)
                    )
                    """
                ),
                {
                    "id": sid,
                    "code": sim.get("simulation_id", f"SIM-{uuid.uuid4().hex[:6]}"),
                    "req": rid,
                    "status": sim.get("status", "READY"),
                    "mode": sim.get("mode", "MANUAL"),
                    "stage": sim.get("current_stage", "PO_SIGNED"),
                    "idx": sim.get("stage_index", 0),
                    "conf": sim.get("confidence_score", 68),
                    "start_conf": sim.get("starting_confidence", 68),
                    "risk": sim.get("risk_level", "MODERATE_CONFIDENCE"),
                    "progress": sim.get("production_progress", 0),
                    "qty_p": sim.get("quantity_planned", 0),
                    "qty_c": sim.get("quantity_completed", 0),
                    "delay": sim.get("delay_days", 0),
                    "exp_days": sim.get("expected_completion_days", 45),
                    "fund": sim.get("funding_requested", 0),
                    "exposure": sim.get("financing_exposure", 0),
                    "meta": _json(meta),
                    "started": sim.get("started_at"),
                    "completed": sim.get("completed_at"),
                },
            )
            for ev in sim.get("events", []):
                session.execute(
                    text(
                        """
                        INSERT INTO simulation_events (
                            simulation_session_id, production_request_id, stage, event_type, description,
                            severity, confidence_before, confidence_after, risk_level, production_progress,
                            financial_impact, metadata
                        ) VALUES (
                            CAST(:sid AS uuid), CAST(:req AS uuid), :stage, :etype, :desc,
                            :severity, :cb, :ca, :risk, :progress,
                            CAST(:impact AS jsonb), CAST(:meta AS jsonb)
                        )
                        """
                    ),
                    {
                        "sid": sid,
                        "req": rid,
                        "stage": ev.get("stage", sim.get("current_stage")),
                        "etype": ev.get("event_type"),
                        "desc": ev.get("description", ""),
                        "severity": ev.get("severity", "info"),
                        "cb": ev.get("confidence_before", 0),
                        "ca": ev.get("confidence_after", 0),
                        "risk": ev.get("risk_level", "MODERATE_CONFIDENCE"),
                        "progress": ev.get("production_progress", 0),
                        "impact": _json(ev.get("financial_impact", {})),
                        "meta": _json({}),
                    },
                )
            session.commit()
            return True
        except Exception as exc:
            session.rollback()
            logger.warning("persist_simulation failed: %s", exc)
            return False
        finally:
            session.close()

    def persist_store(self, store: "DemoPlatformStore") -> bool:
        if not self.is_available():
            return False
        session = get_session_factory()()
        try:
            self._seed_demo_profiles(session)
            for req in store._requests.values():
                fin_id = self._ensure_financing_request(session, req)
                self._upsert_request(session, req, fin_id=fin_id)
            self._replace_offers(session, store._offers)
            self._replace_exposure(session, store._exposure_entries, store._exposure_history)
            self._replace_transitions(session, store._transitions)
            self._replace_reassessments(session, store._reassessment_records)
            self._replace_intelligence_events(session, store._intelligence_events)
            self._replace_simulations(session, store._simulations)
            self._replace_notifications(session, store._notifications)
            self._replace_risk_alerts(session, store._risk_alerts)
            session.commit()
            return True
        except Exception as exc:
            session.rollback()
            logger.warning("persist_store failed: %s", exc)
            return False
        finally:
            session.close()

    def _upsert_request(self, session, req: dict[str, Any], *, fin_id: str | None = None, skip_tranches: bool = False) -> None:
        meta = {
            "manufacturer_name": req.get("manufacturer_name"),
            "decision_status": req.get("decision_status"),
            "open_conflicts": req.get("open_conflicts", 0),
            "document_completeness_pct": req.get("document_completeness_pct"),
            "maximum_safe_capacity": req.get("maximum_safe_capacity"),
            "financing_recommendation": req.get("financing_recommendation"),
            "capital_forecast": req.get("capital_forecast"),
            "current_financing_instrument": req.get("current_financing_instrument"),
            "instrument_lifecycle_stage": req.get("instrument_lifecycle_stage"),
            "events": req.get("events", []),
            "conflicts": req.get("conflicts", []),
            "decisions": req.get("decisions", []),
        }
        session.execute(
            text(
                """
                INSERT INTO production_requests (
                    id, request_code, manufacturer_id, project_name, product_name, product_category,
                    quantity, expected_selling_value, estimated_production_cost, required_funding_amount,
                    funding_purpose, expected_start_date, expected_completion_date, buyer_name,
                    purchase_order_reference, description, current_stage, progress_pct, status,
                    confidence_score, risk_level, verified_value, financeable_value, outstanding_exposure,
                    unclaimed_value, metadata
                ) VALUES (
                    CAST(:id AS uuid), :request_code, CAST(:manufacturer_id AS uuid), :project_name, :product_name, :product_category,
                    :quantity, :expected_selling_value, :estimated_production_cost, :required_funding_amount,
                    :funding_purpose, CAST(:expected_start_date AS date), CAST(:expected_completion_date AS date), :buyer_name,
                    :purchase_order_reference, :description, :current_stage, :progress_pct, :status,
                    :confidence_score, :risk_level, :verified_value, :financeable_value, :outstanding_exposure,
                    :unclaimed_value, CAST(:metadata AS jsonb)
                )
                ON CONFLICT (id) DO UPDATE SET
                    project_name = EXCLUDED.project_name,
                    current_stage = EXCLUDED.current_stage,
                    progress_pct = EXCLUDED.progress_pct,
                    status = EXCLUDED.status,
                    confidence_score = EXCLUDED.confidence_score,
                    risk_level = EXCLUDED.risk_level,
                    verified_value = EXCLUDED.verified_value,
                    financeable_value = EXCLUDED.financeable_value,
                    outstanding_exposure = EXCLUDED.outstanding_exposure,
                    unclaimed_value = EXCLUDED.unclaimed_value,
                    metadata = EXCLUDED.metadata,
                    updated_at = NOW()
                """
            ),
            {
                "id": _uuid(req["id"]),
                "request_code": req["request_code"],
                "manufacturer_id": _uuid(req["manufacturer_id"]),
                "project_name": req["project_name"],
                "product_name": req["product_name"],
                "product_category": req["product_category"],
                "quantity": req["quantity"],
                "expected_selling_value": req.get("expected_selling_value", 0),
                "estimated_production_cost": req.get("estimated_production_cost", 0),
                "required_funding_amount": req.get("required_funding_amount", 0),
                "funding_purpose": req.get("funding_purpose"),
                "expected_start_date": req.get("expected_start_date"),
                "expected_completion_date": req.get("expected_completion_date"),
                "buyer_name": req.get("buyer_name"),
                "purchase_order_reference": req.get("purchase_order_reference"),
                "description": req.get("description"),
                "current_stage": req.get("current_stage", "PURCHASE_ORDER"),
                "progress_pct": req.get("progress_pct", 0),
                "status": req.get("status", "DRAFT"),
                "confidence_score": req.get("confidence_score"),
                "risk_level": req.get("risk_level"),
                "verified_value": req.get("verified_value"),
                "financeable_value": req.get("financeable_value"),
                "outstanding_exposure": req.get("outstanding_exposure", 0),
                "unclaimed_value": req.get("unclaimed_value"),
                "metadata": _json(meta),
            },
        )
        session.execute(text("DELETE FROM collateral_assets WHERE production_request_id = CAST(:id AS uuid)"), {"id": _uuid(req["id"])})
        for col in req.get("collateral", []):
            session.execute(
                text(
                    """
                    INSERT INTO collateral_assets (
                        id, collateral_code, production_request_id, manufacturer_id, asset_name, asset_type,
                        quantity, unit, estimated_value, lifecycle_stage, location, already_pledged,
                        existing_financing_amount, metadata
                    ) VALUES (
                        CAST(:id AS uuid), :code, CAST(:req AS uuid), CAST(:mfg AS uuid), :name, :type,
                        :qty, :unit, :value, :stage, :location, :pledged,
                        :existing, CAST(:meta AS jsonb)
                    )
                    ON CONFLICT (id) DO NOTHING
                    """
                ),
                {
                    "id": _uuid(col.get("id", str(uuid.uuid4()))),
                    "code": col.get("collateral_code", f"COL-{uuid.uuid4().hex[:8]}"),
                    "req": _uuid(req["id"]),
                    "mfg": _uuid(req["manufacturer_id"]),
                    "name": col["asset_name"],
                    "type": col["asset_type"],
                    "qty": col.get("quantity", 0),
                    "unit": col.get("unit", "Units"),
                    "value": col.get("estimated_value", 0),
                    "stage": col.get("lifecycle_stage", "RAW_MATERIAL"),
                    "location": col.get("location"),
                    "pledged": col.get("already_pledged", False),
                    "existing": col.get("existing_financing_amount", 0),
                    "meta": _json({}),
                },
            )
        session.execute(text("DELETE FROM request_documents WHERE production_request_id = CAST(:id AS uuid)"), {"id": _uuid(req["id"])})
        for doc in req.get("documents", []):
            session.execute(
                text(
                    """
                    INSERT INTO request_documents (
                        id, manufacturer_id, production_request_id, document_name, document_type,
                        file_size_bytes, mime_type, status, verification_status, metadata, uploaded_at
                    ) VALUES (
                        CAST(:id AS uuid), CAST(:mfg AS uuid), CAST(:req AS uuid), :name, :type,
                        :size, :mime, :status, :vstatus, CAST(:meta AS jsonb), COALESCE(CAST(:uploaded AS timestamptz), NOW())
                    )
                    ON CONFLICT (id) DO NOTHING
                    """
                ),
                {
                    "id": _uuid(doc.get("id", str(uuid.uuid4()))),
                    "mfg": _uuid(req["manufacturer_id"]),
                    "req": _uuid(req["id"]),
                    "name": doc["document_name"],
                    "type": doc["document_type"],
                    "size": doc.get("file_size_bytes"),
                    "mime": doc.get("mime_type"),
                    "status": doc.get("status", "UPLOADED"),
                    "vstatus": doc.get("verification_status", "PENDING"),
                    "meta": _json({}),
                    "uploaded": doc.get("uploaded_at"),
                },
            )
        if not skip_tranches and req.get("tranches"):
            fin_id = fin_id or self._ensure_financing_request(session, req)
            for tr in req.get("tranches", []):
                session.execute(
                    text(
                        """
                        INSERT INTO financing_tranches (
                            id, tranche_code, production_request_id, financing_request_id, lender_id,
                            approved_amount, outstanding_amount, instrument, status, metadata
                        ) VALUES (
                            CAST(:id AS uuid), :code, CAST(:req AS uuid), CAST(:fin AS uuid), CAST(:lender AS uuid),
                            :approved, :outstanding, :instrument, :status, CAST(:meta AS jsonb)
                        )
                        ON CONFLICT (tranche_code) DO UPDATE SET
                            outstanding_amount = EXCLUDED.outstanding_amount,
                            status = EXCLUDED.status,
                            updated_at = NOW()
                        """
                    ),
                    {
                        "id": _uuid(tr.get("id", str(uuid.uuid4()))),
                        "code": tr.get("tranche_code", f"TR-{uuid.uuid4().hex[:8]}"),
                        "req": _uuid(req["id"]),
                        "fin": fin_id,
                        "lender": _uuid(tr["lender_id"]),
                        "approved": tr.get("approved_amount", 0),
                        "outstanding": tr.get("outstanding_amount", 0),
                        "instrument": tr.get("instrument", "PURCHASE_FINANCE"),
                        "status": tr.get("status", "ACTIVE"),
                        "meta": _json({"lender_name": tr.get("lender_name")}),
                    },
                )

    def _load_request(self, session, request_id: str) -> dict[str, Any] | None:
        row = session.execute(
            text("SELECT * FROM production_requests WHERE id = CAST(:id AS uuid)"),
            {"id": _uuid(request_id)},
        ).mappings().first()
        if not row:
            return None
        meta = row["metadata"] or {}
        if isinstance(meta, str):
            meta = json.loads(meta)
        req = {
            "id": str(row["id"]),
            "request_code": row["request_code"],
            "manufacturer_id": str(row["manufacturer_id"]),
            "manufacturer_name": meta.get("manufacturer_name", ""),
            "project_name": row["project_name"],
            "product_name": row["product_name"],
            "product_category": row["product_category"],
            "quantity": float(row["quantity"]),
            "expected_selling_value": float(row["expected_selling_value"] or 0),
            "estimated_production_cost": float(row["estimated_production_cost"] or 0),
            "required_funding_amount": float(row["required_funding_amount"] or 0),
            "funding_purpose": row["funding_purpose"],
            "expected_start_date": str(row["expected_start_date"]) if row["expected_start_date"] else None,
            "expected_completion_date": str(row["expected_completion_date"]) if row["expected_completion_date"] else None,
            "buyer_name": row["buyer_name"],
            "purchase_order_reference": row["purchase_order_reference"],
            "description": row["description"],
            "current_stage": row["current_stage"],
            "progress_pct": float(row["progress_pct"] or 0),
            "status": row["status"],
            "decision_status": meta.get("decision_status"),
            "confidence_score": row["confidence_score"],
            "risk_level": row["risk_level"],
            "verified_value": float(row["verified_value"] or 0) if row["verified_value"] is not None else None,
            "financeable_value": float(row["financeable_value"] or 0) if row["financeable_value"] is not None else None,
            "maximum_safe_capacity": meta.get("maximum_safe_capacity"),
            "outstanding_exposure": float(row["outstanding_exposure"] or 0),
            "unclaimed_value": float(row["unclaimed_value"] or 0) if row["unclaimed_value"] is not None else None,
            "open_conflicts": meta.get("open_conflicts", 0),
            "document_completeness_pct": meta.get("document_completeness_pct"),
            "financing_recommendation": meta.get("financing_recommendation"),
            "capital_forecast": meta.get("capital_forecast"),
            "current_financing_instrument": meta.get("current_financing_instrument"),
            "instrument_lifecycle_stage": meta.get("instrument_lifecycle_stage"),
            "events": meta.get("events", []),
            "conflicts": meta.get("conflicts", []),
            "decisions": meta.get("decisions", []),
            "created_at": row["created_at"].isoformat() if row["created_at"] else None,
            "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None,
        }
        cols = session.execute(
            text("SELECT * FROM collateral_assets WHERE production_request_id = CAST(:id AS uuid)"),
            {"id": _uuid(request_id)},
        ).mappings().all()
        req["collateral"] = [
            {
                "id": str(c["id"]),
                "collateral_code": c["collateral_code"],
                "asset_name": c["asset_name"],
                "asset_type": c["asset_type"],
                "quantity": float(c["quantity"]),
                "unit": c["unit"],
                "estimated_value": float(c["estimated_value"]),
                "lifecycle_stage": c["lifecycle_stage"],
                "location": c["location"],
                "already_pledged": c["already_pledged"],
                "existing_financing_amount": float(c["existing_financing_amount"] or 0),
            }
            for c in cols
        ]
        docs = session.execute(
            text("SELECT * FROM request_documents WHERE production_request_id = CAST(:id AS uuid)"),
            {"id": _uuid(request_id)},
        ).mappings().all()
        req["documents"] = [
            {
                "id": str(d["id"]),
                "document_name": d["document_name"],
                "document_type": d["document_type"],
                "verification_status": d["verification_status"],
                "status": d["status"],
                "file_size_bytes": d["file_size_bytes"],
                "mime_type": d["mime_type"],
                "uploaded_at": d["uploaded_at"].isoformat() if d["uploaded_at"] else None,
            }
            for d in docs
        ]
        tranches = session.execute(
            text("SELECT * FROM financing_tranches WHERE production_request_id = CAST(:id AS uuid)"),
            {"id": _uuid(request_id)},
        ).mappings().all()
        req["tranches"] = [
            {
                "id": str(t["id"]),
                "tranche_code": t["tranche_code"],
                "approved_amount": float(t["approved_amount"]),
                "outstanding_amount": float(t["outstanding_amount"]),
                "instrument": t["instrument"],
                "status": t["status"],
                "lender_id": str(t["lender_id"]),
                "lender_name": (t["metadata"] or {}).get("lender_name") if isinstance(t["metadata"], dict) else None,
            }
            for t in tranches
        ]
        return req

    def _load_offers(self, session) -> list[dict[str, Any]]:
        rows = session.execute(text("SELECT * FROM financing_offers ORDER BY created_at DESC")).mappings().all()
        return [self._offer_from_row(r) for r in rows]

    def _offer_from_row(self, row) -> dict[str, Any]:
        return {
            "id": str(row["id"]),
            "request_id": str(row["request_id"]),
            "lender_id": str(row["lender_id"]),
            "lender_name": row["lender_name"],
            "offered_amount": float(row["offered_amount"]),
            "interest_rate": float(row["interest_rate"]),
            "tenor_days": row["tenor_days"],
            "instrument_type": row["instrument_type"],
            "conditions": row["conditions"] or [],
            "notes": row["notes"],
            "status": row["status"],
            "created_at": row["created_at"].isoformat() if row["created_at"] else None,
        }

    def _replace_offers(self, session, offers: list[dict[str, Any]]) -> None:
        session.execute(text("DELETE FROM financing_offers"))
        for o in offers:
            session.execute(
                text(
                    """
                    INSERT INTO financing_offers (
                        id, request_id, production_request_id, lender_id, lender_name,
                        offered_amount, interest_rate, tenor_days, instrument_type,
                        conditions, notes, status, metadata
                    ) VALUES (
                        CAST(:id AS uuid), CAST(:req AS uuid), CAST(:req AS uuid), CAST(:lender AS uuid), :lname,
                        :amount, :rate, :tenor, :instrument,
                        CAST(:conditions AS jsonb), :notes, :status, CAST('{}' AS jsonb)
                    )
                    ON CONFLICT (id) DO NOTHING
                    """
                ),
                {
                    "id": _uuid(o.get("id", str(uuid.uuid4()))),
                    "req": _uuid(o["request_id"]),
                    "lender": _uuid(o["lender_id"]),
                    "lname": o.get("lender_name", "Lender"),
                    "amount": o.get("offered_amount", 0),
                    "rate": o.get("interest_rate", 0),
                    "tenor": o.get("tenor_days", 90),
                    "instrument": o.get("instrument_type", "PRODUCTION_FINANCE"),
                    "conditions": _json(o.get("conditions", [])),
                    "notes": o.get("notes"),
                    "status": o.get("status", "PENDING"),
                },
            )

    def _load_exposure_entries(self, session) -> list[dict[str, Any]]:
        rows = session.execute(text("SELECT * FROM exposure_ledger_entries")).mappings().all()
        return [dict(r) for r in rows]

    def _load_exposure_history(self, session) -> list[dict[str, Any]]:
        rows = session.execute(
            text("SELECT metadata FROM exposure_ledger_entries WHERE metadata ? 'history' LIMIT 1")
        ).first()
        if rows and rows[0]:
            meta = rows[0] if isinstance(rows[0], dict) else json.loads(rows[0])
            return meta.get("history", [])
        return []

    def _replace_exposure(self, session, entries: list[dict[str, Any]], history: list[dict[str, Any]]) -> None:
        session.execute(text("DELETE FROM exposure_ledger_entries"))
        for e in entries:
            session.execute(
                text(
                    """
                    INSERT INTO exposure_ledger_entries (
                        id, manufacturer_id, financing_request_id, asset_id, collateral_id, lender_id,
                        financing_id, offer_id, exposure_type, amount, currency, status,
                        effective_from, effective_until, created_by, reference_type, reference_id, notes, metadata
                    ) VALUES (
                        CAST(:id AS uuid), CAST(:mfg AS uuid), CAST(:req AS uuid), CAST(:asset AS uuid), CAST(:col AS uuid), CAST(:lender AS uuid),
                        CAST(:fin AS uuid), CAST(:offer AS uuid), :etype, :amount, :currency, :status,
                        COALESCE(CAST(:from AS timestamptz), NOW()), CAST(:until AS timestamptz), CAST(:created_by AS uuid),
                        :ref_type, :ref_id, :notes, CAST(:meta AS jsonb)
                    )
                    ON CONFLICT (id) DO NOTHING
                    """
                ),
                {
                    "id": _uuid(e.get("id", str(uuid.uuid4()))),
                    "mfg": _uuid(e["manufacturer_id"]),
                    "req": _uuid(e["financing_request_id"]),
                    "asset": _uuid(e.get("asset_id")),
                    "col": _uuid(e.get("collateral_id")),
                    "lender": _uuid(e.get("lender_id")),
                    "fin": _uuid(e.get("financing_id")) if e.get("financing_id") else None,
                    "offer": _uuid(e.get("offer_id")),
                    "etype": e.get("exposure_type", "ACTIVE"),
                    "amount": e.get("amount", 0),
                    "currency": e.get("currency", "INR"),
                    "status": e.get("status", "ACTIVE"),
                    "from": e.get("effective_from"),
                    "until": e.get("effective_until"),
                    "created_by": _uuid(e.get("created_by")),
                    "ref_type": e.get("reference_type"),
                    "ref_id": e.get("reference_id"),
                    "notes": e.get("notes"),
                    "meta": _json({"history": history} if history else {}),
                },
            )

    def _load_transitions(self, session) -> list[dict[str, Any]]:
        rows = session.execute(text("SELECT * FROM instrument_transitions ORDER BY created_at DESC")).mappings().all()
        out = []
        for r in rows:
            meta = r["metadata"] if isinstance(r["metadata"], dict) else json.loads(r["metadata"] or "{}")
            out.append({**meta, "id": str(r["id"]), "production_request_id": str(r["production_request_id"])})
        return out

    def _replace_transitions(self, session, transitions: list[dict[str, Any]]) -> None:
        session.execute(text("DELETE FROM instrument_transitions"))
        for t in transitions:
            tid = t.get("id", str(uuid.uuid4()))
            core = {k: v for k, v in t.items() if k not in ("id", "production_request_id", "request_id")}
            session.execute(
                text(
                    """
                    INSERT INTO instrument_transitions (
                        id, production_request_id, from_instrument, to_instrument, from_stage, to_stage,
                        trigger_event, metadata
                    ) VALUES (
                        CAST(:id AS uuid), CAST(:req AS uuid), :from_i, :to_i, :from_s, :to_s, :trigger, CAST(:meta AS jsonb)
                    )
                    ON CONFLICT (id) DO NOTHING
                    """
                ),
                {
                    "id": _uuid(tid),
                    "req": _uuid(t.get("production_request_id") or t.get("request_id") or DEMO_REQUEST_ID),
                    "from_i": t.get("from_instrument", t.get("current_instrument", "")),
                    "to_i": t.get("to_instrument", t.get("recommended_instrument", "")),
                    "from_s": t.get("from_stage", ""),
                    "to_s": t.get("to_stage", ""),
                    "trigger": t.get("trigger_event"),
                    "meta": _json(core),
                },
            )

    def _load_reassessments(self, session) -> list[dict[str, Any]]:
        rows = session.execute(
            text("SELECT * FROM financing_action_ledger ORDER BY created_at DESC")
        ).mappings().all()
        out = []
        for r in rows:
            snap = r["evidence_snapshot"] if isinstance(r["evidence_snapshot"], dict) else json.loads(r["evidence_snapshot"] or "{}")
            out.append(
                {
                    "id": str(r["id"]),
                    "financing_request_id": str(r["production_request_id"]),
                    "manufacturer_id": str(r["manufacturer_id"]) if r["manufacturer_id"] else None,
                    "trigger_event_id": snap.get("trigger_event_id"),
                    "trigger_type": r.get("trigger_type") or snap.get("trigger_type", "EVENT"),
                    "status": r.get("approval_status") or "COMPLETED",
                    "previous_confidence": r["confidence_before"],
                    "new_confidence": r["confidence_after"],
                    "confidence_change": (r["confidence_after"] or 0) - (r["confidence_before"] or 0),
                    "previous_risk": r["risk_before"],
                    "new_risk": r["risk_after"],
                    "previous_financeable_value": float(r["financeable_value_before"] or 0),
                    "new_financeable_value": float(r["financeable_value_after"] or 0),
                    "financeable_value_change": float(r["financeable_value_after"] or 0) - float(r["financeable_value_before"] or 0),
                    **snap,
                    "recommended_action": r["recommended_action"],
                    "reason_summary": r["reason"],
                    "impact_level": r.get("impact_level") or snap.get("impact_level", "MODERATE_IMPACT"),
                    "lender_action": r.get("lender_action"),
                    "lender_action_at": r["lender_action_at"].isoformat() if r.get("lender_action_at") else None,
                    "created_at": r["created_at"].isoformat() if r["created_at"] else None,
                }
            )
        return out

    def _replace_reassessments(self, session, records: list[dict[str, Any]]) -> None:
        session.execute(text("DELETE FROM financing_action_ledger"))
        for rec in records:
            snap = {k: rec.get(k) for k in rec if k.startswith(("previous_", "new_", "confidence_band", "capacity", "instrument", "source"))}
            snap["trigger_event_id"] = rec.get("trigger_event_id")
            snap["trigger_type"] = rec.get("trigger_type")
            session.execute(
                text(
                    """
                    INSERT INTO financing_action_ledger (
                        id, production_request_id, manufacturer_id, recommended_action, actual_action,
                        confidence_before, confidence_after, risk_before, risk_after,
                        financeable_value_before, financeable_value_after, outstanding_exposure,
                        reason, evidence_snapshot, approval_status, impact_level, trigger_type,
                        lender_action, lender_action_notes, lender_action_at
                    ) VALUES (
                        CAST(:id AS uuid), CAST(:req AS uuid), CAST(:mfg AS uuid), :action, :actual,
                        :cb, :ca, :rb, :ra,
                        :fvb, :fva, :exp,
                        :reason, CAST(:snap AS jsonb), :status, :impact, :trigger,
                        :laction, :lnotes, CAST(:lat AS timestamptz)
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        actual_action = EXCLUDED.actual_action,
                        approval_status = EXCLUDED.approval_status,
                        lender_action = EXCLUDED.lender_action,
                        lender_action_at = EXCLUDED.lender_action_at
                    """
                ),
                {
                    "id": _uuid(rec["id"]),
                    "req": _uuid(rec["financing_request_id"]),
                    "mfg": _uuid(rec.get("manufacturer_id")),
                    "action": rec.get("recommended_action", "LENDER_REVIEW_REQUIRED"),
                    "actual": rec.get("lender_action"),
                    "cb": rec.get("previous_confidence"),
                    "ca": rec.get("new_confidence"),
                    "rb": rec.get("previous_risk"),
                    "ra": rec.get("new_risk"),
                    "fvb": rec.get("previous_financeable_value"),
                    "fva": rec.get("new_financeable_value"),
                    "exp": rec.get("new_active_exposure"),
                    "reason": rec.get("reason_summary"),
                    "snap": _json(snap),
                    "status": rec.get("status", "COMPLETED"),
                    "impact": rec.get("impact_level"),
                    "trigger": rec.get("trigger_type"),
                    "laction": rec.get("lender_action"),
                    "lnotes": rec.get("lender_action_notes"),
                    "lat": rec.get("lender_action_at"),
                },
            )

    def _load_intelligence_events(self, session) -> list[dict[str, Any]]:
        rows = session.execute(text("SELECT * FROM platform_intelligence_events ORDER BY created_at DESC")).mappings().all()
        out = []
        for r in rows:
            meta = r["metadata"] if isinstance(r["metadata"], dict) else json.loads(r["metadata"] or "{}")
            out.append(
                {
                    "id": str(r["id"]),
                    "financing_request_id": str(r["financing_request_id"]),
                    "event_type": r["event_type"],
                    "source_type": r["source_type"],
                    "severity": r["severity"],
                    "previous_value": r["previous_value"],
                    "new_value": r["new_value"],
                    "metadata": meta,
                    "created_at": r["created_at"].isoformat() if r["created_at"] else None,
                    "created_by": str(r["created_by"]) if r["created_by"] else None,
                }
            )
        return out

    def _replace_intelligence_events(self, session, events: list[dict[str, Any]]) -> None:
        session.execute(text("DELETE FROM platform_intelligence_events"))
        for e in events:
            session.execute(
                text(
                    """
                    INSERT INTO platform_intelligence_events (
                        id, financing_request_id, event_type, source_type, actor_id, severity,
                        previous_value, new_value, metadata, created_by, created_at
                    ) VALUES (
                        CAST(:id AS uuid), CAST(:req AS uuid), :etype, :source, CAST(:actor AS uuid), :severity,
                        :prev, :new, CAST(:meta AS jsonb), CAST(:created_by AS uuid), COALESCE(CAST(:created AS timestamptz), NOW())
                    )
                    ON CONFLICT (id) DO NOTHING
                    """
                ),
                {
                    "id": _uuid(e["id"]),
                    "req": _uuid(e["financing_request_id"]),
                    "etype": e["event_type"],
                    "source": e.get("source_type", "SYSTEM"),
                    "actor": _uuid(e.get("created_by") or e.get("actor_id")),
                    "severity": e.get("severity", "info"),
                    "prev": e.get("previous_value"),
                    "new": e.get("new_value"),
                    "meta": _json(e.get("metadata", {})),
                    "created_by": _uuid(e.get("created_by")),
                    "created": e.get("created_at"),
                },
            )

    def _load_simulations(self, session) -> dict[str, dict[str, Any]]:
        rows = session.execute(text("SELECT * FROM simulation_sessions")).mappings().all()
        out: dict[str, dict[str, Any]] = {}
        for r in rows:
            meta = r["metadata"] if isinstance(r["metadata"], dict) else json.loads(r["metadata"] or "{}")
            rid = str(r["production_request_id"])
            state = {
                **meta,
                "simulation_id": r["simulation_code"],
                "request_id": rid,
                "status": r["status"],
                "mode": r["mode"],
                "current_stage": r["current_stage"],
                "stage_index": r["stage_index"],
                "confidence_score": r["confidence_score"],
                "starting_confidence": r["starting_confidence"],
                "risk_level": r["risk_level"],
                "production_progress": float(r["production_progress"]),
                "quantity_planned": float(r["quantity_planned"]),
                "quantity_completed": float(r["quantity_completed"]),
                "delay_days": r["delay_days"],
                "expected_completion_days": r["expected_completion_days"],
                "funding_requested": float(r["funding_requested"]),
                "collateral_value": float(meta.get("collateral_value", 0)),
                "financing_exposure": float(r["financing_exposure"]),
            }
            out[rid] = state
        return out

    def _replace_simulations(self, session, sims: dict[str, dict[str, Any]]) -> None:
        session.execute(text("DELETE FROM simulation_events"))
        session.execute(text("DELETE FROM simulation_sessions"))
        for rid, sim in sims.items():
            meta = {k: v for k, v in sim.items() if k not in (
                "simulation_id", "request_id", "status", "mode", "current_stage", "stage_index",
                "confidence_score", "starting_confidence", "risk_level", "production_progress",
                "quantity_planned", "quantity_completed", "delay_days", "expected_completion_days",
                "funding_requested", "financing_exposure",
            )}
            sid = str(uuid.uuid4())
            session.execute(
                text(
                    """
                    INSERT INTO simulation_sessions (
                        id, simulation_code, production_request_id, status, mode, current_stage, stage_index,
                        confidence_score, starting_confidence, risk_level, production_progress,
                        quantity_planned, quantity_completed, delay_days, expected_completion_days,
                        funding_requested, financing_exposure, metadata, started_at, completed_at
                    ) VALUES (
                        CAST(:id AS uuid), :code, CAST(:req AS uuid), :status, :mode, :stage, :idx,
                        :conf, :start_conf, :risk, :progress,
                        :qty_p, :qty_c, :delay, :exp_days,
                        :fund, :exposure, CAST(:meta AS jsonb), CAST(:started AS timestamptz), CAST(:completed AS timestamptz)
                    )
                    """
                ),
                {
                    "id": sid,
                    "code": sim.get("simulation_id", f"SIM-{uuid.uuid4().hex[:6]}"),
                    "req": _uuid(rid),
                    "status": sim.get("status", "READY"),
                    "mode": sim.get("mode", "MANUAL"),
                    "stage": sim.get("current_stage", "PO_SIGNED"),
                    "idx": sim.get("stage_index", 0),
                    "conf": sim.get("confidence_score", 68),
                    "start_conf": sim.get("starting_confidence", 68),
                    "risk": sim.get("risk_level", "MODERATE_CONFIDENCE"),
                    "progress": sim.get("production_progress", 0),
                    "qty_p": sim.get("quantity_planned", 0),
                    "qty_c": sim.get("quantity_completed", 0),
                    "delay": sim.get("delay_days", 0),
                    "exp_days": sim.get("expected_completion_days", 45),
                    "fund": sim.get("funding_requested", 0),
                    "exposure": sim.get("financing_exposure", 0),
                    "meta": _json(meta),
                    "started": sim.get("started_at"),
                    "completed": sim.get("completed_at"),
                },
            )
            for ev in sim.get("events", []):
                session.execute(
                    text(
                        """
                        INSERT INTO simulation_events (
                            simulation_session_id, production_request_id, stage, event_type, description,
                            severity, confidence_before, confidence_after, risk_level, production_progress,
                            financial_impact, metadata
                        ) VALUES (
                            CAST(:sid AS uuid), CAST(:req AS uuid), :stage, :etype, :desc,
                            :severity, :cb, :ca, :risk, :progress,
                            CAST(:impact AS jsonb), CAST(:meta AS jsonb)
                        )
                        """
                    ),
                    {
                        "sid": sid,
                        "req": _uuid(rid),
                        "stage": ev.get("stage", sim.get("current_stage")),
                        "etype": ev.get("event_type"),
                        "desc": ev.get("description", ""),
                        "severity": ev.get("severity", "info"),
                        "cb": ev.get("confidence_before", 0),
                        "ca": ev.get("confidence_after", 0),
                        "risk": ev.get("risk_level", "MODERATE_CONFIDENCE"),
                        "progress": ev.get("production_progress", 0),
                        "impact": _json(ev.get("financial_impact", {})),
                        "meta": _json({}),
                    },
                )

    def _load_notifications(self, session) -> dict[str, list[dict[str, Any]]]:
        rows = session.execute(text("SELECT * FROM notifications ORDER BY created_at DESC")).mappings().all()
        out: dict[str, list[dict[str, Any]]] = {}
        for r in rows:
            uid = str(r["recipient_id"])
            out.setdefault(uid, []).append(
                {
                    "id": str(r["id"]),
                    "title": r["title"],
                    "body": r["body"],
                    "category": r["category"],
                    "read": r["read"],
                    "created_at": r["created_at"].isoformat() if r["created_at"] else None,
                }
            )
        return out

    def _replace_notifications(self, session, notifications: dict[str, list[dict[str, Any]]]) -> None:
        session.execute(text("DELETE FROM notifications"))
        for uid, items in notifications.items():
            for n in items:
                session.execute(
                    text(
                        """
                        INSERT INTO notifications (id, recipient_id, title, body, category, read, created_at)
                        VALUES (CAST(:id AS uuid), CAST(:uid AS uuid), :title, :body, :cat, :read, COALESCE(CAST(:created AS timestamptz), NOW()))
                        ON CONFLICT (id) DO NOTHING
                        """
                    ),
                    {
                        "id": _uuid(n.get("id", str(uuid.uuid4()))),
                        "uid": _uuid(uid),
                        "title": n["title"],
                        "body": n["body"],
                        "cat": n.get("category", "FINANCING"),
                        "read": n.get("read", False),
                        "created": n.get("created_at"),
                    },
                )

    def _load_risk_alerts(self, session) -> list[dict[str, Any]]:
        rows = session.execute(text("SELECT * FROM risk_alerts ORDER BY created_at DESC")).mappings().all()
        return [dict(r) for r in rows]

    def _replace_risk_alerts(self, session, alerts: list[dict[str, Any]]) -> None:
        session.execute(text("DELETE FROM risk_alerts"))
        for a in alerts:
            session.execute(
                text(
                    """
                    INSERT INTO risk_alerts (
                        id, project_id, financing_request_id, manufacturer_id, lender_id, event_id,
                        previous_confidence_score, new_confidence_score, previous_risk_level, new_risk_level,
                        event_type, reason, recommended_action, alert_status, n8n_triggered,
                        notification_sent, notification_error, trigger_reason_code, created_at
                    ) VALUES (
                        CAST(:id AS uuid), CAST(:project AS uuid), CAST(:req AS uuid), CAST(:mfg AS uuid), CAST(:lender AS uuid), CAST(:event AS uuid),
                        :pcb, :ncb, :pr, :nr,
                        :etype, :reason, :action, :status, :n8n,
                        :sent, :err, :code, COALESCE(CAST(:created AS timestamptz), NOW())
                    )
                    ON CONFLICT (id) DO NOTHING
                    """
                ),
                {
                    "id": _uuid(a.get("id", str(uuid.uuid4()))),
                    "project": _uuid(a.get("project_id") or a.get("financing_request_id")),
                    "req": _uuid(a.get("financing_request_id") or a.get("project_id")),
                    "mfg": _uuid(a.get("manufacturer_id")),
                    "lender": _uuid(a.get("lender_id")),
                    "event": _uuid(a.get("event_id")),
                    "pcb": a.get("previous_confidence_score", 0),
                    "ncb": a.get("new_confidence_score", 0),
                    "pr": a.get("previous_risk_level", ""),
                    "nr": a.get("new_risk_level", ""),
                    "etype": a.get("event_type", ""),
                    "reason": a.get("reason"),
                    "action": a.get("recommended_action"),
                    "status": a.get("alert_status", "PENDING"),
                    "n8n": a.get("n8n_triggered", False),
                    "sent": a.get("notification_sent", False),
                    "err": a.get("notification_error"),
                    "code": a.get("trigger_reason_code"),
                    "created": a.get("created_at"),
                },
            )

    # --- App users ---
    def upsert_app_user(self, user: dict[str, Any]) -> None:
        if not self.is_available():
            return
        session = get_session_factory()()
        try:
            uid = _uuid(user["id"])
            session.execute(
                text(
                    """
                    INSERT INTO profiles (id, full_name, email, organization_name, role, company_name, designation, phone)
                    VALUES (CAST(:id AS uuid), :name, :email, :company, :role, :company, :designation, :phone)
                    ON CONFLICT (email) DO UPDATE SET
                        full_name = EXCLUDED.full_name,
                        phone = EXCLUDED.phone,
                        updated_at = NOW()
                    """
                ),
                {
                    "id": uid,
                    "name": user["full_name"],
                    "email": user["email"],
                    "role": user["role"],
                    "company": user["company_name"],
                    "designation": user.get("designation", "Member"),
                    "phone": user.get("phone"),
                },
            )
            session.execute(
                text(
                    """
                    INSERT INTO app_users (
                        id, username, email, password_hash, role, company_name, full_name, designation, phone, profile_id
                    ) VALUES (
                        CAST(:id AS uuid), :username, :email, :hash, :role, :company, :name, :designation, :phone, CAST(:profile AS uuid)
                    )
                    ON CONFLICT (username) DO UPDATE SET
                        email = EXCLUDED.email,
                        password_hash = EXCLUDED.password_hash,
                        phone = EXCLUDED.phone,
                        updated_at = NOW()
                    """
                ),
                {
                    "id": uid,
                    "username": user["username"].lower(),
                    "email": user["email"],
                    "hash": user["password_hash"],
                    "role": user["role"],
                    "company": user["company_name"],
                    "name": user["full_name"],
                    "designation": user.get("designation", "Member"),
                    "phone": user.get("phone"),
                    "profile": uid,
                },
            )
            session.commit()
        finally:
            session.close()

    def load_app_users(self) -> list[dict[str, Any]]:
        if not self.is_available():
            return []
        session = get_session_factory()()
        try:
            rows = session.execute(text("SELECT * FROM app_users")).mappings().all()
            return [dict(r) for r in rows]
        finally:
            session.close()


platform_repository = PlatformRepository()
