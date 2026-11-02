# Phase 7 — Keyboard-Accessible Modelling: Design

Date: **2026-11-01** · Resolves the architectural half of Phase 6
finding **F4** (canvas modelling is pointer-only).

## Problem

All model editing in the editor is canvas pointer interaction
(place/drag nodes, click members, click supports). A keyboard-only
user cannot create or edit a model at all, even though every result
the app produces (reactions, diagrams as data, design checks) is
inherently tabular.

## Design decision

Add a **"Data Tabel" tab** alongside Model/Beban/Analisis/Desain that
renders a form-and-table editor over the **same** `StructureModel`
state the canvas uses:

- **Same state, same ops.** The view receives App's `model` and
  `setModel`. Mutations go through the engine's existing operations
  where they exist (`addNode`, `deleteNode`, `deleteMember` from
  `src/engine/model.ts` / `geometry.ts` — including their cascade
  rules) and through the same plain-record construction the canvas
  handlers use elsewhere (supports, loads, member section). There is
  no second model and no second calculation path.
- **Same solver.** Its analysis button calls `solveAllCases` from
  `src/engine/analysis-pipeline.ts` — the exact pipeline the Analisis
  tab renders — and displays classification + reactions as text
  tables.
- **Native controls only.** `<table>`, `<input>`, `<select>`,
  `<button>`, `<label>` — everything reachable and operable by
  keyboard by construction, with visible focus from the app's existing
  styles. Numeric fields commit on blur/Enter so typing is natural.
- **Destructive actions are explicit.** Delete buttons state their
  cascade in a native `confirm()` ("menghapus simpul juga menghapus
  elemen, tumpuan, dan beban yang terhubung") — the dependency
  feedback the engine's cascade makes true.
- **Canvas untouched.** The canvas remains the primary editor; the
  Data tab is an alternative front-end to the same document, and
  switching tabs mid-session shows the same model in both.

## Vertical slice scope (this sprint)

Implemented: node create/edit-coordinates/delete (with cascade),
support assignment per node, member create (node pair + section) /
edit endpoints and section / delete (with cascade), point-load
create/edit/delete, distributed-load list + delete, run analysis
(all cases) and read classification + reactions as tables.

Explicitly **INCOMPLETE** (recorded, not hidden): editing distributed
loads' magnitudes in the table (they are listed and deletable;
creating/editing them remains a canvas task in this slice), load-case
and combination management, section geometry editing (the MATERIAL
library editor already exists as a form UI and is keyboard-reachable
in the Model tab), and design-tab inputs. F4 therefore remains
INCOMPLETE overall — the core modelling loop (geometry → supports →
section → load → analysis → results) is keyboard-completable, the
long tail is not.
