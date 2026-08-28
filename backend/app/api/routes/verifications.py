from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.verification import VerificationCreate, VerificationListResponse, VerificationRead, VerificationUpdate
from app.services.verification_service import VerificationService

router = APIRouter(tags=["Verifications"])


@router.post("", response_model=VerificationRead, status_code=status.HTTP_201_CREATED)
def create_verification(payload: VerificationCreate, db: Session = Depends(get_db)):
    return VerificationService(db).create(payload)


@router.get("", response_model=VerificationListResponse)
def list_verifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    asset_id: str | None = None,
    db: Session = Depends(get_db),
):
    return VerificationService(db).list(page, page_size, asset_id)


@router.get("/{verification_id}", response_model=VerificationRead)
def get_verification(verification_id: UUID, db: Session = Depends(get_db)):
    return VerificationService(db).get(verification_id)


@router.patch("/{verification_id}", response_model=VerificationRead)
def update_verification(verification_id: UUID, payload: VerificationUpdate, db: Session = Depends(get_db)):
    return VerificationService(db).update(verification_id, payload)
