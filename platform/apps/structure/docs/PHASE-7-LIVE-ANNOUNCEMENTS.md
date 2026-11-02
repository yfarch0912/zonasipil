# Phase 7 — Accessible Live Announcements (F3 resolved)

Date: **2026-11-01** · Status: **PASS** for the implemented scope —
verified by `e2e/live-announcements.spec.ts` (4 tests, all PASS).

## Implementation

- `src/shared/announce.ts` — a tiny announcement bus
  (`announceStatus(text, priority)` dispatching a window event).
- `src/shared/live-announcer.tsx` — `LiveAnnouncer`: a polite region
  (`aria-live="polite"`, `role="status"`) and an assertive region
  (`aria-live="assertive"`, `role="alert"`), both `sr-only`, mounted
  once by `StrukturaRoot` in **both** dashboard and editor views, so
  the regions exist before any update can occur. The listener
  clear-then-sets text (40 ms) so a repeated identical message is
  still announced.
- Producers:
  - **App (analysis outcomes):** an effect keyed on the classification
    set / failure reason of `caseResults`. Solver failure →
    assertive, announced wherever it occurs (Analyze/Design tabs,
    where results exist). Completed analysis → polite, announced when
    the outcome completes on the Analyze tab or the user enters it.
    Non-VALID classifications that make results untrustworthy
    (PHYSICALLY_IMPLAUSIBLE, NUMERICALLY_UNRELIABLE) escalate to
    assertive. Language: Bahasa Indonesia, e.g. "Analisis selesai.
    Klasifikasi: valid." / "Analisis gagal. …".
  - **StrukturaRoot (save + root errors):** successful
    `handleSaveToProject` → polite "Proyek berhasil disimpan."; any
    root error state (save/report/import failures) → assertive
    "Terjadi kesalahan: …" via an effect on the error state.

## Decisions recorded

- **"Analysis started" is not announced.** The solve is
  synchronous/derived in this app; a start message would be replaced
  by the outcome within the same tick, producing noise without
  information. The evaluated alternative (announce on tab entry) is
  what the completion-on-entry announcement already covers.
- **No announcements while modelling on the Model tab for successful
  solves** — `caseResults` only exists on Analyze/Design tabs, and
  re-solves during editing would spam the region. The classification
  key guard also suppresses repeat announcements when a re-solve
  yields the same outcome.
- **Empty models are excluded:** a model with no members has nothing
  to analyse, so its solver failure is not announced (it is not an
  event, and announcing it on every new project would train users to
  ignore the assertive channel).
- No fabricated success: announcements fire only from the actual
  success/failure branches of the save handler and solver results.

## Tests

`e2e/live-announcements.spec.ts`: regions present and empty at first
paint; sample 01 → Analisis announces completion + "valid" politely;
unstable model → entering Analisis announces "Analisis gagal."
assertively; Simpan proyek announces save completion politely.
