# Phase 2 — Playwright E2E Smoke Report

Date: **2026-11-01** · Result: **PASS** (1 test, real browser)
Environment: Node v24.22.1 · Playwright **1.64.1** (Apache-2.0, dev-only
dependency) · Chromium Headless Shell **156.0.8078.4** · app served from
the production build via `vite preview` on 127.0.0.1:4317 (port 4173 was
occupied by an unrelated local service; the config uses 4317).
Files: `config/playwright.config.ts`, `e2e/smoke.spec.ts`, run with
`npm run test:e2e`. No production APIs; the app is fully client-side.

## Scenario and assertions (all verified in the browser)

1. Dashboard loads; title `ZonaSipil Structure …`; sample catalogue
   heading and sample 01 card visible.
2. "Muat contoh" on sample 01 → editor opens (Simpan proyek visible;
   status bar SIMPUL: 3, ELEMEN: 2 — the template's real model).
3. Analisis tab → the analysis **actually runs**: the app's own
   diagnostics dialog appears classifying the run
   **PHYSICALLY_IMPLAUSIBLE** ("Hasil analisis TIDAK MASUK AKAL SECARA
   FISIK", rotation ≈0.218 rad at n1 > 0.1 rad). The test asserts this
   dialog — it is the visible proof that solver + conditioning
   diagnostics executed, and the test dismisses it via its Tutup button
   rather than bypassing it.
4. Reaction panel ("Ringkasan" toggled on) renders **Ry = +6 kN** at the
   left support and **Ry = +4 kN** at the right support. These are the
   statics of the template (10 kN at 2 m on a 5 m span: 10·3/5, 10·2/5),
   produced by the live solver in the browser from `analysisResult` —
   no fixture or shortcut feeds the panel.
5. Error hygiene: zero `pageerror`s; zero HTTP ≥ 400 responses; zero
   failed requests **except** the external Google Fonts stylesheet,
   which this sandbox's proxy blocks (`ERR_TUNNEL_CONNECTION_FAILED`)
   and which the app tolerates via font fallback. That exclusion is
   written into the test with its reason, not silently filtered.

## Findings surfaced by the E2E (recorded, not fixed in this phase)

- **F-E2E-1 (product behaviour, arguably correct-by-design):** sample 01
  as shipped cannot present "clean" results in the editor — its stored
  default section (`E=23500, I33=3.125e6` in the template's units) makes
  the beam so flexible that the R-11 plausibility guard fires. The
  documented "expected reactions 6/4 kN" remain numerically right (they
  are statics), and the panel does show them after the user acknowledges
  the warning. Whether the *template's section* should be stiffer is an
  engineering-content decision for the product owner — Phase 2 does not
  change templates, thresholds, or the guard.
- The app requests Google Fonts at runtime (external dependency of the
  page). Noted for the Anti-Slop/self-hosting backlog; not changed here.

## Dependency note (Phase 2 §9)

`@playwright/test@1.64.1` — Apache-2.0, **devDependency only**, adds no
runtime bundle bytes (verified: production build output unchanged in
composition; browsers live under `~/.cache/ms-playwright`, outside the
project). Transitive: playwright + playwright-core (Apache-2.0).
Purpose: this E2E suite only. `test-results/` added to `.gitignore`.

---

## Phase 4 update (2026-11-01) — corrected sample, updated expectations

The Phase 4 section correction (`docs/PHASE-4-SECTION-CORRECTION-REPORT.md`)
fixed the root cause recorded above as F-E2E-1: sample 01's stored
section was 1000× too flexible. The E2E spec was therefore updated
**after** the new analytical regression tests
(`tests/regression/phase4-sample-templates.test.ts`) established the
corrected behaviour:

- The Analisis tab no longer raises the PHYSICALLY_IMPLAUSIBLE dialog
  for sample 01 — the spec now asserts its absence (`PHYSICALLY_IMPLAUSIBLE`
  text count = 0) **and** keeps asserting the meaningful solver output:
  the reaction panel still renders **Ry +6 kN / +4 kN** from the live
  run. The diagnostics system itself is untouched and remains covered
  by the unit/regression suites (its dialog still appears for genuinely
  implausible models — e.g. the Phase 2 reproduction family).
- Result: **PASS** (1 test; dashboard → sample 01 → Analisis → reactions,
  production build, Chromium Headless Shell 156).
- Finding F-E2E-1 is thereby **resolved** (fixed at the data level, not
  by weakening any diagnostic). The Google Fonts runtime request noted
  in Phase 2 remains as-is (documented exclusion in the spec).
