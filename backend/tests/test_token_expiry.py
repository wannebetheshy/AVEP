from __future__ import annotations

import pytest

from app.services.auth_service import create_access_token, parse_token
from config import settings


def test_token_expired_when_expiration_in_past(monkeypatch):
    monkeypatch.setattr(settings, "jwt_secret_key", "unit-test-secret")
    monkeypatch.setattr(settings, "jwt_algorithm", "HS256")
    # set expiration to -1 hours so token is already expired
    monkeypatch.setattr(settings, "jwt_expiration_hours", -1)

    token = create_access_token({"sub": "u-exp", "role": "user"})

    with pytest.raises(ValueError):
        parse_token(token)
