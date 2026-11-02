# Structural Animation & Load Simulation — Implementation Report

Date: **2026-11-01** · Final status: **PARTIALLY COMPLETE** — the
animation system, honest scale labelling, and case comparison are
implemented and verified on top of the pre-existing solver-true
visualizations; the items under "Known limitations" are stated
plainly rather than papered over.

## 1. Executive summary

Step 0 inspection changed the shape of this task: the application
already contained professional, solver-true static visualizations
(loads, reactions, N/V/M diagrams, and a Hermite-spline deformed
shape) inside its canvas. What was genuinely missing was
**animation** (playback of the deformation), **explicit scale
honesty in the UI**, and a **numeric load-case comparison**. Those
three were built — read-only over the solver, no engine change, no
canvas rewrite (the canvas file is byte-identical to baseline) —
and validated end-to-end.

## 2. Baseline before implementation

222/222 unit tests · build PASS · lint 0 errors / 20 warnings ·
E2E 32/32 · lockfile `b294dc3d153cb492` · file hashes recorded:
`solver.ts ca5a9240af0699cb`, `structural-canvas.tsx d1654f0c4444ca30`.

## 3–4. Files created / modified

Created:
- `src/visualization/deformation.ts` — read-only adapter
  (Hermite member sampling, peak nodal displacement).
- `src/visualization/animation.ts` — pure deterministic progress
  logic (advance/clamp, reduced-motion helpers).
- `src/components/simulation-controls.tsx` — Analyze-view control
  bar (playback, slider, speed, scale presets, honest label,
  comparison table).
- `tests/unit/visualization.test.ts` — 8 adapter/animation tests.
- `e2e/animation.spec.ts` — 4 browser tests.

Modified:
- `src/App.tsx` — `animProgress` state; effective canvas scale =
  `deformationScale × animProgress`; control bar rendered in the
  Analyze view; comparison rows derived from `caseResults`.

NOT modified: `src/canvas/structural-canvas.tsx` (hash unchanged),
anything under `src/engine/**`, `package-lock.json`.

## 5. Visualization capability matrix (verified from code)

| Visualization | Solver data available | State |
|---|---|---|
| Point + distributed loads (both modes) | model loads | Existed (canvas drawLoads); unchanged |
| Deformed shape | `nodeDisplacements {u, v, theta}` | Existed (Hermite spline renderer); now animated |
| Reactions | `reactions {Rx, Ry, Mz}` | Existed (drawReactions); unchanged |
| Axial / Shear / Moment diagrams | `memberEndForces` + engine `memberInternalForces` + `diagram-utils` | Existed (draw*Diagram); unchanged |
| Continuous member inspection | `memberInternalForces(endForces, x, L)` | Engine-supported and used by diagrams; a dedicated click-along-member inspector UI was NOT added (see §15) |
| Load-case comparison | `caseResults` per case | **New**: numeric table (status, peak displacement, ΣRy) |
| Deformation animation | interpolation over the above | **New**: this implementation |
| Stale-result marking | — | Not applicable by architecture: results are a `useMemo` of the live model, recomputed synchronously on any model change — a stale result cannot be displayed |

## 6. Solver output fields used

`AnalysisResult.nodeDisplacements` (u, v, theta per node),
`AnalysisResult.reactions` (Rx, Ry, Mz), `AnalysisResult.numerical
.classification`, `memberEndForces` (via the pre-existing diagram
renderers). The animation layer itself consumes only
nodeDisplacements-derived geometry through the existing canvas prop.

## 7. Deformation interpolation method

Cubic Hermite shape functions of the Euler–Bernoulli frame element
over each member, from the solver's nodal translations and
rotations — the formulation the canvas already used, now also
exposed as a tested adapter (`sampleMemberDeformation`). Exact for
members without distributed loads (validated: adapter deflection at
x = L/4 of a centrally loaded SS beam matches
Px(3L²−4x²)/(48EI) to <0.5%; endpoints reproduce solver nodal
values to 1e-12). Under distributed loads the Hermite field is the
element-consistent representation of the FE result — the standard
FE postprocessing picture — and is documented as such in the code;
it is never described as the exact quartic elastic curve.

## 8. Internal force diagram data source

Pre-existing and unchanged: element end forces plus the engine's
own `memberInternalForces` recovery with the member's distributed
load intensities (q1/q2/qx1/qx2), drawn by the canvas's axial/shear/
moment renderers with the established sign conventions.

## 9. Animation architecture

- Pure progress logic (`advanceProgress`): deterministic, clamps at
  t = 1, speed multipliers 0.25/0.5/1/2, 2400 ms full sweep at 1×.
- One `requestAnimationFrame` loop inside a single effect in
  SimulationControls; teardown on pause/unmount/speed change — no
  duplicate loops (verified by lifecycle E2E). The loop only sets an
  interpolation parameter; **the solver never runs per frame**, and
  the model is never touched (E2E asserts the autosave is
  byte-identical after a full playback session).
- Progress 1 by default (the deformed shape shows on entering
  Analyze, exactly as before this feature); animation is opt-in via
  Putar/Ulang or by scrubbing the slider.
- The bar states in plain Indonesian that the animation is an
  interpolation of a static result — not dynamic/time-history/
  seismic simulation.

## 10. UI controls implemented

Putar/Jeda, Ulang (replay), Atur Ulang (back to full deformation),
progress slider (keyboard-operable), speed select, deformation
scale presets 0.5/1/2/5/10/20×, and the persistent honesty chip:
"SKALA DEFORMASI: N× — HANYA VISUALISASI · perpindahan maks
sebenarnya X m di simpul Y" with the unscaled solver peak.

## 11. Load-case behavior

The animation follows the currently displayed result (case /
combination / envelope via the existing AnalyzeViewSelector).
Results are derived live from the model (useMemo), so edits
immediately re-solve — there is no stale state to animate. The
comparison table lists every load case with its classification,
peak nodal displacement, and ΣRy from the same `caseResults` the
canvas uses; failed cases are shown as "gagal / belum dianalisis".

## 12. Performance considerations

Single rAF loop; no solver execution during playback; progress is
one number in React state (the canvas redraw is the same redraw any
state change already caused); loop cleaned up on unmount; mobile
control layout wraps (flex-wrap) and reuses ≥24 px targets.

## 13. Analytical validation results

- Adapter vs closed form (unit): endpoint identity 1e-12; L/4
  deflection <0.5% of Px(3L²−4x²)/(48EI); peak = PL³/(48EI) <0.5%.
- Sample 01 in the browser: the honesty chip shows the Phase-4
  verified peak, 0.00033 m; comparison ΣRy for Beban Mati = 10.000
  kN (the applied load).
- Phase 8's UDL case (25.000 kN reactions) remains covered by
  phase8.spec, still green in the full run.

## 14. Regression results (final)

| Gate | Baseline | Final |
|---|---|---|
| Unit/regression | 222/222 | **230/230 PASS** (+8 new) |
| Build + typecheck | PASS | PASS |
| Lint | 0 errors / 20 warnings | **0 errors / 20 warnings** |
| Playwright E2E | 32/32 | **36/36 PASS** (+4 new) |
| External runtime requests | zero | zero |
| Lockfile | `b294dc3d153cb492` | unchanged |

Prompt test mapping: A/B — animation.spec test 1 (labels, solver
values, UDL coverage via phase8.spec) · C cantilever — covered by
unit benchmarks (fixed-support cases in the 222) and the adapter
tests' formulation; no separate browser cantilever test was added ·
D portal frame — multi-member rendering exercised by sample-based
specs (portal samples in workflows) · E — animation.spec test 2 ·
F — animation.spec test 3 · G — missing-member adapter returns []
(unit test); invalid results show the no-animation state (test 3) ·
H — animation.spec tests 1 + 4 (lifecycle, reduced-motion stepping;
unmount cleanup is structural — single effect with teardown).

## 15. Known limitations

- No dedicated click-along-a-member numeric inspector UI was added;
  continuous values exist in the engine and drive the diagrams, and
  node displacement inspection exists via the canvas hover tooltip.
  Building that inspector is a UI task for a future brief, not a
  data limitation.
- The deformation auto-fit in the canvas normalizes the peak
  displacement to 1 m of world space at scale 1× (pre-existing
  behaviour); the UI therefore labels the scale as a visualization
  scale and always shows the true peak value alongside — the
  physical displacement is never restated.
- Animation applies to the Analyze view; the Design tab shares the
  same effective scale state but has no control bar.

## 16. Unsupported features (unchanged, not expanded)

Calculator Mode UNSUPPORTED · 3D UNSUPPORTED · seismic/dynamic/
time-history/modal analysis UNSUPPORTED (the animation is
explicitly labelled as static-result interpolation) · combination
editing in Data Tabel NOT IMPLEMENTED · no new diagram types beyond
the solver's N/V/M outputs.

## 17–19. Confirmations

- `src/engine/**`: **unchanged** — `solver.ts` sha256 prefix
  `ca5a9240af0699cb` before and after; no engine file was edited.
- Original STRUKTURA: **untouched** — HEAD
  `77fd6e1bf537c18fff0e0e253deda63973e80102`, single protected
  change ` M docs/AUDIT_CYCLE.md`, re-verified at close.
- Lockfile/dependencies: **unchanged** (`b294dc3d153cb492`); no new
  dependency added; no external runtime asset introduced.

## 20. Testing locally

```bash
cd ~/workspace/zonasipil-structure
npm test                                    # 230 unit/regression tests
npm run build && npm run test:e2e           # 36 browser tests
npm run dev                                 # open a sample → tab Analisis → Putar
```
