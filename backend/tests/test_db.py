import pytest
from tortoise import Tortoise

from app.db.models import User
from app.services.auth_service import hash_password
from config import settings


@pytest.mark.asyncio
async def test_db_connection_and_crud():
    await Tortoise.init(
        db_url=settings.database_url,
        modules={"models": ["app.db.models"]},
    )
    await Tortoise.generate_schemas()

    user = await User.create(
        username="db_test_user",
        email="db_test_user@example.com",
        password=hash_password("TestPass123!"),
    )

    stored = await User.get(id=user.id)
    assert stored.username == "db_test_user"

    await stored.delete()
    assert await User.filter(id=user.id).count() == 0

    await Tortoise.close_connections()
