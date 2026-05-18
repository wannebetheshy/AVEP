from __future__ import annotations

from datetime import timedelta

from app.services import instance_service
from app.services.instance_service import _time_remaining_ms, build_instance_payload


def test_time_remaining_and_serialization(fixed_now, fake_instance_factory, monkeypatch):
    # Ensure instance_service uses the fixed now for deterministic results
    monkeypatch.setattr(instance_service, "_now", lambda: fixed_now)

    # past expires -> 0
    past = fake_instance_factory(expires_at=fixed_now - timedelta(minutes=1))
    assert _time_remaining_ms(past.expires_at) == 0

    # future expires -> positive
    future = fake_instance_factory(expires_at=fixed_now + timedelta(minutes=30))
    rem = _time_remaining_ms(future.expires_at)
    assert rem > 0 and rem <= 30 * 60 * 1000

    payload = build_instance_payload(future)
    assert payload.uuid == future.uuid
    assert payload.time_remaining_ms == rem
