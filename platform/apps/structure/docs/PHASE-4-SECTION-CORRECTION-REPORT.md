# Phase 4 — SECTION_DEFAULT Correction Report

Date: **2026-11-01** · Change: one numeric constant in one file.
Evidence basis: `docs/PHASE-3-SAMPLE-MODEL-AUDIT.md` (root cause proven
against closed-form solutions before any edit).

## The change

File: `src/templates/examples.ts` (the only source file modified).

```diff
 const SECTION_DEFAULT: StructureModel["sections"][string] = {
-  id: "section", name: "penampang", E: 23500, I33: 3125000, A: 150000,
+  // 300x500 concrete beam: A = 300*500 = 150000 mm^2, I33 = 300*500^3/12 =
+  // 3125000000 mm^4 (identical to the parametric rc300x500 in
+  // defaultSections). Phase 4 correction: I33 was 3125000 (1000x too
+  // small), which made templates 1-2 classify PHYSICALLY_IMPLAUSIBLE.
+  id: "section", name: "penampang", E: 23500, I33: 3125000000, A: 150000,
 }
```

| Property | Before | After | Basis |
|---|---|---|---|
| E | 23500 MPa | 23500 MPa (unchanged) | concrete, fc≈25 (4700√fc ≈ 23 500) |
| A | 150 000 mm² | 150 000 mm² (unchanged) | = 300 × 500 mm |
| **I33** | **3 125 000 mm⁴** | **3 125 000 000 mm⁴** | = 300·500³/12 mm⁴, and exactly the value the parametric `rc300x500` section (same model, same E/A) already carried |

Units verified against the engine convention (E: MPa, I: mm⁴, A: mm² —
`src/engine/model.ts`, all parametric sections). Why the old value was
inconsistent: with E and A fixing the section's identity as the 300×500
concrete beam, I33 was exactly 1000× below that section's geometric
second moment of area — a transcription/scale error, confirmed by the
Phase 3 analytical reproduction (solver rotation matched the
closed-form value for the *stored* EI to all printed digits).

## Templates affected

- `template1SimpleBeam()` (dashboard sample 01) — uses `SECTION_DEFAULT`.
- `template2Cantilever()` (dashboard sample 02) — uses `SECTION_DEFAULT`.
- Templates 3/4/5 unaffected (parametric or `SECTION_C30` sections).

## Numerical effect (solver, executed — see test evidence)

| Quantity | Before | After | Analytical (corrected EI) |
|---|---|---|---|
| T1 reactions Ry | 6 / 4 kN | 6 / 4 kN (unchanged — statics) | 6 / 4 kN |
| T1 θ at left support | −0.21787 rad | **−2.1787e-4 rad** | 2.178723e-4 rad |
| T1 δ at load point | −0.32681 m | **−3.2681e-4 m** | 3.268085e-4 m |
| T1 classification | PHYSICALLY_IMPLAUSIBLE | **VALID** | — |
| T2 tip rotation | −2.83688 rad | **−2.8369e-3 rad** | 2.836879e-3 rad |
| T2 tip deflection | (1000× the corrected value) | **−1.0638e-2 m** | 1.063830e-2 m |
| T2 classification | PHYSICALLY_IMPLAUSIBLE | **VALID** | — |
| Residuals | ~1e-21 | < 1e-8 (asserted in tests) | — |

All deformations scale by exactly 1/1000, as they must for a linear
solver when only I changes by 1000× — internal consistency proof that
nothing else moved.

## Provenance — solver untouched

- Full engine diff vs the original STRUKTURA `src/lib` (Phase 2 method):
  61 engine files checked; differences remain **import lines only**
  plus Phase 2's single documented type relocation. **Zero** Phase 4
  changes under `src/engine/`. No threshold, formula, or diagnostic was
  modified (`PIVOT_RATIO_*`, `ROTATION_IMPLAUSIBLE = 0.1`, etc. intact).
- `examples.ts` diff vs the original: import-path updates (Phase 2) +
  the I33 line + its comment. Nothing else.
