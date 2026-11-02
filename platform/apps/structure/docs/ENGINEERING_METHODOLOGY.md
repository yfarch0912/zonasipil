# Engineering Methodology

## Analysis — Direct Stiffness Method (2D)
- Each node carries 3 DOF (u, v, θ). Frame elements use the Euler–Bernoulli
  6×6 local stiffness (axial EA/L; bending 12EI/L³, 6EI/L², 4EI/L, 2EI/L),
  rotated to global axes by the standard direction-cosine transformation and
  assembled into the global stiffness matrix.
- Optional Timoshenko shear deformation: Φ = 12EI/(G·As·L²) scaling of the
  bending block (off by default; Euler–Bernoulli is the documented default).
- Truss members: frame element with both end rotations released, implemented
  by static condensation (K_cc = K_rr − K_rs·K_ss⁻¹·K_sr). Rotational DOFs at
  pure-truss joints are constrained to zero (no moment path exists there).
- Element distributed loads (uniform/trapezoidal, local- or global-axis)
  enter through consistent fixed-end forces; axial distributed load uses the
  consistent L(2q₁+q₂)/6 distribution. End forces recovered as f = K·d − FEF.
- Supports (pin/roller/fixed) are enforced exactly by zeroing rows/columns.
- Linear system: Gaussian elimination with partial pivoting. Singularity is
  tested per DOF against its own original diagonal scale (1e-12 relative) so
  stiff/soft DOF mixtures don't produce false singularities; a singular result
  returns the offending DOF for diagnostics instead of numbers.
- Reactions are recovered as R = K_original·d − F_original at constrained DOFs.
- Internal forces along a member use the exact prismatic interpolation with
  the stored end forces and load intensities (solver.memberInternalForces).

## Sign conventions (normative for this app)
- Point load fy > 0 = upward. Distributed local-axis w > 0 = +local-2.
- Axial force N: tension positive. Moment M: sagging positive.
- Shear V is stored in the SAP-style convention (dM/dx = −V); the conventional
  shear is −V. This is documented wherever V is printed, including reports.

## Combinations & superposition
The system is linear-elastic, small-deformation: per-case results superpose
exactly. Combinations are factor-weighted sums of case results; envelopes take
per-quantity extrema and record the governing combination.

## Self-weight
Synthesized per member as a global-Y distributed load w = γ·A (γ from the
section, kN/m³; A in m²), scoped to the Selfweight case only, never persisted
into the user model. Sections with γ ≤ 0 contribute nothing (surfaced in the
editor as a diagnostic).

## Design layer
Demands (N, V, M per member per combination, incl. envelope) feed the design
strategies. Every check returns inputs, intermediates, capacity, utilization
and a verdict in {PASS, FAIL, WARNING, NOT CHECKED, UNSUPPORTED}. A check whose
rule is not implemented returns UNSUPPORTED — it can never render as PASS.
See SNI_IMPLEMENTATION_MATRIX.md for the exact implemented subset.

## Verification philosophy
The solver is verified against closed-form analytical solutions (beam theory,
method of joints, continuous-beam coefficients, equilibrium/symmetry
invariants) — never against another DSM implementation. See
NUMERICAL_VALIDATION.md for measured errors.
