from __future__ import annotations

from unittest.mock import AsyncMock

from app.middleware.auth import require_token
from app.routers import admin as admin_router_module


def test_admin_endpoint_requires_admin_role(admin_client, admin_test_app, monkeypatch):
    role = {"value": "user"}

    def fake_require_token():
        return {"sub": "actor-1", "role": role["value"]}

    monkeypatch.setattr(
        admin_router_module,
        "list_admin_instances",
        AsyncMock(return_value=[]),
    )

    admin_test_app.dependency_overrides[require_token] = fake_require_token

    try:
        denied = admin_client.get("/api/v1/admin/instances")
        assert denied.status_code == 403

        role["value"] = "admin"
        allowed = admin_client.get("/api/v1/admin/instances")
        assert allowed.status_code == 200
        body = allowed.json()
        assert body["status"] == "success"
        assert body["items"] == []
    finally:
        admin_test_app.dependency_overrides.clear()
