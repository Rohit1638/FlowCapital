from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.audit import AuditListResponse
from app.services.audit_service import AuditService

router = APIRouter(tags=["Audit"])


@router.get("", response_model=AuditListResponse)
def list_audit(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return AuditService(db).list(page, page_size)
