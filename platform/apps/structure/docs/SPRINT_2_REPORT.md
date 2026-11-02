# STRUKTURA — SPRINT 2 REPORT
## Numerical Trust, Verdict Integrity & Engineering Verification

**Date:** 2026-10-31 · **Mode:** user-approved remediation sprint (SPRINT 2
MASTER EXECUTION PROMPT, 22:46 WIB) · **All work local** on branch
`feature/struktura-engineering-platform`. **No push, no deployment.**
Sprint 3 was NOT started.

---

## 1. Actual Git state — before and after

| | Before | After |
|---|---|---|
| Branch | `feature/struktura-engineering-platform` | same |
| HEAD | `327f187` (Cycle 26, Sprint 1 close-out) | `96445d9` (+ this docs commit) |
| Working tree | clean (verified at §0) | clean after every commit |
| Tests | 143/143 (17 files) | **196/196 (22 files)** |
| Build | PASS | PASS (`tsc -b` strict + vite) |
| Lint | 37 problems (6 errors / 31 warnings) | **37 (6 / 31) — rule-level set identical** (JSON diff vs a pre-sprint baseline capture: zero new, zero removed) |

Sprint commits (oldest first):

| SHA | Subject |
|---|---|
| `294c5f7` | Sprint 2 (P1, R-11): numerical conditioning & plausibility diagnostics |
| `b6417b8` | Sprint 2 (P2, R-06): unified verdict taxonomy |
| `8e0f5b8` | Sprint 2 (P3+P4): demand-integrity propagation + report integrity |
| `4484ad6` | Sprint 2 (P5): end-to-end integration coverage over the real pipeline |
| `96445d9` | Sprint 2 (secondary): R-04 fingerprint recompute + R-08 citation cleanup |

## 2. Files changed

29 files, +2111 / −45 lines (implementation commits). Principal items:

- **Solver/diagnostics:** `src/lib/solver.ts` (+263: NumericalDiagnostics,
  equilibrated-pivot + residual + plausibility computation),
  `src/lib/analysis-diagnostics.ts` (+106: `numerical-reliability` issue
  kind + `mergeNumericalDiagnostics`), `src/lib/analysis-pipeline.ts`
  (+80: metadata propagation), `src/App.tsx` (merge chain wiring),
  `src/components/analysis-issues-dialog.tsx` (messages).
- **Verdict taxonomy:** `src/lib/design/core/verdict.ts` (new, 247 lines),
  `src/lib/design/core/types.ts` (`Verdict`/`VerdictStatus`, optional
  `verdict` on member + run results), `src/lib/design/core/run-design.ts`
  (verdict attachment), `src/components/design-issues-panel.tsx`.
- **Report integrity:** `src/struktura/service-result.ts`,
  `src/struktura/report.ts`, `src/struktura/StrukturaRoot.tsx`.
- **Secondary:** `src/struktura/projects.ts` (R-04); comment-only R-08
  corrections in 10 source files + a repository note in
  `docs/DESIGN_RC.md`.
- **Tests (new):** `tests/sprint2-conditioning.test.ts` (10),
  `tests/sprint2-verdict.test.ts` (20), `tests/sprint2-integrity.test.ts`
  (9), `tests/sprint2-integration.test.ts` (8), `tests/sprint2-secondary.test.ts`
  (5); B12 in `benchmarks/solver-benchmarks-2.test.ts` gained a diagnostics
  test (numbers unchanged). Total new: 53.

## 3. Risk disposition table

| ID | Disposition | Evidence |
|---|---|---|
| **R-11** conditioning/plausibility guard (was open, Medium) | **FIXED** | §4 below; B12 now classified PHYSICALLY_IMPLAUSIBLE everywhere it surfaces; tests in `tests/sprint2-conditioning.test.ts` |
| **R-06** no unified verdict taxonomy | **FIXED** | §5; `verdict.ts`; 20 taxonomy tests + pipeline integration |
| **R-04** stale fingerprint trusted on import (= C18-F1) | **FIXED** | `importProjectJSON` always recomputes; 3 regression tests |
| **R-05** one-click report is service-level only | **MITIGATED to Sprint-2 scope** | Semantics deliberately UNCHANGED (per prompt §4); scope/title/warnings/conclusion made unmistakable (§7). A factored design report remains a future product decision, not a defect fixed here |
| **R-08** dangling `validation/*.mts` citations | **FIXED** | Every citation in `src/` now states the file is NOT shipped here; guard test; docs note in DESIGN_RC.md |
| R-01 unverified AISC 341 constants | **CONTAINMENT UNCHANGED** | No constant touched; Sprint 1 seismic tests still pass; the taxonomy now also caps steel-seismic members at UNVERIFIED |
| R-02 / R-03 / R-07 (Sprint 1) | Unchanged, regression-covered | Full suite green |
| C15-F1 (latent ghost-term drop) | Superseded | The drop is always audited (R-03) and the metadata now propagates through envelope/service/report (P3) |
| **NEW-1** (found this sprint) | ILL_CONDITIONED as a *primary* classification has no reproducing model in this solver's model class (measured — §4.4) | Documented limitation; the band + flag are implemented and exercised, precedence is unit-tested |
| **NEW-2** | Diagnostics cost: one extra O(n³) equilibrated elimination per solve | Accepted for this app's model sizes; noted in §10 |

## 4. Numerical diagnostic architecture (P1 — R-11)

### 4.1 Investigation before thresholds

The solver's arithmetic was NOT changed. `gaussSolve`, assembly, FEF and
recovery are byte-identical; B12's raw rotation is still exactly
**281250 rad**, equilibrium still exact. What was added is a
post-solve classification computed from the BC-modified system actually
solved. Before choosing any threshold, candidate models were measured
with a throwaway probe (deleted after use); the pinned values in the
tests come from that probe with their derivations stated inline.

Three INDEPENDENT signals (no single one suffices — B12 passes two):

1. **Equilibrated pivot ratio ρ** — a copy of K is symmetrically
   equilibrated (K̂ = D^(−1/2) K D^(−1/2), D = diag K) and eliminated
   with partial pivoting; ρ = min|pivot|/max|pivot|. Equilibration makes
   ρ invariant to the EA/L vs EI/L³ vs EI/L unit contrasts that defeated
   a global-max-diagonal test (the v1.0.6 gaussSolve note). Bands, tied
   to double precision (ε ≈ 2.2×10⁻¹⁶): ρ < 1e-12 →
   NUMERICALLY_UNRELIABLE (fewer than ~4 significant digits can survive);
   ρ < 1e-8 → ILL_CONDITIONED (up to half the working precision may be
   lost). **Limitation, stated in the code:** ρ is a pivot-based
   indicator, not the true 2-norm condition number (which needs an SVD
   or inverse iteration); a small ρ proves trouble, a healthy ρ does not
   prove a small κ.
2. **Relative residual** ‖Kd − F‖∞ / (‖K‖∞·‖d‖∞ + ‖F‖∞); > 1e-8 →
   NUMERICALLY_UNRELIABLE (a backward-stable solve leaves this ~n·ε).
3. **Rotation plausibility** — the formulation is first-order
   (sin θ ≈ θ, error θ²/6). |θ| or member chord rotation > **0.1 rad**
   (≈5.7°, linearization error > 1.7×10⁻³, beyond the project's 0.1 %
   verification tolerance) → PHYSICALLY_IMPLAUSIBLE; > **0.02 rad** →
   `large-rotation` flag only. These are evidence-classification bounds,
   not clamps: raw displacements are returned untouched.

Classification precedence (worst wins): NUMERICALLY_UNRELIABLE >
PHYSICALLY_IMPLAUSIBLE > ILL_CONDITIONED > VALID. Diagnostics identify
the affected location: `maxAbsRotation` (node), `maxChordRotation`
(member), `worstDofs` (up to 3 DOFs with smallest equilibrated pivot
ratios, node + direction).

### 4.2 Measured evidence (probe, then pinned in tests)

| Model | ρ | rel. residual | max |θ| | Classification |
|---|---|---|---|---|---|
| B7 SS beam (reference) | 0.375 | 2.1e-18 | 0.00675 | VALID |
| Portal (B13 model) | 0.041 | 9.0e-17 | 0.0041 | VALID |
| **B12** (I×1e-8 span) | **0.5** | **3.4e-26** | **281250** | **PHYSICALLY_IMPLAUSIBLE** |
| Small-but-valid (I×1e-4, load×1e-4) | 0.375 | ~1e-22 | 0.00675 | VALID (response identical — stiffness magnitude alone flags nothing) |
| Large-but-legitimate cantilever (δ/L = 1/20) | 0.25 | 1.1e-18 | 0.0667 = wL³/6EI exactly | VALID + `large-rotation` |
| Alternating stiff/soft spans, soft ratio 1e-4 / 1e-5 / 1e-6 | 1.57e-4 / 1.57e-5 / 1.57e-6 | ~1e-18 | 56 / 563 / 5625 | PHYSICALLY_IMPLAUSIBLE (+ρ degrades linearly with the ratio) |
| Alternating, soft ratio 3e-9 | ≈4.7e-9 (in the ill-conditioned band) | — | ~1.9e7 | PHYSICALLY_IMPLAUSIBLE + `ill-conditioned` flag |
| Three-roller beam (true mechanism) | — (no solve) | — | — | solver failure `Singular stiffness matrix`, singularDof = (n3, u) |

### 4.3 Perturbation sensitivity (measured, not assumed)

- Reference SS beam: 1e-6 relative load AND stiffness perturbations →
  response changes 1.0e-6 relative (amplification ≈ ×1).
- Alternating family and B12: the same perturbations also amplify ≈ ×1
  in RELATIVE terms — the floppy member's θ changes by ≈1e-6 relative
  when its I is perturbed by 1e-6. **Conclusion recorded in the tests:**
  B12's pathology is a plausibility failure, not numerical sensitivity —
  the linear solve is componentwise tame; the answer is meaningless
  because 2.8×10⁵ rad violates the small-angle assumption. This is the
  measured justification for classifying by plausibility, and for
  keeping ILL_CONDITIONED a caution class rather than a failure class.

### 4.4 Honest limitation (NEW-1)

In this solver's model class, a *primary* ILL_CONDITIONED classification
(ρ in band with plausible rotations) was not reachable in any probed
model family: weakly-restrained DOFs are exactly the ones whose response
explodes, so plausibility fires first and the band appears as a flag
alongside it (asserted at soft ratio 3e-9). The classification, band and
precedence are implemented and unit-exercised; the missing item is a
reproducing model for the primary class. Recorded, not hidden.

### 4.5 User visibility

`mergeNumericalDiagnostics` folds the worst classification into the
diagnostics report: error severity (IMPLAUSIBLE / UNRELIABLE) forces
status **unstable** — a result that cannot be trusted must not present
under a determinate label (the Cycle-12 precedent) — and the issues
dialog names the classification, the measured rotation/pivot ratio and
the node/DOF. Warning severity (ILL_CONDITIONED, large-rotation) leaves
status alone.

## 5. Verdict taxonomy and precedence (P2 — R-06)

Statuses (definitions in `types.ts`): **PASS** (evaluated, passed,
verified provisions) · **FAIL** (evaluated, failed) · **INCOMPLETE**
(required input/case/combination missing or failed) · **UNVERIFIED**
(depends on unverified provisions) · **UNSUPPORTED** (required check
outside implemented scope) · **NOT_EVALUATED** (not performed).

Precedence (worst wins): FAIL > INCOMPLETE > UNSUPPORTED > UNVERIFIED >
NOT_EVALUATED > PASS. Rationale documented in `verdict.ts`: FAIL is the
most decision-relevant and the safe direction (a member failing on
partial demands is FAIL, never PASS, with incompleteness preserved in
reasons); INCOMPLETE next because it voids the determination itself.

Implementations (`src/lib/design/core/verdict.ts`):

- `combineVerdicts` — worst status, all reasons preserved; an EMPTY
  rollup is NOT_EVALUATED (missing checks can never default to PASS).
- `memberVerdict` — rollup of the member's own channels (zone
  flexure/shear, dimension checks, column interaction/shear/confinement/
  SCWB, steel interaction/shear, steel seismic via `seismicVerdict`);
  `demandsIncomplete` contributes INCOMPLETE; `not-implemented` /
  `not-designable` → UNSUPPORTED; `no-result` → NOT_EVALUATED;
  `axial-exceeded` → FAIL.
- `seismicVerdict` — pass → **UNVERIFIED** (R-01 constants), fail →
  FAIL. A steel member with seismic checks can therefore never be a
  verified PASS (integration-tested on a real IMF steel run).
- `jointVerdict` — RC joints PASS/FAIL; steel E3.4a joints route
  through `seismicVerdict` via the existing `verification` marker.
- `designRunVerdict` — members + joints + run-level completeness
  (failed cases, skipped/incomplete combos, missing/partial gravity
  combo). PASS is issued only when the full combination is PASS; never
  inferred from a subset (tested: one UNSUPPORTED member blocks a run
  of PASS members).
- `analysisVerdict` — maps the P1 classification onto the same
  language: VALID → PASS, ILL_CONDITIONED → UNVERIFIED,
  PHYSICALLY_IMPLAUSIBLE / NUMERICALLY_UNRELIABLE / SINGULAR → FAIL
  (reason states the result is not usable evidence).

Rollup is lossless: check-level D/C fields remain the primary record;
verdicts add `reasons` with provenance. Status semantics live in the
data, not in colours (rule 8) — presentation layers map them.

Wiring: `designFromCases` attaches `member.verdict` (computed AFTER the
SCWB post-pass, whose member mutations it must reflect) and
`result.verdict`, including on both early-return paths.
`DesignIssuesPanel` prints the run verdict whenever it renders.
**Stated limit:** the panel renders only for issue-bearing runs, so a
clean run's PASS verdict is present in the result data (and asserted by
tests) but has no dedicated always-on UI chip yet.

## 6. Combination-consumer audit (P3)

Every call site of `combineResults` / `auditCombination` /
`envelopeResults` and every downstream consumer of their products,
inspected in the actual code:

| # | Consumer | Metadata handling before Sprint 2 | After |
|---|---|---|---|
| 1 | App Analyze: `comboResults` via `combineResults` | completeness on the object (Sprint 1); numerical + shear-fallback DROPPED at the seam | object now carries worst-case `numerical` + fallback union |
| 2 | `CombinationCompletenessBanner` | re-audits via `auditCombination` (Sprint 1) ✓ | unchanged |
| 3 | App envelope via `envelopeResults` | **silently discarded** source combos' completeness, numerical, fallbacks | `incompleteSourceCombos` names partial sources; worst `numerical` + fallback union propagated |
| 4 | `pickDisplayedResult` | returns objects untouched ✓ | metadata (incl. new fields) rides along |
| 5 | `designFromCases` per-combo loop | reads `r.combination`, flags `demandsIncomplete` ✓ (Sprint 1) | + verdict rollup consumes the same state |
| 6 | Gravity combo (`buildGravityCombo` → `combineResults`) in run-design | missing/incomplete flags ✓ (Sprint 1) | **Ve behaviour pinned by a differential test** (below) |
| 7 | `envelopeMemberDemands` / `collectPMPairs` (demands.ts) | pure math over caller-supplied end forces — completeness is the caller's duty | caller (run-design) audits before building the maps ✓ verified by inspection; no change needed |
| 8 | RC strategy `gravityEf` (Ve ← Vg) | null gravity → Ve without Vg, named only in run issues (Sprint 1) | differential test: identical design combo, gravity present vs missing ⇒ Ve differs by exactly the Vg term; missing run's verdict is INCOMPLETE; partial gravity (failed live case) ⇒ `gravityComboIncomplete`, members tainted, Ve still computed from the partial Vg and labelled as such |
| 9 | Steel strategy / SCWB post-passes | consume member results; steel joint `verification` propagates ✓ (Sprint 1) | `jointVerdict` maps it into the taxonomy |
| 10 | `serviceResult` (one-click report) | ignored `combination` entirely (structurally complete, but silent) and had no reliability channel | returns `completeness` + `warnings` (dropped terms defensively, numerical classification, large-rotation) |
| 11 | `generateReportHTML` | unconditional success conclusion | qualified conclusion whenever warnings exist or classification ≠ VALID (§7) |
| 12 | Diagnostics merges (App) | failures (Sprint 1), shear fallback (Sprint 1) | + numerical reliability (P1) |

No consumer was found that discards completeness metadata after this
sprint's fixes; consumers 7's contract (caller audits) is now stated in
the table and covered by the run-design tests.

## 7. Report scope and integrity findings (P4)

The one-click report's calculation semantics are UNCHANGED (1.0×
self-weight + all modelled cases, exact superposition). What changed is
that the document can no longer be mistaken for something it is not:

- **Title**: "Laporan Hasil Analisis Layan (Tak Terfaktor)".
- **Scope banner** on page 1: service-level, unfactored; **BUKAN laporan
  desain**, **BUKAN bukti kepatuhan** SNI; design verdicts are not in
  the document.
- **§9 rewritten**: analysis results vs design checks are separated;
  the section states no member design verdicts are included, lists the
  unified verdict statuses used in the Design tab, and states the steel
  seismic **UNVERIFIED** limitation (R-01) and the UNSUPPORTED marking.
- **§10** prints the service layer's integrity warnings verbatim.
- **§11 conclusion is conditional**: with any warning or a non-VALID
  classification it reads "selesai DENGAN PERINGATAN INTEGRITAS … TIDAK
  boleh dibaca sebagai hasil terverifikasi" and names the cause; the
  unqualified success sentence survives only for clean, VALID results.
  Both branches are test-pinned (clean model, B12 model, hand-supplied
  incomplete warning).
- The report is generated from the same model + service result the app
  computed (StrukturaRoot passes `svc.warnings` through `openReport`);
  it still carries the model fingerprint.

Residual (R-05): factored combinations and member design verdicts are
still not IN the one-click document — by the prompt's own instruction
not to change its semantics silently, and now stated explicitly in the
document itself. Producing a factored design report is a product
decision for a later sprint.

## 8. Tests added and results

Baseline 143 → **196/196 PASS (22 files)**. New: 53 tests.

| File | Tests | Covers |
|---|---|---|
| `tests/sprint2-conditioning.test.ts` | 10 | B12 reproduction + diagnosis; well-conditioned reference; small-but-valid stiffness; large-but-legitimate displacement; true mechanism (singular, located DOF); near-singular family (ρ scaling law, ill-conditioned band flag); load + stiffness perturbation sensitivity; diagnostics merge (error/warning/clean) |
| `benchmarks/solver-benchmarks-2.test.ts` (B12) | +1 | pathology diagnosed, raw numbers pinned unchanged; healthy ρ and residual asserted |
| `tests/sprint2-verdict.test.ts` | 20 | full precedence matrix (all 36 pairs); empty rollup; UNVERIFIED ≠ pass; analysis/seismic/joint mappings; member channels (flexure, shear, column, confinement, SCWB, steel seismic cap); run-verdict rules (subset inference blocked); real-pipeline integration (clean + partial runs) |
| `tests/sprint2-integrity.test.ts` | 9 | combine/envelope propagation; Ve↔Vg differential; partial gravity; service warnings; report scope + qualified conclusion (3 cases) |
| `tests/sprint2-integration.test.ts` | 8 | full app flow: happy path; failed case; disabled case; missing combo term; Timoshenko fallback; unsupported members; unverified seismic cap; near-singular (diagnostics + dialog SSR + report) |
| `tests/sprint2-secondary.test.ts` | 5 | R-04 (stale fingerprint, hand-edited model, honest round-trip); R-08 guard + provenance retention |

No existing test was deleted or weakened. The only modified existing
test is B12, updated deliberately per its own header instruction, with
its numerical assertions preserved verbatim and strengthened.

## 9. Build and lint results

- `npm run build`: **PASS** (`tsc -b` strict + vite build).
- `npm test`: **196/196 PASS**.
- `npm run lint`: **37 problems (6 errors, 31 warnings)** — the
  rule-level set is IDENTICAL to the pre-sprint baseline (verified by
  JSON diff): `react-hooks/immutability` ×2 (errors, App.tsx),
  `react-hooks/refs` ×4 (errors, structural-canvas.tsx),
  `react-refresh/only-export-components` ×20, `react-hooks/exhaustive-deps`
  ×7, `@typescript-eslint/no-unused-vars` ×3, parse ×1 (warnings).
- The 6 errors were individually reviewed (secondary scope): both
  classes require restructuring unrelated code — handler declaration
  order in the 1600-line App component, and ref reads during canvas
  render — i.e. exactly the "unrelated refactoring" the prompt excludes.
  Left untouched, reported here accurately.

## 10. Known limitations and unresolved risks

1. **No browser E2E exists** (unchanged from Sprint 1). P5 is
   module-level integration over the real pipeline + SSR markup of real
   components — the strongest coverage the current architecture
   supports, and explicitly NOT equivalent to browser E2E.
2. **ILL_CONDITIONED primary-classification evidence gap** (§4.4): the
   band is implemented and flag-tested; no probed model produces it as
   the primary class because plausibility fires first in this solver's
   model class.
3. **Pivot ratio is an indicator, not κ₂** (§4.1): documented in code;
   a healthy ρ does not prove a well-conditioned system.
4. **Diagnostics cost**: one extra O(n³) equilibrated elimination +
   O(n²) residual per solve. Fine for this app's model sizes; a size
   cap policy would be needed before very large models.
5. **Verdict UI surface**: run verdict prints in the Design issues
   panel when it renders; member verdicts live in result data. An
   always-on verdict chip/dashboard is future UI work, not attempted.
6. **R-05 residual**: the one-click report remains service-level by
   design (§7); factored design reporting is a future product decision.
7. **R-01 unchanged**: AISC 341 constants remain unverified
   transcriptions under UNVERIFIED containment; no Sprint 2 work
   validates them, and nothing in this sprint may be read as doing so.
8. Lint baseline (37) and the editor chunk size (~632 kB) remain
   accepted minors, unchanged.

## 11. Evidence for each completion claim

| Claim | Evidence |
|---|---|
| B12 cannot masquerade as reliable | B12 benchmark test (classification + flags + θ pinned at 281250); conditioning suite; integration test (diagnostics error, status unstable, dialog SSR text, qualified report conclusion, `analysisVerdict` → FAIL) |
| Valid models stay valid | B7/portal/small-stiffness/large-legitimate cases VALID in the conditioning suite; all 143 baseline tests pass unmodified (except B12's additive test) |
| No clamping / no silent modification | solver diff adds computation AFTER the solve only; B12's θ asserted bit-comparable (rel. err < 1e-9 vs the pre-sprint pinned 281250); equilibrium assertions unchanged |
| Verdict consistency | one taxonomy module consumed by analysis mapping, member/run/joint/seismic verdicts and the report's §9 status list; 36-pair precedence matrix test |
| Metadata preserved through every consumer | consumer map (§6) + propagation tests for combine, envelope, gravity/Ve, service, report |
| Report cannot imply compliance | report tests assert scope strings, UNVERIFIED note, and both conclusion branches |
| Failure paths covered | integration suite's 8 scenarios (§8) |
| Build/type-check pass; lint reported accurately | §9 (commands run at final HEAD; lint JSON diff vs baseline capture) |
| User changes preserved | tree clean at sprint start (§0 verification); only sprint-scope files touched; no destructive git used |
| No push/deploy | all commits local on the feature branch; no remote commands run in this sprint |

## 12. Recommendation — release gate (§9 of the execution prompt)

| Gate item | Result |
|---|---|
| B12 cannot masquerade as a reliable verified result | ✅ PASS |
| Valid reference models remain valid | ✅ PASS |
| No arbitrary numerical clamping introduced | ✅ PASS |
| Verdict statuses consistent across analysis and design | ✅ PASS |
| Incomplete combination metadata preserved through every consumer | ✅ PASS |
| Reports cannot imply unsupported design compliance | ✅ PASS |
| Tests cover critical failure paths | ✅ PASS |
| Build and type-check pass | ✅ PASS |
| Lint state accurately reported | ✅ PASS (unchanged at baseline; 6 errors reviewed, unsafe to fix in scope) |
| All existing user changes preserved | ✅ PASS |
| No push or deployment | ✅ PASS |

**Recommendation: PASS** — with the residual risks of §10 carried
forward explicitly (chiefly: no browser E2E, the ILL_CONDITIONED
primary-classification evidence gap, R-05's by-design service-level
report, and R-01's constants still awaiting authoritative verification).
Nothing in this report claims SNI/AISC compliance beyond what Sprint 0
established, and no unverified output is presented as verified.

**Sprint 3 was not started.**
