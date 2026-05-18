from __future__ import annotations

from datetime import datetime, timezone

import pytest

from app.services.auth_service import create_access_token, decode_token, parse_token
from config import settings


def test_jwt_integrity_claims_and_tamper_rejection(monkeypatch):
    monkeypatch.setattr(settings, "jwt_secret_key", "unit-test-secret")
    monkeypatch.setattr(settings, "jwt_algorithm", "HS256")
    monkeypatch.setattr(settings, "jwt_expiration_hours", 24)

    token = create_access_token({"sub": "u-1", "role": "user"})
    payload = decode_token(token)

    assert payload["sub"] == "u-1"
    assert payload["role"] == "user"
    assert "exp" in payload
    assert payload["exp"] > datetime.now(timezone.utc).timestamp()

    tampered = f"{token[:-1]}x"
    with pytest.raises(ValueError, match="Invalid token"):
        parse_token(tampered)
