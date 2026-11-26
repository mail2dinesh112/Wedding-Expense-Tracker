# Wedding Expense Tracker — Frontend

React + Vite + Tailwind CSS frontend for the Wedding Expense Tracker. Phase 4 connects it to the FastAPI backend; the original static app remains at the repository root.

## Run locally

Start the backend first (`cd ../backend && uvicorn app.main:app --reload --port 8000`), then:

```bash
npm install
npm run dev
```

Open the URL printed by Vite and sign in with the backend admin password. In development the backend accepts `admin` when `ADMIN_PASSWORD_HASH` is unset.

## Modes

- `VITE_MOCK_MODE=false` (default): all data comes from `VITE_API_URL` with a Bearer JWT.
- `VITE_MOCK_MODE=true`: browser-only LocalStorage mock for UI work without the backend (`VITE_MOCK_PASSWORD`).

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build to `dist/`
- `npm run preview` — preview the production build
- `npm test` — Vitest + React Testing Library

## Deployment

Vite `base` is set to `/Wedding-Expense-Tracker/` for GitHub Pages. Publish `frontend/dist` via GitHub Actions. `VITE_API_URL` is baked at build time.
