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
