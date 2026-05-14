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


class MessageResponse(BaseModel):
    status: str = "success"
    message: str


class AdminIdentity(BaseModel):
    id: str = "admin"
    username: str = "admin"
    role: str = ROLE_ADMIN


class TaskResponse(BaseModel):
    id: str
    name: str
    description: str
    difficulty: str
    category: str


class TaskListResponse(BaseModel):
    status: str = "success"
    tasks: list[TaskResponse]


class InstanceResponse(BaseModel):
    uuid: str
    task_id: str
    task_name: str
    status: str
    url: str
    created_at: str
    expires_at: str
    time_remaining_ms: int
    extensions_count: int = 0


class UserInstanceStatusResponse(BaseModel):
    status: str = "success"
    has_active_instance: bool
    instance: InstanceResponse | None = None


class DeployRequest(BaseModel):
    task_id: str


class DeployResponse(BaseModel):
    status: str = "success"
    instance: InstanceResponse


class ExtendResponse(BaseModel):
    status: str = "success"
    instance: InstanceResponse
    new_expires_at: str
    new_time_remaining_ms: int


class TerminateResponse(BaseModel):
    status: str = "success"
    message: str
    instance_uuid: str


class AdminInstanceResponse(BaseModel):
    uuid: str
    user_id: str
    username: str
    task_id: str
    task_name: str
    status: str
    url: str
    created_at: str
    expires_at: str
    time_remaining_ms: int
    extensions_count: int = 0


class AdminInstanceListResponse(BaseModel):
    status: str = "success"
    items: list[AdminInstanceResponse]


class AdminTerminateResponse(BaseModel):
    status: str = "success"
    message: str
    instance_uuid: str
