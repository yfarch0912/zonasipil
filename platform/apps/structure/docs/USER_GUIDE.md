# STRUKTURA — User Guide

## Start
Open the site → **Dashboard**. Create a project (name + §6.2 metadata), open a
saved project, import a project JSON, or load one of the 7 verified samples.
**Open editor** continues with the current (autosaved) model.

## Editor workflow (the intended loop)
1. **Model tab** — draw/edit nodes and members on the SVG grid (snap on/off),
   set supports (pin/roller/fixed), pick the active section; use templates
   (beam/frame/truss) and examples for fast starts. Exact coordinates are
   editable in the node/member tools. Undo/redo is built in.
2. **Sections & materials** — parametric sections (rect/circle/IWF/tee/angle/
   CHS/RHS) compute A, I, S, Z, r automatically; manual sections are allowed
   but any property you leave blank stays blank (design checks needing it
   report UNSUPPORTED rather than guessing). Material strengths (f′c, fy, fu)
   are shown on the section — check them before designing.
3. **Load tab** — define load cases (Dead/Live/Wind/Seismic…), apply point and
   distributed loads, and generate combinations: pick **SNI 1727:2020** for
   the Pasal 2.3.2 LRFD set, or write custom combinations. Self-weight is a
   built-in case synthesized from section γ·A.
4. **Analyze tab** — run/inspect per case, per combination, or envelope:
   reactions, shear/moment/axial diagrams, deformed shape. If the model is
   unstable, the diagnostics dialog names the node and direction — fix the
   model; the app never invents results for a failed analysis.
5. **Design tab** — RC (SNI 2847:2019) and steel (SNI 1729:2020) checks per
   member with clause references, inputs, utilization and verdicts
   (PASS / FAIL / WARNING / NOT CHECKED / UNSUPPORTED).
6. **Report** — from the STRUKTURA bar above the editor: **Report (PDF)**
   builds a calculation report from the service combination
   1.0×(self-weight + all modelled cases) and opens it for print /
   Save-as-PDF. **Save project** stores the current model under the active
   project (version bumps each save).

## Saving, files, recovery
- Every editor change **autosaves** to the browser (localStorage); reloading
  restores the last model. Projects are per-browser — **Export** JSON backups
  for anything important.
- Two JSON formats exist and the Dashboard accepts both: *project files*
  (metadata + model, from Dashboard Export) and *bare model files* (from the
  editor's File menu) — bare models import wrapped in fresh metadata.
- A report carries the **model fingerprint**; if the model changed after the
  report was made, the fingerprint differs — regenerate the report.

## Sign conventions
Point fy > 0 is upward; distributed w > 0 acts in +local-2; axial N tension
positive; moment M sagging positive; shear V uses the SAP-style convention
(conventional shear = −V) and is labelled as such in outputs.

## Limits
2D linear static analysis; implemented SNI subsets only — read
SNI_IMPLEMENTATION_MATRIX.md and KNOWN_LIMITATIONS.md before relying on a
check. Educational/professional-assist tool: have results reviewed by a
licensed structural engineer.
