# Phase 6 — Accessibility Audit

Date: **2026-11-01** · Method: automated checks against the production
build in a real browser (`e2e/accessibility.spec.ts`, 6 tests — all
PASS after the fixes in §3) + source inspection. Automated checks do
not cover everything; §4 lists what remains manual/NOT_EVALUATED.
Overall status: **INCOMPLETE** — no critical defect found, two defects
fixed, two findings remain open (F3, F4) and full screen-reader testing
was not performed.

## 1. Checks executed and results

| # | Check | Method | Result |
|---|---|---|---|
| 1 | Keyboard navigation | Playwright: Tab from dashboard reaches interactive controls | PASS |
| 2 | Visible focus indicator | Computed style of focused element (outline/box-shadow present within 12 Tab stops) | PASS |
| 3 | Semantic HTML / lang | `<html lang="id">` present (source); headings used on dashboard | PASS |
| 4 | Accessible labels | Programmatic scan: every button has an accessible name; every input/select/textarea is labelled (wrapping `<label>`, `label[for]`, or aria) | PASS **after fix F1** |
| 5 | Dialog focus handling | Dialogs are Radix primitives (focus trap, Escape, aria-modal by construction); the analysis-issues dialog has its own Escape handler (source) | PASS (by construction + source) |
| 6 | Escape-key behaviour (flyouts) | Playwright: open TUMPUAN flyout → Escape → panel dismissed | PASS **after fix F2** |
| 7 | Colour contrast (primary text) | Computed WCAG ratio of dashboard heading text vs effective background (#14213d on #f4f6fa ≈ 14:1) | PASS |
| 8 | Screen-reader announcements | Source scan: **no `aria-live` region exists** — see F3 | **FINDING (open)** |
| 9 | Reduced motion | Playwright with `prefers-reduced-motion: reduce`: dashboard + editor render fully | PASS |
| 10 | Responsive / zoom | Viewport meta no longer disables zoom — see F0; layout verified at desktop viewport only | PASS **after fix F0** (mobile viewport behaviour NOT_EVALUATED) |

## 2. Findings

- **F0 (fixed) — Zoom was disabled.** `index.html` viewport carried
  `maximum-scale=1, user-scalable=no`, blocking pinch/text zoom
  (WCAG 1.4.4 failure pattern). Severity: high for low-vision users.
- **F1 (fixed) — Two unlabelled inputs on the dashboard.** The project
  search input had only a placeholder; the hidden JSON file input had
  no accessible name. Severity: low–moderate.
- **F2 (fixed) — Tool flyouts did not close on Escape.** App-level
  Escape cleared the selection but left panels open. Severity:
  moderate (keyboard workflow).
- **F3 (OPEN) — No live regions.** Analysis completion, solver
  classification changes and save state are visual-only; a screen
  reader announces none of them. Recommendation: add an
  `aria-live="polite"` status region announcing analysis outcome and
  save state. Severity: moderate. Not fixed here: it requires deciding
  announcement content/frequency — a product decision, not a patch.
- **F4 (OPEN) — The canvas is not keyboard-operable.** Modelling
  (placing nodes/members/supports) is pointer-only; keyboard users
  cannot build models. This is an inherent limitation of the current
  canvas editor design; the data-table alternative that would address
  it does not exist. Severity: high for keyboard-only users, recorded
  honestly as a product limitation. Not a small fix — out of Phase 6
  scope, flagged for product planning.
- Canvas-drawn labels/diagrams have no text alternative (part of F4's
  scope); numerical results ARE available as text in the Ringkasan
  panel, which is the accessible path to results today.

## 3. Fixes applied (each isolated, regression-gated)

- **F0:** viewport meta → `width=device-width, initial-scale=1`
  (`index.html`).
- **F1:** `aria-label` added to the search input ("Cari proyek") and
  the file input ("Pilih berkas JSON untuk diimpor")
  (`src/struktura/StrukturaRoot.tsx`).
- **F2:** the existing App Escape handler now calls the pre-existing
  `handleCloseFlyout()` (which already included the handler's former
  selection-clearing behaviour) — `src/App.tsx`, one handler changed.
- Gates after fixes: suite 222/222, build PASS, lint unchanged 33,
  E2E 14/14 including the new assertions for F0/F1/F2 behaviour.

## 4. Not evaluated

Full screen-reader walkthrough (NVDA/JAWS/VoiceOver), mobile-viewport
and touch-target audit, contrast of every secondary/grey text and of
canvas-rendered diagram labels, and keyboard operability beyond the
dashboard/flyout flows (F4). These remain NOT_EVALUATED and are the
reason this audit is INCOMPLETE rather than PASS.
