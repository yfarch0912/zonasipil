# Phase 5 — Lint Debt Assessment

Date: **2026-11-01** · Method: `eslint -c config/eslint.config.js .`
with JSON output; every finding individually listed and grouped.
Baseline at sprint start: **37 (6 errors, 31 warnings)**.
After the safe-fix batch (§3): **33 (6 errors, 27 warnings)** — build +
full suite re-run green after the change (216/216), so the final sprint
lint state is 33, with the delta fully explained below.

## 1. The 6 errors (all React hooks/compiler rules — none in the engine)

| # | Location | Rule | Actual risk | Recommendation |
|---|---|---|---|---|
| E1–E2 | `src/App.tsx:1018–1019` | `react-hooks/immutability` — `handleDeselectItems`/`handleSelectItems` accessed before declaration | Real code smell in the editor's selection wiring (works today because access happens inside a callback executed later, but it is declaration-order fragile). Medium risk to refactor: touches App-level interaction state. | Separate UI-refactor workstream with manual + E2E verification. **Not safe for this sprint.** |
| E3–E6 | `src/canvas/structural-canvas.tsx:327, 328 (×2), 3262` | `react-hooks/refs` — refs accessed during render | The canvas reads interaction refs while rendering diagram overlays. Refactoring means re-plumbing the canvas render pipeline — the most interaction-dense file in the app. High regression risk without dedicated canvas tests. | Separate workstream; add canvas interaction coverage first. **Not safe for this sprint.** |

No error is in solver/engineering logic, model validation, or design
modules: `src/engine/**` produces **zero errors and (after §3) zero
warnings**.

## 2. The 31 warnings at baseline, grouped

| Group | Count | Findings | Risk | Disposition |
|---|---|---|---|---|
| Rendering/visualization (canvas) | 6 | `react-hooks/exhaustive-deps` in `structural-canvas.tsx` useCallbacks (missing label/scale deps) | Low–medium: stale-closure risk on diagram labels; diagrams currently render correctly in E2E. Fixing changes re-render behaviour of the canvas. | Defer with E3–E6 workstream. |
| State management (App) | 1 | `exhaustive-deps` at `App.tsx:1185` (same handlers as E1–E2) | Same cluster as E1–E2. | Defer with E1–E2. |
| UI / DX only | 20 | `react-refresh/only-export-components` across `components/ui/*`, toolbars, report/preference modules (files exporting both a component and helpers/constants) | **Zero runtime risk** — this rule only affects Vite fast-refresh granularity in development. | Leave; fixing means splitting ~15 files for no user-facing benefit. Revisit only if HMR pain appears. |
| Engineering logic (design) | 2 | `no-unused-vars`: unused `type BarLayout` imports in both RC beam code modules | None (type-only). | **FIXED in §3.** |
| Application shell | 1 | `no-unused-vars`: unused `type StoredProject` import, `StrukturaRoot.tsx` | None (type-only). | **FIXED in §3.** |
| Model input UI | 1 | Unused `eslint-disable` directive, `advanced-panel.tsx` | None. | **FIXED in §3.** |

## 3. Safe-fix batch (applied, separately gated)

Four zero-behaviour removals: the two `type BarLayout` import lines,
the `type StoredProject` import, and the unused eslint-disable
directive (plus removal of the blank lines the import edits left).
These are type-level or comment-level tokens — erased at compile time —
and the gate proves it: `npm run build` (tsc) PASS, suite **216/216**,
lint **33 (6/27)**. No suppression was added anywhere; no rule was
disabled; no application behaviour can change.

## 4. What was deliberately NOT done

Lint-zero was not chased. The remaining 6 errors and 7 hooks warnings
live in the editor's two most state-dense files; "fixing" them inside a
QA sprint — without dedicated interaction tests — would trade a known,
stable lint debt for unknown behaviour risk. They are recorded here as
a scoped, separately authorised UI-refactor workstream (App selection
handlers first, canvas refs second, each with its own verification).
