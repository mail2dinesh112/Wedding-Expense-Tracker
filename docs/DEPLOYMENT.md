# Deployment guide

React frontend on GitHub Pages, FastAPI backend on Render, data in a separate private GitHub repository.

## 1. Private data repository

Create a **private** repository (for example `wedding-expense-data`) containing one file:

`wedding.json`

```json
{
  "wedding": {
    "groom": "Dinesh",
    "bride": "Suthesi",
    "wedding_date": "2026-12-14",
    "total_budget": 100000.0
  },
  "expenses": []
}
```

Create a fine-grained Personal Access Token with **Contents: read and write** on that repository only. Set an expiry and rotate it before it lapses. Never put this token in the frontend or in source control.

## 2. Backend on Render

1. Connect this source repository to Render and use `backend/render.yaml` as the blueprint.
2. Set these secret environment values in Render:
   - `JWT_SECRET` — a long random string.
   - `ADMIN_PASSWORD_HASH` — generate with:
     ```bash
     python -c "import bcrypt; print(bcrypt.hashpw(b'your-password', bcrypt.gensalt()).decode())"
     ```
   - `GITHUB_TOKEN` — the fine-grained PAT from step 1.
   - `GITHUB_REPO_NAME` — the private data repository name.
3. Confirm non-secret values in the blueprint: `ENVIRONMENT=production`, `STORAGE_BACKEND=github`, `GITHUB_REPO_OWNER`, `GITHUB_FILE_PATH`, `GITHUB_BRANCH`, `CORS_ORIGINS`.
4. Render uses `/health` as the health check. On the free plan the service sleeps when idle, so the first request may take a few seconds.

## 3. Frontend on GitHub Pages

1. In repository **Settings → Pages**, set Source to **GitHub Actions**.
2. Add a repository variable `VITE_API_URL` = the Render service URL (no trailing slash).
3. Push to `main` (or run the workflow manually). `.github/workflows/deploy-frontend.yml` builds `frontend/dist` with `VITE_MOCK_MODE=false` and deploys it.
4. Site URL: `https://mail2dinesh112.github.io/Wedding-Expense-Tracker/`.

If the Render URL changes, update the `VITE_API_URL` variable and re-run the workflow — Vite embeds it at build time.

## 4. Verify production

- `GET https://<render-url>/health` → `{"status":"ok"}`
- Open the Pages URL, sign in with the admin password, add an expense.
- Check that a new commit appeared in `wedding.json` in the private repository.
- `GET /backup` with the Bearer token downloads the current JSON.

## 5. Data migration and backup

- Expenses previously stored in the old static app's browser LocalStorage are **not** migrated automatically. Re-create them through the UI or import them with the authenticated API.
- Git history in the private repository is the change history. `GET /backup` provides a manual export.

## 6. Security checklist

- No token, password, or JWT secret in frontend code or committed files.
- CORS allows only the GitHub Pages origin.
- Token scoped to one private repository with Contents write only.
- HTTPS on both Render and GitHub Pages.
- 409 SHA conflicts are retried server-side; writes are not blindly overwritten.
