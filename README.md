# Dinesh ♥ Suthesi — Wedding Expense Tracker

A lightweight, single-page wedding expense dashboard built with plain HTML, CSS, and Vanilla JavaScript. No build step, no backend, no dependencies. Designed for GitHub Pages.

## Features

- Wedding header with names, subtitle, and date
- Four live KPI cards: Total Budget, Total Expenses, Balance Amount, Total Transactions
- Editable total budget (pencil icon on the budget card)
- Add, edit, and delete expenses through a validated modal
- Search by expense name
- From Date, To Date, and Groom/Bride/Both side filters that combine with search
- Custom dropdowns for side selection and date pickers with a calendar panel
- Collapsible expense day cards with per-day totals, side split, and expand/collapse all
- Groom Side / Bride Side / Both Sides icons and Indian currency formatting (`₹1,00,000`)
- Friendly empty state for no records and for no filter matches
- LocalStorage persistence
- Responsive layout for desktop, tablet, and mobile

## Getting started

Open `index.html` directly in a browser, or serve the folder locally:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploying to GitHub Pages

1. Push this repository to GitHub.
2. In the repository, go to **Settings → Pages**.
3. Set **Source** to **Deploy from a branch**, choose `main` and `/ (root)`, then save.
4. The site will be available at the repository's GitHub Pages URL.

## Project structure

```text
├── index.html
├── assets/
│   ├── css/style.css
│   ├── js/
│   │   ├── app.js        # initialization, events, rendering
│   │   ├── expenses.js   # CRUD helpers, filters, KPIs, formatting
│   │   ├── dropdowns.js  # custom side and date dropdowns
│   │   └── storage.js    # LocalStorage and seed loading
│   ├── data/expenses.json
│   └── images/           # optimized WebP hero assets (sources in images/source/)
├── references/           # original design reference files
├── README.md
└── .gitignore
```

## Data behavior

- `assets/data/expenses.json` holds the wedding information and the initial expense list. It currently contains an **empty** expense list; add expenses in the app and they are saved in LocalStorage.
- Initial JSON is loaded **only when LocalStorage has no expense data**. Existing records are never overwritten on startup.
- Dates use ISO format (`YYYY-MM-DD`); amounts are stored as numbers; sides use `groom`, `bride`, or `both`.

## Design

Warm sunset palette: horizontal amber → peach → coral gradient `#FFC46B → #FA9062 → #F4635E` on the header and primary buttons, with white cards, a warm off-white page background, and soft `#F2DDD0` borders. Dark cocoa `#4A2A23` text keeps the gradient readable.
