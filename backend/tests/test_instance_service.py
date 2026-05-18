from __future__ import annotations

from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

from app.services import instance_service


@pytest.mark.asyncio
async def test_instance_extension_threshold_rule(monkeypatch, fixed_now, fake_instance_factory):
    monkeypatch.setattr(instance_service, "_now", lambda: fixed_now)

    blocked_instance = fake_instance_factory(expires_at=fixed_now + timedelta(minutes=16))

    async def blocked_get_user_instance(_user_id: str):
        return blocked_instance

    monkeypatch.setattr(instance_service, "get_user_instance", blocked_get_user_instance)

    with pytest.raises(HTTPException) as blocked:
        await instance_service.extend_user_instance("user-1")
    assert blocked.value.status_code == 400

    allowed_instance = fake_instance_factory(expires_at=fixed_now + timedelta(minutes=14, seconds=59))

    async def allowed_get_user_instance(_user_id: str):
        return allowed_instance

    monkeypatch.setattr(instance_service, "get_user_instance", allowed_get_user_instance)

    result = await instance_service.extend_user_instance("user-1")
    assert result.extensions_count == 1
    assert result.expires_at == fixed_now + timedelta(minutes=44, seconds=59)
    assert result.save_called is True
    assert result.fetch_related_called is True


@pytest.mark.asyncio
async def test_deploy_guard_blocks_second_active_instance(monkeypatch):
    user = SimpleNamespace(id="user-1")

    async def fake_existing(_user_id: str):
        return object()

    deploy_mock = AsyncMock()

    monkeypatch.setattr(instance_service, "get_user_instance", fake_existing)
    monkeypatch.setattr(instance_service, "deploy_k8s_instance", deploy_mock)

    with pytest.raises(HTTPException) as blocked:
        await instance_service.deploy_instance_for_user(user, "dvwa")

    assert blocked.value.status_code == 400
    deploy_mock.assert_not_awaited()
