# Phase 5 — Engineering Validation Matrix (solver)

Date: **2026-11-01** · Scope: what the *code actually supports*, each
row backed by an executed comparison against an independent reference.
Tolerance for benchmark comparisons: ≤0.1% relative (the suite's gate);
equilibrium: ≤1e-6 relative. "Independent" = closed-form statics /
classical beam tables / method of joints / metamorphic invariants —
never the solver compared against itself.

| # | Case family | Independent reference | Compared quantities | Evidence | Status |
|---|---|---|---|---|---|
| 1 | Simply supported beam | Beam tables: R=wL/2, M=wL²/8, δ=5wL⁴/384EI; central point: δ=PL³/48EI | Reactions, δ, θ, M(x) profile | Benchmarks B1, B7; Phase 4 T1 tests; **Phase 5 V3** (internal-force recovery) | PASS |
| 2 | Cantilever | δ_tip=PL³/3EI, wL⁴/8EI; θ=wL³/6EI; M=wL²/2 | Reactions, tip δ/θ, fixed moment | B2, B8; Phase 4 T2 tests | PASS |
| 3 | Indeterminate beams (new this phase) | Classical coefficients: propped cantilever 3wL/8, 5wL/8, wL²/8; fixed-fixed PL/8, PL³/192EI | Reactions, end moments, δ | **Phase 5 V1, V2** (`tests/benchmarks/phase5-validation.test.ts`) | PASS |
| 4 | Frame / portal | Symmetry invariants (B5), metamorphic scaling/superposition (B13), global statics (V4) | Reactions, equilibrium ΣFx/ΣFy/ΣM, scaled-response identities | B5, B13; **Phase 5 V4** (asymmetric portal + lateral load, equilibrium to 1e-6) | PASS |
| 5 | Truss | Method of joints (B4); sample 04 symmetric reactions 22.5/22.5 kN, ΣRy=45 | Member axial forces, reactions | B4; sample audit (Workstream E) | PASS |
| 6 | Distributed loads | wL totals + coefficients above; two-span 0.375wL / 1.25wL / −wL²/8 | Reactions, support moment | B1, B3, B8; sample 03 verified 18.75/62.5/18.75 | PASS |
| 7 | Point loads | PL products above; B9 overhang pure statics | Reactions, moments, δ | B2, B7, B9; Phase 4 T1 | PASS |
| 8 | Support-reaction equilibrium | Statics (necessary condition, formulation-independent) | ΣFx, ΣFy, ΣM residuals | Phase 5 V4; sample audit: all 7 samples balance to ≤1e-13; solver relative residual ≤5.4e-17 across samples | PASS |
| 9 | Member force/moment recovery | Beam theory along-member profiles (V3), end-force identities (V1/V2) | N/V/M at member stations | B1 (Mmax), **Phase 5 V1–V3** | PASS |
| 10 | Numerical conditioning | Phase 3 ρ↔κ₂ study (independent DSM + Jacobi + numpy SVD) | Classification vs κ bands | Phase 2 reproductions; sprint2-conditioning; Phase 3 study | PASS (heuristic characterised, not calibrated — see Phase 3) |
| 11 | Singular / unstable models | Solver must FAIL loudly with the singular DOF identified, never silent zeros | Failure mode, DOF reporting | B6 failure diagnostics; B12 near-singular (now diagnosed); cycle/sprint regressions | PASS |
| 12 | Inclined members / transformation | Local-global transformation identities | Forces on inclined member | B10 | PASS |
| 13 | Timoshenko shear deformation | Timoshenko closed form vs EB limit | δ with/without shear | B11; sprint1-timoshenko | PASS |

## Boundaries of this validation (unchanged, restated)

- Validation covers the **2D linear-static frame/truss solver** and the
  quantities above. It does **not** extend to: design-code compliance
  (RC/steel checks remain verified only against their own worked
  examples in the design suites, and remain **INCOMPLETE subsets** of
  SNI 2847:2019 / SNI 1729:2020 per `docs/SNI_IMPLEMENTATION_MATRIX.md`),
  seismic procedures (**UNVERIFIED**), or anything listed UNSUPPORTED
  in `docs/KNOWN_LIMITATIONS.md`.
- Every comparator shares the Euler–Bernoulli/Timoshenko *theory* with
  the implementation (that is what a DSM solver is); independence here
  means the expected numbers come from statics and classical solutions,
  not from re-running the same discretisation. Cross-implementation
  benchmarking (e.g. against an external FEM package) has **not** been
  performed and would be the next evidence tier.
- No national-standard compliance is claimed by this matrix.
