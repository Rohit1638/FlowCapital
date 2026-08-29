"""Local SQLite persistence for platform demo data.

Supabase/Postgres is used when reachable (profiles, production requests, reassessments).
When the remote database is offline, SQLite keeps users, requests, simulations, and
reassessment records across backend restarts.
"""

from __future__ import annotations

import json
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.core.logging import get_logger

logger = get_logger("platform_persistence")

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
SQLITE_PATH = DATA_DIR / "platform.db"

_SCHEMA = """
CREATE TABLE IF NOT EXISTS kv_store (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS app_users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    company_name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    designation TEXT NOT NULL,
    phone TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_app_users_username ON app_users (username);
"""


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@contextmanager
def _connect():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(SQLITE_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    try:
        conn.executescript(_SCHEMA)
        yield conn
        conn.commit()
    finally:
        conn.close()


class PlatformPersistence:
    def load_json(self, key: str, default: Any = None) -> Any:
        try:
            with _connect() as conn:
                row = conn.execute("SELECT value FROM kv_store WHERE key = ?", (key,)).fetchone()
                if not row:
                    return default
                return json.loads(row["value"])
        except Exception as exc:
            logger.warning("sqlite load failed for %s: %s", key, exc)
            return default

    def save_json(self, key: str, value: Any) -> None:
        try:
            payload = json.dumps(value, default=str)
            with _connect() as conn:
                conn.execute(
                    """
                    INSERT INTO kv_store (key, value, updated_at) VALUES (?, ?, ?)
                    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
                    """,
                    (key, payload, _now_iso()),
                )
        except Exception as exc:
            logger.warning("sqlite save failed for %s: %s", key, exc)

    def upsert_user(self, user: dict[str, Any]) -> None:
        try:
            with _connect() as conn:
                conn.execute(
                    """
                    INSERT INTO app_users (
                        id, username, email, password_hash, role, company_name,
                        full_name, designation, phone, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(username) DO UPDATE SET
                        email = excluded.email,
                        password_hash = excluded.password_hash,
                        role = excluded.role,
                        company_name = excluded.company_name,
                        full_name = excluded.full_name,
                        designation = excluded.designation,
                        phone = excluded.phone,
                        updated_at = excluded.updated_at
                    """,
                    (
                        user["id"],
                        user["username"].lower(),
                        user["email"],
                        user["password_hash"],
                        user["role"],
                        user["company_name"],
                        user["full_name"],
                        user["designation"],
                        user.get("phone"),
                        user.get("created_at", _now_iso()),
                        _now_iso(),
                    ),
                )
        except Exception as exc:
            logger.warning("sqlite user upsert failed: %s", exc)

    def load_users(self) -> list[dict[str, Any]]:
        try:
            with _connect() as conn:
                rows = conn.execute("SELECT * FROM app_users ORDER BY username").fetchall()
                return [dict(row) for row in rows]
        except Exception as exc:
            logger.warning("sqlite user load failed: %s", exc)
            return []

    def try_sync_postgres(self) -> bool:
        """Best-effort sync of demo platform data to Supabase when reachable."""
        try:
            from sqlalchemy import text

            from app.core.database import ping_database, get_session_factory
            from app.core.auth import DEMO_LENDER_ID, DEMO_MANUFACTURER_ID

            if not ping_database():
                return False

            session = get_session_factory()()
            try:
                # Ensure core demo profiles exist
                for profile in (
                    {
                        "id": DEMO_MANUFACTURER_ID,
                        "full_name": "Demo Manufacturer",
                        "email": "manufacturer_demo@flowcapital.internal",
                        "organization_name": "VoltRide Mobility Pvt. Ltd.",
                        "role": "MANUFACTURER",
                        "company_name": "VoltRide Mobility Pvt. Ltd.",
                        "designation": "Operations Lead",
                        "phone": "+919943666848",
                    },
                    {
                        "id": DEMO_LENDER_ID,
                        "full_name": "Demo Lender",
                        "email": "lender_demo@flowcapital.internal",
                        "organization_name": "Balanced Growth Capital",
                        "role": "LENDER",
                        "company_name": "Balanced Growth Capital",
                        "designation": "Underwriter",
                        "phone": "+919043775875",
                    },
                ):
                    session.execute(
                        text(
                            """
                            INSERT INTO profiles (id, full_name, email, organization_name, role, company_name, designation, phone)
                            VALUES (:id::uuid, :full_name, :email, :organization_name, :role, :company_name, :designation, :phone)
                            ON CONFLICT (email) DO UPDATE SET
                                full_name = EXCLUDED.full_name,
                                phone = EXCLUDED.phone,
                                updated_at = NOW()
                            """
                        ),
                        profile,
                    )

                reassessments = self.load_json("reassessment_records", [])
                for rec in reassessments[:50]:
                    session.execute(
                        text(
                            """
                            INSERT INTO financing_action_ledger (
                                id, production_request_id, manufacturer_id, recommended_action,
                                actual_action, confidence_before, confidence_after, risk_before, risk_after,
                                financeable_value_before, financeable_value_after, outstanding_exposure,
                                reason, evidence_snapshot, approval_status
                            ) VALUES (
                                :id::uuid, :production_request_id::uuid, :manufacturer_id::uuid,
                                :recommended_action, :actual_action, :confidence_before, :confidence_after,
                                :risk_before, :risk_after, :financeable_value_before, :financeable_value_after,
                                :outstanding_exposure, :reason, :evidence_snapshot::jsonb, :approval_status
                            )
                            ON CONFLICT (id) DO NOTHING
                            """
                        ),
                        {
                            "id": rec.get("id", str(uuid.uuid4())),
                            "production_request_id": rec.get("financing_request_id"),
                            "manufacturer_id": rec.get("manufacturer_id"),
                            "recommended_action": rec.get("recommended_action", "LENDER_REVIEW_REQUIRED"),
                            "actual_action": rec.get("lender_action"),
                            "confidence_before": rec.get("previous_confidence"),
                            "confidence_after": rec.get("new_confidence"),
                            "risk_before": rec.get("previous_risk"),
                            "risk_after": rec.get("new_risk"),
                            "financeable_value_before": rec.get("previous_financeable_value"),
                            "financeable_value_after": rec.get("new_financeable_value"),
                            "outstanding_exposure": rec.get("new_active_exposure"),
                            "reason": rec.get("reason_summary"),
                            "evidence_snapshot": json.dumps({"trigger_type": rec.get("trigger_type"), "source": rec.get("source")}),
                            "approval_status": rec.get("status"),
                        },
                    )
                session.commit()
                logger.info("postgres sync completed")
                return True
            except Exception as exc:
                session.rollback()
                logger.warning("postgres sync skipped: %s", exc.__class__.__name__)
                return False
            finally:
                session.close()
        except Exception as exc:
            logger.warning("postgres unavailable: %s", exc.__class__.__name__)
            return False


platform_persistence = PlatformPersistence()
