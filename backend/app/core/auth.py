from __future__ import annotations

from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status

DEMO_MANUFACTURER_ID = "00000000-0000-4000-8000-000000000001"
DEMO_LENDER_ID = "00000000-0000-4000-8000-000000000002"

DEMO_USERS = {
    "demo-manufacturer": {
        "id": DEMO_MANUFACTURER_ID,
        "full_name": "Priya Sharma",
        "email": "priya@voltride.in",
        "organization_name": "VoltRide Mobility Pvt. Ltd.",
        "role": "MANUFACTURER",
        "company_name": "VoltRide Mobility Pvt. Ltd.",
        "designation": "Chief Operations Officer",
        "username": "manufacturer_demo",
    },
    "demo-lender": {
        "id": DEMO_LENDER_ID,
        "full_name": "Arjun Mehta",
        "email": "arjun@apexcapital.in",
        "organization_name": "Apex Capital Partners",
        "role": "LENDER",
        "company_name": "Apex Capital Partners",
        "designation": "Head of Supply Chain Finance",
        "username": "lender_demo",
    },
}


@dataclass
class AuthUser:
    id: str
    full_name: str
    email: str
    organization_name: str | None
    role: str
    company_name: str | None
    designation: str | None
    is_demo: bool = False
    username: str | None = None


def _parse_demo_token(token: str) -> AuthUser | None:
    key = token.removeprefix("Bearer ").strip()
    if key in DEMO_USERS:
        data = DEMO_USERS[key]
        return AuthUser(is_demo=True, **data)
    return None


async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
    x_demo_role: Annotated[str | None, Header()] = None,
) -> AuthUser:
    if authorization:
        raw = authorization.removeprefix("Bearer ").strip()
        demo = _parse_demo_token(raw)
        if demo:
            return demo
        from app.services.user_store import user_store

        registered = user_store.get_by_token(raw)
        if registered:
            profile = user_store.profile_dict(registered)
            return AuthUser(is_demo=False, **profile)

    if x_demo_role:
        token = f"demo-{x_demo_role.lower()}"
        demo = _parse_demo_token(token)
        if demo:
            return demo

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")


def require_role(*roles: str):
    async def checker(user: AuthUser = Depends(get_current_user)) -> AuthUser:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return checker


ManufacturerUser = Annotated[AuthUser, Depends(require_role("MANUFACTURER"))]
LenderUser = Annotated[AuthUser, Depends(require_role("LENDER"))]
AnyPlatformUser = Annotated[AuthUser, Depends(get_current_user)]
