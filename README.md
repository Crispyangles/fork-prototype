# Fork — don't reinvent. re-fork.

A single-page prototype that demos an AI-powered GitHub research tool.

## What it does

Type any topic → Fork searches GitHub → shows clustered results → mines issues for pain points → proposes a differentiated "re-fork" idea to build. Runs as a scripted 30s auto-loop in demo mode; clicking the search box switches to live GitHub API search.

## Stack

Vanilla HTML/CSS/JS. No build step, no dependencies, no framework.

- `index.html` — markup + CSP header
- `style.css` — dark glassmorphism design system; phase-driven layout via `body[data-phase]`
- `app.js` — phase machine (8 phases), masonry card layout, real GitHub search, Shed (saved repos), search history
- `data/fake-repos.js` — scripted demo data (repos, pain points, gap analysis, remix idea)

## Running locally

```bash
# Any static server works, e.g.:
npx serve .
# or
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Phases (demo loop)

`empty → typing → loading → results → clustered → pain → climax → remix → discover`

Each phase is driven by `body[data-phase]` — CSS selectors handle visibility/transitions; JS handles layout calculations and data population.
