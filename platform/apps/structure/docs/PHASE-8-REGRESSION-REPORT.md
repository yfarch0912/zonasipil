# Phase 8 — Regression & Solver-Provenance Report

Date: **2026-11-01**

## Final gates (baseline → final)

| Gate | Phase 8 baseline | Final |
|---|---|---|
| Unit/regression suite | 222/222 | **222/222 PASS** — no test removed, weakened, or re-expected |
| Build + typecheck | PASS | PASS |
| Lint | 0 errors / 20 warnings | **0 errors / 20 warnings** (unchanged; all react-refresh DX warnings, deliberately not chased) |
| Playwright E2E | 25/25 | **32/32 PASS** (+7 in new `e2e/phase8.spec.ts`) |
| External runtime requests | zero | zero (smoke hygiene assertions green) |
| Lockfile | `b294dc3d153cb492` | **unchanged** — no dependency changes this phase |
| Engine provenance | import-lines only vs original | re-verified: `solver.ts` diff vs original = **0 lines** modulo imports; **no `src/engine/**` file was opened for edit in Phase 8** |
| Original STRUKTURA | HEAD `77fd6e1…`, ` M docs/AUDIT_CYCLE.md` | **identical** at close |

## Coverage of the required regression list

- Canvas ↔ Data Tabel share one model: distributed load created in
  Data Tabel survives Data→Canvas→Data switches via the shared
  autosave (phase8 C1); node-coordinate edits in Data Tabel were
  already proven to re-solve in Phase 7; canvas drag proven in
  Phase 7 (drag-move.spec) and still green.
- Distributed-load solver response: UDL −10 kN/m × 5 m SS beam →
  reactions exactly 25.000 kN both ends (closed-form wL/2), asserted
  from the UI-rendered result table, not from internals.
- Focus remains operable after add/edit/delete in Data Tabel
  (keyboard flows complete end-to-end; delete dialog returns focus
  to the editor heading).
- Modal open/close + focus restoration: advisory dialog (B2) and
  delete dialog (C4) both E2E-covered.
- Live announcements: success/failure/save-success/save-failure all
  covered (live-announcements.spec + phase8.spec).
- No browser errors in tested workflows: pageerror captured and
  asserted empty in C1; smoke spec asserts zero failed requests.

## Defects found by Phase 8 testing (all fixed)

1. **F7** status pill 16 px → 24×24 (B1).
2. Advisory modal lacked dialog semantics/focus handling (B2).
3. **F8** 320 px dashboard overflow from the samples grid's fixed
   300 px min track → `minmax(min(300px, 100%), 1fr)` (B3).
