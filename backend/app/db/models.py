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


class Instance(Model):
    uuid = fields.CharField(pk=True, max_length=36)
    user = fields.OneToOneField(
        "models.User",
        related_name="instance",
        on_delete=fields.CASCADE,
    )
    task_id = fields.CharField(max_length=64)
    task_name = fields.CharField(max_length=255)
    status = fields.CharField(max_length=32, default="running")
    url = fields.CharField(max_length=255)
    created_at = fields.DatetimeField(auto_now_add=True)
    expires_at = fields.DatetimeField()
    extensions_count = fields.IntField(default=0)

    def __str__(self) -> str:
        return f"{self.uuid} -> {self.user_id} ({self.task_id})"
