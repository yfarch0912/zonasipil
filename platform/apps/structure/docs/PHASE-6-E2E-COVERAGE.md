# Phase 6 — Playwright E2E Coverage

Date: **2026-11-01** · Suite: **14 tests, all PASS** against the
production build (`vite preview`, 127.0.0.1:4317):
`e2e/smoke.spec.ts` (1, from Phase 2), `e2e/workflows.spec.ts` (7, new),
`e2e/accessibility.spec.ts` (6, new — detailed in the accessibility
audit).

## Mandated scenarios vs coverage

| # | Scenario | Covered by | How it is verified |
|---|---|---|---|
| 1 | Dashboard → sample 01 → analysis | smoke.spec | Reactions +6/+4 kN from the live solver; no implausibility dialog (Phase 4 behaviour) |
| 2 | Dashboard → sample 02 → analysis | workflows | Reactions +50 kN and fixed-end moment +125 kN·m, live |
| 3 | Create a new model | workflows (build-beam) | Project form → editor opens with SIMPUL: 0 |
| 4 | Edit geometry | workflows (build-beam) | Canvas node placement + placing a node on a member splits it (SIMPUL 2→3, ELEMEN 1→2). **Gap:** GESER SIMPUL drag-move is not covered (drag precision in headless canvas); recorded, not hidden |
| 5 | Change section/material | workflows (material edit) | MATERIAL library editor: b 300→400 mm via Ubah/Simpan; autosaved section's derived A becomes 200 000 mm²; reactions stay 6/4 (determinate statics) |
| 6 | Change support conditions | workflows (build-beam) | TUMPUAN tool: Sendi + Rol applied → status becomes TERTENTU |
| 7 | Change loading | workflows (build-beam) | BEBAN TITIK −10 kN placed on the mid node; autosave gains exactly 1 load |
| 8 | Re-run analysis | workflows (build-beam, material) | Analysis runs after each edit; the material test re-runs analysis post-edit and re-reads reactions |
| 9 | Display solver results | smoke + workflows | Ringkasan reaction panel values parsed and compared numerically |
| 10 | Invalid input handling | workflows (invalid JSON) | Malformed JSON import → "Berkas bukan JSON yang valid", no project opens, dashboard intact |
| 11 | Unstable model diagnostics | workflows (unstable) | Member with no supports: STATUS "TIDAK STABIL"; Analisis surfaces the failure text; no fabricated reactions |
| 12 | Save/reload | workflows (persistence) | Nodes built → autosave → page reload → "Buka editor (model saat ini)" restores SIMPUL: 2. Supported by the app (localStorage) — tested as-is, not invented |

## Method notes

- Engineering assertions never hardcode the app’s own fixture strings:
  sample reactions are statics; the from-scratch beam's expected
  reactions are **computed in-test from the autosaved model's actual
  node coordinates** (grid snapping decides the real span), tolerance
  0.06 kN against the parsed Ringkasan panel.
- Canvas interactions locate nodes through a mapper calibrated from
  the editor's own status-bar coordinate readout, because the view
  re-fits when panels open — fixed pixel fractions were tried and
  produced missed clicks (recorded during development).
- The smoke test's error-hygiene assertion was **strengthened** in
  Phase 6: the former Google Fonts failed-request exception was
  removed after font self-hosting; zero failed requests are now
  required.
