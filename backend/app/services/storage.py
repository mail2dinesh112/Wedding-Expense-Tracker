import base64
import json
import os
import tempfile
import threading
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

import httpx
from pydantic import ValidationError

from app.core.config import Settings, get_settings
from app.schemas.wedding import DataFile

DEFAULT_DATA = {
    "wedding": {
        "groom": "Dinesh",
        "bride": "Suthesi",
        "wedding_date": "2026-12-14",
        "total_budget": 100000,
    },
    "expenses": [],
}


class StorageError(Exception):
    pass


class ConflictError(Exception):
    pass


class StorageService(ABC):
    @abstractmethod
    def read(self) -> DataFile:
        raise NotImplementedError

    @abstractmethod
    def write(self, data: DataFile) -> None:
        raise NotImplementedError

    @abstractmethod
    def mutate(self, callback):
        raise NotImplementedError


class LocalJSONStorage(StorageService):
    def __init__(self, path: str | Path | None = None):
        configured = Path(path or get_settings().data_file)
        self.path = configured if configured.is_absolute() else Path(__file__).resolve().parents[2] / configured
        self._lock = threading.RLock()

    def read(self) -> DataFile:
        with self._lock:
            if not self.path.exists():
                self._write_raw(DEFAULT_DATA)
            try:
                raw = json.loads(self.path.read_text(encoding="utf-8"))
                return DataFile.model_validate(raw)
            except (OSError, json.JSONDecodeError, ValidationError) as error:
                raise StorageError("Stored data is unreadable or invalid.") from error

    def write(self, data: DataFile) -> None:
        with self._lock:
            self._write_raw(data.model_dump(mode="json"))

    def mutate(self, callback):
        with self._lock:
            data = self.read()
            result = callback(data)
            self.write(data)
            return result

    def _write_raw(self, payload: dict) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        handle = tempfile.NamedTemporaryFile(
            "w",
            encoding="utf-8",
            dir=self.path.parent,
            prefix=".wedding-",
            suffix=".tmp",
            delete=False,
        )
        try:
            json.dump(payload, handle, indent=2)
            handle.flush()
            os.fsync(handle.fileno())
            handle.close()
            os.replace(handle.name, self.path)
        except Exception:
            handle.close()
            if os.path.exists(handle.name):
                os.unlink(handle.name)
            raise


_default_github_client = httpx.Client(timeout=10.0)


class GitHubStorage(StorageService):
    API_URL = "https://api.github.com"

    def __init__(self, settings: Settings | None = None, client: httpx.Client | None = None):
        self.settings = settings or get_settings()
        if not all([
            self.settings.github_token,
            self.settings.github_repo_owner,
            self.settings.github_repo_name,
        ]):
            raise StorageError("GitHub storage is not configured.")
        self.client = client or _default_github_client
        self._url = (
            f"{self.API_URL}/repos/{quote(self.settings.github_repo_owner, safe='')}/"
            f"{quote(self.settings.github_repo_name, safe='')}/contents/"
            f"{quote(self.settings.github_file_path, safe='/')}"
        )
        self._headers = {
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {self.settings.github_token}",
            "X-GitHub-Api-Version": "2022-11-28",
        }

    def read(self) -> DataFile:
        data, _ = self._read_with_sha()
        return data

    def write(self, data: DataFile) -> None:
        def replace(target: DataFile) -> None:
            target.wedding = data.wedding
            target.expenses = data.expenses

        self.mutate(replace)

    def mutate(self, callback):
        attempts = max(1, self.settings.github_max_retries)
        for _ in range(attempts):
            data, sha = self._read_with_sha()
            result = callback(data)
            try:
                self._put(data, sha)
                return result
            except ConflictError:
                continue
        raise StorageError("Could not save data after repeated concurrent changes.")

    def _read_with_sha(self) -> tuple[DataFile, str]:
        params = {"ref": self.settings.github_branch} if self.settings.github_branch else None
        try:
            response = self.client.get(self._url, headers=self._headers, params=params)
        except httpx.HTTPError as error:
            raise StorageError("GitHub API unavailable.") from error
        if response.status_code in (401, 403):
            raise StorageError("GitHub authentication failed.")
        if response.status_code == 404:
            raise StorageError("Data file not found in the private repository.")
        if response.status_code >= 400:
            raise StorageError("GitHub API request failed.")
        payload = response.json()
        content = payload.get("content")
        sha = payload.get("sha")
        if not isinstance(content, str) or not isinstance(sha, str):
            raise StorageError("Invalid GitHub file response.")
        try:
            decoded = base64.b64decode(content).decode("utf-8")
            return DataFile.model_validate(json.loads(decoded)), sha
        except (ValueError, UnicodeDecodeError, json.JSONDecodeError, ValidationError) as error:
            raise StorageError("Stored data is unreadable or invalid.") from error

    def _put(self, data: DataFile, sha: str) -> None:
        payload = {
            "message": f"Wedding tracker update {datetime.now(timezone.utc).isoformat()}",
            "content": base64.b64encode(
                json.dumps(data.model_dump(mode="json"), indent=2).encode("utf-8")
            ).decode("ascii"),
            "sha": sha,
        }
        if self.settings.github_branch:
            payload["branch"] = self.settings.github_branch
        try:
            response = self.client.put(self._url, headers=self._headers, json=payload)
        except httpx.HTTPError as error:
            raise StorageError("GitHub API unavailable.") from error
        if response.status_code in (401, 403):
            raise StorageError("GitHub authentication failed.")
        if response.status_code == 409:
            raise ConflictError()
        if response.status_code >= 400:
            raise StorageError("GitHub API request failed.")
