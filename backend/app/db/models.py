from tortoise import fields
from tortoise.models import Model

from app.constants import ROLE_USER


class User(Model):
    id = fields.UUIDField(pk=True)
    username = fields.CharField(max_length=50, unique=True)
    email = fields.CharField(max_length=255, unique=True)
    password = fields.CharField(max_length=255)
    role = fields.CharField(max_length=20, default=ROLE_USER)
    created_at = fields.DatetimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.username} ({self.role})"

    def verify_password(self, plain_password: str) -> bool:
        from app.services.auth_service import verify_password

        return verify_password(plain_password, self.password)
