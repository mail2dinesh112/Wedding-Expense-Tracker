import base64
import json

import httpx
import pytest

from app.core.config import Settings
from app.schemas.expense import ExpenseOut
from app.services.github_storage import GitHubStorage
from app.services.storage import StorageError

INITIAL = {
    "wedding": {
        "groom": "Dinesh",
        "bride": "Suthesi",
        "wedding_date": "2026-12-14",
        "total_budget": 100000.0,
    },
    "expenses": [],
}


def settings() -> Settings:
    return Settings(
        environment="test",
        github_token="test-token",
        github_repo_owner="owner",
        github_repo_name="repo",
        github_file_path="wedding.json",
        github_max_retries=3,
    )


def encoded(data: dict) -> str:
    return base64.b64encode(json.dumps(data).encode()).decode()


class GithubApiStub:
    def __init__(self, data=None, conflict_once=False, status=None):
        self.data = data or INITIAL
        self.sha = "sha-1"
        self.conflict_once = conflict_once
        self.status = status
        self.puts = []

    def handler(self, request: httpx.Request) -> httpx.Response:
        if self.status:
            return httpx.Response(self.status, json={}, request=request)
        if request.method == "GET":
            return httpx.Response(200, json={"content": encoded(self.data), "sha": self.sha}, request=request)
        payload = json.loads(request.content)
        self.puts.append(payload)
        if self.conflict_once and len(self.puts) == 1:
            return httpx.Response(409, json={}, request=request)
        if payload.get("sha") != self.sha:
            return httpx.Response(409, json={}, request=request)
        self.data = json.loads(base64.b64decode(payload["content"]))
        self.sha = f"sha-{len(self.puts) + 1}"
        return httpx.Response(200, json={"content": payload["content"], "sha": self.sha}, request=request)

    def storage(self) -> GitHubStorage:
        client = httpx.Client(transport=httpx.MockTransport(self.handler))
        return GitHubStorage(settings(), client)


def test_github_read():
    storage = GithubApiStub().storage()
    data = storage.read()
    assert data.wedding.groom == "Dinesh"
    assert data.expenses == []


def test_github_mutate_writes_updated_sha():
    api = GithubApiStub()
    storage = api.storage()

    def add_expense(data):
        data.expenses.append(ExpenseOut(
            id="EXP001", date="2026-11-22", name="PETROL", side="groom", amount=100
        ))
        return "done"

    assert storage.mutate(add_expense) == "done"
    assert len(api.puts) == 1
    assert api.puts[0]["sha"] == "sha-1"
    assert api.data["expenses"][0]["name"] == "PETROL"


def test_github_retries_on_conflict():
    api = GithubApiStub(conflict_once=True)
    storage = api.storage()
    calls = []

    def add_expense(data):
        calls.append(1)
        data.expenses.append(ExpenseOut(
            id="EXP001", date="2026-11-22", name="TEA", side="bride", amount=50
        ))

    storage.mutate(add_expense)
    assert len(calls) == 2
    assert len(api.puts) == 2
    assert api.data["expenses"][0]["name"] == "TEA"


def test_github_auth_failure():
    storage = GithubApiStub(status=401).storage()
    with pytest.raises(StorageError, match="authentication failed"):
        storage.read()


def test_github_api_failure():
    storage = GithubApiStub(status=500).storage()
    with pytest.raises(StorageError, match="request failed"):
        storage.read()


def test_github_invalid_content():
    api = GithubApiStub()
    api.data = {"wedding": {}, "expenses": "not-a-list"}
    with pytest.raises(StorageError, match="unreadable or invalid"):
        api.storage().read()


def test_github_requires_configuration():
    with pytest.raises(StorageError, match="not configured"):
        GitHubStorage(Settings(environment="test"))
