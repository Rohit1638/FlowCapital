"""Quick DB connectivity and bootstrap check."""
from __future__ import annotations

from sqlalchemy import create_engine, text

from app.core.database import ping_database, reset_database_cache, resolve_database_url
from app.services.platform_repository import PlatformRepository


def main() -> None:
    reset_database_cache()
    connected = ping_database()
    url = resolve_database_url()
    host = url.split("@")[-1].split("/")[0] if url else "none"
    print(f"connected: {connected}")
    print(f"via: {host}")

    repo = PlatformRepository()
    print(f"bootstrap: {repo.bootstrap()}")

    if not url:
        return
    engine = create_engine(url)
    with engine.connect() as conn:
        tables = conn.execute(
            text(
                "SELECT table_name FROM information_schema.tables "
                "WHERE table_schema = 'public' ORDER BY table_name"
            )
        ).fetchall()
        print(f"tables ({len(tables)}):", [t[0] for t in tables])
        for tbl in ("profiles", "production_requests", "financing_action_ledger", "simulation_sessions"):
            try:
                n = conn.execute(text(f"SELECT COUNT(*) FROM {tbl}")).scalar()
                print(f"  {tbl}: {n} rows")
            except Exception as exc:
                print(f"  {tbl}: missing ({exc.__class__.__name__})")
    engine.dispose()


if __name__ == "__main__":
    main()
