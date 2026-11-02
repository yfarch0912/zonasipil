# Phase 8 — Keyboard Editor Completion: Implementation

Date: **2026-11-01** · Design: docs/PHASE-8-KEYBOARD-EDITOR-DESIGN.md.
All work in `src/components/data-model-editor.tsx` (+ App prop
wiring). Same `StructureModel`, same engine operations, same
`solveAllCases` pipeline — no second model, no engine change.

## COMPLETE

- **C1 distributed loads.** Create / edit / retarget (member select)
  / delete for both engine modes. Local-axis: `wStart/wEnd` fields.
  Global-axis: `wyStart/wyEnd` fields in the table (see PARTIAL for
  wx). Mode switching converts values the way the engine defaults do
  (carries the perpendicular magnitude across). Create-form
  validation is explicit: empty/non-numeric magnitudes are rejected
  with an Indonesian `role="alert"` message and **nothing is
  created** — no silent zero coercion. Solver-verified end-to-end:
  UDL −10 kN/m on a 5 m pin–roller beam built entirely in Data Tabel
  yields reactions 25.000 kN at both supports (wL/2 statics), and the
  load persists across Data→Canvas→Data view switches via the shared
  autosave.
- **C2 load cases.** Enable/disable toggles over the same App
  `loadCases` state the canvas flyouts edit (including the locked
  Selfweight case, whose flag synthesizes self-weight). Verified:
  disabling "Beban Mati" removes that case from the next analysis.
- **C3 section core properties.** Name, E, A, I33 editable per
  section through the same patch path as the canvas material editor.
  Positivity validation (E/A/I33 > 0) with an explicit error message;
  rejected values are never written.
- **C4 destructive operations.** `window.confirm` fully replaced by
  an in-app `role="alertdialog"` confirmation that lists the actual
  dependents the engine cascade will remove (members on a node,
  its support, its point loads, distributed loads on those members).
  Focus lands on **Batal**; Escape cancels; after confirmation or
  cancellation focus returns to the editor heading. Cancellation and
  confirmation paths are both E2E-tested, including the cascade
  (node + member + counts verified).

## PARTIAL

- **Global-axis distributed loads:** the table edits the `wy`
  components; `wx` components are carried (preserved, and set to 0
  on create in global mode) but are edited via the canvas. Stated in
  the UI under the table and here — not hidden.
- **Load-case management:** toggles only. Renaming cases, adding
  custom cases, or changing kinds stays in the canvas flyouts.

## NOT IMPLEMENTED (recorded, not implied)

- Combination editing in Data Tabel (read-only display of name +
  factors ships instead).
- Section creation/deletion and parametric shape-dimension editing
  in Data Tabel (material editor's domain).
- Load-case *reassignment* of existing loads from the table (loads
  display their case; creation assigns the default Dead case, as in
  Phase 7).

Phase 7's remaining F4 gap list is therefore closed except for the
items above, which are bounded, visible, and have working canvas
equivalents.
