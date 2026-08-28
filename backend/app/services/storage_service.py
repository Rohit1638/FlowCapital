from __future__ import annotations

import uuid
from pathlib import Path

import httpx

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger("storage")

UPLOAD_ROOT = Path(__file__).resolve().parents[2] / "uploads" / "documents"
MAX_FILE_BYTES = 15 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg"}


class StorageService:
    def __init__(self) -> None:
        UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)

    def validate_file(self, filename: str, size: int) -> None:
        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise ValueError(f"File type {ext} not allowed")
        if size > MAX_FILE_BYTES:
            raise ValueError("File exceeds 15 MB limit")

    async def save(self, filename: str, content: bytes, manufacturer_id: str, request_id: str) -> str:
        self.validate_file(filename, len(content))
        settings = get_settings()
        if settings.supabase_url and settings.supabase_service_role_key:
            try:
                return await self._save_supabase(filename, content, manufacturer_id, request_id)
            except Exception as exc:
                logger.warning("Supabase storage failed, using local: %s", exc)
        return self._save_local(filename, content, manufacturer_id, request_id)

    def _save_local(self, filename: str, content: bytes, manufacturer_id: str, request_id: str) -> str:
        safe_name = f"{uuid.uuid4()}_{Path(filename).name}"
        dest_dir = UPLOAD_ROOT / manufacturer_id / request_id
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest = dest_dir / safe_name
        dest.write_bytes(content)
        return str(dest.relative_to(UPLOAD_ROOT.parent.parent))

    async def _save_supabase(self, filename: str, content: bytes, manufacturer_id: str, request_id: str) -> str:
        settings = get_settings()
        safe_name = f"{manufacturer_id}/{request_id}/{uuid.uuid4()}_{Path(filename).name}"
        url = f"{settings.supabase_url.rstrip('/')}/storage/v1/object/documents/{safe_name}"
        headers = {
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
            "Content-Type": "application/octet-stream",
            "x-upsert": "true",
        }
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(url, content=content, headers=headers)
            response.raise_for_status()
        return f"supabase://documents/{safe_name}"

    def read_local(self, storage_path: str) -> bytes | None:
        path = Path(__file__).resolve().parents[2] / storage_path
        if path.exists():
            return path.read_bytes()
        alt = UPLOAD_ROOT.parent.parent / storage_path
        if alt.exists():
            return alt.read_bytes()
        return None


storage_service = StorageService()
