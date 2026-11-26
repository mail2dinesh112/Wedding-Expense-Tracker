# Wedding Expense Tracker — Backend

FastAPI service for Phases 2–3. Routers and business logic use the `StorageService` interface; the implementation is selected at startup:

- `STORAGE_BACKEND=local` (default) → local JSON file, for development/tests.
- `STORAGE_BACKEND=github` → private GitHub repository via the Contents API, for production.

`GitHubStorage` reads the current file SHA and includes it on every PUT, so concurrent writes fail with 409 and are retried with a fresh read before reapplying the change. No token or response body is logged; failures return generic messages.

## Run

```bash
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

In development the admin password defaults to `admin` when `ADMIN_PASSWORD_HASH` is unset. In production `ADMIN_PASSWORD_HASH`, `JWT_SECRET`, and (for GitHub storage) `GITHUB_TOKEN`, `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME` must be provided. The token needs Contents read/write on the private data repository only.

Create a private repository containing `wedding.json` with the documented schema, then set `GITHUB_FILE_PATH` (default `wedding.json`) and optionally `GITHUB_BRANCH`.

## Tests

```bash
pytest -q
```

## Endpoints

- `GET /health` — public
- `POST /auth/login` — public, returns a JWT
- `GET/PUT /wedding` — protected
- `GET/POST /expenses` — protected
- `PUT/DELETE /expenses/{id}` — protected
- `GET /backup` — protected, downloads the full JSON data as `wedding.json`

All protected endpoints require `Authorization: Bearer <token>`. Errors use `{"error": {"code": "...", "message": "..."}}`.
