from fastapi import APIRouter, Depends, HTTPException, status

from app.constants import ROLE_ADMIN
from app.db.models import User
from app.middleware.auth import require_token
from app.models.schemas import (
    AdminLoginRequest,
    AuthSuccessResponse,
    LoginRequest,
    RegisterRequest,
    RegisterResponse,
    UserResponse,
    VerifyTokenResponse,
)
from app.services.auth_service import (
    admin_token_payload,
    authenticate_user,
    create_access_token,
    hash_password,
    verify_admin_credentials,
)

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


@router.post("/register", response_model=AuthSuccessResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest):
    existing_user = await User.filter(username=payload.username).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists")

    existing_email = await User.filter(email=payload.email).first()
    if existing_email:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

    user = await User.create(
        username=payload.username,
        email=payload.email,
        password=hash_password(payload.password),
    )

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return AuthSuccessResponse(
        token=token,
        user=UserResponse(
            id=str(user.id),
            username=user.username,
            email=user.email,
            role=user.role,
        ),
    )


@router.post("/login", response_model=AuthSuccessResponse)
async def login(payload: LoginRequest):
    user = await authenticate_user(payload.login, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return AuthSuccessResponse(
        token=token,
        user=UserResponse(
            id=str(user.id),
            username=user.username,
            email=user.email,
            role=user.role,
        ),
    )


@router.post("/admin-login", response_model=AuthSuccessResponse)
async def admin_login(payload: AdminLoginRequest):
    if not verify_admin_credentials(payload.username, payload.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(admin_token_payload())
    return AuthSuccessResponse(
        token=token,
        user=UserResponse(id="admin", username=payload.username, email=None, role=ROLE_ADMIN),
    )


@router.post("/verify", response_model=VerifyTokenResponse)
async def verify(token_payload: dict = Depends(require_token)):
    user_id = token_payload.get("sub")
    role = token_payload.get("role")
    if not user_id or not role:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    if role == ROLE_ADMIN:
        return VerifyTokenResponse(
            user=UserResponse(
                id="admin",
                username="admin",
                email=None,
                role=ROLE_ADMIN,
            )
        )

    user = await User.filter(id=user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    return VerifyTokenResponse(
        user=UserResponse(
            id=str(user.id),
            username=user.username,
            email=user.email,
            role=user.role,
        )
    )
