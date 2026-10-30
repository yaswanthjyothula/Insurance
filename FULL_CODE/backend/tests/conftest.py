"""Test setup: runtime data goes to a throw-away folder so tests never touch real saved data."""

import tempfile
from pathlib import Path

import pytest

import app.core.config as config

_TMP = Path(tempfile.mkdtemp(prefix="lifesure-test-"))
config.settings.STORE_DIR = _TMP
# The tests must never reach a real Supabase project or depend on what a developer has in .env
config.settings.SUPABASE_URL = ""
config.settings.SUPABASE_KEY = ""
config.settings.ENABLE_DEMO_LOGIN = True
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


@pytest.fixture(autouse=True)
def _factory_configuration():
    """Admin tests change the live configuration. Every test starts from, and leaves behind, the factory defaults."""
    from app.admin.config_store import config_store, factory_config
    from app.pack.loader import get_base_pack

    def restore():
        base = get_base_pack()
        current = config_store.current().config
        if current.model_dump(exclude={"version", "updated_at", "updated_by"}) != factory_config(base).model_dump(
            exclude={"version", "updated_at", "updated_by"}
        ):
            config_store.commit(lambda cfg: factory_config(base).model_dump(), "tests", "restore factory defaults")

    restore()
    yield
    restore()
