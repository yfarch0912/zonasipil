# Phase 3 — Status Matrix

Date: 2026-11-01 · Workspace: `~/workspace/zonasipil-structure/`
Original STRUKTURA (`~/workspace/struktura/`): **untouched** — git status
identical at sprint start and end (branch
`feature/struktura-engineering-platform`, HEAD `77fd6e1`, only its
pre-existing ` M docs/AUDIT_CYCLE.md`).

| Workstream | Status | Implementation | Evidence | Commands / counts | Limitations |
|---|---|---|---|---|---|
| A. Baseline & integrity | PASS | Re-ran full baseline before edits; configs inspected | `docs/PHASE-3-BASELINE.md` | suite 206/206, build PASS, lint 37 (6e/31w) | Workspace is not a git checkout (state = file tree), as in Phases 1–2 |
| B. Sample-model audit | PASS (root cause found) | Traced sample 01 → `template1SimpleBeam` → `SECTION_DEFAULT`; reproduced with the real solver; closed-form checks | `docs/PHASE-3-SAMPLE-MODEL-AUDIT.md`; `investigation/sample01.probe.ts` | θ_solver 0.21787 rad = θ_analytical 0.21787 rad; reactions 6/4 kN exact; residual 2.6e-21 | **Fix not applied** (needs approval): I33 3.125e6 → 3.125e9 mm⁴ in `src/templates/examples.ts`; samples 01 AND 02 affected; E2E dialog assertion must change in the same approved fix |
| C. ρ vs κ₂(K) study | PASS (research) | Independent DSM assembly + Jacobi eigensolver, cross-checked against numpy SVD | `docs/PHASE-3-CONDITIONING-STUDY.md`; `investigation/conditioning.probe.ts` + `conditioning-data.json` | κ·ρ constant per family: 4.000 (truss, 2 DOF), 56.08 (frame, 5 DOF); estimators agree <1e-6 for κ≤1e10 | Correlation within ONE family; **not** calibration; no threshold changed; κ estimates degrade beyond ~1e12 |
| D. Dependency & licence audit | INCOMPLETE | Full transitive licence scan executed (277 pkgs); npm audit retried | `docs/PHASE-3-DEPENDENCY-LICENCE-AUDIT.md` | 0 GPL/AGPL/LGPL, 0 UNKNOWN licences; MPL-2.0 build-only flagged; npm audit: **NOT RUN** (endpoint error, exit 1) | Security audit remains environmentally blocked — the sprint's one unmet acceptance criterion |
| E. Test directory migration (Increment 2) | PASS | `tests/`+`benchmarks/` → `tests/{unit,regression,integration,benchmarks}`; vitest include updated | `docs/PHASE-3-TEST-ARCHITECTURE-MIGRATION.md` | 24 files before/after; 23 byte-identical + 1 path-token fix; suite 206/206; build PASS; lint 37; E2E PASS | — |

**Overall sprint: INCOMPLETE** — by the sprint's own rule: every
workstream's deliverable exists and is evidenced, but Workstream D's
security-audit acceptance criterion (`npm audit` executed) remains
blocked by the environment, exactly as in Phases 1–2. Everything else
is PASS. No engineering status changed: design subsets INCOMPLETE,
seismic UNVERIFIED, unsupported procedures UNSUPPORTED, utilisation
overlay NOT_EVALUATED.
