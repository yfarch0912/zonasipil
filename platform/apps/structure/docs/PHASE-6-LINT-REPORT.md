# Phase 6 — Lint Remediation Plan

Date: **2026-11-01** · Baseline and final: **33 problems (6 errors,
27 warnings)** — unchanged in count. One finding class was created and
eliminated during this phase (see §3); no broad refactoring was done.

## 1. Classification of the remaining 33

| Class | Findings | Items | Plan |
|---|---|---|---|
| Critical correctness risk | **0** | — | None of the 33 can change a computed result; `src/engine/**` is finding-free |
| React hooks/state risk (errors) | 6 | `App.tsx` ×2 `react-hooks/immutability` (selection handlers used before declaration); `structural-canvas.tsx` ×4 `react-hooks/refs` (refs read during render) | **Separate UI-refactor workstream** (unchanged from Phase 5): reorder/hoist the App selection callbacks first (smaller blast radius), then re-plumb canvas render-time ref reads behind state/effects. Each step needs the E2E suite (now 14 tests) plus manual canvas verification. Not safe as a side-effect of a QA sprint |
| React hooks/state risk (warnings) | 7 | `exhaustive-deps` — App.tsx ×1 (same handler cluster), structural-canvas.tsx ×6 (label/scale deps in diagram callbacks) | Same workstream as above; fix together with the errors per file, not piecemeal |
| Maintainability / DX only | 20 | `react-refresh/only-export-components` across UI and report modules | Leave. Zero runtime effect; splitting ~15 files purely for fast-refresh granularity is churn without user benefit. Revisit if HMR pain is reported |
| Safe cleanup | 0 remaining | Phase 5 already removed the 4 zero-behaviour items (unused type imports ×3, dead eslint-disable ×1) | — |
| False positive / justified exception | 0 claimed | — | No finding is suppressed or reclassified as false without evidence |

## 2. What "done" looks like for the deferred workstream

1. App.tsx: move `handleSelectItems`/`handleDeselectItems`
   declarations above their first use (or convert the early consumer
   to a ref-stable dispatcher); verify selection flows via E2E +
   manual multi-select session.
2. structural-canvas.tsx: audit the 4 render-time ref reads; where the
   value is render-relevant, mirror it into state at write time;
   re-run diagram E2E + visual check.
3. Re-run lint after each file: expected end state ≤20 warnings
   (react-refresh only), 0 errors.

## 3. Incident recorded honestly (this phase)

The first version of the new `e2e/workflows.spec.ts` introduced 3 new
lint **errors** (`@typescript-eslint/no-explicit-any` ×3) — the eslint
config covers `e2e/`, and the Phase 2–5 baselines had no `any` there.
They were fixed by typing the autosave-model casts properly (no
suppression), returning the total to exactly 33. Separately, the
Phase 6 accessibility fix in `src/App.tsx` (Escape → flyout close) was
verified to add **zero** new findings.
