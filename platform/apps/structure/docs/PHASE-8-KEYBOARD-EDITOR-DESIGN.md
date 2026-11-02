# Phase 8 — Keyboard Editor Completion: Design

Date: **2026-11-01** · Extends the Phase 7 Data Tabel slice
(docs/PHASE-7-KEYBOARD-MODELLING-DESIGN.md remains the base design).

## Scope decisions (from auditing the actual model/UI first)

### C1 — Distributed loads
The engine schema (`DistributedLoad`) has two modes, and the editor
must not invent a third:
- `local-axis` (default): `wStart`, `wEnd` in kN/m, perpendicular to
  the member; negative = downward for a horizontal member (the same
  sign convention as point-load `fy`).
- `global-axis`: `wxStart/wxEnd`, `wyStart/wyEnd` in kN/m.
Data Tabel supports create / edit / retarget (member select) /
delete for both modes, with the same fields the canvas exposes.
Load-case association is displayed; case *assignment* stays where
the canvas puts it (case management is C2's display/toggle scope).
Validation is explicit: non-numeric or empty magnitudes are rejected
with an Indonesian error message — never silently coerced to zero.

### C2 — Load cases and combinations
Load cases live in App state (`Record<LoadCaseId, LoadCase>`), not in
`StructureModel`; the solver consumes them via `solveAllCases`.
Supported operations in the existing UI: enable/mute a case
(including the locked Selfweight case, whose `enabled` flag means
"synthesize self-weight"). Data Tabel therefore offers **case
enable/disable toggles** over the same state — nothing more is
invented. Combinations are **displayed read-only** (name + factors)
because their full editor (factor CRUD with its own validation)
would duplicate a second source of truth for combination semantics;
editing combinations in Data Tabel is recorded NOT IMPLEMENTED.

### C3 — Section properties
Sections are solver-truth records (`name`, `E` MPa, `A` mm²,
`I33` mm⁴, plus optional parametric shape metadata). The canvas
material editor ultimately writes these same fields (via
`handleSectionPropsChange`). Data Tabel edits **name, E, A, I33**
through the identical patch mechanism, with positivity validation
(the solver requires E, A, I33 > 0). For parametric sections, a later
dimension edit in the material flyout recomputes A/I33 — last edit
wins in the same store; the table labels this honestly. Shape dims,
strength (f'c/fy), and section creation/deletion stay in the
material editor (NOT IMPLEMENTED in Data Tabel).

### C4 — Destructive operations
`window.confirm` is replaced by an in-application confirmation
dialog (`role="alertdialog"`, labelled, focus lands on **Batal**,
Escape cancels, focus returns to the section heading after the
trigger element is removed). The dialog lists the actual dependents
that the engine cascade will remove (connected members, supports,
point loads on the node, distributed loads on the member), computed
from the current model — the user confirms with full knowledge, and
cancellation is a first-class path.
