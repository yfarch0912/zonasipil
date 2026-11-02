# Repository Audit (Stage 0 — performed 2026-10-31)

## Destination repository
- `yfarch0912/software-perhitungan-struktur` — public, **empty** at audit time
  (GitHub connector returned the empty-repository response; `git ls-remote`
  showed no HEAD). Verified accessible to the Muse GitHub App under login
  `yfarch0912`. STRUKTURA is its first content.

## Candidate foundations (cloned to ~/workspace/struktura-audit/)
| Repo | HEAD | License | Verdict |
|---|---|---|---|
| ziyad-cpu/OpenANSTRUK-2Dtest (fork) | 31cc234c2a63 | **MIT** (LICENSE file, Copyright (c) 2026 OpenAnstruk Contributors) | **Chosen base** |
| adrianulza/OpenANSTRUK-2D (upstream) | 819cad94ebeb | **MIT** (same text) | Upstream of the fork |
| lambdaclass/stabileo, ritchie46/anaStruct | not cloned | — | Not needed: the MIT web foundation already provides a browser DSM solver; recorded as unexamined references, not dependencies. |

## What inspection found in the fork (claims vs code)
README claims were **not** trusted; the code was read:
- `src/lib/solver.ts` (517 lines) — genuine Direct Stiffness implementation:
  6×6 Euler–Bernoulli frame element (optional Timoshenko Φ factor), truss
  elements by static condensation of released end rotations, trapezoidal
  fixed-end forces, Gaussian elimination with per-DOF singularity tolerance,
  reaction recovery from K·d − F. **Real, not a stub.**
- `src/lib/model.ts` (366 lines) — nodes/members(supports pin/roller/fixed)/
  sections/loads schema, parametric default sections, JSON shape guard.
- Design code is real and clause-referenced: `src/lib/design/rc/codes/
  sni2847-19/` (beam 618 lines, column, rules with β1/As,min per SNI 2847:2019
  ≡ ACI 318-14) and `src/lib/design/steel/` (flexure 645 lines, compression,
  shear, interaction — AISC 360 / SNI 1729:2020 basis).
- Sections: parametric computation for rect/circle/IWF/tee/angle/CHS/RHS.
- Editor: full SVG canvas app (151 source files), load cases/combinations with
  code presets (ASCE 7-22, SNI 1726:2019, EN, GB, AS/NZS, BSL), templates,
  undo/redo history hook, SFD/BMD/deformation tools.
- **Gaps found:** no automated tests at all upstream; no project management /
  localStorage persistence; no SNI 1727:2020 combination preset; Cloudflare
  (wrangler) hosting config; landing page + demo PNG screenshots (binary,
  dropped); no calculation-report generator matching §11.

## Baseline verification of the unmodified foundation
- `npm install` OK (242 packages). `npm run build` (tsc -b + vite) **passed**
  before STRUKTURA modifications (1928 modules, dist JS 841.7 kB in one chunk).
- Solver correctness was NOT assumed — see NUMERICAL_VALIDATION.md for the
  analytical benchmark suite written for STRUKTURA (28→46 tests over cycles).

## Decision
Adopt the MIT fork as the foundation (license permits adaptation with notice —
see LICENSING_AUDIT.md and NOTICE), keep its solver/design code, fix and extend
around it: tests first, then project layer, SNI 1727 preset, reporting, docs,
GitHub Pages. STRUKTURA branding/UI shell is original work in src/struktura/.
