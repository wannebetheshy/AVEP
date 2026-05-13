from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.constants import ROLE_ADMIN
from app.db.models import User
from config import settings

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    if len(password) > 32:
        raise ValueError("Password must be at most 32 characters")
    return _pwd_context.hash(password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return _pwd_context.verify(plain_password, password_hash)


def create_access_token(payload: dict[str, Any]) -> str:
    expires = datetime.now(timezone.utc) + timedelta(
        hours=settings.jwt_expiration_hours
    )
    to_encode = payload.copy()
    to_encode.update({"exp": expires})
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])


def verify_admin_credentials(username: str, password: str) -> bool:
    return username == settings.admin_username and password == settings.admin_password


def admin_token_payload() -> dict[str, Any]:
    return {"sub": "admin", "role": ROLE_ADMIN}


async def authenticate_user(login: str, password: str) -> User | None:
    user = await User.filter(username=login).first()
    if not user:
        user = await User.filter(email=login).first()
    if not user:
        return None
    if not verify_password(password, user.password):
        return None
    return user


def parse_token(token: str) -> dict[str, Any]:
    try:
        return decode_token(token)
    except JWTError as exc:
        raise ValueError("Invalid token") from exc
