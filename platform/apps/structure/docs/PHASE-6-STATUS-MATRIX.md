# Phase 6 — Status Matrix

Date: 2026-11-01 · Workspace: `~/workspace/zonasipil-structure/`
Original STRUKTURA: **untouched** (HEAD `77fd6e1…`, only its
pre-existing ` M docs/AUDIT_CYCLE.md`; verified at baseline and close).

| Workstream | Status | Key results |
|---|---|---|
| A. Baseline | PASS | 222/222, build PASS, lint 33 (6e/27w), lockfile hash `b294dc3d…` unchanged all phase; sole external dependency identified (Google Fonts) — `docs/PHASE-6-BASELINE.md` |
| B. Security audit | **NOT RUN / INCOMPLETE** | `npm audit` endpoint error, 6th consecutive phase; no alternative network available to the agent; no data fabricated — `docs/PHASE-6-SECURITY-AUDIT.md` |
| C. Accessibility audit | INCOMPLETE | 10 check areas executed (`e2e/accessibility.spec.ts`, 6 tests PASS): keyboard, focus visibility, semantics, labels, dialog construction, Escape, contrast, reduced motion, zoom. **3 defects fixed** (zoom disabled → meta corrected; 2 unlabelled inputs → aria-labels; flyouts ignored Escape → App handler now closes flyout). **2 findings open:** F3 no aria-live announcements; F4 canvas modelling is pointer-only (product limitation). Screen-reader walkthrough + mobile viewport NOT_EVALUATED — `docs/PHASE-6-ACCESSIBILITY-AUDIT.md` |
| D. E2E expansion | PASS | 1 → **14 browser tests**: all 12 mandated scenarios covered except GESER drag-move (recorded gap); from-scratch beam reactions asserted against statics computed from the actual autosaved geometry; smoke hygiene assertion strengthened (fonts exception removed) — `docs/PHASE-6-E2E-COVERAGE.md` |
| E. Font self-hosting | PASS | Inter + JetBrains Mono variable fonts from the authoritative google/fonts repo, SIL OFL 1.1 (licence texts shipped in `public/fonts/`), WOFF2 351 KB + 72 KB, `@font-face` in globals.css, Google Fonts links removed; E2E verifies **zero external requests** and both families loaded — `docs/PHASE-6-FONT-SELF-HOSTING.md` |
| F. Lint remediation plan | PASS (plan) | All 33 findings classified: 0 critical, 13 hooks-risk (deferred to a scoped UI-refactor workstream with steps defined), 20 DX-only. A self-inflicted +3 (new spec's `any` casts) was caught by the gate and fixed by proper typing — final count identical to baseline, no suppressions — `docs/PHASE-6-LINT-REPORT.md` |

**Final gates:** suite **222/222** (no test removed or weakened) ·
build + typecheck PASS · lint **33 (6/27)** = baseline · E2E **14/14**
(was 1/1) · external runtime requests **zero** · solver provenance
unchanged (no engine file touched this phase; the two app-shell edits
are the a11y fixes in `src/App.tsx` and `src/struktura/StrukturaRoot.tsx`,
plus `index.html` and `src/globals.css` for fonts) · lockfile unchanged.

**Sprint verdict: INCOMPLETE by its own definition of done** —
everything executable in this environment was executed and evidenced,
but (1) the security audit has still never run (endpoint), and
(2) accessibility carries two open findings (F3 live regions, F4
pointer-only canvas) plus unevaluated areas. Commercial release
readiness therefore remains **not fully cleared**. Engineering statuses
unchanged: design subsets INCOMPLETE, seismic UNVERIFIED, unsupported
procedures UNSUPPORTED, utilisation NOT_EVALUATED.
