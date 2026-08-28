from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.conflict import ConflictListResponse, ConflictRead, ConflictResolve
from app.services.conflict_service import ConflictService

router = APIRouter(tags=["Conflicts"])


@router.get("", response_model=ConflictListResponse)
def list_conflicts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    asset_id: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    return ConflictService(db).list(page, page_size, asset_id, status)


@router.get("/{conflict_id}", response_model=ConflictRead)
def get_conflict(conflict_id: UUID, db: Session = Depends(get_db)):
    return ConflictService(db).get(conflict_id)


@router.patch("/{conflict_id}/resolve", response_model=ConflictRead)
def resolve_conflict(conflict_id: UUID, payload: ConflictResolve, db: Session = Depends(get_db)):
    return ConflictService(db).resolve(conflict_id, payload)
