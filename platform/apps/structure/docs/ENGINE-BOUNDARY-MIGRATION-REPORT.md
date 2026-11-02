# Phase 2 — Engine Boundary Migration Report (Increment 1)

Date: **2026-11-01** · Workspace: `~/workspace/zonasipil-structure/`
Baseline: `docs/PHASE-2-BASELINE.md` (matched Phase 1; no stop condition).

## What moved

| From | To | Files | Reason |
|---|---|---|---|
| `src/lib/**` (calculation & model modules, incl. `design/`, `sections/`) | `src/engine/**` | 61 | Pure TS engine: solver, analysis pipeline/diagnostics, load cases/combinations, geometry, diagram utils, model, units, constants, sections/materials, RC + steel design |
| `src/lib/svg-renderer.ts` | `src/visualization/svg-renderer.ts` | 1 | Renderer boundary decision (§ below) |
| `src/lib/utils.ts` | `src/shared/utils.ts` | 1 | It is the shadcn `cn()` UI helper (clsx + tailwind-merge) — not engineering code; putting it in `engine/` would have falsified the boundary |
| `src/lib/flyout-panel-colors.ts` | `src/shared/flyout-panel-colors.ts` | 1 | Pure UI theme constants for flyout panels |

`src/lib/` no longer exists. All `@/lib/…` imports (124 files) were
rewritten: `@/engine/…`, with the three boundary files at their new
`@/shared` / `@/visualization` paths. No relative `../lib` imports existed.

**Renderer decision:** `svg-renderer.ts` renders a model to an SVG string;
it imports only the model type + `SCALE`, performs geometric layout, and
computes no structural behaviour — so it belongs to visualisation, not the
engine. Noted honestly: `renderModelToSVG` currently has **no callers** in
the app (pre-existing; the move neither introduced nor hid that).

**Constants decision:** `constants.ts` stayed in the engine, per the
Phase 2 expected groups and because engine `geometry.ts` depends on it;
it contains only pure values/formatters (no React/DOM). UI importing it
from the engine is a one-way UI→engine dependency, as before.

## The one content change beyond imports

`src/engine/analysis-pipeline.ts` previously had a **type-only** import of
`AnalyzeViewMode` from a UI component (`@/components/analyze-view-selector`)
— a pre-existing boundary leak (runtime-erased, but a UI→engine direction
violation). The type (`"case" | "combination" | "envelope"`, unchanged
union) is now defined in the engine; the component re-exports it, and
`App.tsx` is untouched. No runtime or numerical behaviour can change from
moving a type definition; the full suite + build verify this.

## Provenance diff (the increment's core evidence)

Every moved file was diffed against the untouched original
(`~/workspace/struktura/src/lib/`):

- **64/64 files accounted for** (61 engine + 3 boundary files).
- Differences are **import lines only**, plus the single documented type
  relocation in `analysis-pipeline.ts`. **Zero non-import content changes
  in any calculation file.** No formula, algorithm, threshold, expected
  benchmark value, schema, storage key, or verdict semantic was touched.
- Outside the moved tree, files differing from the original remain exactly
  the Phase-0 branding/config/docs set (11 files) — plus three *comment/
  path-string* updates and one test *file-path* update (next section).

## Gate incident (investigated, not hidden)

First post-move suite run: **202/203** — `tests/sprint2-secondary.test.ts`
(R-08 provenance guard) failed with ENOENT because it reads
`src/lib/design/steel/seismic.ts` by hard-coded path. Diagnosis: the test
guards that historical validation citations are *retained in that file*;
the file's content is byte-identical, only its directory changed — the
exact subject of this increment. Fix: updated the **path string** in that
test (assertions untouched), plus three comment-only path references
(`tests/sprint1-seismic.test.ts`, `benchmarks/solver-benchmarks.test.ts`,
`src/App.tsx`). Re-run: **203/203**.

## Acceptance gates — all PASS

| Gate | Result |
|---|---|
| Full suite | **203/203 PASS** (23 files) — count not reduced |
| Benchmark suite | Included above: 21 + 8 benchmark tests PASS, expected values unchanged (provenance diff) |
| Production build (incl. `tsc -b` typecheck) | PASS (6.29s) |
| Lint | **37 problems (6 errors, 31 warnings) — identical to baseline**, no new errors |
| Engine purity | `grep`: 0 React imports, 0 `document`/`window`, 0 imports from `@/components|tabs|canvas|struktura|platform|shared` inside `src/engine` |
| Hidden exclusions | None: vitest include globs unchanged; no test skipped or deleted |
| Original repo | Untouched (git status identical: only its pre-existing ` M docs/AUDIT_CYCLE.md`) |

No further folder reorganisation (Increment 2+) was performed, per the
Phase 2 instruction to stop after Increment 1's gates.
