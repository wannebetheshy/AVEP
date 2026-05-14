from pydantic import BaseModel, EmailStr, Field

from app.constants import ROLE_ADMIN, ROLE_USER


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8, max_length=32)


class RegisterResponse(BaseModel):
    status: str = "success"
    message: str = "User registered successfully"
    user_id: str


class LoginRequest(BaseModel):
    login: str
    password: str


class AdminLoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: str
    username: str
    email: EmailStr | None = None
    role: str = ROLE_USER


class AuthSuccessResponse(BaseModel):
    status: str = "success"
    token: str
    user: UserResponse


class VerifyTokenResponse(BaseModel):
    status: str = "success"
    valid: bool = True
    user: UserResponse


class ErrorResponse(BaseModel):
    status: str = "error"
    message: str
    code: str


class AdminIdentity(BaseModel):
    id: str = "admin"
    username: str = "admin"
    role: str = ROLE_ADMIN
