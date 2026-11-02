# Testing Report — real execution record

Environment: Node v24.22.1, npm 10.9.4, Vitest 3.2.7, TypeScript (tsc -b) —
this VM, 2026-10-31.

## Suites
| Suite | File | Tests | Covers |
|---|---|---|---|
| Numerical benchmarks | benchmarks/solver-benchmarks.test.ts | 21 | DSM solver vs analytical solutions (§8) |
| Design & sections | tests/design-sections.test.ts | 7 | Section formulas; SNI 2847 β1, As,min, Vc, φMn |
| Samples & projects | tests/samples-projects.test.ts | 10 | 7 samples solve + equilibrium; fingerprint stability; export/import round-trip + rejection |
| Cycle-1 regressions | tests/cycle1-regressions.test.ts | 8 | SNI 1727:2020 preset + stored reference; project store CRUD (localStorage stub); bare-model import; service-combination self-weight + report content |

## Results timeline (honest, per cycle)
- Foundation baseline build (pre-modification): `npm run build` PASS.
- Benchmark suite first run: 19/21 — two failures were **wrong test
  expectations**, proven by debug output: (a) shear is stored in the solver's
  documented SAP sign convention (assert −V1 and the mid-span zero crossing
  instead); (b) portal beam joints displace equal-and-opposite (beam axial
  shortening), not zero. Tests corrected with the reasoning recorded in-source;
  solver unchanged. Then 21/21.
- After STRUKTURA shell + SNI preset: 38/38 PASS, production build PASS.
- Audit Cycle 1 regression run: 44/46 → two failures exposed (a) a real
  fingerprint defect (fixed in projects.ts, see AUDIT_CYCLE.md C1-F7) and
  (b) a wrong test expectation about kind-matched 1.4D terms (test corrected).
  Final: **46/46 PASS**, production build PASS.

## Production build (final Cycle-1 state)
```
dist/index.html                  1.08 kB │ gzip:  0.58 kB
dist/assets/index-*.css         61.89 kB │ gzip: 11.37 kB
dist/assets/index-*.js         239.40 kB │ gzip: 76.93 kB   (dashboard first load)
dist/assets/App-*.js           624.48 kB │ gzip: 172.60 kB  (editor, lazy-loaded)
✓ tsc -b passed (strict), vite build passed. One chunk-size advisory (>500 kB)
  for the lazy editor chunk — accepted, recorded in KNOWN_LIMITATIONS.
```

## Not run / not claimed
- Playwright/browser end-to-end: NOT run in v1 (no browser automation in the
  build environment). The workflow logic is covered at module level
  (store CRUD, import/export, service result, report content, samples).
- Lint: eslint config ships with the foundation; not part of the v1 gate.

## Addendum — Audit Cycle 2 (2026-10-31)
- New suite tests/cycle2-regressions.test.ts (8 tests): solver referential-
  integrity guards (C2-F1) + §19 portal workflow end-to-end at module level.
- Final totals: **54/54 PASS**, production build PASS
  (index JS 244.65 kB/gzip 78.41; editor chunk 621.14 kB/gzip 171.66).
