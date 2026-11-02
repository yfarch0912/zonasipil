# ZONASIPIL STRUCTURE — LAPORAN PHASE 4 (GABUNGAN)
Digabung dari 5 dokumen · 2026-11-01 · Koreksi SECTION_DEFAULT, tes regresi analitis, E2E, audit keamanan


---

<!-- FILE: docs/PHASE-4-BASELINE.md -->

# Phase 4 — Baseline

Date: **2026-11-01** · Captured before any Phase 4 edit.

## Source verification (against the Phase 3 audit)

`src/templates/examples.ts` is **unchanged** from the Phase 3 audit:

- `SECTION_DEFAULT = { id: "section", name: "penampang", E: 23500,
  I33: 3125000, A: 150000 }` — the inconsistent constant, exactly as
  reported (E/A match the 300×500 concrete beam; I33 is 1000× below the
  parametric `rc300x500` value 3 125 000 000 mm⁴ in `defaultSections`).
- Referenced **only** by `template1SimpleBeam()` and
  `template2Cantilever()` in the same file; no references elsewhere in
  `src/`. Both templates store it under key `section`, overriding
  nothing else.
- Template 02's load confirmed from source (not assumed): one member,
  fixed at x=−2.5, free at x=+2.5 (L=5 m), distributed load
  `mode: "local-axis", wStart = wEnd = −10 kN/m` (uniform).
- Other hand-written constants in the file: `SECTION_C30`
  (E=30000, I33=480 000 000, A=75 000 — no declared dimensions; used by
  one portal template) and `SECTION_COL500` (parametric, computed by
  `buildParametricSection` for an explicit 500×500 rect — self-consistent
  by construction).

## Baseline results (executed this session)

| Check | Result |
|---|---|
| Suite (`npm test`) | **206/206 PASS (24 files)** — includes benchmarks 21+8 |
| Build + typecheck (`npm run build`) | PASS |
| Lint (`npm run lint`) | **37 problems (6 errors, 31 warnings)** — Phase 3 baseline |
| E2E (`npm run test:e2e`) | **PASS** — the Phase 2/3 spec, which asserts the PHYSICALLY_IMPLAUSIBLE dialog for sample 01 (expected to change in Workstream D, after the fix) |
| Original STRUKTURA | untouched: branch `feature/…`, HEAD `77fd6e1`, only ` M docs/AUDIT_CYCLE.md` |

**Baseline matches Phase 3 close-out. The correction may proceed.**


---

<!-- FILE: docs/PHASE-4-SECTION-CORRECTION-REPORT.md -->

# Phase 4 — SECTION_DEFAULT Correction Report

Date: **2026-11-01** · Change: one numeric constant in one file.
Evidence basis: `docs/PHASE-3-SAMPLE-MODEL-AUDIT.md` (root cause proven
against closed-form solutions before any edit).

## The change

File: `src/templates/examples.ts` (the only source file modified).

```diff
 const SECTION_DEFAULT: StructureModel["sections"][string] = {
-  id: "section", name: "penampang", E: 23500, I33: 3125000, A: 150000,
+  // 300x500 concrete beam: A = 300*500 = 150000 mm^2, I33 = 300*500^3/12 =
+  // 3125000000 mm^4 (identical to the parametric rc300x500 in
+  // defaultSections). Phase 4 correction: I33 was 3125000 (1000x too
+  // small), which made templates 1-2 classify PHYSICALLY_IMPLAUSIBLE.
+  id: "section", name: "penampang", E: 23500, I33: 3125000000, A: 150000,
 }
```

| Property | Before | After | Basis |
|---|---|---|---|
| E | 23500 MPa | 23500 MPa (unchanged) | concrete, fc≈25 (4700√fc ≈ 23 500) |
| A | 150 000 mm² | 150 000 mm² (unchanged) | = 300 × 500 mm |
| **I33** | **3 125 000 mm⁴** | **3 125 000 000 mm⁴** | = 300·500³/12 mm⁴, and exactly the value the parametric `rc300x500` section (same model, same E/A) already carried |

Units verified against the engine convention (E: MPa, I: mm⁴, A: mm² —
`src/engine/model.ts`, all parametric sections). Why the old value was
inconsistent: with E and A fixing the section's identity as the 300×500
concrete beam, I33 was exactly 1000× below that section's geometric
second moment of area — a transcription/scale error, confirmed by the
Phase 3 analytical reproduction (solver rotation matched the
closed-form value for the *stored* EI to all printed digits).

## Templates affected

- `template1SimpleBeam()` (dashboard sample 01) — uses `SECTION_DEFAULT`.
- `template2Cantilever()` (dashboard sample 02) — uses `SECTION_DEFAULT`.
- Templates 3/4/5 unaffected (parametric or `SECTION_C30` sections).

## Numerical effect (solver, executed — see test evidence)

| Quantity | Before | After | Analytical (corrected EI) |
|---|---|---|---|
| T1 reactions Ry | 6 / 4 kN | 6 / 4 kN (unchanged — statics) | 6 / 4 kN |
| T1 θ at left support | −0.21787 rad | **−2.1787e-4 rad** | 2.178723e-4 rad |
| T1 δ at load point | −0.32681 m | **−3.2681e-4 m** | 3.268085e-4 m |
| T1 classification | PHYSICALLY_IMPLAUSIBLE | **VALID** | — |
| T2 tip rotation | −2.83688 rad | **−2.8369e-3 rad** | 2.836879e-3 rad |
| T2 tip deflection | (1000× the corrected value) | **−1.0638e-2 m** | 1.063830e-2 m |
| T2 classification | PHYSICALLY_IMPLAUSIBLE | **VALID** | — |
| Residuals | ~1e-21 | < 1e-8 (asserted in tests) | — |

All deformations scale by exactly 1/1000, as they must for a linear
solver when only I changes by 1000× — internal consistency proof that
nothing else moved.

## Provenance — solver untouched

- Full engine diff vs the original STRUKTURA `src/lib` (Phase 2 method):
  61 engine files checked; differences remain **import lines only**
  plus Phase 2's single documented type relocation. **Zero** Phase 4
  changes under `src/engine/`. No threshold, formula, or diagnostic was
  modified (`PIVOT_RATIO_*`, `ROTATION_IMPLAUSIBLE = 0.1`, etc. intact).
- `examples.ts` diff vs the original: import-path updates (Phase 2) +
  the I33 line + its comment. Nothing else.


---

<!-- FILE: docs/E2E-SMOKE-REPORT.md -->

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


---

<!-- FILE: docs/PHASE-4-SECURITY-AUDIT-ADDENDUM.md -->

# Phase 4 — Security Audit Addendum

Date: **2026-11-01** · Addendum to
`docs/PHASE-3-DEPENDENCY-LICENCE-AUDIT.md` (which remains unchanged as
the historical record).

## Retry result: NOT RUN (fourth consecutive phase)

- Environment: Node v24.22.1, npm 10.9.4, registry
  `https://registry.npmjs.org/` (default; no credentials or tokens are
  configured or were exposed).
- Command: `npm audit`.
- Outcome: the audit endpoint again returned an error
  (`npm error audit endpoint returned an error`; log
  `~/.npm/_logs/2026-11-01T06_24_21_551Z-debug-0.log`). No audit report
  was produced, so there are **no vulnerability counts to report** —
  by severity or otherwise.
- No TLS/registry security control was bypassed, no dependency was
  upgraded or removed, and the lockfile was not regenerated.

Status of the security-audit acceptance criterion: **NOT RUN /
INCOMPLETE** — an environmental block (the endpoint is unreachable from
this VM), unchanged since Phase 1. It must be executed from a network
where the endpoint answers before any commercial release. The licence
side of the audit is complete (Phase 3: 277 packages scanned, no
GPL/AGPL/LGPL, no undeclared licences) and is unaffected by this
addendum.


---

<!-- FILE: docs/PHASE-4-STATUS-MATRIX.md -->

# Phase 4 — Status Matrix

Date: 2026-11-01 · Workspace: `~/workspace/zonasipil-structure/`
Original STRUKTURA (`~/workspace/struktura/`): **untouched** — git status
identical at sprint start and end (only its pre-existing
` M docs/AUDIT_CYCLE.md`).

| Workstream | Status | Evidence | Actual results |
|---|---|---|---|
| A. Baseline | PASS | `docs/PHASE-4-BASELINE.md` | Suite 206/206, build PASS, lint 37 (6e/31w), E2E PASS (old expectations); source verified identical to Phase 3 audit |
| B. SECTION_DEFAULT correction | PASS | `docs/PHASE-4-SECTION-CORRECTION-REPORT.md` | One value changed: I33 3 125 000 → 3 125 000 000 mm⁴ in `src/templates/examples.ts` (+ explanatory comment). Templates 01 & 02 affected; solver/thresholds untouched (engine provenance diff: import-only, as Phase 2) |
| C. Analytical regression tests | PASS | `tests/regression/phase4-sample-templates.test.ts` (10 tests) | T1: reactions 6/4 kN, θ & δ within 1% of closed form (near-exact in practice), VALID, residual <1e-8. T2: Ry=50 kN, |Mz|=125 kN·m, tip θ/δ within 1%, VALID. Guard: hand-written `section` ≡ parametric `rc300x500` (E/A/I33); rectangular formula verified where dims are explicit; SECTION_C30 finite/positive only (dims undeclared — ambiguity recorded, not guessed) |
| D. Playwright E2E update | PASS | `e2e/smoke.spec.ts`; `docs/E2E-SMOKE-REPORT.md` (Phase 4 section appended, history preserved) | No PHYSICALLY_IMPLAUSIBLE dialog for sample 01; reactions +6/+4 kN still asserted from the live solver; error hygiene unchanged (Fonts exclusion documented) |
| E. Security audit retry | **NOT RUN** | `docs/PHASE-4-SECURITY-AUDIT-ADDENDUM.md` | `npm audit` endpoint error again (Node v24.22.1 / npm 10.9.4); no report produced; nothing upgraded or removed |
| Full regression gates | PASS | this matrix + reports | **Suite 216/216 (25 files)** = 206 baseline + 10 new; benchmarks 21+8 PASS inside the suite; build + typecheck PASS; lint **37** identical; E2E PASS. No test removed or weakened; no expected value changed (new tests use independent closed forms) |

**Overall sprint: the correction workstreams (A–D + gates) are PASS.
The security-audit criterion remains NOT RUN / INCOMPLETE** for the
same environmental reason as Phases 1–3, reported separately rather
than folded into a single overall status. Engineering validation
statuses unchanged: design subsets INCOMPLETE, seismic UNVERIFIED,
unsupported procedures UNSUPPORTED, utilisation overlay NOT_EVALUATED.
No SNI status was upgraded by this sprint.
