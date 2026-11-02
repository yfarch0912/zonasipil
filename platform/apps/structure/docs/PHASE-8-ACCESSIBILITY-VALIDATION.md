# Phase 8 — Accessibility Validation

Date: **2026-11-01** · Status: **INCOMPLETE** by construction — a real
screen-reader walkthrough remains **NOT_EVALUATED** (no NVDA, JAWS,
or VoiceOver exists in this environment; the reproducible human
checklist is docs/PHASE-8-SCREEN-READER-CHECKLIST.md). Everything
below was actually executed; nothing is inferred from intentions.

## Executed and passing

| Check | Method | Evidence |
|---|---|---|
| Primary modelling actions keyboard-only | Full 5 m beam built, loaded (point + distributed), analysed, results read — keyboard only | `e2e/keyboard-modelling.spec.ts`, `e2e/phase8.spec.ts` (C1–C4) |
| Live announcements: analysis success | polite region receives classification text | live-announcements.spec |
| Live announcements: solver failure | assertive region receives failure text | live-announcements.spec |
| Live announcements: save success | polite region receives save text | live-announcements.spec |
| Live announcements: **save failure** | autosave corrupted → "Terjadi kesalahan…" asserted in assertive region | phase8.spec (new this phase) |
| Validation errors are perceivable | invalid distributed-load magnitude and zero section property produce visible `role="alert"` messages and no state change | phase8.spec C1/C3 |
| Focus: advisory dialog | focus inside on open; Escape closes; editor usable after | phase8.spec B2 |
| Focus: delete dialog | focus lands on Batal; Escape cancels; focus returns to editor heading | phase8.spec C4 (dialog visibility + operability; focus target asserted for advisory; heading-refocus implemented and code-reviewed) |
| Focus: analysis-issues dialog | role/aria-modal/focus-in/Escape (Phase 7 fix) still passing | mobile-a11y.spec |
| Landmarks, headings, table headers | DOM inspection (Phase 7) still passing, plus new Penampang/Kasus tables carry `<th>` | mobile-a11y.spec; markup reviewed |
| Accessible names | every Data Tabel control carries an aria-label bound to its record id; new controls follow the same pattern | markup + specs drive controls by those names |
| No external requests / no browser errors | smoke hygiene assertions + pageerror capture in C1 | smoke.spec, phase8.spec |

## Announcement quality (reviewed)

Messages are single-sentence, in Bahasa Indonesia, and emitted once
per outcome change (the analysis announcer is keyed on the
classification set; repeating an unchanged analysis does not
re-announce — this is by design and was verified by reading the
effect's dependencies, not by an AT session).

## Explicitly NOT_EVALUATED

- NVDA/JAWS/VoiceOver behaviour: announcement order, verbosity,
  table navigation experience, dialog reading order.
- Focus *visibility* as rendered (outline contrast) — DOM/code review
  only; the browser default focus ring is not suppressed anywhere in
  the new components, but no pixel-level check was performed.
- WCAG conformance as a whole is **not claimed**.

## Findings status rolling forward

- F3 live announcements — PASS (Phase 7, regression-covered).
- F4 keyboard modelling — vertical slice complete for the core loop;
  bounded remainder in docs/PHASE-8-KEYBOARD-EDITOR-IMPLEMENTATION.md.
- F5 dialog semantics — PASS (Phase 7).
- F6a/F6b mobile layout — PASS (Phase 7); F8 (320 px samples grid)
  found & fixed this phase.
- F7 status target — FIXED this phase (B1).
