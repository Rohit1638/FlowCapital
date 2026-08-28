from fastapi import APIRouter, Depends, HTTPException, status



from app.core.auth import DEMO_USERS, AnyPlatformUser, get_current_user

from app.schemas.platform import (

    DemoLoginRequest,

    DemoLoginResponse,

    LoginRequest,

    LoginResponse,

    ProfileRead,

    RegisterRequest,

)

from app.services.user_store import user_store



router = APIRouter(prefix="/auth", tags=["Auth"])





def _profile_from_demo(token: str) -> ProfileRead:

    user = DEMO_USERS[token]

    return ProfileRead(

        id=user["id"],

        full_name=user["full_name"],

        email=user["email"],

        organization_name=user["organization_name"],

        role=user["role"],

        company_name=user["company_name"],

        designation=user["designation"],

        username=token.replace("demo-", "") + "_demo",

    )





@router.post("/register", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest):
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match")
    try:
        user = user_store.register(payload.username, payload.password, payload.role, payload.company_name)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    token = user_store.create_session(user)
    return LoginResponse(access_token=token, profile=ProfileRead(**user_store.profile_dict(user)))





@router.post("/login", response_model=LoginResponse)

def login(payload: LoginRequest):

    user = user_store.authenticate(payload.username, payload.password)

    if not user:

        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    token = user_store.create_session(user)

    return LoginResponse(access_token=token, profile=ProfileRead(**user_store.profile_dict(user)))





@router.post("/demo-login", response_model=DemoLoginResponse)

def demo_login(payload: DemoLoginRequest):

    token = f"demo-{payload.role.lower()}"

    if token not in DEMO_USERS:

        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")

    return DemoLoginResponse(access_token=token, profile=_profile_from_demo(token))





@router.get("/me", response_model=ProfileRead)

def me(user=Depends(get_current_user)):

    return ProfileRead(

        id=user.id,

        full_name=user.full_name,

        email=user.email,

        organization_name=user.organization_name,

        role=user.role,

        company_name=user.company_name,

        designation=user.designation,

        username=getattr(user, "username", None),

    )

