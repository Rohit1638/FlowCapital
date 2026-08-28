"""Smoke checks against a running backend. Usage: python -m scripts.smoke_test"""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

BASE = "http://localhost:8000/api/v1"


def req(method: str, path: str, body: dict | None = None, expected: int | tuple[int, ...] = 200):
    data = None if body is None else json.dumps(body).encode("utf-8")
    request = urllib.request.Request(f"{BASE}{path}", data=data, method=method)
    request.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            payload = json.loads(response.read().decode("utf-8"))
            status = response.status
    except urllib.error.HTTPError as exc:
        payload = json.loads(exc.read().decode("utf-8"))
        status = exc.code
    allowed = expected if isinstance(expected, tuple) else (expected,)
    if status not in allowed:
        raise SystemExit(f"{method} {path} -> {status} {payload}")
    return payload


def main() -> None:
    health = req("GET", "/health")
    assert health["database"] == "connected", health
    assets = req("GET", "/assets?page_size=20")
    assert assets["pagination"]["total"] >= 8, assets
    codes = {item["asset_code"] for item in assets["items"]}
    assert "DA-2026-001" in codes and "DA-2026-003" in codes
    one = req("GET", "/assets/DA-2026-001")
    assert one["asset_code"] == "DA-2026-001"
    dup = req("POST", "/assets", {"asset_code": "DA-2026-001", "asset_name": "x", "asset_type": "t", "owner_name": "o", "lifecycle_stage": "PRODUCTION"}, expected=409)
    assert dup["error"]["code"] == "409"
    first = req("POST", "/events", {"event_code": "SMOKE-QTY-1", "asset_code": "DA-2026-003", "event_type": "QUANTITY_MISMATCH_DETECTED", "source": "WAREHOUSE", "idempotency_key": "SMOKE-QTY-1", "payload": {"expectedQuantity": 500, "actualQuantity": 440}})
    second = req("POST", "/events", {"event_code": "SMOKE-QTY-1", "asset_code": "DA-2026-003", "event_type": "QUANTITY_MISMATCH_DETECTED", "source": "WAREHOUSE", "idempotency_key": "SMOKE-QTY-1", "payload": {"expectedQuantity": 500, "actualQuantity": 440}})
    assert first["duplicate"] is False
    assert second["duplicate"] is True
    conflicts = req("GET", "/conflicts?asset_id=DA-2026-003")
    assert conflicts["pagination"]["total"] >= 1
    print("SMOKE OK", {"assets": assets["pagination"]["total"], "duplicate": second["duplicate"]})


if __name__ == "__main__":
    main()
    sys.exit(0)
