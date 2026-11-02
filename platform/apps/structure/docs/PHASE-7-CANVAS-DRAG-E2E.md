# Phase 7 — Canvas Drag-Move E2E (GESER SIMPUL)

Date: **2026-11-01** · Status: **PASS** — `e2e/drag-move.spec.ts`
(1 test, green in the full suite run).

## Scenario

Sample 01 (span 5 m centred on the origin: supports x=−2.5/+2.5,
loaded node x=−0.5, i.e. 2 m from the left support):

1. Open sample 01; read the autosaved model — the loaded node and
   support positions come from the model itself, not assumptions (an
   early draft of this test assumed 0/2/5 m coordinates and failed
   against the real template geometry; the test now derives every
   coordinate from the autosave).
2. Activate **GESER SIMPUL**; drag the loaded node with the mouse from
   x=−0.5 to x=+0.5 (3 m from the left support), using a pixel↔world
   mapper calibrated live from the editor's status-bar readout (the
   same technique as the workflows spec — fixed fractions are
   unreliable because the view re-fits).
3. Verify from the autosave: node coordinates changed to the target
   (±0.01 m), y unchanged; connected member lengths are now 3 m and
   2 m.
4. Re-run analysis on the Analisis tab: the Ringkasan reactions are
   **+4 kN / +6 kN** — the exact statics of the new geometry
   (R_left = 10·(5−3)/5), mirrored from the original 6/4.
5. Zero page errors throughout.

This closes the Phase 6 coverage gap: canvas drag editing is now
covered by a deterministic browser test that goes through the real
pointer interaction and the real solver, and it doubles as the manual
canvas verification for the Phase 7 hooks remediation (the drag path
exercises `draggingNodeId`, `handleMoveNode`, and the canvas render
loop whose ref-read was removed).
