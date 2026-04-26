# Handoff — Fork prototype
**Date:** 2026-04-26
**Status:** Getting Started feature complete. Language-chip switching bug fixed (pending-lang queue pattern). Ready to push to GitHub.

---

## Project in 3 lines

**Fork** is a vanilla JS/HTML/CSS research tool (no build step). It shows GitHub repos matching any search topic via the GitHub Search API. It has two modes: (1) a 9-phase animated demo loop with fake data, and (2) a live search mode. A third mode — **Getting Started** — helps first-time contributors find beginner-friendly GitHub issues to fix.

Run it: `cd /Users/reesemunoz/projects/testing/fork-prototype && python3 -m http.server 8000`  
Open: `http://localhost:8000/index.html`

---

## Recent commit history (newest first)

| Hash | Message |
|------|---------|
| `31d1654` | fix: Before you start no longer navigates to GitHub |
| `19adc01` | Getting Started: concept extractor + resource map |
| `cb07165` | docs: update HANDOFF with Getting Started feature details |
| `14aba92` | Getting Started: beginner-friendly enhancements |
| `03a1df9` | Getting Started: scaffold — nav, HTML structure, CSS, JS wiring |
| `747503d` | Add OG/Twitter meta tags; update HANDOFF with post-push checklist |

---

## ✅ Resolved — Language chip switching during in-flight fetch

The pending-lang queue pattern is implemented in `app.js`:
- `gsPendingLang` declared alongside `gsInflight` (~line 1459).
- `loadGSIssues(lang)` queues the requested lang and updates the active chip class immediately when a fetch is already in flight (~line 1503).
- The `finally` block fires the queued lang after the in-flight request completes (~line 1620).

If chip switching ever regresses, run `node /tmp/fork-personas/test-tabs-debug.mjs` to confirm.

---

## Architecture crib sheet

### Phase system
`body[data-phase]` controls all visibility via CSS attribute selectors. The phases:
```
empty → typing → loading → results → clustered → pain → climax → remix
```
Plus a separate mode: `getting-started`

JS variable `mode` tracks: `'demo' | 'real' | 'getting-started'`

### ⚠️ Z-index gotcha — the invisible overlay pattern
Every `.gs-card` has a `.gs-card-openlink` element:
```css
.gs-card-openlink {
  position: absolute;
  inset: 0;
  z-index: 1;   /* covers the ENTIRE card */
}
```
This makes the whole card a clickable link to the GitHub issue. **Any interactive element inside the card (buttons, links) MUST have `position: relative; z-index: 2` or the overlay steals its clicks.** This caused TWO bugs this session — fixed in commits `31d1654` and `14aba92`. If you add any button or link inside a `.gs-card`, always add those two CSS rules.

### GS mode key variables (`app.js` ~line 1456–1458)
```js
let gsCurrentLang = 'docs';   // which chip is active
let gsAllIssues = [];          // all fetched issues for current lang
let gsInflight = false;        // ← root of tabs bug
```

### sessionStorage / localStorage
- `gs:<lang>` → `{ data: [...], ts: epochMs }` — 10-min issue cache per language
- `gs:banner:dismissed` → `'1'` — dismissible "you don't need to code" banner
- `gs:concepts:viewed` → `{ conceptName: epochMs }` — tracks which concept resources the user has opened

### Getting Started card structure
Each card has:
- `.gs-card-openlink` — invisible full-card link (z-index: 1) → opens GitHub issue
- `.gs-card-learnbtn` — "Before you start ▾" toggle button (**must have z-index: 2**)
- `.gs-card-learn` — expandable panel with 5-step recipe + concept resources (**must have z-index: 2**)
- `.gs-browser-fix` (optional) — badge for issues fixable in the browser

### Masonry layout
`applyGSLayout()` mirrors main `applyLayout('clustered')`. Uses CSS custom properties `--tx`, `--ty`, `--gs-card-w`. Always call inside `requestAnimationFrame` after adding cards.

---

## File map

| File | What's in it |
|------|-------------|
| `app.js` | All logic, ~1600 lines. GS feature starts around line 1200 |
| `style.css` | All styles, ~2100 lines. GS styles near the bottom |
| `index.html` | Static HTML shell. `#gsView` section with 7 chip buttons |
| `data/fake-repos.js` | Static fake data for the demo loop |
| `docs/` | hero.gif, social-preview.png, screenshots/ |
| `README.md` | Public-facing readme with hero GIF and feature table |
| `HANDOFF.md` | This file |
| `.github/workflows/pages.yml` | Auto-deploys to GitHub Pages on push to main |

### Key app.js sections (approximate line numbers)
| Section | Line |
|---------|------|
| Constants / config | ~1 |
| DOM refs | ~50 |
| Phase transitions | ~200 |
| `runLoop()` — demo phases | ~360 |
| `enterClustered()` / `applyLayout()` | ~280 |
| Filters / pills | ~600 |
| Shed / overlay / toast | ~800 |
| Getting Started — `RESOURCE_MAP` | ~1200 |
| `extractConcepts()` | ~1250 |
| `mapGSIssue()` | ~1310 |
| `createGSCard()` | ~1340 |
| `applyGSLayout()` | ~1420 |
| `loadGSIssues()` | ~1501 |
| `enterGettingStarted()` / `exitGettingStarted()` | ~1586 |
| Chip event listeners | ~1619 |

---

## Test suite

Tests live in `/tmp/fork-personas/` (has its own `node_modules/playwright`).

```bash
cd /tmp/fork-personas
node test-gs-scaffold.mjs      # 10 smoke checks for GS mode
node test-learn-fix.mjs        # 6 checks for "Before you start" toggle
node test-tabs-debug.mjs       # diagnostic: confirms chips receive clicks but gsInflight blocks them
```

`test-tabs-debug.mjs` was originally written to diagnose the `gsInflight`
chip-blocking bug. After the pending-lang queue fix, it serves as a
regression check — clicking a chip while a fetch is in flight should now
update the active chip class immediately and fire the queued fetch in
`finally`.

---

## Getting Started feature — what's done

| Feature | Status |
|---------|--------|
| Nav toggle `#navGetStarted` | ✅ |
| "Fix typos & docs" chip active on entry | ✅ |
| 7 language chips: Any / JS / Python / HTML / Go / Rust / Docs | ✅ |
| Difficulty badges (🟢 Easiest / 🟡 A bit more) | ✅ |
| "Show me how →" expander per card | ✅ |
| Encouraging banner (dismissible, localStorage) | ✅ |
| Glossary overlay (📖 button, 10 terms) | ✅ |
| "Before you start ▾" concept resources per card | ✅ |
| `extractConcepts()` — classifies issues into learning concepts | ✅ |
| `RESOURCE_MAP` — 12 curated free resources by concept | ✅ |
| sessionStorage cache (10-min TTL) | ✅ |
| Fallback repos on API failure | ✅ |
| Show 8 / reveal N more | ✅ |
| Chip switching works | ✅ |

---

## How to push to GitHub (when ready)

`gh` CLI is not installed. Install it first:
```bash
brew install gh && gh auth login
cd /Users/reesemunoz/projects/testing/fork-prototype
gh repo create fork-prototype --private --source=. --remote=origin --push
# When ready to make public:
gh repo edit fork-prototype --visibility public
```

### Post-push checklist
1. **Replace `<USERNAME>` placeholders** in `README.md` and `index.html`:
   ```bash
   sed -i '' 's/<USERNAME>/crispyangles/g' README.md index.html
   git add README.md index.html && git commit -m "Set GitHub username" && git push
   ```
2. **GitHub Pages**: Settings → Pages → Source: GitHub Actions (workflow already in repo)
3. **Social preview**: Settings → Social preview → upload `docs/social-preview.png`
4. **Repo metadata**:
   ```bash
   gh repo edit fork-prototype --description "Beautiful research tool for builders. Type any topic, see what exists on GitHub, find your unmet niche."
   gh repo edit fork-prototype --add-topic github-search --add-topic vanilla-js --add-topic no-build-tools
   ```
5. **Fill in README** "Why I built this" section (marked with TODO comment)

---

## Next steps (in order)

1. **Run** `node /tmp/fork-personas/test-gs-scaffold.mjs` and `node /tmp/fork-personas/test-tabs-debug.mjs` to confirm chip switching still works.
2. **Push** to GitHub when ready (`gh` CLI install + steps above).
3. **Fill in README** "Why I built this" section.
