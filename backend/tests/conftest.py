from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routers.admin import router as admin_router


@dataclass
class FakeUser:
    id: str = "user-1"
    username: str = "user"


class FakeInstance:
    def __init__(self, *, expires_at: datetime, extensions_count: int = 0) -> None:
        self.uuid = "inst-1"
        self.user_id = "user-1"
        self.user = FakeUser()
        self.task_id = "dvwa"
        self.task_name = "Damn Vulnerable Web App"
        self.status = "running"
        self.url = "http://inst-1.vulnavep.com"
        self.created_at = datetime(2026, 1, 1, tzinfo=timezone.utc)
        self.expires_at = expires_at
        self.extensions_count = extensions_count
        self.save_called = False
        self.fetch_related_called = False

    async def save(self) -> None:
        self.save_called = True

    async def fetch_related(self, *_args, **_kwargs) -> None:
        self.fetch_related_called = True


@pytest.fixture
def fixed_now() -> datetime:
    return datetime(2026, 5, 18, 12, 0, 0, tzinfo=timezone.utc)


@pytest.fixture
def fake_instance_factory():
    def _make(*, expires_at: datetime, extensions_count: int = 0) -> FakeInstance:
        return FakeInstance(expires_at=expires_at, extensions_count=extensions_count)

    return _make


@pytest.fixture
def admin_test_app() -> FastAPI:
    app = FastAPI()
    app.include_router(admin_router)
    return app


@pytest.fixture
def admin_client(admin_test_app: FastAPI) -> TestClient:
    with TestClient(admin_test_app) as client:
        yield client
