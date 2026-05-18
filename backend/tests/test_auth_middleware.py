from __future__ import annotations

import pytest
from fastapi import HTTPException

from app.middleware.auth import get_bearer_token


def test_bearer_auth_middleware_rejection_paths_and_success_case():
    with pytest.raises(HTTPException) as missing:
        get_bearer_token(None)
    assert missing.value.status_code == 401

    with pytest.raises(HTTPException) as wrong_scheme:
        get_bearer_token("Basic abc")
    assert wrong_scheme.value.status_code == 401

    with pytest.raises(HTTPException) as empty_bearer:
        get_bearer_token("Bearer ")
    assert empty_bearer.value.status_code == 401

    assert get_bearer_token("Bearer valid-token") == "valid-token"
