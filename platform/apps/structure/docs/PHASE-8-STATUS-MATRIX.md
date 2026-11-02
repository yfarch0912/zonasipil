# Phase 8 — Status Matrix

Date: **2026-11-01** · Executive verdict: **INCOMPLETE** — every
locally executable gate passes, but `npm audit` remains blocked by
an environment policy (precisely diagnosed this phase), and a real
screen-reader walkthrough is still externally pending. Per the
Phase 8 definition of done, commercial release readiness remains
**INCOMPLETE**.

| Workstream | Baseline status | Final status | Evidence | Files changed | Tests added | Known limitations / remaining blockers | External/manual validation required |
|---|---|---|---|---|---|---|---|
| 1. Baseline & change control | Phase 7 close state | PASS | docs/PHASE-8-BASELINE.md | docs only | — | Repo is not a git checkout (state = file tree), as in all phases | No |
| A. Security audit closure | NOT RUN (7 phases) | **NOT RUN / BLOCKED** — root cause now precise: registry audit endpoint returns `403 policy_denied` from this environment's egress policy | docs/PHASE-8-SECURITY-AUDIT.md (exit codes, exact error, log reference) | docs only; **lockfile unchanged** | — | No vulnerability data exists; licence scan (Phase 3/6) is not a substitute | **Yes** — run `npm audit` once from an unrestricted network against lockfile `b294dc3d153cb492` |
| B1. Status pill target | F7 open (16 px) | **FIXED / PASS** | phase8.spec B1 measures ≥24×24 in the live editor | src/components/status-bar.tsx | 1 | — | No |
| B2. Advisory modal | plain div (Phase 7 record) | **PASS** (semantics + focus in + restore + Escape via App listener) | phase8.spec B2 | src/App.tsx | 1 | No full focus trap (single-action gate; recorded) | Human AT check in checklist §A.3 |
| B3. Viewport retest | F6a/F6b fixed in Phase 7 | **PASS** + new defect F8 found & fixed (320 px samples-grid overflow) | phase8.spec B3; mobile-a11y.spec | src/struktura/StrukturaRoot.tsx | 1 | — | No |
| C1. Distributed loads | read-only listing (Phase 7) | **COMPLETE** (CRUD both modes; wx via canvas — PARTIAL note) | phase8.spec C1 (UDL → 25.000 kN ×2) | src/components/data-model-editor.tsx | 1 (incl. invalid-input rejection) | wx components edited on canvas only | No |
| C2. Load cases & combinations | not in Data Tabel | **PARTIAL by design**: case toggles COMPLETE; combinations read-only display; editing NOT IMPLEMENTED | phase8.spec C2 | data-model-editor.tsx, src/App.tsx (props) | 1 | Combination factor editing stays in the canvas panel | No |
| C3. Section properties | not in Data Tabel | **COMPLETE** for core properties (name/E/A/I33 + validation) | phase8.spec C3 | data-model-editor.tsx | (in C3+C4) | Shape dims / create / delete stay in material editor | No |
| C4. Destructive operations | `window.confirm` (Phase 7) | **COMPLETE**: in-app alertdialog listing cascade dependents; cancel/Escape/confirm tested | phase8.spec C4 | data-model-editor.tsx | (in C3+C4) | — | No |
| D. SR & keyboard validation | NOT_EVALUATED (SR); DOM-level checks PASS | **INCOMPLETE**: executed checks all PASS; real SR walkthrough **NOT_EVALUATED** with a reproducible checklist delivered | docs/PHASE-8-ACCESSIBILITY-VALIDATION.md, docs/PHASE-8-SCREEN-READER-CHECKLIST.md | docs only | save-failure announcement test | NVDA/JAWS/VoiceOver unavailable here | **Yes** — human runs the 12-item checklist |
| E. Regression & provenance | 222/222, E2E 25/25 | **PASS**: 222/222, E2E **32/32**, lint 0 errors, solver diff 0 lines, original intact | docs/PHASE-8-REGRESSION-REPORT.md | — | +7 E2E total | — | No |

## Files changed in Phase 8

Source: `src/components/status-bar.tsx`, `src/App.tsx`,
`src/components/data-model-editor.tsx`,
`src/struktura/StrukturaRoot.tsx`.
Tests: `e2e/phase8.spec.ts` (new, 7 tests).
Docs: the nine Phase 8 deliverables.
No `src/engine/**` file modified; no dependency or lockfile change;
no new runtime dependency.
