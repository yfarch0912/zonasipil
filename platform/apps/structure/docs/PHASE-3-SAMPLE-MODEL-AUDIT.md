# Phase 3 — Sample-Model Audit: Sample 01 PHYSICALLY_IMPLAUSIBLE

Date: **2026-11-01** · Status: **ROOT CAUSE FOUND (evidence-backed)**.
No sample, threshold, or solver code was changed in this audit.
Reproduction: `investigation/sample01.probe.ts`
(`npx vitest run -c investigation/vitest.probe.config.ts investigation/sample01.probe.ts`).

## The model (traced end to end)

Dashboard sample **01 · Balok Tumpuan Sederhana**
(`src/struktura/samples.ts`, id `01-simple-beam`) builds
`template1SimpleBeam()` (`src/templates/examples.ts`):

- Nodes n1(−2.5, 0), n2(−0.5, 0), n3(+2.5, 0) — span 5 m, load point 2 m
  from the left support; members n1→n2, n2→n3; pin at n1, roller at n3.
- Load: point, fy = −10 kN at n2, case `dead`.
- Both members reference section id **`section`** — a hand-written
  constant in the same file:

```ts
const SECTION_DEFAULT = { id: "section", name: "penampang",
  E: 23500, I33: 3125000, A: 150000 }
```

Units convention of the engine (see `src/engine/model.ts` and every
parametric section): E in MPa, I33 in mm⁴, A in mm².

## Solver output (executed, actual)

- Reactions: **Ry(n1) = 6 kN, Ry(n3) = 4 kN** — exact.
- Relative residual: **2.6e-21** (equilibrium essentially perfect).
- Displacements: v(n2) = −0.3268 m; θ(n1) = **−0.21787 rad**,
  θ(n3) = +0.19064 rad → classification **PHYSICALLY_IMPLAUSIBLE**
  (limit 0.1 rad), pivot ratio healthy (0.421).

## Independent analytical check (closed form, this audit)

For a simply supported beam, P at a=2 m, b=3 m, L=5 m:

- Reactions (statics, EI-independent): R₁ = Pb/L = 6 kN, R₂ = Pa/L = 4 kN ✓
- θ₁ = P·a·b·(L+b)/(6EIL). With the stored section,
  EI = 23.5e6 kN/m² × 3.125e-6 m⁴ = **73.44 kN·m²** →
  θ₁ = 480/2203.1 = **0.21787 rad** — matches the solver to all printed
  digits. Deflection at the load point, Pa²b²/(3EIL) = 0.3268 m ✓.
  **The solver is right; the input section is the problem.**

## Root cause: SECTION_DEFAULT's I33 is 1000× too small for its own A and E

The same model also carries the dashboard's default section set, which
includes **`rc300x500` "Balok 300x500"**: E = 23500 MPa, A = 150 000 mm²,
**I33 = 3 125 000 000 mm⁴** (the correct parametric value for a 300×500
rectangular concrete section: 300·500³/12 = 3.125e9 mm⁴).

`SECTION_DEFAULT` has the *same* E and the *same* A (150 000 mm² =
300×500 mm exactly) but I33 = **3 125 000 mm⁴** — exactly **1000×
smaller**, i.e. the digits of the correct value with three zeros lost.
With A and E pointing unambiguously at the 300×500 concrete beam, the
stored I33 is inconsistent with the section it describes: a
transcription/scale error in the hand-written constant, not a
deliberately flexible example (nothing in the sample's text suggests a
flexibility demonstration, and the companion `SECTION_C30` in the same
file — E=30000, I33=4.8e8, A=75000 — is internally consistent).

Blast radius: **template 2 (cantilever, dashboard sample 02) uses the
same `SECTION_DEFAULT`** and classifies PHYSICALLY_IMPLAUSIBLE with
θ_tip = 2.84 rad (probe-verified). Templates 3/4 use parametric/computed
sections and are unaffected.

## Separation of concerns (per the audit brief)

- **Statics/equilibrium:** correct and unaffected — reactions are
  EI-independent for this determinate beam, residual ~1e-21. The
  documented expectation "Ry = 6/4 kN" remains true.
- **Deformation/plausibility:** the warning is the R-11 guard working as
  designed on genuinely implausible input data. **No diagnostic is at
  fault and no threshold should move.**

## User-facing implication

A first-time user opening samples 01 or 02 immediately hits a red
warning dialog and a "TIDAK STABIL"-looking status, on the product's
flagship educational examples — despite the engineering *results*
(reactions) being exactly right. This undermines the samples' purpose.

## Recommended corrective action (NOT applied — needs approval)

1. Correct `SECTION_DEFAULT.I33` from 3 125 000 → **3 125 000 000 mm⁴**
   in `src/templates/examples.ts` (one constant; makes it identical in
   E/I/A to the existing `rc300x500`). Expected post-fix values:
   θ₁ = 2.18e-4 rad, v(n2) = 3.27e-4 m, classification VALID, reactions
   unchanged (6/4 kN).
2. Regression tests to add with the fix (none exist for template
   deformations today):
   - template 1: classification VALID, θ₁ within 1% of the closed-form
     2.1787e-4 rad, reactions still 6/4 kN;
   - template 2: classification VALID, tip deflection/rotation within
     1% of wL⁴/(8EI) / wL³/(6EI) with the corrected EI;
   - a section-consistency guard: for every hand-written section
     constant in `templates/examples.ts`, assert I33/A² lies in the
     plausible range for solid sections (catches order-of-magnitude
     transcription errors of this class).
3. Re-run the Playwright E2E: the sample-01 scenario's dialog assertion
   must then be updated (the dialog will no longer appear) — the E2E
   change belongs to the same approved fix, not before it.
