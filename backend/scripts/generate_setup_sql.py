"""Generate full_setup.sql (schema + idempotent demo seed) for Supabase SQL Editor."""

from __future__ import annotations

import json
from pathlib import Path

from app.seed.demo_assets import DEMO_ASSETS, FOUNDATIONAL_EVENTS, SEED_CONFLICTS

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = ROOT / "database" / "schema.sql"
OUTPUT = ROOT / "database" / "full_setup.sql"


def sql_literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def main() -> None:
    lines: list[str] = [
        "-- FlowCapital AI — run once in Supabase SQL Editor (Dashboard → SQL → New query)",
        "-- Creates all tables and idempotent demo seed data.",
        "",
        SCHEMA.read_text(encoding="utf-8").strip(),
        "",
        "-- Demo seed (idempotent)",
        "",
    ]

    for asset in DEMO_ASSETS:
        metadata = json.dumps(asset["metadata"], separators=(",", ":"))
        lines.append(
            "INSERT INTO assets ("
            "asset_code, asset_name, asset_type, owner_name, description, quantity, unit, "
            "current_location, lifecycle_stage, status, metadata, created_at, updated_at"
            ") VALUES ("
            f"{sql_literal(asset['asset_code'])}, "
            f"{sql_literal(asset['asset_name'])}, "
            f"{sql_literal(asset['asset_type'])}, "
            f"{sql_literal(asset['owner_name'])}, "
            f"{sql_literal(asset['description'])}, "
            f"{asset['quantity']}, "
            f"{sql_literal(asset['unit'])}, "
            f"{sql_literal(asset['current_location'])}, "
            f"{sql_literal(asset['lifecycle_stage'])}, "
            f"{sql_literal(asset['status'])}, "
            f"{sql_literal(metadata)}::jsonb, "
            f"{sql_literal(asset['created_at'])}::timestamptz, "
            f"{sql_literal(asset['updated_at'])}::timestamptz"
            ") ON CONFLICT (asset_code) DO NOTHING;"
        )
        lines.append(
            "INSERT INTO verifications ("
            "asset_id, verification_type, source, status, confidence_score, "
            "evidence_reference, verified_at, metadata"
            ") SELECT "
            "a.id, 'PHYSICAL', 'VERIFICATION', "
            f"{sql_literal(asset['verification_status'])}, "
            f"{asset['confidence_score']}, "
            f"{sql_literal(asset['asset_code'])}, "
            "NOW(), '{\"seed\": true}'::jsonb "
            "FROM assets a "
            f"WHERE a.asset_code = {sql_literal(asset['asset_code'])} "
            "AND NOT EXISTS ("
            "SELECT 1 FROM verifications v "
            "WHERE v.asset_id = a.id AND v.verification_type = 'PHYSICAL' AND v.source = 'VERIFICATION'"
            ");"
        )
        lines.append(
            "INSERT INTO audit_logs (asset_id, entity_type, entity_id, action, source, new_state, metadata) "
            "SELECT a.id, 'asset', a.id::text, 'ASSET_CREATED', 'seed', "
            f"jsonb_build_object('asset_code', {sql_literal(asset['asset_code'])}), "
            "'{\"seed\": true}'::jsonb "
            "FROM assets a "
            f"WHERE a.asset_code = {sql_literal(asset['asset_code'])} "
            "AND NOT EXISTS ("
            "SELECT 1 FROM audit_logs al "
            "WHERE al.asset_id = a.id AND al.action = 'ASSET_CREATED' AND al.source = 'seed'"
            ");"
        )
        lines.append("")

    for event in FOUNDATIONAL_EVENTS:
        payload = json.dumps(event["payload"], separators=(",", ":"))
        lines.append(
            "INSERT INTO asset_events ("
            "event_code, asset_id, event_type, source, event_timestamp, payload, severity, "
            "status, idempotency_key, processed, processed_at"
            ") SELECT "
            f"{sql_literal(event['event_code'])}, "
            "a.id, "
            f"{sql_literal(event['event_type'])}, "
            f"{sql_literal(event['source'])}, "
            f"{sql_literal(event['event_timestamp'])}::timestamptz, "
            f"{sql_literal(payload)}::jsonb, "
            f"{sql_literal(event['severity'])}, "
            "'APPLIED', "
            f"{sql_literal(event['idempotency_key'])}, "
            "TRUE, NOW() "
            "FROM assets a "
            f"WHERE a.asset_code = {sql_literal(event['asset_code'])} "
            f"ON CONFLICT (idempotency_key) DO NOTHING;"
        )
        lines.append(
            "INSERT INTO audit_logs (asset_id, entity_type, entity_id, action, source, metadata) "
            "SELECT a.id, 'event', "
            f"{sql_literal(event['event_code'])}, "
            "'EVENT_PROCESSED', 'seed', '{\"seed\": true}'::jsonb "
            "FROM assets a "
            f"WHERE a.asset_code = {sql_literal(event['asset_code'])} "
            "AND NOT EXISTS ("
            "SELECT 1 FROM audit_logs al "
            f"WHERE al.entity_id = {sql_literal(event['event_code'])} AND al.action = 'EVENT_PROCESSED'"
            ");"
        )
        lines.append("")

    for conflict in SEED_CONFLICTS:
        lines.append(
            "INSERT INTO conflicts ("
            "conflict_code, asset_id, conflict_type, severity, status, description, "
            "expected_value, actual_value, difference_value"
            ") SELECT "
            f"{sql_literal(conflict['conflict_code'])}, "
            "a.id, "
            f"{sql_literal(conflict['conflict_type'])}, "
            f"{sql_literal(conflict['severity'])}, "
            "'OPEN', "
            f"{sql_literal(conflict['description'])}, "
            f"{sql_literal(conflict['expected_value'])}, "
            f"{sql_literal(conflict['actual_value'])}, "
            f"{sql_literal(conflict['difference_value'])} "
            "FROM assets a "
            f"WHERE a.asset_code = {sql_literal(conflict['asset_code'])} "
            f"ON CONFLICT (conflict_code) DO NOTHING;"
        )
        lines.append(
            "INSERT INTO audit_logs (asset_id, entity_type, entity_id, action, source, metadata) "
            "SELECT a.id, 'conflict', "
            f"{sql_literal(conflict['conflict_code'])}, "
            "'CONFLICT_DETECTED', 'seed', '{\"seed\": true}'::jsonb "
            "FROM assets a "
            f"WHERE a.asset_code = {sql_literal(conflict['asset_code'])} "
            "AND NOT EXISTS ("
            "SELECT 1 FROM audit_logs al "
            f"WHERE al.entity_id = {sql_literal(conflict['conflict_code'])} AND al.action = 'CONFLICT_DETECTED'"
            ");"
        )

    OUTPUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT} ({OUTPUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
