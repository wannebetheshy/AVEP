from pydantic import BaseModel, EmailStr, Field

from app.constants import ROLE_USER


class UserProfile(BaseModel):
    id: str
    username: str
    email: EmailStr | None = None
    role: str = ROLE_USER


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8, max_length=32)
