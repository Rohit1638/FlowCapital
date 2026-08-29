from __future__ import annotations

from collections.abc import Generator
from functools import lru_cache
from urllib.parse import quote_plus, unquote, urlparse

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings


class Base(DeclarativeBase):
    pass


_engine: Engine | None = None
_SessionLocal: sessionmaker | None = None
_resolved_url: str | None = None


def _project_ref(settings) -> str | None:
    if settings.supabase_url:
        host = settings.supabase_url.rstrip("/").split("//")[-1]
        return host.split(".")[0] if host else None
    parsed = urlparse(settings.database_url.replace("postgresql+psycopg://", "postgresql://"))
    user = parsed.username or ""
    if "." in user:
        return user.split(".")[-1]
    if parsed.hostname and parsed.hostname.startswith("db."):
        return parsed.hostname.removeprefix("db.").removesuffix(".supabase.co")
    return None


def candidate_database_urls() -> list[str]:
    settings = get_settings()
    urls: list[str] = []
    seen: set[str] = set()

    def add(raw: str) -> None:
        url = raw
        if url.startswith("postgresql://") and "+psycopg" not in url:
            url = url.replace("postgresql://", "postgresql+psycopg://", 1)
        if "sslmode=" not in url:
            url = f"{url}{'&' if '?' in url else '?'}sslmode=require"
        if url not in seen:
            seen.add(url)
            urls.append(url)

    add(settings.database_url)
    parsed = urlparse(settings.database_url.replace("postgresql+psycopg://", "postgresql://"))
    password = unquote(parsed.password or "")
    ref = _project_ref(settings)
    if ref and password:
        enc = quote_plus(password)
        add(f"postgresql://postgres:{enc}@db.{ref}.supabase.co:5432/postgres")
        for host in (
            "aws-0-ap-northeast-1.pooler.supabase.com",
            "aws-1-ap-northeast-1.pooler.supabase.com",
        ):
            add(f"postgresql://postgres.{ref}:{enc}@{host}:6543/postgres")
            add(f"postgresql://postgres.{ref}:{enc}@{host}:5432/postgres")
    return urls


@lru_cache
def resolve_database_url() -> str | None:
    global _resolved_url
    for url in candidate_database_urls():
        engine = create_engine(url, pool_pre_ping=False, connect_args={"connect_timeout": 8, "prepare_threshold": None})
        try:
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            _resolved_url = url
            return url
        except Exception:
            continue
        finally:
            engine.dispose()
    _resolved_url = None
    return None


def get_engine() -> Engine:
    global _engine
    if _engine is None:
        url = resolve_database_url() or get_settings().sqlalchemy_url
        _engine = create_engine(
            url,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=5,
            connect_args={"connect_timeout": 20, "prepare_threshold": None},
        )
    return _engine


def get_session_factory() -> sessionmaker:
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(bind=get_engine(), autoflush=False, autocommit=False, expire_on_commit=False)
    return _SessionLocal


def get_db() -> Generator[Session, None, None]:
    session = get_session_factory()()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def ping_database() -> bool:
    """Live connection check — bootstrap may succeed via get_engine fallback even when URL resolution was cached as failed."""
    try:
        with get_engine().connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


def reset_database_cache() -> None:
    global _engine, _SessionLocal, _resolved_url
    resolve_database_url.cache_clear()
    _engine = None
    _SessionLocal = None
    _resolved_url = None
