# Phase 7 — Mobile & Screen-Reader Validation

Date: **2026-11-01** · Status: **INCOMPLETE** — the checks below were
executed and two real defects were found and fixed, but a genuine
screen-reader walkthrough remains NOT_EVALUATED (see §4).
Evidence: `e2e/mobile-a11y.spec.ts` (5 tests, all PASS).

## 1. Mobile viewport (Pixel 7 emulation, 412×915, touch)

- **F6a — dashboard horizontal overflow: FOUND & FIXED.** The
  dashboard rendered 491 px wide on a 412 px viewport (new-project
  form locked to 3 columns; project header row unwrappable with a
  fixed 220 px search field). Fixed in StrukturaRoot using the
  existing `useIsMobile` hook: the form goes single-column and the
  header row wraps with a full-width search field on mobile. Verified:
  page-level overflow now ≤1 px.
- **F6b — editor tabs unreachable on mobile: FOUND & FIXED.** The
  NavBar's absolutely-centred tab group placed the (new) Data Tabel
  tab at x=416 px — outside the viewport, with no scroll container.
  On mobile the group is now an in-flow, horizontally scrollable
  strip with compact padding and the wordmark hidden. Verified by
  tapping through to the Data Tabel tab in the test.
- **Advisory modal (by design, recorded):** the editor opens behind a
  full-screen "Lebih Baik di Layar Lanskap atau PC Desktop" modal
  with a "Tetap Lanjutkan" dismissal. It is a plain div without
  dialog semantics (same class as F5); not changed in this phase —
  recorded here so the gap is explicit. The Data Tabel view gives
  phone users a workable path once past it.
- **Touch targets (WCAG 2.5.8):** Data Tabel's own controls measure
  ≥26 px — PASS. **F7 (open):** the status-bar STATUS pill button is
  16 px tall, below the 24 px AA minimum. Left open deliberately:
  the status bar's density is a product-wide design decision, not an
  isolated defect; recorded for a future chrome pass.
- **Narrow/zoom proxy:** at 320 px width (roughly 200% zoom of a
  small phone) the dashboard remains operable; the Phase 6 viewport
  fix (zoom not disabled) still holds.

## 2. Screen-reader semantics (DOM inspection)

- Landmarks: dashboard has `header`; editor has `nav`, exactly one
  `main`, and `aside` — PASS.
- Data Tabel tables expose real `<th>` header cells (≥3 per table) —
  PASS.
- **F5 — analysis-issues dialog semantics: FOUND & FIXED.** The
  dialog was a plain div: no `role="dialog"`, no `aria-modal`, focus
  never moved into it. It now carries role/aria-modal/aria-label and
  focuses itself on open (verified: document.activeElement is inside
  the dialog).
- **Escape reliability (found during F5 verification):** real
  keydowns reached App-registered window listeners but the dialog's
  own subscription was not reliably live — its effect re-subscribes
  on every render because App passes an inline `onClose`, and
  listener-registry instrumentation showed add/remove churn with the
  subscription absent at rest. Escape-to-close is now also handled in
  App's existing window keydown listener (state-local, dependable);
  verified end-to-end by the test.
- Live regions (F3, Workstream C) verified separately in
  `e2e/live-announcements.spec.ts`.

## 3. Canvas alternative navigation

The Data Tabel tab (Workstream D) is the canvas alternative: full
modelling loop operable by keyboard, results as text tables
(`e2e/keyboard-modelling.spec.ts`).

## 4. NOT_EVALUATED — stated plainly

**No NVDA, JAWS, or VoiceOver session was executed** — those tools
are not available in this environment, and nothing in this document
should be read as screen-reader verification. What exists is DOM
semantics inspection, focus behaviour, live-region behaviour, and
keyboard operability, all exercised in a real browser. A human
screen-reader walkthrough (NVDA + Chrome at minimum) remains the
outstanding validation step before any "accessible" claim.
