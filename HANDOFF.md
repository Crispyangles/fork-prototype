# Handoff — Fork prototype
**Date:** 2026-04-20  
**Status:** Working demo loop, animation bugs identified, no git history yet.

---

## Current state

The prototype runs fully end-to-end:
- 9-phase auto-loop (empty → typing → loading → results → clustered → pain → climax → remix → discover), ~30s cycle
- Live GitHub API search mode (click the input to activate)
- Masonry card layout, filter bar, Shed (localStorage bookmarks), search history (sessionStorage)
- Overlay/toast system wired for Shed panel

No backend, no build step, no git yet — pure vanilla HTML/CSS/JS.

---

## Animation bugs found (not yet fixed)

### Bug 1 — `enterClustered` skips `requestAnimationFrame` (`app.js:292`)

Every other phase that triggers a layout (`enterResults:281`, `enterClimax:322`, `enterRemix:331`) wraps its work in `requestAnimationFrame`. `enterClustered` calls `applyLayout('clustered')` synchronously. The masonry path inside `applyLayout` forces a reflow via `void cardsContainer.offsetHeight` (line 189) and immediately reads `card.offsetHeight` per card (line 202) — all before the browser has committed a paint for the new phase. Measured heights can be stale/wrong, causing cards to overlap or leave gaps in the masonry columns.

**Fix:** wrap `enterClustered` body in `requestAnimationFrame`.

### Bug 2 — Pain panel scroll undershoots (`app.js:309-314`)

`stage.scrollTo({ top: stage.scrollHeight, behavior: 'smooth' })` fires after a 450ms `setTimeout`. The `.pain-panel` `max-height` transition is `0.55s` (550ms). The scroll fires 100ms before the panel finishes expanding, so `stage.scrollHeight` is still at an intermediate value. Result: smooth-scroll stops short of showing the full pain list.

**Fix:** Increase the timeout to ≥ 600ms, or listen for `transitionend` on the panel before scrolling.

### Bug 3 — Tab-hide restarts loop from `empty` (`app.js:851-856`)

`document.visibilitychange` sets `running = false` when the tab is hidden, then calls `runLoop()` on return. `runLoop` always starts from phase index 0 (`empty`). Hiding mid-loop and returning resets the demo to the beginning.

**Fix:** Track current phase index and resume from it, or accept the restart as intended behavior (design call).

### Bug 4 — `cluster-headers` container keeps `pointer-events: none` when visible (`style.css:316-317`)

`.cluster-headers` sets `pointer-events: none`. The visible-phase CSS rules (lines 320-327) restore `opacity` and `transform` but do **not** reset `pointer-events`. Individual `.cluster-header` children override with `pointer-events: auto` (line 342), so clicking works, but hover near container edges is fragile.

**Fix:** Add `pointer-events: auto` to the visible-phase CSS block for `.cluster-headers`.

---

## What is NOT broken

- Card entry stagger in results phase — all cards finish within the 4500ms window
- Results → Clustered position transition — `--tx`/`--ty` update smoothly via 0.7s CSS transition
- Real GitHub search (fetch, broaden, paginate, cluster inference)
- Filter bar, language pills, Shed panel, toast

---

## Next session priorities

1. Fix Bug 1 (rAF in `enterClustered`) — highest visual impact, one-liner fix
2. Fix Bug 2 (pain scroll timing) — small tweak, noticeable UX win
3. Decide on Bug 3 behavior (restart vs. resume)
4. Push to private GitHub repo — `gh` CLI needs installing first (see below)

---

## GitHub setup (manual — `gh` CLI not installed on this machine)

```bash
brew install gh
gh auth login

# Then from the project dir:
cd /Users/reesemunoz/projects/testing/fork-prototype
gh repo create fork-prototype --private --source=. --remote=origin --push
```
