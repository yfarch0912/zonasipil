# ZonaSipil Structure — Status Matrix

Vocabulary: ZonaSipil Engineering Validation Policy (PASS / FAIL /
INCOMPLETE / UNVERIFIED / UNSUPPORTED / NOT_EVALUATED). Per-provision
detail for standards lives in `docs/SNI_IMPLEMENTATION_MATRIX.md`, which
remains the authoritative engineering record. This matrix is the
product-level summary. Last updated: 2026-11-01 (migration).

| Capability | Status | Evidence / note |
|---|---|---|
| 2D frame/truss analysis (Direct Stiffness, Euler–Bernoulli + Timoshenko path) | PASS (engine, pre-migration suite) | `benchmarks/` closed-form suite, gate ≤ 0.1 %; migration re-run recorded in the 2026-11-01 delivery report |
| Reactions, shear/moment/axial diagrams, deflections | PASS | Solver outputs + SVG diagrams; 7 sample projects with known results |
| Load combinations — SNI 1727:2020 Pasal 2.3.2 LRFD preset | PASS (that provision only) | Regression-tested; ASD combinations UNSUPPORTED (see SNI matrix) |
| RC design checks — SNI 2847:2019 subset (beam flexure/shear, detailing, column P–M partial) | INCOMPLETE (subset) | Per-check status in SNI matrix; two-way slab, walls, footings, torsion = UNSUPPORTED |
| Steel design checks — SNI 1729:2020 subset (classification, tension, compression, flexure major-axis, shear, combined) | INCOMPLETE (subset) | Minor-axis flexure and connections = UNSUPPORTED (see SNI matrix) |
| Seismic design verdicts | UNVERIFIED | Contained since STRUKTURA Sprint 1 (R-01): verdicts render "BELUM TERVERIFIKASI (UNVERIFIED)"; hazard/spectrum generation UNSUPPORTED |
| Standalone Calculator Mode (beam/column/slab/foundation/stair forms) | UNSUPPORTED | Not present in the migrated product; Phase 2 work |
| 3D analysis & 3D visualisation / deformation animation | UNSUPPORTED | Product is 2D only; Phase 2 after 2D gate |
| Utilisation colour map (green ≤0.70 / yellow ≤1.00 / red >1.00) as a platform-standard overlay | NOT_EVALUATED | Design checks report per-member utilisation/verdicts in their own panels; the platform-standard colour overlay is not implemented |
| Calculation report export (service-level, unfactored) | PASS (as titled) | Report is titled "Laporan Hasil Analisis Layan (Tak Terfaktor)" with an explicit not-a-design/compliance-report banner; never claim otherwise |
| Project import/export, autosave, fingerprinting | PASS | `struktura-project` schema v1 retained for STRUKTURA compatibility |
| Platform licence integration | NOT_EVALUATED | Development fixtures only (`fixtures/licenses/`); real platform service is Phase 7. Demo labelling is mandatory until then |
| Accounts / cloud project sync | UNSUPPORTED | Projects are local (localStorage + file export) |
