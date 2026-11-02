# Phase 2 — ILL_CONDITIONED Evidence Investigation (NEW-1)

Date: **2026-11-01** · Result: **REPRODUCTION FOUND** — a minimal,
deterministic model classifies ILL_CONDITIONED on the pivot signal alone,
and is now locked in as regression tests
(`tests/phase2-ill-conditioned.test.ts`, 3 tests, suite 203 → 206).
Probes: `investigation/ill-conditioned.probe.ts` (run:
`npx vitest run -c investigation/vitest.probe.config.ts`).
No threshold, diagnostic, or solver behaviour was changed.

## The classification under investigation

`solveStructure`'s numerical diagnostics classify **ILL_CONDITIONED** when
the equilibrated pivot ratio ρ < 1e-8 (and ρ ≥ 1e-12, relative residual
≤ threshold, and max rotation ≤ 0.1 rad — precedence:
NUMERICALLY_UNRELIABLE > PHYSICALLY_IMPLAUSIBLE > ILL_CONDITIONED).
ρ is the min/max ratio of Gaussian-elimination pivots of the
symmetrically equilibrated stiffness matrix. As the Phase 2 prompt
states, ρ is a one-sided heuristic, **not** a true condition number —
this investigation does not upgrade that claim.

## What was tried (in order)

**Family 1 — shallow two-bar apex (stiffness weakness).** Two bars from
pins at (0,0)/(10,0) to an apex at height h swept 1e-1 → 1e-6 m, load
horizontal. Result: ρ pinned at **1.000** (truss) / **0.250** (frame) for
every h; classification VALID throughout. *Why:* symmetric equilibration
divides each DOF by its own diagonal — a weak but **decoupled** DOF
equilibrates to a unit pivot and becomes invisible to ρ. Stiffness
*scale* contrast (the earlier R-11 family's lever) is likewise removed
by equilibration. Conclusion: ρ responds only to near-linear
**dependence between DOFs** (coupling), not to absolute weakness.

**Family 2 — near-parallel bars, off-axis load.** Free node C=(5,5) held
by two bars to pins A=(0,0), B=(δ,0); load at −45°. ρ fell as ~δ²
(truss ρ ≈ 1.02e-2·δ²) and crossed 1e-8 near δ=1e-3 — but the response
grew as ~1/δ (the load's small off-axis component is amplified by the
weak mode), so at the crossing the plausibility signal fired first and
precedence yielded PHYSICALLY_IMPLAUSIBLE; at δ ≤ 1e-6 the system is a
mechanism and the solve fails outright. This family alone could not
isolate ILL_CONDITIONED.

**Family 3 — near-parallel bars, load on the symmetry axis
(REPRODUCTION).** Same geometry; load 10 kN directed exactly along
C → midpoint(AB). The configuration is symmetric about that axis, so
the weak (antisymmetric) mode receives no excitation: displacements
stay ≈1e-4 m, chord rotations ≈1e-5 rad, residual ≈1e-17, while ρ
keeps its ~δ² law.

| Variant | δ (m) | ρ | Residual | maxRot | Classification |
|---|---|---|---|---|---|
| truss | 1e-3 | 1.000e-8 | 3.1e-17 | 1.0e-5 | VALID (boundary, strict <) |
| truss | **5e-4** | **2.500e-9** | 1.6e-17 | 1.0e-5 | **ILL_CONDITIONED** (worst DOF c/v) |
| truss | 5e-5 | 2.500e-11 | 3.1e-17 | 1.0e-5 | ILL_CONDITIONED |
| frame | 2e-4 | 5.585e-9 | 3.2e-17 | 1.0e-5 | ILL_CONDITIONED (worst DOF c/θ) |
| frame | 5e-5 | 3.490e-10 | 6.4e-17 | 1.0e-5 | ILL_CONDITIONED |

The whole band [1e-12, 1e-8) is swept by δ alone, with the other two
signals healthy throughout — the exact evidence profile NEW-1 lacked.
The boundary case (δ=1e-3, ρ=1.000e-8, VALID) also confirms the band's
strict inequality in practice.

## Assessment

- The classifier behaves as designed on a real (if contrived) model
  class: near-parallel load paths — a genuine modelling hazard
  (near-duplicate supports / near-coincident restraints) — produce
  ρ-driven ILL_CONDITIONED with otherwise clean signals.
- The threshold itself was **not** validated as *calibrated* (e.g.
  against a true condition number κ(K)); ρ remains a heuristic. A
  κ-correlation study (compute κ via SVD for the reproduction family
  and compare ρ vs κ across δ) is the honest next study — recommended
  for a future phase, not required to close NEW-1's narrower question
  ("can the classification occur at all in this solver class"), which
  is now answered: **yes, reproducibly**.
- NEW-1 status: **CLOSED as an evidence gap** (reproduction exists and
  is regression-tested). Engineering statuses elsewhere are unchanged:
  this says nothing about SNI design subsets (still INCOMPLETE),
  seismic (still UNVERIFIED), or unsupported procedures.
