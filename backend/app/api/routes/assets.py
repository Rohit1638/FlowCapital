from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.asset import AssetCreate, AssetListResponse, AssetRead, AssetUpdate, HistoryItem
from app.schemas.conflict import ConflictListResponse
from app.schemas.event import EventListResponse
from app.schemas.verification import VerificationListResponse
from app.services.asset_service import AssetService
from app.services.audit_service import AuditService
from app.services.conflict_service import ConflictService
from app.services.event_service import EventService
from app.services.verification_service import VerificationService

router = APIRouter(tags=["Assets"])


def assets(db: Session = Depends(get_db)) -> AssetService:
    return AssetService(db)


@router.post("", response_model=AssetRead, status_code=status.HTTP_201_CREATED)
def create_asset(payload: AssetCreate, service: AssetService = Depends(assets)):
    return service.create(payload)


@router.get("", response_model=AssetListResponse)
def list_assets(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    lifecycle_stage: str | None = None,
    status_filter: str | None = Query(default=None, alias="status"),
    asset_type: str | None = None,
    service: AssetService = Depends(assets),
):
    return service.list(page, page_size, lifecycle_stage, status_filter, asset_type)


@router.get("/{asset_id}", response_model=AssetRead)
def get_asset(asset_id: str, service: AssetService = Depends(assets)):
    return service.get(asset_id)


@router.patch("/{asset_id}", response_model=AssetRead)
def update_asset(asset_id: str, payload: AssetUpdate, service: AssetService = Depends(assets)):
    return service.update(asset_id, payload)


@router.get("/{asset_id}/history", response_model=list[HistoryItem])
def asset_history(asset_id: str, service: AssetService = Depends(assets)):
    return service.history(asset_id)


@router.get("/{asset_id}/events", response_model=EventListResponse)
def asset_events(
    asset_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return EventService(db).list(page, page_size, asset_id)


@router.get("/{asset_id}/verifications", response_model=VerificationListResponse)
def asset_verifications(
    asset_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return VerificationService(db).list(page, page_size, asset_id)


@router.get("/{asset_id}/conflicts", response_model=ConflictListResponse)
def asset_conflicts(
    asset_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return ConflictService(db).list(page, page_size, asset_id)


@router.get("/{asset_id}/audit")
def asset_audit(
    asset_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    asset = AssetService(db).resolve(asset_id)
    return AuditService(db).list(page, page_size, asset.id)
