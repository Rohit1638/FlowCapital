from fastapi import APIRouter

from app.core.auth import AnyPlatformUser
from app.services.demo_platform_store import demo_store

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("")
def list_notifications(user: AnyPlatformUser):
    return {"items": demo_store.notifications(user.id)}
