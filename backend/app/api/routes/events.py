from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.event import EventCreate, EventIngestResponse, EventListResponse, EventRead
from app.services.event_service import EventService

router = APIRouter(tags=["Events"])


@router.post("", response_model=EventIngestResponse, status_code=status.HTTP_200_OK)
def ingest_event(payload: EventCreate, db: Session = Depends(get_db)):
    return EventService(db).ingest(payload)


@router.get("", response_model=EventListResponse)
def list_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    asset_id: str | None = None,
    event_type: str | None = None,
    db: Session = Depends(get_db),
):
    return EventService(db).list(page, page_size, asset_id, event_type)


@router.get("/{event_id}", response_model=EventRead)
def get_event(event_id: str, db: Session = Depends(get_db)):
    return EventService(db).get(event_id)
