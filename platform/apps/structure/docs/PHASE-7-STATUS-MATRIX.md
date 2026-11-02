# Phase 7 — Status Matrix

Date: **2026-11-01** · Sprint verdict: **INCOMPLETE** by its own
definition of done — security audit still NOT RUN, F4 only partially
resolved, and no real screen-reader walkthrough exists. Everything
executable in this environment was executed and is evidenced below.

## Final gates (vs Phase 7 baseline)

| Gate | Baseline | Final |
|---|---|---|
| Unit/regression suite | 222/222 | **222/222 PASS** (no test removed or weakened) |
| Build + typecheck | PASS | PASS |
| Lint | 33 (6 errors, 27 warnings) | **20 (0 errors, 20 warnings)** — warnings are all DX-only react-refresh |
| Playwright E2E | 14/14 | **25/25 PASS** |
| External runtime requests | zero | zero |
| Lockfile | `b294dc3d153cb492` | unchanged |
| Original STRUKTURA | HEAD `77fd6e1…`, ` M docs/AUDIT_CYCLE.md` | identical |
| Solver provenance | engine = original modulo imports | re-verified: solver diff 0 lines modulo imports; **no engine file touched in Phase 7** |

## Workstreams

| WS | Status | Evidence |
|---|---|---|
| A. Baseline | PASS | docs/PHASE-7-BASELINE.md |
| B. React hooks reliability | **PASS** | 6 original errors fixed; fixing them unmasked 14 latent compiler diagnostics (2 set-state-in-effect, 12 preserve-manual-memoization), all fixed without eslint-disable; final 0 errors. docs/PHASE-7-REACT-HOOKS-REMEDIATION.md |
| C. Live announcements (F3) | **PASS** | polite/assertive live regions mounted in both views; analysis outcomes + save outcomes announced in Bahasa Indonesia; 4 E2E. docs/PHASE-7-LIVE-ANNOUNCEMENTS.md |
| D. Keyboard modelling (F4) | **INCOMPLETE** | Working vertical slice: "Data Tabel" tab over the same model/ops/solver; full beam built keyboard-only in E2E with correct reactions (+5.000 kN ×2). Gaps: distributed-load editing, load-case/combination management, in-table section geometry. docs/PHASE-7-KEYBOARD-MODELLING-{DESIGN,IMPLEMENTATION}.md |
| E. Mobile & SR validation | **INCOMPLETE** | Mobile: dashboard overflow (F6a) and unreachable editor tabs (F6b) found & fixed; Data controls ≥26 px; F7 open (status pill 16 px). SR: landmarks/tables PASS; dialog semantics F5 found & fixed (+ Escape reliability moved to App listener). **Screen-reader walkthrough NOT_EVALUATED** (no NVDA/JAWS/VoiceOver available). docs/PHASE-7-ACCESSIBILITY-VALIDATION.md |
| F. Drag-move E2E | **PASS** | GESER SIMPUL drag −0.5→+0.5 m; autosave geometry + swapped reactions 4/6 kN verified. docs/PHASE-7-CANVAS-DRAG-E2E.md |
| G. Security audit | **NOT RUN / INCOMPLETE** | 7th consecutive endpoint failure; no counts fabricated. docs/PHASE-7-SECURITY-AUDIT.md |

## Files changed in Phase 7

Source: `src/App.tsx`, `src/canvas/structural-canvas.tsx`,
`src/components/analysis-issues-dialog.tsx`,
`src/components/nav-bar.tsx`, `src/components/tool-sidebar.tsx`,
`src/struktura/StrukturaRoot.tsx`; new:
`src/components/data-model-editor.tsx`, `src/shared/announce.ts`,
`src/shared/live-announcer.tsx`.
Tests (all new): `e2e/live-announcements.spec.ts`,
`e2e/drag-move.spec.ts`, `e2e/keyboard-modelling.spec.ts`,
`e2e/mobile-a11y.spec.ts`. Docs: the nine Phase 7 deliverables.
No `src/engine/**` file was modified.

## Remaining blockers

1. `npm audit` has never executed (7 phases) — commercial release
   readiness stays INCOMPLETE until it runs somewhere with registry
   access against this lockfile.
2. F4 long tail (distributed-load editing, combinations, section
   geometry in table form).
3. F7 status-bar target size; mobile advisory modal lacks dialog
   semantics.
4. Human screen-reader walkthrough outstanding.
