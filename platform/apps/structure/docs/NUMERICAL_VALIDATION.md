# Numerical Validation — real measured results

Suite: `benchmarks/solver-benchmarks.test.ts` (Vitest). Reference values are
closed-form analytical solutions (Euler–Bernoulli theory, method of joints,
continuous-beam coefficients, equilibrium/symmetry invariants) — never another
DSM implementation. Acceptance target (directive §8.2): ≤ 0.1 % relative error.

## Measured spot values (evidence run, 2026-10-31)
Test section: E = 200 000 MPa, A = 5 000 mm², I = 80×10⁶ mm⁴ (EI = 16 000 kN·m²).

| Case | Quantity | Solver output | Analytical | Rel. error |
|---|---|---|---|---|
| Simply supported beam, UDL 10 kN/m, L = 6 m | Ry (left) | 29.999999999999993 kN | 30 kN | ~2×10⁻¹⁶ |
| | Ry (right) | 30.000000000000007 kN | 30 kN | ~2×10⁻¹⁶ |
| | M at mid-span | 44.99999999999997 kN·m | wL²/8 = 45 kN·m | ~7×10⁻¹⁶ |
| | δ at mid-span | −0.010546874999999989 m | 5wL⁴/384EI = −0.010546875 m | ~1×10⁻¹⁵ |
| Cantilever, P = 10 kN, L = 3 m | δ tip | −0.005624999999999996 m | PL³/3EI = −0.005625 m | ~7×10⁻¹⁶ |
| | Base moment | 29.999999999999975 kN·m | PL = 30 kN·m | ~8×10⁻¹⁶ |

(Prismatic DSM reproduces these nodal values to floating-point precision;
the 0.1 % tolerance is the gate, the measured errors are far below it.)

## Full benchmark list (21 tests, all passing)
1. **Simply supported beam UDL** — reactions wL/2, Mmax wL²/8, δ 5wL⁴/384EI,
   shear zero-crossing at mid-span (SAP sign convention asserted explicitly).
2. **Cantilever tip load** — δ PL³/3EI, Ry = P, |Mz| = PL, fixed-end moment.
3. **Two-span continuous beam UDL** — R = 0.375wL / 1.25wL / 0.375wL,
   support moment −wL²/8 on both member ends.
4. **Triangular truss, apex load** — method of joints: top chords −12.5 kN,
   bottom chord +7.5 kN, reactions 10 kN, truss end moments ≈ 0 (< 1e-6).
5. **Portal frame, symmetric UDL** — global equilibrium to 1e-8 relative,
   mirror-symmetry invariants (equal Ry, u joints equal/opposite incl. beam
   axial shortening, rotations equal/opposite), downward beam deflection.
6. **Failure diagnostics** — unrestrained beam rejected; empty model rejected
   with a reason. Failures never return zero results.

## Design-formula validation (tests/design-sections.test.ts, 7 tests)
- Section properties vs hand formulas: rect 300×500 (A, I = bh³/12, S),
  circle D400 (A = πD²/4, I = πD⁴/64), IWF area from flange/web rectangles.
- SNI 2847:2019: β1(25) = 0.85, β1(35) = 0.80; As,min(300×440, f′c25, fy400)
  = 462 mm²; Vc = 0.17λ√f′c·bw·d = 112.2 kN (exact); φMn of a 300×440 beam
  with As = 1473 mm²: solver Mn = within 0.5 % of the hand-computed
  232.0 kN·m, φMn within 0.5 % of 208.8 kN·m, φ = 0.90.

## Sample-project validation (tests/samples-projects.test.ts)
All 7 samples solve; each satisfies global equilibrium (Σ reactions +
Σ applied vertical load ≈ 0 to < 1e-9 relative). The shipped foundation
templates were additionally solved in an evidence run: simple beam
Ry = 6/4 kN, cantilever base Ry = 50 kN & Mz = 125 kN·m, portal solves with
both support reactions reported.

## What is NOT validated
Modal/eigenvalue, P-Delta, response spectrum (not implemented — UNSUPPORTED).
Steel design formulas are covered by code-level clause implementation in the
foundation; STRUKTURA's own added tests cover RC formulas and section
properties above. Expanding steel hand-calc tests is roadmap work, stated
plainly here rather than implied.
