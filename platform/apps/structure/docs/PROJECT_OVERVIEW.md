# STRUKTURA — Project Overview

**STRUKTURA** is a web-based structural analysis and design application:
2D-first modelling (no 3D viewport required), a Direct Stiffness solver that
runs entirely in the browser, reinforced-concrete and steel design checks for
implemented SNI subsets, and calculation reporting generated from real results.

- **Live target (GitHub Pages):** https://yfarch0912.github.io/software-perhitungan-struktur/
- **Repository:** https://github.com/yfarch0912/software-perhitungan-struktur
- **Version:** 1.0.0 · **Branch:** `feature/struktura-engineering-platform`

## What works in v1
| Area | Status |
|---|---|
| Dashboard, project CRUD, search, import/export JSON | Implemented (browser localStorage) |
| 2D model editor (nodes, members, supports, snap, undo/redo, multi-select, templates) | Implemented (foundation, MIT) |
| Materials & parametric sections (rect/circle/IWF/tee/angle/CHS/RHS + manual) | Implemented |
| Load cases, point + distributed loads, self-weight synthesis | Implemented |
| Load combinations: user-defined + presets incl. **SNI 1727:2020 Pasal 2.3.2 LRFD** | Implemented |
| 2D frame + truss analysis (DSM, Euler–Bernoulli, optional Timoshenko shear) | Implemented, benchmark-verified |
| Reactions, SFD/BMD/axial diagrams, deformed shape (SVG) | Implemented |
| RC design SNI 2847:2019 subset; steel design SNI 1729:2020/AISC subset | Implemented subset — see SNI matrix |
| Calculation report (print → PDF) from actual results + model fingerprint | Implemented |
| 7 verified sample projects | Implemented |
| 3D analysis, P-Delta, modal/response spectrum, geotech, server backend/DB | **UNSUPPORTED in v1** (roadmap) |

## Honesty rules
Engineering correctness outranks features. Anything not implemented is marked
**UNSUPPORTED**, never PASS. STRUKTURA does **not** claim full SNI compliance
and is not a substitute for review by a licensed engineer.

## License & attribution
STRUKTURA is the product identity for the complete application. License and
third-party attribution are recorded in `../NOTICE` and
`LICENSING_AUDIT.md`. The STRUKTURA product layer includes the
dashboard/project layer, benchmark and test suites, the SNI 1727:2020 preset,
service-combination reporting, samples, GitHub Pages hosting, and this
documentation.
