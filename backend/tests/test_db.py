import pytest
from tortoise import Tortoise

from app.db.models import User
from app.services.auth_service import hash_password
from config import settings


@pytest.mark.asyncio
async def test_db_connection_and_crud():
    await Tortoise.init(
        db_url="sqlite://:memory:",
        modules={"models": ["app.db.models"]},
    )
    await Tortoise.generate_schemas()

    from types import SimpleNamespace
    import app.services.auth_service as auth_svc
    stub = SimpleNamespace(hash=lambda p: f"stubhash:{p}")
    monkeypatch = None
    try:
        import pytest
    except Exception:
        pass
    setattr(auth_svc, "_pwd_context", stub)

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
