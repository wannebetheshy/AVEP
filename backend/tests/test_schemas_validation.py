from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.models.schemas import RegisterRequest


def test_register_request_valid_and_invalid_cases():
    # valid
    req = RegisterRequest(username="alice", email="a@example.com", password="StrongPass1!")
    assert req.username == "alice"

    # username too short
    with pytest.raises(ValidationError):
        RegisterRequest(username="aa", email="a@example.com", password="StrongPass1!")

    # password too short
    with pytest.raises(ValidationError):
        RegisterRequest(username="alice2", email="a2@example.com", password="short")

    # invalid email
    with pytest.raises(ValidationError):
        RegisterRequest(username="bob", email="not-an-email", password="StrongPass1!")
