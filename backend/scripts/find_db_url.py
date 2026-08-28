"""Try multiple Supabase connection string formats using password from backend/.env."""

from __future__ import annotations

import sys
from urllib.parse import quote_plus, urlparse, unquote

from sqlalchemy import create_engine, text

from app.core.config import get_settings


def password_from_settings() -> str:
    raw = get_settings().database_url
    parsed = urlparse(raw.replace("postgresql+psycopg://", "postgresql://"))
    return unquote(parsed.password or "")


def try_url(label: str, url: str) -> bool:
    if url.startswith("postgresql://") and "+psycopg" not in url:
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    if "sslmode=" not in url:
        url += "?sslmode=require" if "?" not in url else "&sslmode=require"
    engine = create_engine(url, connect_args={"connect_timeout": 8, "prepare_threshold": None})
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print(f"OK  {label}")
        print(f"    {url.split('@', 1)[1]}")
        print("\nDATABASE_URL=" + url.replace("postgresql+psycopg://", "postgresql://"))
        return True
    except Exception as exc:
        print(f"FAIL {label}: {exc.__class__.__name__}: {str(exc)[:140]}")
        return False
    finally:
        engine.dispose()


def main() -> None:
    settings = get_settings()
    parsed = urlparse(settings.database_url.replace("postgresql+psycopg://", "postgresql://"))
    project = parsed.username.split(".")[-1] if parsed.username and "." in parsed.username else "vastwvtdzaambohbbasj"
    enc = quote_plus(password_from_settings())
    candidates = [
        ("direct-5432", f"postgresql://postgres:{enc}@db.{project}.supabase.co:5432/postgres"),
        ("session-pooler-5432", f"postgresql://postgres.{project}:{enc}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"),
        ("session-pooler-5432-aws1", f"postgresql://postgres.{project}:{enc}@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"),
        ("transaction-pooler-6543", f"postgresql://postgres.{project}:{enc}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"),
    ]
    for label, url in candidates:
        if try_url(label, url):
            sys.exit(0)
    sys.exit(1)


if __name__ == "__main__":
    main()
