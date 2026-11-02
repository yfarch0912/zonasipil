# Phase 3 — Conditioning Study: pivot ratio ρ versus κ₂(K)

Date: **2026-11-01** · Research only — **no production threshold, solver
code, or test expectation was changed.**
Code: `investigation/conditioning.probe.ts`; data:
`investigation/conditioning-data.json` (probe rows + both matrices per
point, for re-checking).

## Research question

The production diagnostic classifies ILL_CONDITIONED at equilibrated
pivot ratio ρ < 1e-8 and NUMERICALLY_UNRELIABLE at ρ < 1e-12. ρ is a
heuristic from Gaussian elimination on the equilibrated matrix. How does
ρ relate to the true 2-norm condition number κ₂ of the same system, for
the Phase 2 reproduction family (near-parallel bars, offset δ)?

## Method (independence of the κ estimate)

- **ρ, residual, rotation, classification:** taken from the production
  solver's public `analyze()` on the exact Phase 2 models — the real
  diagnostic, unmodified.
- **K:** assembled **independently in the probe** from the textbook DSM
  element stiffness (axial for truss; full 6×6 Euler–Bernoulli frame
  element with the standard transformation for frame), reduced to the
  free DOFs (truss: c/u, c/v — 2×2; frame: a/θ, b/θ, c/u, c/v, c/θ —
  5×5; pins restrain translations at a and b). This mirrors what the
  solver's BC-modified system contains; internal solver matrices are
  not exported, and the solver was not modified to expose them.
- **κ₂:** singular values of the symmetric matrices = |eigenvalues|,
  computed two independent ways: (1) a cyclic-Jacobi eigensolver
  written for this probe; (2) **numpy 1.26.4 `linalg.svd`** on the same
  dumped matrices. Agreement: relative difference < 1e-6 for all
  threshold-relevant points (κ ≤ 1e10); up to 4.7% at κ ~ 1e14, where
  σ_min approaches double-precision resolution (itself a finding, §6).
- Both the **raw** reduced K and the **symmetrically equilibrated**
  K̂ = D^(−1/2) K D^(−1/2) were evaluated. (An early Jacobi bug — the
  τ=0 rotation case returning t=0 — produced three κ=1.0 artefacts; it
  was found via the numpy cross-check, fixed in the probe, and the run
  repeated. The fix is commented in the probe source.)

## Data (κ̂ = κ₂ of the equilibrated matrix)

Truss (2×2), load 10 kN on the symmetry axis, section E=200 GPa,
A=5000 mm², I=80e6 mm⁴:

| δ (m) | ρ | κ₂(K̂) | κ₂(K̂)·ρ | Residual | maxRot | Class |
|---|---|---|---|---|---|---|
| 1e-1 | 1.020e-4 | 3.920e4 | 4.000 | ~1e-16 | 1e-3* | VALID |
| 1e-2 | 1.002e-6 | 3.992e6 | 4.000 | ~1e-16 | 1e-5 | VALID |
| 1e-3 | 1.000e-8 | 3.999e8 | 4.000 | 3.1e-17 | 1e-5 | VALID (boundary) |
| 5e-4 | 2.500e-9 | 1.600e9 | 4.000 | 1.6e-17 | 1e-5 | ILL_CONDITIONED |
| 1e-4 | 1.000e-10 | 4.000e10 | 4.000 | 3.1e-17 | 1e-5 | ILL_CONDITIONED |
| 1e-5 | 1.000e-12 | 3.999e12 | 4.000 | ~1e-17 | 1e-5 | ILL_CONDITIONED |
| 3e-6 | — | 4.446e13 | — | — | — | SOLVE FAILED (singular) |

*Family-2 (off-axis) rotations from Phase 2; the on-axis sweep holds
maxRot ≈1e-5 throughout. Full 14-point sweeps for both variants are in
`conditioning-data.json`.

Frame (5×5), same sweep (selected rows):

| δ (m) | ρ | κ₂(K̂) | κ₂(K̂)·ρ | Class |
|---|---|---|---|---|
| 1e-1 | 1.417e-3 | 3.937e4 | 55.80 | VALID |
| 1e-3 | 1.396e-7 | 4.016e8 | 56.08 | VALID |
| 3e-4 | 1.257e-8 | 4.463e9 | 56.08 | VALID |
| 2e-4 | 5.585e-9 | 1.004e10 | 56.08 | ILL_CONDITIONED |
| 1e-5 | 1.396e-11 | 4.017e12 | 56.08 | ILL_CONDITIONED |
| 1e-6 | — | 3.965e14 | — | SOLVE FAILED |

Raw vs equilibrated κ differ by <6% throughout this family (the
ill-conditioning is geometric — near-dependence — not a scaling
artefact), so the choice of matrix does not change the conclusions here.

## Findings

1. **Within a structural family, ρ is an exact-order proxy for 1/κ₂:**
   κ₂(K̂)·ρ is *constant* across 2–3 decades of δ — **4.000** for the
   2-DOF truss system, **56.08** for the 5-DOF frame system. Both
   quantities are driven by the same single near-dependence parameter,
   so they track each other perfectly (in log terms) inside the family.
2. **The constant is family-dependent** (4 vs 56 — and it will differ
   again for larger, mixed systems). Therefore ρ is **not** a
   calibrated estimator of κ₂ in general; no universal conversion
   exists. Correlation: established. Calibration: **not** established.
3. **Threshold translation (this family only):** ρ < 1e-8 ⟺
   κ₂(K̂) ≳ 4.0e8 (truss) / 5.6e9 (frame); the UNRELIABLE boundary
   ρ < 1e-12 ⟺ κ₂ ≳ 4e12 / 5.6e13 — i.e. the production bands sit at
   condition numbers where a double-precision solve progressively
   loses 8–13 significant digits. The bands are *plausible* as
   order-of-magnitude guards; this study does not justify moving them.
4. **Precision ceiling:** at κ ≳ 1e12 the two independent κ estimators
   themselves begin to diverge (worst 4.7% at κ~1e14); beyond that,
   neither ρ nor a computed κ₂ can be quoted more precisely than
   order-of-magnitude — consistent with the solver treating that region
   as UNRELIABLE outright.
5. Nothing here validates ρ for *other* ill-conditioning mechanisms
   (e.g. mixed-unit systems, shear-flexibility contrasts). One family,
   however clean, is one family.

## Recommendation

Keep the production thresholds unchanged. If a future phase wants a
calibration claim, it needs (a) several structurally distinct families,
(b) the solver's own assembled K exposed to tests (an internal hook,
test-only), and (c) a stated policy for what κ range each verdict band
should mean. Until then, reports should keep describing ρ exactly as
the code does: an equilibrated-pivot heuristic, empirically proportional
to 1/κ₂ within the one family studied.
