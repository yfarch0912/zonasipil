# Phase 4 — Baseline

Date: **2026-11-01** · Captured before any Phase 4 edit.

## Source verification (against the Phase 3 audit)

`src/templates/examples.ts` is **unchanged** from the Phase 3 audit:

- `SECTION_DEFAULT = { id: "section", name: "penampang", E: 23500,
  I33: 3125000, A: 150000 }` — the inconsistent constant, exactly as
  reported (E/A match the 300×500 concrete beam; I33 is 1000× below the
  parametric `rc300x500` value 3 125 000 000 mm⁴ in `defaultSections`).
- Referenced **only** by `template1SimpleBeam()` and
  `template2Cantilever()` in the same file; no references elsewhere in
  `src/`. Both templates store it under key `section`, overriding
  nothing else.
- Template 02's load confirmed from source (not assumed): one member,
  fixed at x=−2.5, free at x=+2.5 (L=5 m), distributed load
  `mode: "local-axis", wStart = wEnd = −10 kN/m` (uniform).
- Other hand-written constants in the file: `SECTION_C30`
  (E=30000, I33=480 000 000, A=75 000 — no declared dimensions; used by
  one portal template) and `SECTION_COL500` (parametric, computed by
  `buildParametricSection` for an explicit 500×500 rect — self-consistent
  by construction).

## Baseline results (executed this session)

| Check | Result |
|---|---|
| Suite (`npm test`) | **206/206 PASS (24 files)** — includes benchmarks 21+8 |
| Build + typecheck (`npm run build`) | PASS |
| Lint (`npm run lint`) | **37 problems (6 errors, 31 warnings)** — Phase 3 baseline |
| E2E (`npm run test:e2e`) | **PASS** — the Phase 2/3 spec, which asserts the PHYSICALLY_IMPLAUSIBLE dialog for sample 01 (expected to change in Workstream D, after the fix) |
| Original STRUKTURA | untouched: branch `feature/…`, HEAD `77fd6e1`, only ` M docs/AUDIT_CYCLE.md` |

**Baseline matches Phase 3 close-out. The correction may proceed.**
