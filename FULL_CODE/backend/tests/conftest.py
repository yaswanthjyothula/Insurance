"""Test setup: runtime data goes to a throw-away folder so tests never touch real saved data."""

import tempfile
from pathlib import Path

import pytest

import app.core.config as config

_TMP = Path(tempfile.mkdtemp(prefix="lifesure-test-"))
config.settings.STORE_DIR = _TMP
import app.services.storage as storage  # noqa: E402

storage.storage_service = storage.StorageService(_TMP)
for _mod in (
    "app.services.advisory",
    "app.services.auth",
    "app.api.v1.routes.assessments",
    "app.api.v1.routes.scenarios",
    "app.api.v1.routes.my_plan",
):
    __import__(_mod)
    __import__(_mod, fromlist=["x"]).storage_service = storage.storage_service


@pytest.fixture(scope="session")
def client():
    from fastapi.testclient import TestClient

    from app.main import app

    return TestClient(app)


@pytest.fixture()
def auth_headers(client):
    token = client.post("/api/v1/auth/demo").json()["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(autouse=True)
def _fresh_rate_limits():
    from app.core import security

    security._hits.clear()
    yield
