# Phase 8 — Baseline

Date: **2026-11-01** · Environment: Node v24.22.1, npm 10.9.4,
Playwright 1.64.1 (Chromium Headless Shell 156).

## Verified facts

| Check | Result |
|---|---|
| Repository form | `~/workspace/zonasipil-structure/` is **not a git checkout** (no `.git`) — no branch/HEAD/dirty state exists to record; state = file tree, as in every prior phase |
| Phase 7 artifacts | all 9 `docs/PHASE-7-*.md` present; all 7 e2e specs present (smoke, workflows, accessibility, live-announcements, drag-move, keyboard-modelling, mobile-a11y) |
| Suite | **222/222 PASS (26 files)** |
| Build + typecheck | PASS |
| Lint | **20 problems: 0 errors, 20 warnings** (all react-refresh/only-export-components, DX-only) |
| E2E | **25/25 PASS** |
| Lockfile | sha256 prefix `b294dc3d153cb492` — unchanged since Phase 5 |
| Engine | `src/engine/**` untouched since Phase 2 provenance (import-lines only vs original); re-verified at Phase 7 close (solver diff 0 lines modulo imports) |
| Original STRUKTURA | HEAD `77fd6e1bf537…`, single protected change ` M docs/AUDIT_CYCLE.md` |

## Assumptions

None needed — every Phase 7 claim re-verified above by direct runs.

## Blocked / not run at baseline

- `npm audit`: attempted as Workstream A (see PHASE-8-SECURITY-AUDIT.md).
- Screen-reader walkthrough: NOT_EVALUATED (no NVDA/JAWS/VoiceOver in
  this environment), unchanged from Phase 7.

Baseline matches the Phase 7 close exactly; no unexpected changes.
Workstreams proceed.
