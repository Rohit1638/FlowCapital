from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(str(BACKEND_ROOT / ".env"), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = "development"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    database_url: str = Field(..., min_length=8)
    supabase_url: str | None = None
    supabase_anon_key: str | None = None
    supabase_service_role_key: str | None = None
    allowed_origins: str = "http://localhost:3000"

    ai_provider: str = "gemini"
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.0-flash"
    openai_api_key: str | None = None

    mismatch_low_pct: float = 2.0
    mismatch_medium_pct: float = 5.0
    mismatch_high_pct: float = 15.0

    @field_validator("database_url")
    @classmethod
    def require_database_url(cls, value: str) -> str:
        if "YOUR_PASSWORD" in value or "YOUR_PROJECT" in value:
            raise ValueError("DATABASE_URL is a placeholder. Set the real Supabase connection string in backend/.env")
        return value

    @property
    def origin_list(self) -> list[str]:
        return [item.strip() for item in self.allowed_origins.split(",") if item.strip()]

    @property
    def sqlalchemy_url(self) -> str:
        url = self.database_url
        if url.startswith("postgresql://") and "+psycopg" not in url:
            url = url.replace("postgresql://", "postgresql+psycopg://", 1)
        if "sslmode=" not in url:
            url = f"{url}{'&' if '?' in url else '?'}sslmode=require"
        return url


@lru_cache
def get_settings() -> Settings:
    return Settings()
