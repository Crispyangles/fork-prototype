# Handoff — Fork prototype
**Date:** 2026-04-21
**Status:** Getting Started feature complete. One active bug: language chip switching is broken while an in-flight fetch is running. Ready for that fix, then push to GitHub.

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

## 🔴 ACTIVE BUG — Language chips don't respond to clicks

### Symptoms
Open Getting Started mode → the "Documentation" chip loads and shows issues. Click any other chip (JavaScript, Python, etc.) → nothing happens. The active chip stays on docs, and the status text doesn't change.

### Root cause
`app.js` line 1502:
```js
async function loadGSIssues(lang) {
  if (gsInflight) return;   // ← THIS IS THE BUG
```

When the page enters GS mode, `loadGSIssues('docs')` is called immediately. `gsInflight` is set to `true` at line 1503. The GitHub API fetch takes 1–3 seconds. Any chip click during that window hits the guard and silently returns — no UI feedback, no queuing, no response.

`gsInflight` is reset in the `finally` block at line 1581 — but by then the user has already given up thinking the chips are broken.

**Repro steps:**
1. Open `http://localhost:8000/index.html`
2. Click "Get started" in the nav (or "New to open source? Start here →")
3. Immediately (within ~2 seconds) click the "JavaScript" chip
4. Nothing happens — active chip stays on "Documentation"

If you **wait ~3 seconds** and THEN click a chip, it works fine.

### Recommended fix (AbortController approach)
Replace the silent `return` with AbortController so clicking a chip cancels the in-flight request and starts the new one:

```js
// Add near the gsInflight declaration (around line 1458):
let gsAbortController = null;

// Replace the top of loadGSIssues with:
async function loadGSIssues(lang) {
  // Cancel any in-flight request
  if (gsAbortController) gsAbortController.abort();
  gsAbortController = new AbortController();
  gsInflight = true;
  // ... rest unchanged ...
  // In fetchGSIssues, pass signal: gsAbortController.signal to fetch()
  // Catch AbortError separately — just return without showing error UI
}
```

Alternative simpler fix (pending-lang pattern):
```js
let gsPendingLang = null;   // declare alongside gsInflight

async function loadGSIssues(lang) {
  if (gsInflight) {
    gsPendingLang = lang;
    // Give immediate visual feedback
    document.querySelectorAll('.gs-chip').forEach(c =>
      c.classList.toggle('is-active', c.dataset.gslang === lang));
    return;
  }
  // ... rest unchanged ...
  } finally {
    gsInflight = false;
    if (gsPendingLang && gsPendingLang !== gsCurrentLang) {
      const next = gsPendingLang;
      gsPendingLang = null;
      loadGSIssues(next);
    }
  }
}
```

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
| `loadGSIssues()` | ~1501 **← tabs bug here** |
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

The tabs debug test was used to confirm the `gsInflight` root cause. Key output:
```
Active before click: [docs]
Active after  click: [docs]      ← no change
Chip click worked: NO ✗ — no change
.gs-lang-chips computed: { pointerEvents: 'auto' }   ← CSS is fine, not a z-index issue
```

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
| Chip switching works | ❌ **BROKEN — see Active Bug above** |

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

1. **Fix the tabs bug** — `app.js` line 1502, `loadGSIssues()`, replace silent `return` (see fix options above)
2. **Commit** the fix: `git commit -m "fix: chip switching works during in-flight fetch"`
3. **Run** `node /tmp/fork-personas/test-gs-scaffold.mjs` and `node /tmp/fork-personas/test-tabs-debug.mjs` to confirm
4. **Push** to GitHub when ready (`gh` CLI install + steps above)
