# ZonaSipil Structure

**Web-based structural analysis & design — 2D-first, in the browser.**
A ZonaSipil product (`zonasipil.web.id/apps/structure`, product code `ZS-STRUCTURE`).

> **Migration record:** This repository was created on 2026-11-01 by migrating
> **STRUKTURA 1.0.0** (MIT) — see [docs/MIGRATION-RECORD.md](docs/MIGRATION-RECORD.md).
> The original STRUKTURA project remains untouched in its own repository.
> Engine provenance stays visible on purpose: reports carry the version string
> `ZonaSipil Structure 1.0.0 · engine STRUKTURA 1.0.0`, and attribution lives in
> [NOTICE](NOTICE).

📄 Docs: [Status Matrix](docs/STATUS-MATRIX.md) · [SNI Matrix](docs/SNI_IMPLEMENTATION_MATRIX.md) · [Numerical Validation](docs/NUMERICAL_VALIDATION.md) · [User Guide](docs/USER_GUIDE.md) · [Migration Record](docs/MIGRATION-RECORD.md)

ZonaSipil Structure lets you model a 2D structure (nodes, members, supports),
apply load cases and code combinations, run a Direct Stiffness analysis, inspect
reactions / shear / moment / axial diagrams and deflections, run reinforced
concrete (SNI 2847:2019 subset) and steel (SNI 1729:2020 subset) design checks
with clause-level traceability, and export a calculation report generated from
the actual results — no server, no install.

**Not yet present** (see STATUS-MATRIX): standalone calculator mode
(beam/column/slab/foundation/stair), 3D analysis/visualisation, and real
platform licence integration (development fixtures only, Phase 7).

## Highlights
- **Solver, verified:** Direct Stiffness frame + truss engine, checked against
  closed-form analytical solutions in `benchmarks/` (reactions, moments and
  deflections match beam theory to floating-point precision; gate ≤ 0.1 %).
- **Indonesian standards, honestly scoped:** SNI 1727:2020 Pasal 2.3.2 LRFD
  combinations; SNI 2847:2019 RC beam/column checks; SNI 1729:2020 steel
  checks. Anything not implemented is labelled **UNSUPPORTED** — see the
  [SNI matrix](docs/SNI_IMPLEMENTATION_MATRIX.md). No full-compliance claims.
- **Projects:** dashboard, versioned JSON import/export, autosave + recovery,
  model fingerprinting so stale reports are detectable. Project files keep the
  `struktura-project` schema for compatibility with STRUKTURA exports.
- **Light UI:** plain components, SVG diagrams, no decorative weight; the
  editor lazy-loads after a small dashboard first paint.
- **7 sample projects** with independently known expected results.

## Quick start
```bash
npm install
npm run dev     # http://localhost:5173/  (Vite base is now '/')
npm test        # benchmarks + unit + regression + platform-contract tests
npm run build   # production build → dist/
```

## License & attribution
ZonaSipil Structure is MIT-licensed ([LICENSE](LICENSE)), as was STRUKTURA. License and third-party
attribution details are recorded in [NOTICE](NOTICE) and
[docs/LICENSING_AUDIT.md](docs/LICENSING_AUDIT.md).

## Disclaimer
Educational / professional-assist software. Verify all results; construction
decisions require a licensed structural engineer. No engineering certification
is claimed.
