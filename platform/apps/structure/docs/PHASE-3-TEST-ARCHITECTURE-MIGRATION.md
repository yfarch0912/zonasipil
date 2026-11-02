# Phase 3 — Test & Benchmark Directory Migration (Increment 2)

Date: **2026-11-01** · Mechanical, suite-gated; no test content,
assertion, or expected value was changed (one path-token fix, §3).

## Before → after

```
BEFORE                          AFTER
tests/ (22 files, flat)         tests/unit/         design-sections, platform-metadata
benchmarks/ (2 files)           tests/regression/   cycle×9, sprint1×4, sprint2×4 (+verdict),
                                                    phase2-ill-conditioned
                                tests/integration/  samples-projects, sprint2-integration
                                tests/benchmarks/   solver-benchmarks, solver-benchmarks-2
```

Classification rule: *unit* = single-module/contract tests; *regression*
= defect-locking suites (audit cycles, sprints, NEW-1 evidence);
*integration* = multi-module flows (samples + project store, pipeline
integration); *benchmarks* = closed-form solver benchmarks (21 + 8
cases, unchanged). Playwright stays in `e2e/` (different runner,
unchanged). Total files: **24 before, 24 after** — none added, removed,
skipped, or excluded.

## Discovery change

`config/vitest.config.ts` include: `['tests/**/*.test.ts',
'benchmarks/**/*.test.ts']` → `['tests/**/*.test.ts']` (the recursive
glob covers all four subfolders). Nothing else in any config changed.

## Provenance

Pre-move snapshot taken (`tests/` + `benchmarks/` copied aside before
the move; compared after):

- **23/24 files byte-identical** to their pre-move versions (all tests
  import via the `@/` alias; the three `readFileSync('src/…')` users
  resolve from the repo-root cwd and were unaffected).
- **1 file, one token:** `tests/unit/platform-metadata.test.ts`
  computes the repo root as `path.resolve(__dirname, '..')`; at its new
  depth the correct mechanical equivalent is `'../..'`. That single
  path token was updated (assertions untouched). Without it, 6 tests in
  that file failed with ENOENT — caught by the gate, fixed as a path
  change, re-gated green. Exactly the Increment-1 R-08 pattern.

## Gates after migration (all PASS)

| Gate | Result |
|---|---|
| Full suite | **206/206 PASS (24 files)** — count identical to baseline |
| Benchmarks | solver-benchmarks 21 + solver-benchmarks-2 8, inside the suite above, expected values untouched |
| Build + typecheck | PASS (6.34 s) |
| Lint | **37 problems (6 errors, 31 warnings)** — identical to Phase 3 baseline, zero new |
| Playwright E2E | **PASS** (dashboard → sample 01 → reactions +6/+4 kN, production build, Chromium headless) |

No further reorganisation increment was started (per the sprint rule:
one increment, gated, then stop).
