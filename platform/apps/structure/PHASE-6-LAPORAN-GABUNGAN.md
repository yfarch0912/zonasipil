# ZONASIPIL STRUCTURE — LAPORAN GABUNGAN PHASE 6

Release Hardening, Accessibility, E2E Expansion & Security Closure · 2026-11-01

Gabungan 7 dokumen Phase 6 dari `docs/`. Isi sama persis dengan berkas asalnya.

---

<!-- ===== docs/PHASE-6-BASELINE.md ===== -->

# Phase 6 — Baseline

Date: **2026-11-01** · Environment: Node v24.22.1, npm 10.9.4,
Playwright 1.64.1, Chromium Headless Shell 156.

| Check | Result |
|---|---|
| Suite | **222/222 PASS (26 files)** |
| Build + typecheck | PASS (6.30 s) |
| Lint | **33 problems: 6 errors, 27 warnings** (Phase 5 final state) |
| E2E | 1 spec, PASS at Phase 5 close (dashboard → sample 01) |
| `package.json` / lockfile | sha256 prefixes `bdb0a336bacb9c4f` / `b294dc3d153cb492`; dependency set unchanged since Phase 5 |
| Runtime external requests | **Exactly one source:** Google Fonts in `index.html` — `fonts.googleapis.com` CSS + `fonts.gstatic.com` files for Inter (variable 100..900) and JetBrains Mono (variable 100..800), plus two `preconnect` hints. A source-wide scan (`src/`, `index.html`) found no other external URL. |
| Original STRUKTURA | untouched: HEAD `77fd6e1bf537…`, only its pre-existing ` M docs/AUDIT_CYCLE.md` |
| Engine provenance | unchanged since Phase 2 (import-only differences) + Phase 5's two documented unused-import removals in design modules |

Baseline matches Phase 5 close-out exactly. No unexpected changes;
workstreams proceed.

---

<!-- ===== docs/PHASE-6-SECURITY-AUDIT.md ===== -->

# Phase 6 — Security Audit

Date: **2026-11-01** · Status: **NOT RUN / INCOMPLETE** (sixth
consecutive phase).

## Attempt record

- Command: `npm audit` at the project root.
- Node v24.22.1, npm 10.9.4, registry `https://registry.npmjs.org/`
  (default), lockfile sha256 prefix `b294dc3d153cb492` (unchanged since
  Phase 5).
- Result: `npm error audit endpoint returned an error`; log
  `~/.npm/_logs/2026-11-01T07_40_58_455Z-debug-0.log`.
- No alternative network or machine is available to this agent, and no
  "approved alternative" was designated by the user, so the audit could
  not be executed elsewhere. No TLS/registry setting was altered; no
  `audit fix` was run; no counts exist to report and none are
  fabricated.

## Consequence

Per the Phase 6 definition of done, **commercial release readiness
remains INCOMPLETE** while this is open. The one-step closure (user
side, any normal network): `npm audit` in a checkout of this tree with
the same lockfile, output filed as an addendum to this document.

---

<!-- ===== docs/PHASE-6-ACCESSIBILITY-AUDIT.md ===== -->

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

---

<!-- ===== docs/PHASE-6-E2E-COVERAGE.md ===== -->

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

---

<!-- ===== docs/PHASE-6-FONT-SELF-HOSTING.md ===== -->

# Phase 6 — Font Self-Hosting

Date: **2026-11-01** · Status: **PASS — the Google Fonts runtime
dependency is eliminated.**

## What the app requested before

`index.html` loaded, at runtime: `fonts.googleapis.com` CSS +
`fonts.gstatic.com` font files for **Inter (variable, wght 100..900)**
and **JetBrains Mono (variable, wght 100..800)**, plus two preconnect
hints. A source-wide scan confirmed this was the application's only
external runtime dependency.

## What was done

- **Source (authoritative):** the google/fonts GitHub repository —
  `ofl/inter/Inter[opsz,wght].ttf` and
  `ofl/jetbrainsmono/JetBrainsMono[wght].ttf`. Axes verified from the
  files themselves: Inter wght 100–900 (+ opsz 14–32), JetBrains Mono
  wght 100–800 — exactly the ranges the Google Fonts URL requested.
- **Licence:** both fonts are SIL Open Font License 1.1; the licence
  texts are stored next to the assets
  (`public/fonts/OFL-Inter.txt`, `public/fonts/OFL-JetBrainsMono.txt`),
  which the OFL permits/requires for redistribution.
- **Format:** converted locally to WOFF2 (fontTools): Inter 876 KB TTF
  → **351 KB**, JetBrains Mono 187 KB → **72 KB**. Stored in
  `public/fonts/` (served at `/fonts/…`, copied to `dist/` by the
  build — verified present in build output).
- **Wiring:** `@font-face` declarations at the top of
  `src/globals.css` (family names unchanged — Tailwind's
  `--font-sans: 'Inter', system-ui, sans-serif` and
  `--font-mono: 'JetBrains Mono', monospace` tokens and the canvas's
  `'JetBrains Mono'` label font resolve as before), `font-weight`
  ranges declared, `font-display: swap`, system fallbacks retained.
  The three Google Fonts lines were removed from `index.html`.
- **Typography appearance:** same families, same weight ranges; the
  only nuance is that the self-hosted Inter is the variable file with
  an optical-size axis (browsers apply the default instance), visually
  equivalent to what Google Fonts served for this usage.

## Verification (executed)

- E2E `workflows.spec.ts` › "no external runtime requests": a request
  listener over dashboard + editor + analysis records **zero** requests
  to non-local origins, and `document.fonts.check` confirms Inter and
  JetBrains Mono are actually loaded (not silently fallen back).
- The smoke test's failed-request assertion no longer needs its
  Google Fonts exception (removed; assertion stricter).
- Full gates after the change: suite 222/222, build PASS, E2E 14/14.

---

<!-- ===== docs/PHASE-6-LINT-REPORT.md ===== -->

# Phase 6 — Lint Remediation Plan

Date: **2026-11-01** · Baseline and final: **33 problems (6 errors,
27 warnings)** — unchanged in count. One finding class was created and
eliminated during this phase (see §3); no broad refactoring was done.

## 1. Classification of the remaining 33

| Class | Findings | Items | Plan |
|---|---|---|---|
| Critical correctness risk | **0** | — | None of the 33 can change a computed result; `src/engine/**` is finding-free |
| React hooks/state risk (errors) | 6 | `App.tsx` ×2 `react-hooks/immutability` (selection handlers used before declaration); `structural-canvas.tsx` ×4 `react-hooks/refs` (refs read during render) | **Separate UI-refactor workstream** (unchanged from Phase 5): reorder/hoist the App selection callbacks first (smaller blast radius), then re-plumb canvas render-time ref reads behind state/effects. Each step needs the E2E suite (now 14 tests) plus manual canvas verification. Not safe as a side-effect of a QA sprint |
| React hooks/state risk (warnings) | 7 | `exhaustive-deps` — App.tsx ×1 (same handler cluster), structural-canvas.tsx ×6 (label/scale deps in diagram callbacks) | Same workstream as above; fix together with the errors per file, not piecemeal |
| Maintainability / DX only | 20 | `react-refresh/only-export-components` across UI and report modules | Leave. Zero runtime effect; splitting ~15 files purely for fast-refresh granularity is churn without user benefit. Revisit if HMR pain is reported |
| Safe cleanup | 0 remaining | Phase 5 already removed the 4 zero-behaviour items (unused type imports ×3, dead eslint-disable ×1) | — |
| False positive / justified exception | 0 claimed | — | No finding is suppressed or reclassified as false without evidence |

## 2. What "done" looks like for the deferred workstream

1. App.tsx: move `handleSelectItems`/`handleDeselectItems`
   declarations above their first use (or convert the early consumer
   to a ref-stable dispatcher); verify selection flows via E2E +
   manual multi-select session.
2. structural-canvas.tsx: audit the 4 render-time ref reads; where the
   value is render-relevant, mirror it into state at write time;
   re-run diagram E2E + visual check.
3. Re-run lint after each file: expected end state ≤20 warnings
   (react-refresh only), 0 errors.

## 3. Incident recorded honestly (this phase)

The first version of the new `e2e/workflows.spec.ts` introduced 3 new
lint **errors** (`@typescript-eslint/no-explicit-any` ×3) — the eslint
config covers `e2e/`, and the Phase 2–5 baselines had no `any` there.
They were fixed by typing the autosave-model casts properly (no
suppression), returning the total to exactly 33. Separately, the
Phase 6 accessibility fix in `src/App.tsx` (Escape → flyout close) was
verified to add **zero** new findings.

---

<!-- ===== docs/PHASE-6-STATUS-MATRIX.md ===== -->

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
