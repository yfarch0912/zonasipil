# Phase 2 — Status Matrix

Date: 2026-11-01 · Workspace: `~/workspace/zonasipil-structure/`

| Area | Implementation | Evidence | Engineering validation |
|---|---|---|---|
| Baseline re-verification | DONE | `docs/PHASE-2-BASELINE.md` — identical to Phase 1 (203/203, build PASS, engine byte-identical) | unchanged |
| Engine boundary (Increment 1) | DONE | `src/lib` → `src/engine` (61 files) + `src/visualization/svg-renderer.ts` + `src/shared/{utils,flyout-panel-colors}.ts`; provenance diff: import-only changes + 1 documented type relocation; `docs/ENGINE-BOUNDARY-MIGRATION-REPORT.md` | No numerical change (proven by diff + suite) |
| Test suite | DONE | **206/206 PASS** (24 files) = 203 baseline + 3 new ILL_CONDITIONED reproduction tests; benchmarks (21+8) included, expected values unchanged | Solver benchmark status PASS (unchanged) |
| Build / typecheck | DONE | `npm run build` (incl. `tsc -b`) PASS | n/a |
| Lint | DONE | 37 problems (6 errors, 31 warnings) — identical to baseline, zero new | n/a |
| Playwright E2E smoke | DONE — PASS | `docs/E2E-SMOKE-REPORT.md`; Chromium 156 headless, production build; reactions +6/+4 kN from the live solver; diagnostics dialog asserted, not bypassed | Closes the "no browser E2E" evidence gap for the critical workflow |
| ILL_CONDITIONED (NEW-1) | DONE — reproduction found | `docs/ILL-CONDITIONED-EVIDENCE-INVESTIGATION.md`; near-parallel-bars family, ρ ∈ [2.5e-11 … 5.6e-9] inside the band with healthy residual/plausibility; regression-tested | Evidence gap CLOSED; ρ remains a heuristic (κ-correlation study still open, recommended) |
| Dependency/licence | DONE with gap | `@playwright/test` 1.64.1 Apache-2.0, dev-only; **npm audit NOT RUN** (endpoint error, re-verified this phase) | n/a |
| Original STRUKTURA | UNTOUCHED | git status identical before/after (` M docs/AUDIT_CYCLE.md` only) | n/a |
| Engineering statuses (global) | UNCHANGED | Design subsets INCOMPLETE; seismic UNVERIFIED; unsupported procedures UNSUPPORTED; utilisation overlay NOT_EVALUATED | No status upgraded in Phase 2 |

**Phase 2 overall: COMPLETE against its acceptance criteria**, with one
carried limitation that is environmental, not a work product: `npm audit`
could not be executed from this machine (reported NOT RUN in both
phases). Every other criterion is met with evidence.
