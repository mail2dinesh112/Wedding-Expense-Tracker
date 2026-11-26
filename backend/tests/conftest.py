import json
import os
import tempfile
from pathlib import Path

import pytest

os.environ["ENVIRONMENT"] = "test"
os.environ["JWT_SECRET"] = "test-secret"
os.environ["DATA_FILE"] = str(Path(tempfile.mkdtemp()) / "wedding.json")

from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import app

settings = get_settings()
get_settings.cache_clear()


def reset_data() -> None:
    Path(settings.data_file).write_text(
        json.dumps({
            "wedding": {
                "groom": "Dinesh",
                "bride": "Suthesi",
                "wedding_date": "2026-12-14",
                "total_budget": 100000.0,
            },
            "expenses": [],
        }),
        encoding="utf-8",
    )


@pytest.fixture
def client() -> TestClient:
    reset_data()
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def token(client: TestClient) -> str:
    response = client.post("/auth/login", json={"password": "admin"})
    assert response.status_code == 200
    return response.json()["access_token"]


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}
