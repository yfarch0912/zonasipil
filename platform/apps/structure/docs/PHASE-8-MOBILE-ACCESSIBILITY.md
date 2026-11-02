# Phase 8 — Mobile Accessibility

Date: **2026-11-01** · Evidence: `e2e/phase8.spec.ts` (tests B1–B3),
`e2e/mobile-a11y.spec.ts`. Status: **PASS** for B1/B2/B3 as scoped;
broader mobile WCAG conformance is not claimed.

## B1 — Status pill target (Phase 7 finding F7): FIXED

- Before: the STATUS button in the status bar measured 16 px tall.
- Change (`src/components/status-bar.tsx`): the button now carries
  `min-h-[24px] min-w-[24px] py-1 justify-center` — the 24×24 WCAG
  2.5.8 minimum — while the status bar keeps its single-line height
  and density (no other layout changed).
- Verified by measurement in the live editor: bounding box height
  and width both ≥24 px (phase8.spec B1). Keyboard focus reaches it
  as before (native button in tab order).

## B2 — Landscape advisory modal: dialog semantics implemented

- Before: a plain div (recorded in Phase 7), no semantics, no focus
  management, pointer-only in practice.
- Now (`src/App.tsx`): `role="dialog"`, `aria-modal="true"`,
  `aria-label="Saran tampilan layar"`, focus moves into the dialog
  on open, the previously focused element is remembered and focus is
  restored on dismissal, and **Escape dismisses** via the existing
  App-level keydown listener (no new listener added — the same
  dependable path Phase 7 established for the issues dialog).
  "Tetap Lanjutkan" behaviour unchanged.
- Verified (phase8.spec B2, Pixel 7 UA): dialog role/name/modal
  attribute present, `document.activeElement` inside the dialog on
  open, Escape hides it, editor usable afterwards.
- Note: this is not a full focus *trap* — while open, the modal is a
  gate with a single action; Tab can still reach background controls
  in the underlying editor. Recorded honestly; a trap is a small
  follow-up if a stricter pattern is wanted.

## B3 — Viewport retest: 320 / 412 / desktop

- 412 px (Pixel 7): dashboard no overflow; editor tabs scrollable;
  Data Tabel reachable by touch — PASS (mobile-a11y.spec).
- **320 px: a NEW defect was found and fixed (F8).** The samples
  grid's `minmax(300px, 1fr)` forced a 300 px track inside a 272 px
  content box, overflowing the dashboard ~28 px. Fixed to
  `minmax(min(300px, 100%), 1fr)`. After the fix: dashboard overflow
  ≤1 px at 320 px, and the Data Tabel tab is reachable by touch in
  the editor at 320 px (phase8.spec B3).
- Desktop: all other specs run at desktop widths; no overflow
  findings.
- Data Tabel's own controls measured ≥26 px (Phase 7), unchanged.
