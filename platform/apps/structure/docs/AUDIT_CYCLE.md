# STRUKTURA Audit Cycles

Append-only log. Each cycle: build → audit against directive §19 → fix →
re-audit. History is never rewritten; the hourly audit-fix job appends too.

---

## Cycle 1 — 2026-10-31 (initial build audit)

**Build state audited:** foundation (OpenAnstruk-2Dtest @ 31cc234, MIT)
+ STRUKTURA shell, SNI 1727 preset, samples, report.
**Evidence:** `npm test` 38/38 PASS · `npm run build` PASS
(dist: index JS 239.40 kB/gzip 76.93, CSS 61.89 kB/gzip 11.37,
editor chunk 624.48 kB/gzip 172.60, lazy-loaded).

### §19 checklist (verified items)
App starts (build+dashboard) ✓ · project create/save/reopen (store CRUD
tested) ✓ · editor/nodes/members/supports/materials/sections/loads (foundation
features, code-inspected + templates solve) ✓ · load cases + combinations
(presets incl. new SNI 1727:2020) ✓ · truss/beam/frame analysis (benchmarks
1–5) ✓ · reactions/forces/deflections (analytical, ~1e-15 rel. err.) ✓ ·
diagrams (rendered from the same benchmarked internal-force interpolation) ✓ ·
benchmarks pass ✓ · transparent errors (benchmark 6 + diagnostics) ✓ ·
no fabricated outputs ✓ · production build ✓.

### Findings
| ID | Severity | Finding | Disposition |
|---|---|---|---|
| C1-F1 | Major | Required documentation set (§20) missing | FIXED — 12 docs + README + CHANGELOG written this cycle |
| C1-F2 | Minor | Editor root `h-screen` overflowed under the STRUKTURA top bar (~37 px, bottom bar clipped) | FIXED — `h-full`/`w-full` |
| C1-F3 | Minor | Loading a sample kept the previous active project → "Save project" could overwrite an unrelated project | FIXED — active project cleared for samples/ad-hoc models |
| C1-F4 | Minor | Dashboard import rejected the editor's own bare-model JSON (two formats, confusing) | FIXED — bare models import wrapped in fresh metadata + regression test |
| C1-F5 | Major | Report route untested; combination preset untested; store CRUD untested | FIXED — tests/cycle1-regressions.test.ts (8 tests) |
| C1-F6 | Major | One-click report used a raw all-cases solve: self-weight (a synthesized pipeline case) was silently excluded while the text implied all loads were in | FIXED — report now uses serviceResult(): 1.0×(SW + all cases) superposition, labelled as such; regression test proves ΣRy = (UDL + γA)·L |
| C1-F7 | Major (found during C1-F5 fixes) | Model fingerprint changed after a JSON round-trip (undefined-valued keys hashed in memory, dropped by JSON) → stale-report detection would false-positive after reload | FIXED — stableStringify now mirrors JSON semantics; regression test C1-F4/fingerprint round-trip passes |
| C1-F8 | Minor | Two initial benchmark failures were wrong test expectations (SAP shear sign; portal beam axial shortening), solver proven correct by debug output | Tests corrected with in-source reasoning; solver untouched |
| C1-F9 | Minor | `next-themes` dependency unused; upstream binary demo PNGs + Cloudflare config = dead weight | Removed (bundle is all-text, Pages-ready) |
| C1-F10 | Info | Editor lazy chunk 624 kB exceeds Vite's 500 kB advisory | Accepted for v1; recorded in KNOWN_LIMITATIONS; code-splitting is roadmap |

**Regression run after fixes:** 46/46 PASS (details in TESTING_REPORT.md).
No critical defects remain open from Cycle 1. Cycle 2 re-audits the fixed
build (fresh §19 pass + failure-mode probes).

---

## Cycle 2 — 2026-10-31 (re-audit of the Cycle-1-fixed build)

**Evidence:** `npm test` **54/54 PASS** (46 + 8 new) · `npm run build` PASS
(dist index JS 244.65 kB/gzip 78.41 — slightly up from the service-result
pipeline import; editor chunk 621.14 kB/gzip 171.66).

### Failure-mode probes (new this cycle)
Solved/failed as stated — probed directly against the solver:
disconnected node → singular error ✓ · zero-I section → singular error ✓ ·
unrestrained/empty models → named rejection ✓ · stale results impossible in
editor (results are useMemo derivations of the live model) ✓ · model edit
changes fingerprint ✓ · save→reload fingerprint identical ✓ · full portal
workflow (model → analyze → diagram interpolation finite at all stations →
service result → report with real values → persistence) ✓ via
tests/cycle2-regressions.test.ts.

### Findings
| ID | Severity | Finding | Disposition |
|---|---|---|---|
| C2-F1 | Major | Solver **silently ignored dangling references**: a point load on a deleted node returned `ok:true` with all-zero forces — plausible-looking wrong output, the worst failure class for engineering software | FIXED — referential-integrity validation at solver entry (missing node/section/member, zero-length member, dangling support/load) returns named errors; 6 regression tests |
| C2-F2 | Minor | Members with missing sections previously degraded to a generic singular error | FIXED by C2-F1 (named reason now) |
| C2-F3 | Info | Initial bundle +5 kB JS after importing the analysis pipeline into the dashboard chunk (service result) | Accepted — correctness (self-weight in report) outweighs 5 kB; still lazy editor |

**Cycle 2 verdict:** no critical or major defects remain open. Remaining
items are documented minors in KNOWN_LIMITATIONS.md (editor chunk size,
no Playwright e2e in v1, 2D/linear scope, localStorage-only persistence).
The release loop stops here per the working-cycle rule (clean audit);
the scheduled hourly audit-fix job continues appending cycles.

---

## Cycle 3 — 2026-10-31 04:29 WIB (hourly audit-fix, inside auto-approval window s/d 10:28 WIB)

**Commands run:** `git status/log` (clean tree, branch
feature/struktura-engineering-platform, HEAD 4406b7d) · `npm test` ·
`npm run build` · `npm run lint` · benchmark tolerance grep · UNSUPPORTED
grep · TODO/FIXME grep (none in src/tests).

**Evidence:** `npm test` **54/54 PASS** (unchanged from Cycle 2) ·
`npm run build` PASS (tsc + vite; dist index JS 244.65 kB/gzip 78.41,
CSS 61.85 kB/gzip 11.35, lazy editor chunk 621.12 kB/gzip 171.65 —
identical to Cycle 2 within 20 bytes) · `npm run lint` 37 problems
(6 errors, 31 warnings), down from 40 before this cycle's fixes.

### §19 re-check (no drift since Cycle 2)
Project create/save/reopen, editor node/member/support, truss/beam/frame
analysis, reactions/diagrams/deflection benchmarks (0.1% tolerance
assertions in benchmarks/solver-benchmarks.test.ts, all passing),
UNSUPPORTED labelling (src: report.ts; design scope in
SNI_IMPLEMENTATION_MATRIX.md + KNOWN_LIMITATIONS.md), simple/light UI
(dashboard first paint 244.65 kB JS + 61.85 kB CSS; editor lazy-loaded).
No fabricated outputs; no TODO/FIXME left in src/tests.

### Findings
| ID | Severity | Finding | Disposition |
|---|---|---|---|
| C3-F1 | Minor | 3 dead imports/declarations flagged by lint: unused `SupportType` import (App.tsx), unused `cn` import (frame-template-modal.tsx), never-used `boxPointerIdRef` (structural-canvas.tsx) | FIXED — all three removed; regression run after fix: tests 54/54, build PASS, lint 40→37 problems |
| C3-F2 | Minor (accepted, not restructured) | 6 remaining lint errors are react-hooks v7 strict-rule flags, benign at runtime: App.tsx 981–982 (callback references selection helpers declared later in the component; callbacks only run after render completes) and structural-canvas.tsx 328–329/3257 (ref reads during render: box-preview container read guarded by null-return, cursor class from drag ref — at worst one render stale) | NOT CHANGED — restructuring the canvas render path or callback order risks real regressions for zero observed misbehaviour; tests + build + Cycle-2 workflow probes all pass. Revisit only if a real stale-cursor/preview bug is observed |
| C3-F3 | Info | Remaining 31 lint warnings are react-refresh component-export and exhaustive-deps notices in foundation code; no errors, no test impact | Accepted for v1; same class as Cycle 1–2 accepted items |

**Cycle 3 verdict:** no critical or major defects. The build is
unchanged in behaviour from the Cycle-2-clean state; only dead code
removed. No push performed (hourly job commits locally; deploy/push
follows the user's release decision).

---

## Cycle 4 — 2026-10-31 05:29 WIB (hourly audit-fix, inside auto-approval window s/d 10:28 WIB)

**Commands run:** `git status/log` (clean tree, branch
feature/struktura-engineering-platform, HEAD a7c6128) · `npm test` ·
`npm run build` · `npm run lint` · benchmark tolerance grep (0.1% rel.
err. assertions in benchmarks/solver-benchmarks.test.ts, all passing) ·
UNSUPPORTED grep (src: report.ts) · TODO/FIXME grep (none in src/tests)
· ad-hoc solver probes (temporary test file, deleted after probing).

**Baseline evidence (before fix):** `npm test` **54/54 PASS** ·
`npm run build` PASS (dist index JS 244.65 kB/gzip 78.41, CSS 61.85 kB/
gzip 11.35, lazy editor chunk 621.12 kB/gzip 171.65 — identical to
Cycle 3) · `npm run lint` 37 problems (6 errors, 31 warnings),
unchanged from Cycle 3.

### New failure-mode probes (this cycle)
Probed directly against `analyze()` with a simply supported beam,
midspan point load (baseline midspan deflection −0.00281, downward):
negative E → ok:true with deflection sign-flipped upward (+0.00281);
negative I33 → same sign flip; NaN node coordinate / NaN E / NaN
distributed w / Infinity point load → ok:true with nulls in the JSON
output. Zero E / zero A / unconnected free node already failed loudly
(singular-matrix error). Same failure class as C2-F1: silent
plausible/wrong output from invalid input, reachable via imported JSON
even though the editor UI never produces such values.

### Findings
| ID | Severity | Finding | Disposition |
|---|---|---|---|
| C4-F1 | Major | Solver accepted non-finite / non-positive physical inputs and returned `ok:true`: negative E/I gave sign-flipped deflections; NaN/Infinity gave null outputs | FIXED — value validation at solver entry (src/lib/solver.ts, same pattern as Cycle-2 referential checks): node coordinates finite; every referenced section finite E/I33/A > 0 (solver's own model assumes EI > 0, and no catalogue section carries zero/negative values); point-load fx/fy finite; any present distributed-load component (w/wx/wy, start/end) finite. All rejections are named errors. 7 regression tests in tests/cycle4-regressions.test.ts, incl. a downward-deflection sanity anchor |
| C4-F2 | Minor (accepted, unchanged) | Lint still 37 problems (6 errors, 31 warnings) — the same 6 react-hooks v7 flags accepted in C3-F2 plus foundation refresh/deps warnings | NOT CHANGED — same reasoning as C3-F2; no observed misbehaviour, tests + build pass |

**Regression run after fix:** `npm test` **61/61 PASS** (54 + 7 new) ·
`npm run build` PASS (tsc + vite; dist index JS 245.60 kB/gzip 78.66
(+0.95 kB for the validation code), CSS 61.85 kB/gzip 11.35, lazy
editor chunk 621.12 kB/gzip 171.65 unchanged) · `npm run lint` 37
problems, unchanged. No test deleted, no type-check disabled.

**Cycle 4 verdict:** no critical or major defects remain open. The
only accepted items are the documented minors (editor chunk size,
lint flags, 2D/linear scope, localStorage-only persistence). No push
performed (hourly job commits locally; deploy/push follows the user's
release decision).

---

## Cycle 5 — 2026-10-31 06:29 WIB (hourly audit-fix, inside auto-approval window s/d 10:28 WIB)

**Commands run:** `git status/log` (clean tree, branch
feature/struktura-engineering-platform, HEAD b95b9b5) · `npm test` ·
`npm run build` · `npm run lint` · benchmark tolerance grep (0.1% rel.
err. assertions in benchmarks/solver-benchmarks.test.ts, all passing) ·
UNSUPPORTED grep (src: report.ts) · TODO/FIXME grep (none in src/tests)
· ad-hoc solver probes (temporary test file, deleted after probing).

**Baseline evidence (before fix):** `npm test` **61/61 PASS** ·
`npm run build` PASS (dist index JS 245.60 kB/gzip 78.66, CSS 61.85 kB/
gzip 11.35, lazy editor chunk 621.12 kB/gzip 171.65 — identical to
Cycle 4) · `npm run lint` 37 problems (6 errors, 31 warnings),
unchanged from Cycle 4.

### New failure-mode probes (this cycle)
Probed directly against `analyze()` with the Cycle-4 beam baseline:
node record key ≠ id field, and two nodes sharing one id field, both
failed loudly (cryptic "Singular stiffness matrix") rather than
silently — the singular guard caught them, but the message names no
cause. A bare-model import missing supports/loads was ACCEPTED by
`importProjectJSON` (bare path checks only nodes/members/sections,
unlike the full path) and then `analyze()` THREW a raw TypeError
("Cannot convert undefined or null to object") — an uncaught
exception instead of a named rejection, reachable via any hand-edited
import file. Same failure class as C2-F1/C4-F1, one step earlier.

### Findings
| ID | Severity | Finding | Disposition |
|---|---|---|---|
| C5-F1 | Major | Solver entry had no shape/key validation: missing collection → raw TypeError throw; record key ≠ entity id (nodes/members/sections/loads) or support key ≠ nodeId → entity silently skipped in assembly, surfacing only as cryptic singular-matrix failure | FIXED — shape + key-consistency validation at solver entry (src/lib/solver.ts, same pattern as Cycles 2/4): model must be an object, all five collections present objects, every record key equal to its entity's id (supports: nodeId), non-object records named. Key check subsumes duplicate id fields (two keys cannot share one id once key == id). 7 regression tests in tests/cycle5-regressions.test.ts, incl. a downward-deflection sanity anchor and a no-throw assertion for null/missing-collection models |
| C5-F2 | Minor (accepted, unchanged) | Lint still 37 problems (6 errors, 31 warnings) — the same 6 react-hooks v7 flags accepted in C3-F2 plus foundation refresh/deps warnings; the 7 `no-explicit-any` errors briefly introduced by this cycle's first test draft were fixed by proper typing, not by disabling lint | NOT CHANGED — same reasoning as C3-F2/C4-F2; no observed misbehaviour, tests + build pass |

**Regression run after fix:** `npm test` **68/68 PASS** (61 + 7 new) ·
`npm run build` PASS (tsc + vite; dist index JS 246.50 kB/gzip 78.93
(+0.90 kB for the validation code), CSS 61.85 kB/gzip 11.35, lazy
editor chunk 621.12 kB/gzip 171.65 unchanged) · `npm run lint` 37
problems, unchanged. No test deleted, no type-check disabled.

**Cycle 5 verdict:** no critical or major defects remain open. The
only accepted items are the documented minors (editor chunk size,
lint flags, 2D/linear scope, localStorage-only persistence). No push
performed (hourly job commits locally; deploy/push follows the user's
release decision).

---

## Cycle 6 — 2026-10-31 07:29 WIB (hourly audit-fix, inside auto-approval window s/d 10:28 WIB)

**Commands run:** `git status/log` (clean tree, branch
feature/struktura-engineering-platform, HEAD 729dbaf) · `npm test` ·
`npm run build` · `npm run lint` · benchmark tolerance grep (0.1% rel.
err. assertions in benchmarks/solver-benchmarks.test.ts, all passing) ·
UNSUPPORTED grep (src: report.ts) · TODO/FIXME grep (none in src/tests)
· ad-hoc solver probes (temporary test file, deleted after probing).

**Baseline evidence (before fix):** `npm test` **68/68 PASS** ·
`npm run build` PASS (dist index JS 246.50 kB/gzip 78.93, CSS 61.85 kB/
gzip 11.35, lazy editor chunk 621.12 kB/gzip 171.65 — identical to
Cycle 5) · `npm run lint` 37 problems (6 errors, 31 warnings),
unchanged from Cycle 5.

### New failure-mode probes (this cycle)
Probed directly against `analyze()` with the Cycle-4 beam baseline:
unknown load type → ok:true with all-zero forces (the load vanished —
every assembly loop skipped it); unknown support type with enough
valid reactions → ok:true, the bogus support silently behaved as a
roller (only v constrained; the reaction-count gate catches this only
when total reactions drop below 3); unknown memberType `"trus"` →
ok:true, solved as a frame (moment-carrying, M2 = 15 kN·m on the
baseline); unknown distributed-load mode → ok:true with q1/q2 = 0
(the local-axis wStart/wEnd were ignored by the global-axis branch).
Same failure class as C2-F1/C4-F1/C5-F1, one step deeper: silent
reinterpretation of unknown enum values.

### Findings
| ID | Severity | Finding | Disposition |
|---|---|---|---|
| C6-F1 | Major | Solver silently reinterpreted unknown enum values: unknown load type (load vanishes), unknown support type (downgraded to roller), unknown memberType (solved as frame), unknown distributed mode (loads dropped) | FIXED — enum validation at solver entry (src/lib/solver.ts, same pattern as Cycles 2/4/5): memberType must be "frame"/"truss" when present, support type must be pin/roller/fixed, load type must be point/distributed, distributed mode must be local-axis/global-axis when present. All rejections are named errors. 6 regression tests in tests/cycle6-regressions.test.ts, incl. a downward-deflection sanity anchor and a valid-enums acceptance test |
| C6-F2 | Minor (investigated, NOT a defect) | A mixed truss+frame beam chain (one truss member spliced into the beam) reports "Singular stiffness matrix" — verified on unmodified HEAD, so not a Cycle-6 regression, and replicated numerically in Python: the free-DOF submatrix is rank 4 of 5, with a zero-energy rigid-rotation mode (joint v = −θ·L, both end rotations equal). In linear theory the vertical motion of the truss joint is first-order length-preserving, so the model is a genuine mechanism, not a solver bug | NOT CHANGED — solver correctly refuses a mechanism; the regression test uses a stable triangle truss instead, with a comment recording this |
| C6-F3 | Minor (accepted, unchanged) | Lint still 37 problems (6 errors, 31 warnings) — the same 6 react-hooks v7 flags accepted in C3-F2 plus foundation refresh/deps warnings; the TS narrowing error briefly introduced by this cycle's first fix draft (union narrowed to never in the rejection branch) was fixed by reading the type through a widened alias, not by disabling type-check | NOT CHANGED — same reasoning as C3-F2/C4-F2/C5-F2; no observed misbehaviour, tests + build pass |

**Regression run after fix:** `npm test` **74/74 PASS** (68 + 6 new) ·
`npm run build` PASS (tsc + vite; dist index JS 247.35 kB/gzip 79.10
(+0.85 kB for the validation code), CSS 61.85 kB/gzip 11.35, lazy
editor chunk 621.12 kB/gzip 171.65 unchanged) · `npm run lint` 37
problems, unchanged. No test deleted, no type-check disabled.

**Cycle 6 verdict:** no critical or major defects remain open. The
only accepted items are the documented minors (editor chunk size,
lint flags, 2D/linear scope, localStorage-only persistence). No push
performed (hourly job commits locally; deploy/push follows the user's
release decision).

---

## Cycle 7 — 2026-10-31 08:29 WIB (hourly audit-fix, inside auto-approval window s/d 10:28 WIB)

**Commands run:** `git status/log` (clean tree, branch
feature/struktura-engineering-platform, HEAD a3e059e) · `npm test` ·
`npm run build` · `npm run lint` · benchmark tolerance grep (0.1% rel.
err. assertions in benchmarks/solver-benchmarks.test.ts, all passing) ·
UNSUPPORTED grep (src: report.ts) · TODO/FIXME grep (none in src/tests)
· ad-hoc solver probes (temporary test file, deleted after probing).

**Baseline evidence (before fix):** `npm test` **74/74 PASS** ·
`npm run build` PASS (dist index JS 247.35 kB/gzip 79.10, CSS 61.85 kB/
gzip 11.35, lazy editor chunk 621.12 kB/gzip 171.65 — identical to
Cycle 6) · `npm run lint` 37 problems (6 errors, 31 warnings),
unchanged from Cycle 6.

### New failure-mode probes (this cycle)
Probed directly against `analyze()` with a simply supported 6 m beam
(pin + roller, one member): one uniform −10 kN/m load → Ry = 30 kN
each end (correct); two uniform −5 kN/m loads on the same member →
Ry = 15 kN each end — exactly one load's worth. The second load
vanished with ok:true. Same silent-drop failure class as C2-F1/C6-F1,
but in load superposition rather than validation: both the assembly
loop and the force-recovery loop in src/lib/solver.ts `break` after
the first distributed load matching a member. The editor's
distributed-load tool replaces same-member/same-case loads, so normal
editor use never produces two — but an imported/hand-edited model can,
and stacking distributed loads on one member is legitimate
superposition, not an invalid input.

### Findings
| ID | Severity | Finding | Disposition |
|---|---|---|---|
| C7-F1 | Major | Solver dropped every distributed load after the first on a member (assembly + recovery `break`): two −5 kN/m loads solved as one, ok:true, half reactions/forces | FIXED — both loops now SUM all distributed loads on a member (local-axis q added directly, global-axis q projected then added), instead of breaking after the first. `fixedEndForces` is linear in (q1, q2, qx1, qx2), so summing is exact superposition, and the recovery loop sums identically so `f − FEF` recovery and diagram interpolation use the same total load as assembly. 6 regression tests in tests/cycle7-regressions.test.ts: single-load anchor (Ry = 30 kN), two −5 = one −10, complementary trapezoids sum to uniform −10, mixed local + global-axis modes sum, three-load vs single-load end moments match, single-load result unchanged (no double counting) |
| C7-F2 | Minor (accepted, unchanged) | Lint still 37 problems (6 errors, 31 warnings) — the same 6 react-hooks v7 flags accepted in C3-F2 plus foundation refresh/deps warnings | NOT CHANGED — same reasoning as C3-F2/C4-F2/C5-F2/C6-F3; no observed misbehaviour, tests + build pass |

**Regression run after fix:** `npm test` **80/80 PASS** (74 + 6 new) ·
`npm run build` PASS (tsc + vite; dist index JS 247.35 kB/gzip 79.11,
CSS 61.85 kB/gzip 11.35, lazy editor chunk 621.12 kB/gzip 171.65
unchanged — the fix changes `=` to `+=` and drops a `break`) ·
`npm run lint` 37 problems, unchanged. No test deleted, no type-check
disabled.

**Cycle 7 verdict:** no critical or major defects remain open. The
only accepted items are the documented minors (editor chunk size,
lint flags, 2D/linear scope, localStorage-only persistence). No push
performed (hourly job commits locally; deploy/push follows the user's
release decision).

---

## Cycle 8 — 2026-10-31 09:29 WIB (hourly audit-fix, inside auto-approval window s/d 10:28 WIB)

**Commands run:** `git status/log` (clean tree, branch
feature/struktura-engineering-platform, HEAD 288e076) · `npm test` ·
`npm run build` · `npm run lint` · UNSUPPORTED grep (src: report.ts)
· TODO/FIXME grep (none in src/tests) · ad-hoc pipeline probes
(temporary test file, deleted after probing).

**Baseline evidence (before fix):** `npm test` **80/80 PASS** ·
`npm run build` PASS (dist index JS 247.35 kB/gzip 79.11, CSS 61.85 kB/
gzip 11.35, lazy editor chunk 621.12 kB/gzip 171.65 — identical to
Cycle 7) · `npm run lint` 37 problems (6 errors, 31 warnings),
unchanged from Cycle 7.

### New failure-mode probes (this cycle)
Probed the case pipeline (not just `analyze()`, which sums every load
it is given): a 2-member beam, pin + roller, central node carrying a
−12 kN point load in case "dead" and a second −12 kN point load in
case "wind", then solved with `solveAllCases` over cases {dead, live}
— exactly the state left behind after deleting the "wind" case in the
editor. The dead result showed Ry = 6 kN per end (one load only);
the wind load appeared in NO case result, and no API reported it.
Calling `solveCase(model, "wind")` directly still solved the orphan
(6 kN per end) — proving the load is alive in the model but
unreachable: `solveAllCases` iterates cases, not loads, and the UI
can no longer select the deleted case (its dropdown row is gone).
Root cause in `src/App.tsx::handleDeleteLoadCase`: it trimmed
combinations referencing the deleted case but never touched loads —
unlike combinations, loads were left stranded with no warning
anywhere. Same silent-drop failure class as C2-F1/C6-F1/C7-F1, one
step higher: at the case-orchestration layer rather than the solver.

### Findings
| ID | Severity | Finding | Disposition |
|---|---|---|---|
| C8-F1 | Major | Deleting a load case orphaned its loads: stranded in model.loads, silently excluded from every displayed analysis, counted in "All Loads" but with no case row to view/edit them by, and no warning anywhere | FIXED (two layers) — (1) PREVENTION: `handleDeleteLoadCase` now cascades into loads via new pure helper `removeLoadsOfCase` (src/lib/load-cases.ts), matching the existing combination trimming. (2) DETECTION for orphans arriving via imported/saved files: new pure helper `findOrphanedLoadIds`, new `orphaned-loads` warning issue kind in src/lib/analysis-diagnostics.ts (`runDiagnostics` takes an optional live case record; App passes it), and a dialog message naming the orphaned load ids. A disabled-but-existing case does NOT orphan its loads. 7 regression tests in tests/cycle8-regressions.test.ts, incl. cascade purity (input record untouched), back-compat (no case record → no orphan issue), and the pipeline exclusion the warning now guards |
| C8-F2 | Minor (accepted, unchanged) | Lint still 37 problems (6 errors, 31 warnings) — the same 6 react-hooks v7 flags accepted in C3-F2 plus foundation refresh/deps warnings | NOT CHANGED — same reasoning as C3-F2/C4-F2/C5-F2/C6-F3/C7-F2; no observed misbehaviour, tests + build pass |

**Regression run after fix:** `npm test` **87/87 PASS** (80 + 7 new) ·
`npm run build` PASS (tsc + vite; dist index JS 247.35 kB/gzip 79.11,
CSS 61.85 kB/gzip 11.35, lazy editor chunk 621.70 kB/gzip 171.87
(+0.58 kB for the cascade + diagnostics + dialog wiring)) ·
`npm run lint` 37 problems, unchanged. No test deleted, no type-check
disabled.

**Cycle 8 verdict:** no critical or major defects remain open. The
only accepted items are the documented minors (editor chunk size,
lint flags, 2D/linear scope, localStorage-only persistence). No push
performed (hourly job commits locally; deploy/push follows the user's
release decision).

---

## Cycle 9 — 2026-10-31 10:29 WIB (hourly audit, OUTSIDE auto-approval window — window ended 10:28 WIB)

**Mode:** AUDIT ONLY. No code changes, no local commit, no push. This
entry is the audit record itself (task step 5); it is left uncommitted
pending a future in-window run or the user's go-ahead.

**Commands run:** `git status/log` (clean tree, branch
feature/struktura-engineering-platform, HEAD 662e190) · `npm test` ·
`npm run build` · `npm run lint` · UNSUPPORTED grep (src: report.ts
only) · TODO/FIXME grep (none in src/tests) · benchmark tolerance
grep (0.1% rel. err. assertions in benchmarks/solver-benchmarks.test.ts)
· delete-cascade code read (src/lib/model.ts deleteNode/deleteMember/
deleteSection, src/App.tsx delete handlers) · ad-hoc solver probe
(temporary test file, deleted after probing; tree clean afterwards).

**Baseline evidence:** `npm test` **87/87 PASS** (unchanged from Cycle 8:
10 sample/project + 8+8+7+6+6+7 cycle regressions + 7 design-sections
+ 21 benchmarks) · `npm run build` PASS (tsc + vite; dist index JS
247.35 kB/gzip 79.11, CSS 61.85 kB/gzip 11.35, lazy editor chunk
621.70 kB/gzip 171.87 — identical to Cycle 8) · `npm run lint` 37
problems (6 errors, 31 warnings), unchanged from Cycles 6–8 · dist
total 924 kB.

**Release-criteria check:** project create/save/reopen covered by
tests/samples-projects.test.ts (10/10) · editor node/member/support
paths intact (no code touched) · truss/beam/frame analysis covered by
21 benchmark tests at ≤0.1% relative error, all passing ·
unimplemented scope marked UNSUPPORTED in src/struktura/report.ts
(2D linear static only; 3D, P-Delta, modal/response-spectrum and
geotechnical checks) · UI bundle sizes recorded above (dashboard
light; editor chunk >500 kB warning remains a known minor).

### New probes (this cycle, no fix applied — audit-only mode)
Probed the next silent-drop candidate after Cycles 6–8: a member
referencing a nonexistent section, via `analyze()` and via the
selfweight case slice. Both return a NAMED failure
(`ok:false, reason:"Member m1 references missing section ..."`) —
not a silent drop, so no finding. Delete cascades read clean:
deleteNode removes attached members, supports, point loads and
distributed loads on removed members; deleteMember removes its
distributed loads; deleteSection reassigns members to a fallback
section (guarded to ≥1 section in App). One previously documented
behaviour re-confirmed, not re-litigated: `combineResults` silently
drops combo terms whose case is missing/disabled/failed, by design
with an inline warning in the Load Combination flyout
(src/lib/analysis-pipeline.ts comment).

### Findings
| ID | Severity | Finding | Disposition |
|---|---|---|---|
| C9-F1 | Minor (accepted, unchanged) | Lint still 37 problems (6 errors, 31 warnings) — the same 6 react-hooks v7 flags accepted in C3-F2 plus foundation refresh/deps warnings | NOT CHANGED — same reasoning as C3-F2/C4-F2/C5-F2/C6-F3/C7-F2/C8-F2; no observed misbehaviour, tests + build pass; fixing requires an in-window run |
| C9-F2 | Minor (accepted, unchanged) | Lazy editor chunk 621.70 kB (gzip 171.87) still trips Vite's 500 kB warning; dashboard index JS stays light at 247.35 kB | NOT CHANGED — code-split work is a larger change, deferred to an in-window run |
| C9-F3 | Note (no defect) | This run fell 1 minute outside the auto-approval window (10:29 vs 10:28 WIB close), so per task step 1 it is audit-only; any future fix cycle needs a fresh user go-ahead | RECORDED — no code change, no commit, no push this cycle |

**Cycle 9 verdict:** no critical or major defects found; no new
defect of any severity. The only open items are the documented minors
(editor chunk size, lint flags, 2D/linear scope, localStorage-only
persistence) carried from Cycles 3–8. No push performed.

---

## Cycle 10 — 2026-10-31 11:29 WIB (hourly audit, OUTSIDE auto-approval window — window ended 10:28 WIB)

**Mode:** AUDIT ONLY. No code changes, no local commit, no push. This
entry is the audit record itself (task step 5); it is left uncommitted
alongside the Cycle 9 entry, pending a future in-window run or the
user's go-ahead.

**Commands run:** `git status/log` (tree carries uncommitted Cycle 9
entry only, branch feature/struktura-engineering-platform, HEAD
662e190) · `npm test` · `npm run build` · `npm run lint` ·
UNSUPPORTED grep (src: report.ts only) · TODO/FIXME grep (none in
src/tests) · benchmark tolerance grep (0.1% rel. err. assertions in
benchmarks/solver-benchmarks.test.ts) · code read of the solver-failure
surfacing chain (src/lib/solver.ts validation, src/lib/
analysis-diagnostics.ts runDiagnostics, src/lib/analysis-pipeline.ts
pickDisplayedResult/combineResults, src/App.tsx mergedReport/
diagnosticSolve/issues-dialog, src/components/status-bar.tsx) ·
ad-hoc probe (temporary test file, deleted after probing; tree state
afterwards = Cycle 9 entry + this entry only).

**Baseline evidence:** `npm test` **87/87 PASS** (unchanged from Cycles
8–9: 10 sample/project + 8+8+7+6+6+7 cycle regressions + 7
design-sections + 21 benchmarks) · `npm run build` PASS (tsc + vite;
dist index JS 247.35 kB/gzip 79.11, CSS 61.85 kB/gzip 11.35, lazy
editor chunk 621.70 kB/gzip 171.87 — identical to Cycles 8–9) ·
`npm run lint` 37 problems (6 errors, 31 warnings), unchanged from
Cycles 6–9 · dist total 932,293 bytes.

**Release-criteria check:** project create/save/reopen covered by
tests/samples-projects.test.ts (10/10) · editor node/member/support
paths intact (no code touched) · truss/beam/frame analysis covered by
21 benchmark tests at ≤0.1% relative error, all passing ·
unimplemented scope marked UNSUPPORTED in src/struktura/report.ts
(2D linear static only; 3D, P-Delta, modal/response-spectrum and
geotechnical checks) · UI bundle sizes recorded above (dashboard
light; editor chunk >500 kB warning remains a known minor).

### New probe (this cycle, no fix applied — audit-only mode)
Probed the next gap after Cycles 2/6–9 (which hardened the solver
itself): does a NON-singular solver failure reach the user? Take a
beam and drag node n2 exactly onto n1 — `handleMoveNode`
(src/App.tsx) has no coincidence guard, so this is reachable in the
editor, no import needed. Probe result, verified by temporary test:
`analyze()` returns `ok:false` with the named reason "Member m1 has
zero length (nodes n1 and n2 coincide)" — the solver fails safely,
no wrong numbers. But `runDiagnostics()` on the same model returns
ZERO error issues and a non-`unstable` status: it has no issue kind
for zero-length members, dangling references, invalid section values,
or unknown enums. The rest of the chain then swallows the reason:
`mergedReport` (src/App.tsx) merges only `singularDof` failures, so
no error issue exists to auto-open the issues dialog on Analyze-tab
entry; `pickDisplayedResult` returns `null` for the failed case, so
the Analyze tools show only the generic "No results"; and the STATUS
pill renders `mergedReport.status`, which stays DETERMINATE/
INDETERMINATE (green/amber) on a model that cannot solve at all.
The same blind spot covers every non-singular solver failure class
(dangling refs from imported files, invalid section values, unknown
enums — all named at solver level since Cycles 2/4/6, all invisible
at UI level). The report-generation path is NOT affected: it surfaces
`Analysis failed — report not generated: <reason>` (src/struktura/
StrukturaRoot.tsx).

### Findings
| ID | Severity | Finding | Disposition |
|---|---|---|---|
| C10-F1 | Major (diagnostics only — no wrong numbers are ever displayed) | Non-singular solver failures are invisible in the UI: named solver reason never reaches diagnostics, the issues dialog, or the STATUS pill; Analyze tools show only "No results" while the pill still claims DETERMINATE/INDETERMINATE. Reproducible in-editor by dragging a node onto another (zero-length member, unguarded `handleMoveNode`) | NOT FIXED — audit-only mode. Fix candidate for an in-window run: either merge non-singular solver failures into `mergedReport` as an error issue carrying the solver `reason`, or add a diagnostics issue kind for solver-fatal topology (zero-length/dangling/invalid), plus a `handleMoveNode` coincidence guard. Do NOT fix by hiding the solver reason or by weakening solver validation |
| C10-F2 | Minor (accepted, unchanged) | Lint still 37 problems (6 errors, 31 warnings) — the same 6 react-hooks v7 flags accepted in C3-F2 plus foundation refresh/deps warnings | NOT CHANGED — same reasoning as C3-F2/C4-F2/C5-F2/C6-F3/C7-F2/C8-F2/C9-F1; no observed misbehaviour, tests + build pass; fixing requires an in-window run |
| C10-F3 | Minor (accepted, unchanged) | Lazy editor chunk 621.70 kB (gzip 171.87) still trips Vite's 500 kB warning; dashboard index JS stays light at 247.35 kB | NOT CHANGED — code-split work is a larger change, deferred to an in-window run |
| C10-F4 | Note (no defect) | This run is again outside the auto-approval window (11:29 vs 10:28 WIB close), so per task step 1 it is audit-only; any fix cycle (incl. C10-F1) needs a fresh user go-ahead | RECORDED — no code change, no commit, no push this cycle |

**Cycle 10 verdict:** no critical defects; no wrong numbers produced.
One NEW major-grade diagnostics gap (C10-F1) joins the open list —
it does not corrupt results, but it leaves the user with an
unexplained empty analysis and a healthy-looking STATUS pill. The
other open items remain the documented minors (editor chunk size,
lint flags, 2D/linear scope, localStorage-only persistence). No push
performed.

---

## Cycle 11 — 2026-10-31 12:29 WIB (hourly audit, OUTSIDE auto-approval window — window ended 10:28 WIB)

**Mode:** AUDIT ONLY. No code changes, no local commit, no push. This
entry is the audit record itself (task step 5); it is left uncommitted
alongside the Cycle 9–10 entries, pending a future in-window run or
the user's go-ahead.

**Commands run:** `git status/log` (tree carries uncommitted Cycle 9–10
entries only, branch feature/struktura-engineering-platform, HEAD
662e190) · `npm test` · `npm run build` · `npm run lint` ·
UNSUPPORTED grep (src/struktura/report.ts only) · TODO/FIXME grep
(none in src/tests/benchmarks) · benchmark tolerance grep (0.1% rel.
err. assertions in benchmarks/solver-benchmarks.test.ts) · ad-hoc
solver probes (temporary test file, deleted after probing; tree state
afterwards = Cycle 9–10 entries + this entry only).

**Baseline evidence:** `npm test` **87/87 PASS** (unchanged from Cycles
8–10: 10 sample/project + 8+8+7+6+6+7 cycle regressions + 7
design-sections + 21 benchmarks) · `npm run build` PASS (tsc + vite;
dist index JS 247.35 kB/gzip 79.11, CSS 61.85 kB/gzip 11.35, lazy
editor chunk 621.70 kB/gzip 171.87 — identical to Cycles 8–10) ·
`npm run lint` 37 problems (6 errors, 31 warnings), unchanged from
Cycles 6–10 · dist total 932,293 bytes.

**Release-criteria check:** project create/save/reopen covered by
tests/samples-projects.test.ts (10/10) · editor node/member/support
paths intact (no code touched) · truss/beam/frame analysis covered by
21 benchmark tests at ≤0.1% relative error, all passing ·
unimplemented scope marked UNSUPPORTED in src/struktura/report.ts
(2D linear static only; 3D, P-Delta, modal/response-spectrum and
geotechnical checks) · UI bundle sizes recorded above (dashboard
light; editor chunk >500 kB warning remains a known minor).

### New probes (this cycle, no fix applied — audit-only mode)
Probed the next silent-drop candidate after Cycle 7 (which fixed
distributed-load dropping): point loads. Two −6 kN point loads on the
same midspan node in the same case solved as one 12 kN load
(Ry = 6 kN per end, member end moments 18 kN·m) — superposition is
correct; the `+=` nodal assembly (src/lib/solver.ts) sums point
loads, so there is NO point-load analogue of C7-F1. Second probe:
duplicate supports on one node. Under the Cycle-5 key==nodeId rule
this is structurally unrepresentable — a second record on node n1
must reuse key "n1" and overwrites the first. The overwrite outcome
(pin→roller) fails loudly with the named error "Need at least 3
reaction components", never silently; no wrong numbers. Two
non-findings; no new defect this cycle. (Probe drafts first failed
on my own wrong model shape — member fields `a`/`b`/`section` and
load field `loadCaseId` per tests/cycle4-regressions.test.ts — the
solver's named validation errors, not silent output, caught each
mistake; the probe file was deleted after use.)

### Findings
| ID | Severity | Finding | Disposition |
|---|---|---|---|
| C11-F1 | Major (carried, unchanged) | C10-F1 still open: non-singular solver failures invisible in the UI (diagnostics/STATUS pill); reproducible in-editor by dragging a node onto another | NOT FIXED — audit-only mode. Fix candidate unchanged from Cycle 10: merge non-singular solver failures into `mergedReport` as an error issue carrying the solver `reason`, or add a diagnostics issue kind for solver-fatal topology, plus a `handleMoveNode` coincidence guard |
| C11-F2 | Minor (accepted, unchanged) | Lint still 37 problems (6 errors, 31 warnings) — the same 6 react-hooks v7 flags accepted in C3-F2 plus foundation refresh/deps warnings | NOT CHANGED — same reasoning as C3-F2/C4-F2/C5-F2/C6-F3/C7-F2/C8-F2/C9-F1/C10-F2; no observed misbehaviour, tests + build pass; fixing requires an in-window run |
| C11-F3 | Minor (accepted, unchanged) | Lazy editor chunk 621.70 kB (gzip 171.87) still trips Vite's 500 kB warning; dashboard index JS stays light at 247.35 kB | NOT CHANGED — code-split work is a larger change, deferred to an in-window run |
| C11-F4 | Note (no defect) | This run is again outside the auto-approval window (12:29 vs 10:28 WIB close), so per task step 1 it is audit-only; any fix cycle (incl. C10-F1/C11-F1) needs a fresh user go-ahead | RECORDED — no code change, no commit, no push this cycle |

**Cycle 11 verdict:** no critical defects; no new defect of any
severity — both new probes returned clean (point-load superposition
correct, duplicate supports unrepresentable + loudly rejected). The
open list is unchanged: one major-grade diagnostics gap (C10-F1/
C11-F1, no wrong numbers) plus the documented minors (editor chunk
size, lint flags, 2D/linear scope, localStorage-only persistence).
No push performed.

---

## Cycle 12 — 2026-10-31 12:44 WIB (C10-F1 fix, user-approved)

**Mode:** FIX. The user explicitly approved this fix in chat
("Perbaiki C10-F1 sekarang", 2026-10-31 12:44 WIB) after Cycles 10–11
recorded the finding in audit-only mode. Scope is exactly C10-F1;
no other finding was touched.

**The fix (two parts, per the Cycle-10 candidate):**
1. **Surface every solver failure in the diagnostics.** New pure helper
   `mergeSolverFailures` (src/lib/analysis-diagnostics.ts): singular
   failures merge as located `singular-at-dof` errors exactly as before;
   every NON-singular failure now merges as a new `solver-failure`
   error issue carrying the solver's named `reason` VERBATIM, deduped
   by reason across cases. Any merge forces the report status to
   `unstable`, so the STATUS pill can no longer claim DETERMINATE/
   INDETERMINATE for a model that cannot solve. App.tsx `mergedReport`
   now routes through this helper (the inline merge loop was removed),
   and the issues dialog renders the new kind as
   "Analysis failed: <reason>." (src/components/
   analysis-issues-dialog.tsx) — so the failure also auto-opens the
   dialog on Analyze-tab entry, like other error issues. The solver
   reason is never hidden or paraphrased, and no solver validation
   from Cycles 2/4/5/6 was weakened.
2. **Coincidence guard in `handleMoveNode`.** New pure helper
   `findCoincidentNode` (src/lib/geometry.ts): exact-coordinate match
   against every other node (snap-to-node writes the target node's
   coordinates verbatim, so coincidence is exact when it happens;
   near-misses stay legal). `handleMoveNode` (src/App.tsx) now rejects
   a move that would drop the node exactly onto another node, so a
   zero-length member can no longer be created by dragging or by
   coordinate entry. Models arriving already-coincident via import are
   still caught by part 1.

**Regression tests:** `tests/cycle12-regressions.test.ts` — 8 tests:
(a) zero-length-member model → solver named error AND the same reason
present as a `solver-failure` error in the merged report; (a2) the
same failure repeated per case merges once; (b) runDiagnostics alone
rates the model `determinate`, the merged report rates it `unstable`;
(c) a valid model solves clean — merged report untouched (same
object), no spurious error; singular failures still merge as located
`singular-at-dof`, not generic failures; (d) `findCoincidentNode`
names the occupying node, ignores the node's own position, and allows
near misses.

**Evidence:** before — `npm test` 87/87 PASS, `npm run lint` 37
problems (6 errors, 31 warnings). After — `npm test` **95/95 PASS**
(87 + 8 new, none deleted), `npm run build` PASS (tsc + vite; dist
index JS 247.35 kB/gzip 79.11 — unchanged; lazy editor chunk
622.04 kB/gzip 171.98, +0.34 kB for the new merge/dialog code),
`npm run lint` 37 problems (6 errors, 31 warnings) — unchanged.

**Cycle 12 verdict:** C10-F1/C11-F1 CLOSED. No critical or major
defects remain open. Remaining items are the documented minors
(editor chunk size, lint flags, 2D/linear scope, localStorage-only
persistence). This cycle's commit also carries the previously
uncommitted Cycle 9–11 audit entries above. No push performed.

---

## Cycle 13 — 2026-10-31 13:29 WIB (audit-only, outside auto-approval window)

**Mode:** AUDIT ONLY. This run is outside the user's 7-hour auto-approval
window (closed Sabtu 2026-10-31 10:28 WIB; this run 13:29 WIB), so per
task step 1 no code change was applied, nothing was committed, and
nothing was pushed. This entry itself is left uncommitted in the working
tree, following the Cycle 9–11 precedent (those entries were committed
later together with the Cycle 12 fix).

**Commands run:** `git status/log` (tree clean, branch
feature/struktura-engineering-platform, HEAD a14c790 = Cycle 12) ·
`npm test` · `npm run build` · `npm run lint` · UNSUPPORTED grep
(src/struktura/report.ts only) · TODO/FIXME grep (none in
src/tests/benchmarks) · benchmark tolerance grep (0.1% rel. err.
assertions in benchmarks/solver-benchmarks.test.ts) · code-read of
`deleteMultiSelection`/`deleteNode`/`deleteMember` (src/lib/model.ts),
`MaterialFlyout` delete guard (canDelete = sectionCount > 1), and
solver entry validation (src/lib/solver.ts) · ad-hoc probe tests
(temporary test file, deleted after probing; tree state afterwards =
this entry only).

**Baseline evidence:** `npm test` **95/95 PASS** (unchanged from Cycle
12: 10 sample/project + 8+8+7+6+6+7+8 cycle regressions + 7
design-sections + 21 benchmarks) · `npm run build` PASS (tsc + vite;
dist index JS 247.35 kB/gzip 79.11, CSS 61.85 kB/gzip 11.35, lazy
editor chunk 622.04 kB/gzip 171.98 — identical to Cycle 12) ·
`npm run lint` 37 problems (6 errors, 31 warnings), unchanged from
Cycles 6–12 · dist total 932,638 bytes.

**Release-criteria check:** project create/save/reopen covered by
tests/samples-projects.test.ts (10/10) · editor node/member/support
paths intact (no code touched) · truss/beam/frame analysis covered by
21 benchmark tests at ≤0.1% relative error, all passing ·
unimplemented scope marked UNSUPPORTED in src/struktura/report.ts
(2D linear static only; 3D, P-Delta, modal/response-spectrum and
geotechnical checks) · UI bundle sizes recorded above (dashboard
light; editor chunk >500 kB warning remains a known minor).

### New probes (this cycle, no fix applied — audit-only mode)
Probed the next silent-drop candidate family after Cycles 7/8/11
(distributed-load dropping, case-delete cascade, point loads):
deletion cascades and orphan loads arriving via import.
(A) `deleteNode` on the mid node of a 3-node beam removed both
attached members, the point load on that node, and the distributed
load on the removed members, while keeping the two end supports —
cascade complete, no orphans. (B) `deleteMultiSelection` with a
member only dropped that member's distributed loads and kept the
unrelated point load — cascade selective and correct. (C) A crafted
import carrying a distributed load on a missing member plus a point
load on a missing node failed at the solver with a named reason
matching /missing (member|node)/, and the Cycle-12
`mergeSolverFailures` path surfaced it as a `solver-failure` error
and forced the merged report status to `unstable` — the orphan-load
import path is loud end to end, not a silent wrong-number path.
Code-read extra: the Material tool already guards last-section
deletion (`canDelete = sectionCount > 1`), so the
`deleteSection`-to-zero-sections edge is unreachable from the UI;
a crafted zero-section file is rejected by `isStructureModel`
(sections length > 0) on reopen. Four non-findings; no new defect
this cycle.

### Findings
| ID | Severity | Finding | Disposition |
|---|---|---|---|
| C13-F1 | Note (no defect) | This run is outside the auto-approval window (13:29 vs 10:28 WIB close), so per task step 1 it is audit-only; any fix cycle needs a fresh user go-ahead | RECORDED — no code change, no commit, no push this cycle; this entry left uncommitted |
| C13-F2 | Minor (accepted, unchanged) | Lint still 37 problems (6 errors, 31 warnings) — the same 6 react-hooks v7 flags accepted in C3-F2 plus foundation refresh/deps warnings | NOT CHANGED — same reasoning as C3-F2/C4-F2/C5-F2/C6-F3/C7-F2/C8-F2/C9-F1/C10-F2/C11-F2/C12 (carried); no observed misbehaviour, tests + build pass; fixing requires an in-window run |
| C13-F3 | Minor (accepted, unchanged) | Lazy editor chunk 622.04 kB (gzip 171.98) still trips Vite's 500 kB warning; dashboard index JS stays light at 247.35 kB | NOT CHANGED — code-split work is a larger change, deferred to an in-window run |
| C13-F4 | Note (carried, awaiting user decision) | Identity item still open: export filename is still `openanstruk-structure-*.json` (src/App.tsx) and one UI attribution line still reads "OpenAnstruk (MIT)" (src/struktura/StrukturaRoot.tsx); the LICENSE/NOTICE attribution itself is legally required under MIT and is not the issue — only the product-facing branding is undecided | NOT CHANGED — the user was asked (new repo vs reaffirmed identity in this repo) and the answer is still pending; no unilateral rename |

**Cycle 13 verdict:** no critical or major defects; no new defect of
any severity — all four probes returned clean (delete cascades
complete, orphan-load imports loud end to end, last-section delete
guarded in the UI). The open list is unchanged from Cycle 12: only
the documented minors (editor chunk size, lint flags, 2D/linear
scope, localStorage-only persistence) plus the pending user identity
decision. No push performed.

---

## Cycle 14 — 2026-10-31 13:38 WIB (Full STRUKTURA identity rebrand, user decision)

**Mode:** FIX / REBRAND. The user decided on 2026-10-31 13:35 WIB:
"Repo baru + identitas STRUKTURA penuh". Scope is the complete
product-identity sweep; no solver or design behaviour was changed.

**Changes applied:**
- Editor downloads now use `struktura-structure-<timestamp>.json`.
  Import remains compatible with previously exported files because
  both editor and dashboard imports validate the parsed JSON model
  shape, not the download filename.
- The dashboard footer now presents STRUKTURA as an independent
  structural engineering application and points to NOTICE only for
  license and third-party attribution.
- Source comments in the shared constants and steel-design modules now
  refer to STRUKTURA / its 2D solver while preserving the engineering
  meaning of the notes.
- `package.json` retains the package name `struktura`; its description
  no longer presents the foundation as the product and instead points
  to NOTICE for attribution.
- README, the project overview, contribution guide, and the active
  design-engine documents now use the STRUKTURA identity. NOTICE was
  reframed as STRUKTURA's own attribution record; the LICENSE text and
  all MIT copyright/attribution lines were preserved unchanged.
- Historical records were not rewritten: the pre-STRUKTURA changelog
  archive and the licensing/repository/audit/development records retain
  the foundation name only where it identifies the licensed source or
  the historical event being recorded.

**Identity verification:** case-insensitive grep returns **zero**
occurrences of the foundation name in `src/`, `index.html`, `public/`,
`package.json`, `config/`, and `.github/`. The only remaining files
containing it are `LICENSE`, `NOTICE`, `CHANGELOG.md` (historical
archive entries), `docs/AUDIT_CYCLE.md` (past audit entries),
`docs/DEVELOPMENT.md` (labelled pre-STRUKTURA historical plan),
`docs/LICENSING_AUDIT.md` (licensing provenance), and
`docs/REPOSITORY_AUDIT.md` (Stage 0 provenance).

**Evidence:** `npm test` **95/95 PASS** (11 files, unchanged from
Cycle 13) · `npm run build` PASS (tsc + vite; dist index JS 247.41 kB,
CSS 61.85 kB, lazy editor chunk 622.04 kB) · `npm run lint` reports
37 problems (6 errors, 31 warnings), exactly the accepted baseline
from Cycles 6–13.

**Cycle 14 verdict:** the C13-F4 identity item is CLOSED for the local
product. The Vite base path intentionally remains
`/software-perhitungan-struktur/` because the new repository name is
not final. Once the user creates/selects the new repository, update
the Vite base, Pages-facing URLs, and repository references to
`/<new-repo>/`, then push there. No push was performed in this cycle.

---

## Cycle 15 — 2026-10-31 14:29 WIB (hourly audit, OUTSIDE auto-approval window — window ended 10:28 WIB)

**Mode:** AUDIT ONLY. No code changes, no local commit, no push. This
entry is the audit record itself (task step 5); it is left uncommitted
in the working tree, following the Cycle 9–11 / 13 precedent (those
entries were committed later together with an approved fix).

**Commands run:** `git status/log` (clean tree, branch
feature/struktura-engineering-platform, HEAD 51a92f3 = Cycle 14) ·
`npm test` · `npm run build` · `npm run lint` · UNSUPPORTED grep
(src/struktura/report.ts only) · TODO/FIXME grep (none in
src/tests/benchmarks) · benchmark tolerance grep (0.1% rel. err.
assertions in benchmarks/solver-benchmarks.test.ts) · code read of
`combineResults`/`solveAllCases` (src/lib/analysis-pipeline.ts),
`mergeSolverFailures` + issue kinds (src/lib/analysis-diagnostics.ts),
and the combination flyout warnings (src/tabs/load/tools/
load-combination-tool.tsx: only selfweight-disabled and zero-γ
warnings exist) · ad-hoc probe tests (temporary test file, deleted
after probing; tree clean afterwards).

**Baseline evidence:** `npm test` **95/95 PASS** (unchanged from
Cycles 12–14: 10 sample/project + 8+8+7+6+6+7+8 cycle regressions + 7
design-sections + 21 benchmarks) · `npm run build` PASS (tsc + vite;
dist index JS 247.41 kB/gzip 79.12, CSS 61.85 kB/gzip 11.35, lazy
editor chunk 622.04 kB/gzip 171.98 — identical to Cycle 14) ·
`npm run lint` 37 problems (6 errors, 31 warnings), unchanged from
Cycles 6–14 · dist total 932,704 bytes.

**Release-criteria check:** project create/save/reopen covered by
tests/samples-projects.test.ts (10/10) · editor node/member/support
paths intact (no code touched) · truss/beam/frame analysis covered by
21 benchmark tests at ≤0.1% relative error, all passing ·
unimplemented scope marked UNSUPPORTED in src/struktura/report.ts
(2D linear static only; 3D, P-Delta, modal/response-spectrum and
geotechnical checks) · UI bundle sizes recorded above (dashboard
light; editor chunk >500 kB warning remains a known minor).

### New probes (this cycle, no fix applied — audit-only mode)
Probed the combination layer, the last orchestration layer not yet
probed after Cycles 7/8/11 (load dropping/cascades) and Cycle 12
(solver-failure surfacing). Model: simply supported 6 m beam, midspan
point loads, combination 1.0·dead + 1.0·X.
(A) X = a FAILED case (its load carries NaN, rejected at solver
entry with the named reason "Point load l2 has a non-finite
component"): `solveAllCases` reports the failure, `combineResults`
returns `ok:true` with Ry = 6 kN (dead only — the failed term is
dropped, and the returned result carries no dropped-term marker).
But the Cycle-12 diagnostics layer DOES catch this path:
`mergeSolverFailures` surfaces the failure as a `solver-failure`
error and forces status `unstable` — so the user sees an error issue
and a non-healthy STATUS pill, even though the combo result object
itself is unmarked. Guarded, not a new defect; the unmarked result
object is noted under C15-F2.
(B) X = a GHOST case (`ghost`, absent from the case record and from
case results — the state an imported/hand-edited project file can
carry; the editor cannot produce it, since Cycle 8 trims combinations
on case delete and UI-created combos reference existing cases):
`combineResults` returns `ok:true` with Ry = 6 kN (dead only) and
`mergeSolverFailures` reports status `determinate` with no issue of
any kind naming the ghost term — no diagnostics issue kind exists
for combination terms referencing missing cases, and the combination
flyout warns only about selfweight-disabled / zero-γ. The combo
result is therefore presented as complete while one term was
silently omitted. Same silent-drop failure class as C2-F1/C6-F1/
C7-F1/C8-F1, one layer higher: at the combination layer, reachable
only via imported/hand-edited files.

### Findings
| ID | Severity | Finding | Disposition |
|---|---|---|---|
| C15-F1 | Major (orchestration only — solver numbers themselves are correct) | `combineResults` silently drops combination terms whose case is missing from case results, with no diagnostic anywhere: an imported/hand-edited combination referencing a ghost case returns `ok:true` partial values presented as the full combination result, status stays `determinate`, no issue kind names the dropped term | NOT FIXED — audit-only mode. Fix candidate for an in-window run: validate combination terms on project import (flag/drop terms referencing unknown cases), and/or add a diagnostics issue kind for combo terms referencing missing cases, and/or mark combined results that dropped terms. Do NOT fix by weakening solver validation or by silently deleting user combinations without telling them |
| C15-F2 | Minor (noted, guarded) | A combination term whose case FAILED (not missing) is likewise dropped from the returned `ok:true` result with no marker on the result object itself — but unlike C15-F1, the Cycle-12 diagnostics layer flags the failed case as a `solver-failure` error and forces status `unstable`, so the user is warned at UI level | NOT CHANGED — acceptable while the diagnostics guard holds; revisit only if combined results gain their own dropped-term marker (then both paths are covered uniformly) |
| C15-F3 | Minor (accepted, unchanged) | Lint still 37 problems (6 errors, 31 warnings) — the same 6 react-hooks v7 flags accepted in C3-F2 plus foundation refresh/deps warnings | NOT CHANGED — same reasoning as C3-F2/C4-F2/C5-F2/C6-F3/C7-F2/C8-F2/C9-F1/C10-F2/C11-F2/C13-F2; no observed misbehaviour, tests + build pass; fixing requires an in-window run |
| C15-F4 | Minor (accepted, unchanged) | Lazy editor chunk 622.04 kB (gzip 171.98) still trips Vite's 500 kB warning; dashboard index JS stays light at 247.41 kB | NOT CHANGED — code-split work is a larger change, deferred to an in-window run |
| C15-F5 | Note (no defect) | This run is again outside the auto-approval window (14:29 vs 10:28 WIB close), so per task step 1 it is audit-only; any fix cycle (incl. C15-F1) needs a fresh user go-ahead | RECORDED — no code change, no commit, no push this cycle; this entry left uncommitted |
| C15-F6 | Note (carried, awaiting user decision) | New-repo creation/selection for the STRUKTURA push (Cycle 14) is still pending: Vite base remains `/software-perhitungan-struktur/` until the new repository name is final; the old repo is abandoned per the user's 2026-10-31 13:35 decision, so the task body's old repo target is stale and no push was attempted | RECORDED — no push performed |

**Cycle 15 verdict:** no critical defects; solver numbers remain
correct. One NEW major-grade orchestration gap (C15-F1, ghost
combination terms silently dropped with no diagnostic — import-path
only) joins the open list; the failed-term variant (C15-F2) is
already guarded by the Cycle-12 diagnostics layer. The other open
items remain the documented minors (editor chunk size, lint flags,
2D/linear scope, localStorage-only persistence) plus the pending new
repository decision. No push performed.

---

## Cycle 16 — 2026-10-31 15:29 WIB (hourly audit, OUTSIDE auto-approval window — window ended 10:28 WIB)

**Mode:** AUDIT ONLY. No code changes, no local commit, no push. This
entry is the audit record itself (task step 5); it is left uncommitted
in the working tree, following the Cycle 9–11 / 13 / 15 precedent
(those entries were committed later together with an approved fix).

**Commands run:** `git status/log` (tree carries only the uncommitted
Cycle 15 entry; branch feature/struktura-engineering-platform, HEAD
51a92f3 = Cycle 14) · `npm test` · `npm run build` · `npm run lint` ·
UNSUPPORTED grep (src/struktura/report.ts only) · TODO/FIXME grep
(none in src/tests/benchmarks) · code read of `importProjectJSON`
(src/struktura/projects.ts), `isStructureModel` (src/lib/model.ts),
editor state init + `openInEditor` (src/App.tsx,
src/struktura/StrukturaRoot.tsx), combo term editing
(src/tabs/load/tools/load-combination-tool.tsx: Select dropdown),
`envelopeResults` (src/lib/analysis-pipeline.ts) · ad-hoc probe
tests (temporary test file, deleted after probing; tree unchanged
afterwards).

**Baseline evidence:** `npm test` **95/95 PASS** (unchanged from
Cycles 12–15: 10 sample/project + 8+8+7+6+6+7+8 cycle regressions + 7
design-sections + 21 benchmarks) · `npm run build` PASS (tsc + vite;
dist index JS 247.41 kB/gzip 79.12, CSS 61.85 kB/gzip 11.35, lazy
editor chunk 622.04 kB/gzip 171.98 — identical hashes to Cycle 14/15)
· `npm run lint` 37 problems (6 errors, 31 warnings), unchanged from
Cycles 6–15 · dist total 932,704 bytes, identical to Cycle 15.

**Release-criteria check:** project create/save/reopen covered by
tests/samples-projects.test.ts (10/10) · editor node/member/support
paths intact (no code touched) · truss/beam/frame analysis covered by
21 benchmark tests at ≤0.1% relative error, all passing ·
unimplemented scope marked UNSUPPORTED in src/struktura/report.ts
(2D linear static only; 3D, P-Delta, modal/response-spectrum and
geotechnical checks) · UI bundle sizes recorded above (dashboard
light; editor chunk >500 kB warning remains a known minor).

### New probes (this cycle, no fix applied — audit-only mode)
This cycle tested the reachability of C15-F1 (ghost combination
terms) and the import path's referential integrity, using a sample
project as the base model.
(A) Member referencing a ghost node: `importProjectJSON` ACCEPTS the
file (it checks only that the nodes/members/sections/supports/loads
collections exist), but the solver fails CLEANLY — `analyze` returns
`ok:false` with the named reason "Member m4 references a missing
node", no throw; `serviceResult` likewise returns `ok:false` with
"Case \"selfweight\" failed: Member m4 references a missing node".
(B) Point load referencing a ghost node: same pattern — import
accepts, solver returns `ok:false` with "Point load l12 references
missing node \"ghost-node\"", no throw. So the import path's
referential gaps are guarded at solver entry with named reasons,
not crash-class defects (browser display of those reasons was not
probed this cycle).
(C) A hand-edited project file carrying an extra `combinations` key
with a ghost term: the key SURVIVES `importProjectJSON` into the
stored model — but it can never reach `combineResults`, because load
cases and combinations are App `useState` only (src/App.tsx), reset
to DEFAULT_LOAD_CASES/DEFAULT_COMBINATIONS on every editor mount,
and `openInEditor` passes only model + meta (pending-model storage
is model-only). In-session, combo terms are edited via a Select
dropdown of existing cases, case delete trims combinations (Cycle 8),
and preset generation auto-creates any case kind a preset needs.
(D) Envelope with only stale (deleted) combo ids: `envelopeResults`
returns `null` without throwing — the null filter drops ids absent
from combo results, so no crash and no phantom envelope.

### Findings
| ID | Severity | Finding | Disposition |
|---|---|---|---|
| C16-F1 | Correction to C15-F1 (downgrade) | C15-F1's stated reachability ("imported/hand-edited files") does not hold: combinations are never persisted in project JSON, so a ghost combination term cannot arrive via project import, and the in-session UI cannot produce one either (dropdown-only term editing + case-delete trimming + preset auto-creation of needed cases). The silent-drop behaviour in `combineResults` itself is real, but it is latent API-level only — reachable today only by a direct API caller, not by a user through the UI or an imported file | NOT FIXED — audit-only mode. Reclassify C15-F1 from Major to latent/minor until combinations are persisted; then its fix candidate (import-time validation / diagnostics issue kind / dropped-term marker) becomes user-facing again. Do NOT weaken solver validation to "fix" it |
| C16-F2 | Note (guarded, no defect) | Import accepts referentially broken models (ghost node/member references) — but solver entry rejects them cleanly with named reasons and no throw, and the report path surfaces the reason; import-time referential validation would only move the same error earlier | NOT CHANGED — acceptable while the solver-entry guard holds; a future import validator is an in-window enhancement, not a repair |
| C16-F3 | Minor (accepted, unchanged) | Lint still 37 problems (6 errors, 31 warnings) — same baseline as Cycles 6–15 | NOT CHANGED — same reasoning as prior cycles |
| C16-F4 | Minor (accepted, unchanged) | Lazy editor chunk 622.04 kB (gzip 171.98) still trips Vite's 500 kB warning; dashboard index JS stays light at 247.41 kB | NOT CHANGED — code-split work deferred to an in-window run |
| C16-F5 | Note (no defect) | This run is again outside the auto-approval window (15:29 vs 10:28 WIB close), so per task step 1 it is audit-only; any fix cycle needs a fresh user go-ahead | RECORDED — no code change, no commit, no push this cycle; this entry left uncommitted |
| C16-F6 | Note (carried, awaiting user decision) | New-repo creation/selection for the STRUKTURA push (Cycle 14) is still pending: Vite base remains `/software-perhitungan-struktur/` until the new repository name is final; the old repo is abandoned per the user's 2026-10-31 13:35 decision, so the task body's old repo target is stale and no push was attempted | RECORDED — no push performed |

**Cycle 16 verdict:** no critical defects, no new user-reachable
defects. The headline result is a correction, not a regression:
C15-F1 is downgraded to latent/API-level because ghost combinations
cannot reach the combiner through import or the UI today, and the
import path's ghost references are rejected cleanly by the solver
with named reasons. The open list is now: the latent combiner gap
(C15-F1, downgraded), the accepted minors (editor chunk size, lint
flags, 2D/linear scope, localStorage-only persistence), plus the
pending new-repository decision. No push performed.

---

## Cycle 17 — 2026-10-31 16:29 WIB (hourly audit, OUTSIDE auto-approval window — window ended 10:28 WIB)

**Mode:** AUDIT ONLY. No code changes, no local commit, no push. This
entry is the audit record itself (task step 5); it is left uncommitted
in the working tree, following the Cycle 9–11 / 13 / 15 / 16 precedent
(those entries were committed later together with an approved fix).

**Commands run:** `git status/log` (tree carries only the uncommitted
Cycle 15–16 entries; branch feature/struktura-engineering-platform,
HEAD 51a92f3 = Cycle 14) · `npm test` · `npm run build` ·
`npm run lint` · UNSUPPORTED grep (src/struktura/report.ts only) ·
TODO/FIXME grep (none in src/tests/benchmarks) · benchmark tolerance
grep (0.1% rel. err. assertions in benchmarks/solver-benchmarks.test.ts)
· code read of `memberInternalForces` + the Cycle-7 summed-q recovery
(src/lib/solver.ts), the selfweight slice + zero-gamma warning
(src/lib/analysis-pipeline.ts, src/lib/analysis-diagnostics.ts),
and the Vite base (config/vite.config.ts) · ad-hoc probe tests
(temporary test file, deleted after probing; tree unchanged
afterwards).

**Baseline evidence:** `npm test` **95/95 PASS** (unchanged from
Cycles 12–16: 10 sample/project + 8+8+7+6+6+7+8 cycle regressions + 7
design-sections + 21 benchmarks) · `npm run build` PASS (tsc + vite;
dist index JS 247.41 kB/gzip 79.12, CSS 61.85 kB/gzip 11.35, lazy
editor chunk 622.04 kB/gzip 171.98 — identical hashes to Cycles
14–16) · `npm run lint` 37 problems (6 errors, 31 warnings),
unchanged from Cycles 6–16 · dist total 932,704 bytes, identical to
Cycles 15–16.

**Release-criteria check:** project create/save/reopen covered by
tests/samples-projects.test.ts (10/10) · editor node/member/support
paths intact (no code touched) · truss/beam/frame analysis covered by
21 benchmark tests at ≤0.1% relative error, all passing ·
unimplemented scope marked UNSUPPORTED in src/struktura/report.ts
(2D linear static only; 3D, P-Delta, modal/response-spectrum and
geotechnical checks) · UI bundle sizes recorded above (dashboard
light; editor chunk >500 kB warning remains a known minor).

### New probes (this cycle, no fix applied — audit-only mode)
Probed the diagram layer, the last display layer not yet probed after
the solver/case/combination/import layers of Cycles 2–16: does
`memberInternalForces` (the function behind the AFD/SFD/BMD drawers)
agree with the solver's own end forces? The benchmark suite checks
midspan UDL moment (45 kN·m) and end forces separately, never that
the interpolation reproduces the end forces at x=0/L or interior
point-load moments.
(A) UDL −10 kN/m on both members of a 6 m simply supported beam:
interpolation at x=0 and x=L reproduces (N1,V1,M1) and (N2,V2,M2)
to <1e-9 on both members — the Cycle-7 summed-q recovery and the
interpolation use the same total load, so diagrams cannot drift from
tabulated end forces for uniform loads.
(B) Trapezoidal load (0 → −10 kN/m on m1, −10 uniform on m2):
interpolation at x=L again matches (N2,V2,M2) to <1e-9 — the
trapezoid term (q2−q1)·x³/(6L) is consistent with the end forces.
(C) Point load −10 kN at the midspan node: quarter-point moment
from interpolation = 7.5 kN·m (analytic Px/2 = 5·1.5) and end moment
15 kN·m (PL/4), both within 0.1% — interior point-load diagrams are
correct, not just end values. All three probes passed; no diagram
finding. Code-read extra: the selfweight path already warns on
zero-gamma sections (`selfweight-zero-gamma` diagnostics kind), so a
section without density cannot silently drop its self-weight
unnoticed.

### Findings
| ID | Severity | Finding | Disposition |
|---|---|---|---|
| C17-F1 | Note (carried, latent) | C15-F1 remains downgraded per Cycle 16: ghost combination terms cannot reach `combineResults` through import or the UI today (combinations are App state only, never persisted); the silent-drop behaviour is latent/API-level only | NOT FIXED — audit-only mode; fix candidate unchanged (import-time validation / diagnostics issue kind / dropped-term marker) once combinations are persisted |
| C17-F2 | Minor (accepted, unchanged) | Lint still 37 problems (6 errors, 31 warnings) — same baseline as Cycles 6–16 | NOT CHANGED — same reasoning as prior cycles |
| C17-F3 | Minor (accepted, unchanged) | Lazy editor chunk 622.04 kB (gzip 171.98) still trips Vite's 500 kB warning; dashboard index JS stays light at 247.41 kB | NOT CHANGED — code-split work deferred to an in-window run |
| C17-F4 | Note (no defect) | This run is again outside the auto-approval window (16:29 vs 10:28 WIB close), so per task step 1 it is audit-only; any fix cycle needs a fresh user go-ahead | RECORDED — no code change, no commit, no push this cycle; this entry left uncommitted |
| C17-F5 | Note (carried, awaiting user decision) | New-repo creation/selection for the STRUKTURA push (Cycle 14) is still pending: Vite base remains `/software-perhitungan-struktur/` until the new repository name is final; the old repo is abandoned per the user's 2026-10-31 13:35 decision, so the task body's old repo target is stale and no push was attempted | RECORDED — no push performed |

**Cycle 17 verdict:** no critical defects, no new defect of any
severity — all three diagram-interpolation probes passed, and the
selfweight zero-gamma warning was confirmed as already guarding the
density-less-section path. The open list is unchanged: the latent
combiner gap (C15-F1, downgraded), the accepted minors (editor chunk
size, lint flags, 2D/linear scope, localStorage-only persistence),
plus the pending new-repository decision. No push performed.

---

## Cycle 18 — 2026-10-31 17:29 WIB (hourly audit, OUTSIDE auto-approval window — window ended 10:28 WIB)

**Mode:** AUDIT ONLY. No code changes, no local commit, no push. This
entry is the audit record itself (task step 5); it is left uncommitted
in the working tree, following the Cycle 9–11 / 13 / 15–17 precedent
(those entries were committed later together with an approved fix).

**Commands run:** `git status/log` (tree carries only the uncommitted
Cycle 15–17 entries; branch feature/struktura-engineering-platform,
HEAD 51a92f3 = Cycle 14) · `npm test` · `npm run build` ·
`npm run lint` · UNSUPPORTED grep (src/struktura/report.ts only) ·
TODO/FIXME grep (none in src/tests/benchmarks) · benchmark tolerance
grep (0.1% rel. err. assertions in benchmarks/solver-benchmarks.test.ts)
· code read of `importProjectJSON`/`exportProjectJSON`/`saveProject`
(src/struktura/projects.ts), the solver entry validation
(src/lib/solver.ts), and the UI import handler
(src/struktura/StrukturaRoot.tsx: handleImport) · ad-hoc probe tests
(temporary test files, deleted after probing; tree unchanged
afterwards — only docs/AUDIT_CYCLE.md remains modified).

**Baseline evidence:** `npm test` **95/95 PASS** (unchanged from
Cycles 12–17: 10 sample/project + 8+8+7+6+6+7+8 cycle regressions + 7
design-sections + 21 benchmarks) · `npm run build` PASS (tsc + vite;
dist index JS 247.41 kB/gzip 79.12, CSS 61.85 kB/gzip 11.35, lazy
editor chunk 622.04 kB/gzip 171.98 — identical hashes to Cycles
14–17) · `npm run lint` 37 problems (6 errors, 31 warnings),
unchanged from Cycles 6–17 · dist total 932,704 bytes, identical to
Cycles 15–17.

**Release-criteria check:** project create/save/reopen covered by
tests/samples-projects.test.ts (10/10) · editor node/member/support
paths intact (no code touched) · truss/beam/frame analysis covered by
21 benchmark tests at ≤0.1% relative error, all passing ·
unimplemented scope marked UNSUPPORTED in src/struktura/report.ts
(2D linear static only; 3D, P-Delta, modal/response-spectrum and
geotechnical checks) · UI bundle sizes recorded above (dashboard
light; editor chunk >500 kB warning remains a known minor).

### New probes (this cycle, no fix applied — audit-only mode)
Probed the project export/import layer, the last persistence layer not
yet probed after the solver/case/combination/diagram layers of Cycles
2–17 (the existing round-trip test covers an EMPTY model only).
(A) Populated model (sample 03-two-span: 3 nodes, 2 members, 3
supports, 2 UDLs): export → import round-trips exactly — fingerprint
unchanged, model deep-equal, re-solved reactions identical to 1e-9.
No finding.
(B) Tampered file (a load value changed, exported fingerprint kept):
`importProjectJSON` returns the STALE fingerprint
(fnv1a-f6879b47) while the model recomputes to fnv1a-920e7576 —
the function trusts the file's fingerprint field instead of
recomputing it. API-level only: the real UI import path
(StrukturaRoot handleImport) immediately passes the model through
`saveProject`, which recomputes the fingerprint, so the stale value
never reaches storage or reports through the UI. Noted under C18-F1.
(C) Ghost references through import: `importProjectJSON` itself
validates only top-level keys, so a hand-edited file with dangling
references imports without complaint — but the solver's Cycle-2
entry validation then fails loudly with a named reason in every
case probed: distributed load → ghost member
(`Distributed load l1 references missing member "ghost-member"`),
point load → ghost node
(`Point load l6 references missing node "ghost-node"`), member →
ghost node (`Member m22 references a missing node`). No silent
wrong numbers on this path. (An early probe variant that added a
spurious memberId to a POINT load returned ok:true — correctly, not
a defect: point loads carry nodeId, not memberId, so the extra field
is inert; the corrected distributed-load probe above is the valid
one.)
(D) UI-flow check: handleImport wraps import in try/catch and shows
the error string, so a rejected file surfaces to the user rather
than crashing.

### Findings
| ID | Severity | Finding | Disposition |
|---|---|---|---|
| C18-F1 | Note (API-level, guarded in UI flow) | `importProjectJSON` trusts a caller-supplied `fingerprint` string instead of recomputing it, so a hand-edited file can carry a fingerprint that no longer matches its model | NOT FIXED — audit-only mode; fix candidate for an in-window run: always recompute the fingerprint on import (one line), since no legitimate flow needs the stored value — the UI path already recomputes via `saveProject`, so this changes no user-visible behaviour today |
| C18-F2 | Note (guarded) | Import performs no referential-integrity validation (top-level keys only); dangling references are caught later, loudly, by solver entry validation with named reasons — no silent-drop path found on the import route | NOT CHANGED — acceptable while the solver guard holds; import-time validation would only fail earlier, not differently |
| C18-F3 | Minor (accepted, unchanged) | Lint still 37 problems (6 errors, 31 warnings) — same baseline as Cycles 6–17 | NOT CHANGED — same reasoning as prior cycles |
| C18-F4 | Minor (accepted, unchanged) | Lazy editor chunk 622.04 kB (gzip 171.98) still trips Vite's 500 kB warning; dashboard index JS stays light at 247.41 kB | NOT CHANGED — code-split work deferred to an in-window run |
| C18-F5 | Note (no defect) | This run is again outside the auto-approval window (17:29 vs 10:28 WIB close), so per task step 1 it is audit-only; any fix cycle needs a fresh user go-ahead | RECORDED — no code change, no commit, no push this cycle; this entry left uncommitted |
| C18-F6 | Note (carried, awaiting user decision) | New-repo creation/selection for the STRUKTURA push (Cycle 14) is still pending: Vite base remains `/software-perhitungan-struktur/` until the new repository name is final; the old repo is abandoned per the user's 2026-10-31 13:35 decision, so the task body's old repo target is stale and no push was attempted | RECORDED — no push performed |

**Cycle 18 verdict:** no critical defects, no new defect of any
severity — the populated export/import round-trip is exact, and
every ghost-reference variant fails loudly at the solver with a
named reason. The only new item is an API-level note (C18-F1, stale
fingerprint trusted by `importProjectJSON`, neutralised in the real
UI flow by `saveProject`). The open list is otherwise unchanged:
the latent combiner gap (C15-F1, downgraded), the accepted minors
(editor chunk size, lint flags, 2D/linear scope,
localStorage-only persistence), plus the pending new-repository
decision. No push performed.

---

## Cycle 19 — 2026-10-31 18:29 WIB (hourly audit, OUTSIDE auto-approval window — window ended 10:28 WIB)

**Mode:** AUDIT ONLY. No code changes, no local commit, no push. This
entry is the audit record itself (task step 5); it is left uncommitted
in the working tree, following the Cycle 9–11 / 13 / 15–18 precedent
(those entries were committed later together with an approved fix).

**Commands run:** `git status/log` (tree carries only the uncommitted
Cycle 15–18 entries; branch feature/struktura-engineering-platform,
HEAD 51a92f3 = Cycle 14) · `npm test` · `npm run build` ·
`npm run lint` · UNSUPPORTED grep (src/struktura/report.ts only) ·
TODO/FIXME grep (none in src/tests/benchmarks) · benchmark tolerance
grep (0.1% rel. err. assertions in benchmarks/solver-benchmarks.test.ts)
· code read of `solveCase` (src/lib/analysis-pipeline.ts),
`serviceResult` (src/struktura/service-result.ts), the locked
selfweight case (src/lib/load-cases.ts), the load-case selector
(src/tabs/load/tools/point-load-tool.tsx + case-selector-row.tsx) and
`runDiagnostics` (src/lib/analysis-diagnostics.ts) · ad-hoc probe
tests (temporary test file, deleted after probing; tree state
afterwards = Cycle 15–18 entries + this entry only).

**Baseline evidence:** `npm test` **95/95 PASS** (unchanged from
Cycles 12–18: 10 sample/project + 8+8+7+6+6+7+8 cycle regressions + 7
design-sections + 21 benchmarks) · `npm run build` PASS (tsc + vite;
dist index JS 247.41 kB/gzip 79.12, CSS 61.85 kB/gzip 11.35, lazy
editor chunk 622.04 kB/gzip 171.98 — identical hashes to Cycles
14–18) · `npm run lint` 37 problems (6 errors, 31 warnings),
unchanged from Cycles 6–18 · dist total 932,704 bytes, identical to
Cycles 15–18.

**Release-criteria check:** project create/save/reopen covered by
tests/samples-projects.test.ts (10/10) · editor node/member/support
paths intact (no code touched) · truss/beam/frame analysis covered by
21 benchmark tests at ≤0.1% relative error, all passing ·
unimplemented scope marked UNSUPPORTED in src/struktura/report.ts
(2D linear static only; 3D, P-Delta, modal/response-spectrum and
geotechnical checks) · UI bundle sizes recorded above (dashboard
light; editor chunk >500 kB warning remains a known minor).

### New probes (this cycle, no fix applied — audit-only mode)
Probed the selfweight case slice, the last case-slicing behaviour
not yet probed after Cycles 7/8/11/15 (load dropping, cascades,
combiner). Model: simply supported 6 m beam (pin + roller),
section γ = 78.5 kN/m³, A = 5000 mm² → synthesized w = 0.3925 kN/m.
(A) `solveCase(model, "selfweight")` with no user loads returns
Ry = 1.1775 kN per end — the γ·A math is exact (γ·A·L/2). No finding.
(B) The same model plus a user −12 kN midspan point load tagged
`loadCaseId: "selfweight"`: `solveCase` still returns Ry = 1.1775
kN per end — the user load contributes NOTHING, because the
selfweight branch replaces the entire load record with synthesized
body-force loads instead of filtering by case. The −12 kN load is
silently dropped with `ok:true`. (B2) The report path drops it too:
`serviceResult` builds its case set from the model's load case ids,
so the load lands in the selfweight solve and vanishes from the
one-click report as well. (C) No diagnostic names the dropped load:
`runDiagnostics` with a live selfweight case record reports no issue
mentioning the load id — and the Cycle-8 orphan warning cannot fire
either, because "selfweight" IS a live case. (D) Control: the same
load tagged "dead" solves normally (Ry = 6 kN per end), so the drop
is specific to the selfweight slice, not to the load itself.
Reachability, checked by code read: the normal UI cannot produce
this state — the load tools' case selector passes `excludeLocked`
and the selfweight case is `locked: true` — but the import path can:
bare-model and project imports validate only top-level keys
(Cycles 16/18), so a hand-edited or third-party file carrying a
`selfweight`-tagged user load reaches the drop silently. Same
silent-drop failure class as C2-F1/C7-F1/C8-F1, now at the
case-slice layer; unlike C15-F1 (downgraded in Cycle 16 as
unreachable), this one IS reachable via import.

### Findings
| ID | Severity | Finding | Disposition |
|---|---|---|---|
| C19-F1 | Major (import-path only — normal UI use cannot produce it) | User loads tagged `loadCaseId: "selfweight"` are silently dropped: `solveCase("selfweight")` replaces all loads with synthesized γ·A body forces, so an imported user load in that case contributes nothing to the case solve or to the one-click report, with `ok:true` and no diagnostic naming it | NOT FIXED — audit-only mode. Fix candidate for an in-window run: add a diagnostics issue kind for user loads assigned to the locked selfweight case (the Cycle-8 orphan pattern, extended to locked cases), and/or reassign such loads to "dead" with a warning on import. Do NOT fix by folding user loads into the synthesized selfweight slice without a product decision — the selfweight case is defined as body force only |
| C19-F2 | Note (carried) | C18-F1 (stale fingerprint trusted by `importProjectJSON`, neutralised in the UI flow by `saveProject`) still open | NOT FIXED — audit-only mode; fix candidate unchanged (recompute on import) |
| C19-F3 | Note (carried, latent) | C15-F1 remains downgraded per Cycle 16: ghost combination terms cannot reach `combineResults` through import or the UI today (combinations are App state only, never persisted) | NOT FIXED — audit-only mode; fix candidate unchanged |
| C19-F4 | Minor (accepted, unchanged) | Lint still 37 problems (6 errors, 31 warnings) — same baseline as Cycles 6–18 | NOT CHANGED — same reasoning as prior cycles |
| C19-F5 | Minor (accepted, unchanged) | Lazy editor chunk 622.04 kB (gzip 171.98) still trips Vite's 500 kB warning; dashboard index JS stays light at 247.41 kB | NOT CHANGED — code-split work deferred to an in-window run |
| C19-F6 | Note (no defect) | This run is again outside the auto-approval window (18:29 vs 10:28 WIB close), so per task step 1 it is audit-only; any fix cycle (incl. C19-F1) needs a fresh user go-ahead | RECORDED — no code change, no commit, no push this cycle; this entry left uncommitted |
| C19-F7 | Note (carried, awaiting user decision) | New-repo creation/selection for the STRUKTURA push (Cycle 14) is still pending: Vite base remains `/software-perhitungan-struktur/` until the new repository name is final; the old repo is abandoned per the user's 2026-10-31 13:35 decision, so the task body's old repo target is stale and no push was attempted | RECORDED — no push performed |

**Cycle 19 verdict:** no critical defects; solver numbers for normal
UI use remain correct. One NEW import-path silent-drop gap (C19-F1)
joins the open list — it does not affect loads created in the UI
(selfweight is locked out of the case selector), but an imported
file can lose a user load without any warning, including from the
one-click report. The other open items are unchanged: the
API-level fingerprint note (C18-F1), the latent combiner gap
(C15-F1, downgraded), the accepted minors (editor chunk size, lint
flags, 2D/linear scope, localStorage-only persistence), plus the
pending new-repository decision. No push performed.

---

## Cycle 20 — 2026-10-31 19:29 WIB (hourly audit, OUTSIDE auto-approval window — window ended 10:28 WIB)

**Mode:** AUDIT ONLY. No code changes, no local commit, no push. This
entry is the audit record itself (task step 5); it is left uncommitted
in the working tree, following the Cycle 9–11 / 13 / 15–19 precedent
(those entries were committed later together with an approved fix).

**Commands run:** `git status/log` (tree carries only the uncommitted
Cycle 15–19 entries; branch feature/struktura-engineering-platform,
HEAD 51a92f3 = Cycle 14) · `npm test` · `npm run build` · `npm run
lint` · UNSUPPORTED grep (src/struktura/report.ts only) · TODO/FIXME
grep (none in src/tests/benchmarks) · benchmark tolerance grep
(0.1% rel. err. assertions in benchmarks/solver-benchmarks.test.ts)
· code read of `combineResults`/`solveCase` (src/lib/
analysis-pipeline.ts) and the combination type (src/lib/load-cases.ts)
· ad-hoc probe tests (temporary test file, deleted after probing;
tree state afterwards = Cycle 15–19 entries + this entry only).

**Baseline evidence:** `npm test` **95/95 PASS** (unchanged from
Cycles 12–19: 10 sample/project + 8+8+7+6+6+7+8 cycle regressions + 7
design-sections + 21 benchmarks) · `npm run build` PASS (tsc + vite;
dist index JS 247.41 kB/gzip 79.12, CSS 61.85 kB/gzip 11.35, lazy
editor chunk 622.04 kB/gzip 171.98 — identical hashes to Cycles
14–19) · `npm run lint` 37 problems (6 errors, 31 warnings),
unchanged from Cycles 6–19 · dist total 932,704 bytes, identical to
Cycles 15–19.

**Release-criteria check:** project create/save/reopen covered by
tests/samples-projects.test.ts (10/10) · editor node/member/support
paths intact (no code touched) · truss/beam/frame analysis covered by
21 benchmark tests at ≤0.1% relative error, all passing ·
unimplemented scope marked UNSUPPORTED in src/struktura/report.ts
(2D linear static only; 3D, P-Delta, modal/response-spectrum and
geotechnical checks) · UI bundle sizes recorded above (dashboard
light; editor chunk >500 kB warning remains a known minor).

### New probes (this cycle, no fix applied — audit-only mode)
Probed the load-combination layer, the last pipeline layer not yet
probed after Cycles 7/8/11/15/19 (load dropping, cascades,
combiner ghosts, selfweight slice). Model: simply supported 6 m beam
(pin + roller), −12 kN midspan point load in case "dead", −6 kN in
case "live". (A) Per-case solves are exact (Ry = 6 kN and 3 kN per
end). (B) `combineResults` with 1.2·dead + 1.6·live returns Ry =
12 kN per end (1.2×6 + 1.6×3, exact) and a midspan deflection equal
to 1.2·v_dead + 1.6·v_live — linear superposition is exact, no
scaling or factor error. (C) A combination referencing only a
failed case returns `null` (no fabricated combo result). Two
non-findings; no new defect this cycle. The documented
valid-plus-missing-term silent drop in `combineResults` (C15-F1
lineage) was not re-litigated: combinations remain App state only,
never persisted, so the ghost-term route stays unreachable via
import or the UI.

### Findings
| ID | Severity | Finding | Disposition |
|---|---|---|---|
| C20-F1 | Major (carried, import-path only) | C19-F1 still open: user loads tagged `loadCaseId: "selfweight"` silently dropped by the selfweight case slice (normal UI use cannot produce it; import path can) | NOT FIXED — audit-only mode. Fix candidate unchanged from Cycle 19: diagnostics issue kind for user loads on the locked selfweight case, and/or reassignment to "dead" with a warning on import |
| C20-F2 | Note (carried) | C18-F1 (stale fingerprint trusted by `importProjectJSON`, neutralised in the UI flow by `saveProject`) still open | NOT FIXED — audit-only mode; fix candidate unchanged (recompute on import) |
| C20-F3 | Note (carried, latent) | C15-F1 remains downgraded per Cycle 16: ghost combination terms cannot reach `combineResults` through import or the UI today (combinations are App state only, never persisted) | NOT FIXED — audit-only mode; fix candidate unchanged |
| C20-F4 | Minor (accepted, unchanged) | Lint still 37 problems (6 errors, 31 warnings) — same baseline as Cycles 6–19 | NOT CHANGED — same reasoning as prior cycles |
| C20-F5 | Minor (accepted, unchanged) | Lazy editor chunk 622.04 kB (gzip 171.98) still trips Vite's 500 kB warning; dashboard index JS stays light at 247.41 kB | NOT CHANGED — code-split work deferred to an in-window run |
| C20-F6 | Note (no defect) | This run is again outside the auto-approval window (19:29 vs 10:28 WIB close), so per task step 1 it is audit-only; any fix cycle (incl. C19-F1) needs a fresh user go-ahead | RECORDED — no code change, no commit, no push this cycle; this entry left uncommitted |
| C20-F7 | Note (carried, awaiting user decision) | New-repo creation/selection for the STRUKTURA push (Cycle 14) is still pending: Vite base remains `/software-perhitungan-struktur/` until the new repository name is final; the old repo is abandoned per the user's 2026-10-31 13:35 decision, so the task body's old repo target is stale and no push was attempted | RECORDED — no push performed |

**Cycle 20 verdict:** no critical defects; no new defect of any
severity — load-combination scaling is exact and a failed-only
combination returns null rather than a fabricated result. The open
list is unchanged: one import-path silent-drop gap (C19-F1), the
API-level fingerprint note (C18-F1), the latent combiner gap
(C15-F1, downgraded), the accepted minors (editor chunk size, lint
flags, 2D/linear scope, localStorage-only persistence), plus the
pending new-repository decision. No push performed.

---

## Cycle 21 — 2026-10-31 20:29 WIB (hourly audit, OUTSIDE auto-approval window — window ended 10:28 WIB)

**Mode:** AUDIT ONLY. No code changes, no local commit, no push. This
entry is the audit record itself (task step 5); it is left uncommitted
in the working tree, following the Cycle 9–11 / 13 / 15–20 precedent
(those entries were committed later together with an approved fix).

**Commands run:** `git status/log` (tree carries only the uncommitted
Cycle 15–20 entries; branch feature/struktura-engineering-platform,
HEAD 51a92f3 = Cycle 14) · `npm test` · `npm run build` · `npm run
lint` · UNSUPPORTED grep (src/struktura/report.ts only) · TODO/FIXME
grep (none in src/tests/benchmarks) · benchmark tolerance grep
(0.1% rel. err. assertions in benchmarks/solver-benchmarks.test.ts)
· code read of `importProjectJSON` (src/struktura/projects.ts),
`isStructureModel` + `deleteNode`/`deleteMember` (src/lib/model.ts),
and the solver entry validation (src/lib/solver.ts, lines 249–372)
· ad-hoc probe tests (temporary test file, deleted after probing;
tree state afterwards = Cycle 15–20 entries + this entry only).

**Baseline evidence:** `npm test` **95/95 PASS** (unchanged from
Cycles 12–20: 10 sample/project + 8+8+7+6+6+7+8 cycle regressions + 7
design-sections + 21 benchmarks) · `npm run build` PASS (tsc + vite;
dist index JS 247.41 kB/gzip 79.12, CSS 61.85 kB/gzip 11.35, lazy
editor chunk 622.04 kB/gzip 171.98 — identical hashes to Cycles
14–20) · `npm run lint` 37 problems (6 errors, 31 warnings),
unchanged from Cycles 6–20 · dist total 932,704 bytes, identical to
Cycles 15–20.

**Release-criteria check:** project create/save/reopen covered by
tests/samples-projects.test.ts (10/10) · editor node/member/support
paths intact (no code touched) · truss/beam/frame analysis covered by
21 benchmark tests at ≤0.1% relative error, all passing ·
unimplemented scope marked UNSUPPORTED in src/struktura/report.ts
(2D linear static only; 3D, P-Delta, modal/response-spectrum and
geotechnical checks) · UI bundle sizes recorded above (dashboard
light; editor chunk >500 kB warning remains a known minor).

### New probes (this cycle, no fix applied — audit-only mode)
Probed the import path's referential integrity, the one import-path
gap not yet probed after Cycles 16/18/19 (fingerprint trust,
selfweight-tagged loads). Model: simply supported 6 m beam, −12 kN
midspan point load in case "dead". (A) `importProjectJSON` accepts a
project whose member m2 references ghost node `gx` — import
validation checks top-level keys only, as documented in Cycles 16/18
— BUT the solver entry validation rejects it with the named reason
"Member m2 references a missing node", and `mergeSolverFailures`
surfaces it as a `solver-failure` error forcing status `unstable`.
(B) Same pattern for a member referencing ghost section `sx`
("references missing section") and a support referencing ghost node
`gx` ("references missing node"): both named rejections, no silent
drop. (C) Editor `deleteNode` cascades correctly by code read +
probe: deleting n2 removes both attached members and the point load
on it; deleting n1 removes its support and the attached member.
Three non-findings; no new defect this cycle. The distinction from
C19-F1 is now explicit: ghost references are caught by solver entry
validation, whereas a `selfweight`-tagged user load is NOT — it is a
well-formed load in a locked case, so only the selfweight slice's
replace-all behaviour drops it, which is why C19-F1 stays open while
this probe closes the ghost-reference question.

### Findings
| ID | Severity | Finding | Disposition |
|---|---|---|---|
| C21-F1 | Major (carried, import-path only) | C19-F1 still open: user loads tagged `loadCaseId: "selfweight"` silently dropped by the selfweight case slice (normal UI use cannot produce it; import path can) | NOT FIXED — audit-only mode. Fix candidate unchanged from Cycles 19–20: diagnostics issue kind for user loads on the locked selfweight case, and/or reassignment to "dead" with a warning on import |
| C21-F2 | Note (carried) | C18-F1 (stale fingerprint trusted by `importProjectJSON`, neutralised in the UI flow by `saveProject`) still open | NOT FIXED — audit-only mode; fix candidate unchanged (recompute on import) |
| C21-F3 | Note (carried, latent) | C15-F1 remains downgraded per Cycle 16: ghost combination terms cannot reach `combineResults` through import or the UI today (combinations are App state only, never persisted) | NOT FIXED — audit-only mode; fix candidate unchanged |
| C21-F4 | Note (closed by probe, no defect) | Imported ghost references (member→node, member→section, support→node) are NOT silent drops: solver entry validation rejects each with a named reason and diagnostics forces `unstable` | CLOSED — no action; contrast with C21-F1, which is not caught by that validation |
| C21-F5 | Minor (accepted, unchanged) | Lint still 37 problems (6 errors, 31 warnings) — same baseline as Cycles 6–20 | NOT CHANGED — same reasoning as prior cycles |
| C21-F6 | Minor (accepted, unchanged) | Lazy editor chunk 622.04 kB (gzip 171.98) still trips Vite's 500 kB warning; dashboard index JS stays light at 247.41 kB | NOT CHANGED — code-split work deferred to an in-window run |
| C21-F7 | Note (no defect) | This run is again outside the auto-approval window (20:29 vs 10:28 WIB close), so per task step 1 it is audit-only; any fix cycle (incl. C21-F1) needs a fresh user go-ahead | RECORDED — no code change, no commit, no push this cycle; this entry left uncommitted |
| C21-F8 | Note (carried, awaiting user decision) | New-repo creation/selection for the STRUKTURA push (Cycle 14) is still pending: Vite base remains `/software-perhitungan-struktur/` until the new repository name is final; the old repo is abandoned per the user's 2026-10-31 13:35 decision, so the task body's old repo target is stale and no push was attempted | RECORDED — no push performed |

**Cycle 21 verdict:** no critical defects; no new defect of any
severity — the import path's ghost-reference question is closed with
a guarded result, and the editor's node-delete cascade is confirmed
correct. The open list is unchanged except for that closure: one
import-path silent-drop gap (C19-F1, now C21-F1), the API-level
fingerprint note (C18-F1), the latent combiner gap (C15-F1,
downgraded), the accepted minors (editor chunk size, lint flags,
2D/linear scope, localStorage-only persistence), plus the pending
new-repository decision. No push performed.

## Cycle 22 — 2026-10-31 21:00 WIB (C19-F1 fix, USER-APPROVED — user said "Perbaiki C19-F1 sekarang" at 20:57 WIB)

**Mode:** FIX. The user explicitly approved fixing C19-F1, so this run
applies the fix, adds regression tests, and commits everything locally
(including the previously uncommitted Cycle 15–21 audit entries). No
push — the push still waits for the user's GitHub card tap, and the
target repo itself is the new-repo decision still pending (Cycle 14).

**The fix (diagnostics layer only — solver semantics deliberately
unchanged):**
1. `src/lib/load-cases.ts` — new structurally-typed helper
   `findSelfweightCaseLoadIds(loads)` beside `findOrphanedLoadIds`:
   returns the ids of persisted user loads tagged
   `loadCaseId: "selfweight"`.
2. `src/lib/analysis-diagnostics.ts` — new issue kind
   `{ kind: "selfweight-case-loads"; severity: "warning"; loadIds }`.
   `runDiagnostics` emits it when the caller supplies the live case
   record AND the "selfweight" case exists in it. Mutually exclusive
   with `orphaned-loads` by construction: if the selfweight case is
   absent from the record, the same loads are reported as orphans
   instead (covered by a regression test). Warning, not error — every
   other case still solves correctly; the defect was the silence, not
   the numbers.
3. `src/components/analysis-issues-dialog.tsx` — new `messageFor`
   case naming the load ids verbatim and stating the remedy
   (reassign to another case, e.g. Dead): the Selfweight case is
   solved from synthesized body forces (γ·A) only, so the loads are
   excluded from every analysis and from the report.

**UI path:** App already runs `runDiagnostics(model, loadCases)`
reactively on every model change (status-bar STATUS pill + issues
dialog via the merged report), and an imported project model lands in
exactly that state with `DEFAULT_LOAD_CASES()` as the live record —
so the warning surfaces for imported files with no import-path code
change. `importProjectJSON` has no warnings channel (it throws on
hard errors only) and its signature was left untouched.

**Explicitly NOT done (per the audit's forbidden list):** user loads
are NOT folded into the synthesized selfweight slice (the case is
body force only by definition), NOT silently reassigned to "dead",
NOT deleted; no solver validation from Cycles 2/4/5/6/8/12 was
weakened; no tests deleted; type-check not disabled.

**Regression tests** (`tests/cycle22-regressions.test.ts`, 8 tests):
(a) a model with a −12 kN load tagged "selfweight" produces the new
warning naming that load id, with no fabricated error and status
still determinate; (b) normal models (loads in dead, no loads,
model-only call without a case record) produce NO such issue, and a
missing selfweight case routes the load to `orphaned-loads` instead;
(c) synthesized selfweight behaviour unchanged — Ry = 1.1775 kN per
end (γ·A exact, the Cycle-19 probe numbers) with and without the
tagged load, reactions bit-identical, while the same load tagged
"dead" solves normally at Ry = 6 kN per end; (d) end-to-end import
path — a project JSON carrying the tagged load round-trips through
`exportProjectJSON`/`importProjectJSON` and the warning fires on the
imported model against the App's live case record.

**Verification (real runs):** before — `npm test` 95/95 PASS,
`npm run build` PASS, `npm run lint` 37 problems (6 errors,
31 warnings). After — `npm test` **103/103 PASS** (95 + 8 new, none
removed), `npm run build` PASS (tsc strict + vite; index JS
247.41 kB unchanged, editor chunk 622.72 kB, +0.68 kB for the new
dialog copy), `npm run lint` **37 problems (6 errors, 31 warnings)**
— baseline unchanged.

### Findings
| ID | Severity | Finding | Disposition |
|---|---|---|---|
| C22-F1 | Major (import-path only) | C19-F1: user loads tagged `loadCaseId: "selfweight"` silently dropped by the selfweight case slice | **FIXED** — diagnostics now names the affected load ids via the new `selfweight-case-loads` warning (helper + issue kind + dialog message); 8 regression tests; solve semantics intentionally unchanged |
| C22-F2 | Note (carried) | C18-F1 (stale fingerprint trusted by `importProjectJSON`, neutralised in the UI flow by `saveProject`) still open | NOT FIXED — out of this fix's approved scope; fix candidate unchanged (recompute on import) |
| C22-F3 | Note (carried, latent) | C15-F1 remains downgraded per Cycle 16: ghost combination terms cannot reach `combineResults` through import or the UI today | NOT FIXED — fix candidate unchanged |
| C22-F4 | Minor (accepted, unchanged) | Lint still 37 problems (6 errors, 31 warnings) — same baseline as Cycles 6–21 | NOT CHANGED — same reasoning as prior cycles |
| C22-F5 | Minor (accepted, unchanged) | Lazy editor chunk 622.72 kB still trips Vite's 500 kB warning; dashboard index JS stays light at 247.41 kB | NOT CHANGED — code-split work deferred |
| C22-F6 | Note (carried, awaiting user decision) | New-repo creation/selection for the STRUKTURA push (Cycle 14) is still pending: Vite base remains `/software-perhitungan-struktur/` until the new repository name is final | RECORDED — no push performed |

**Cycle 22 verdict:** C19-F1 is closed. The one remaining import-path
silent-drop class from the audit chain (C2-F1 → C7-F1 → C8-F1 →
C10-F1 → C19-F1) now has a named diagnostic at every layer: solver
entry validation (Cycles 2/4/5/6), orphan warning (Cycle 8), solver
failure surfacing (Cycle 12), and locked-case load warning
(Cycle 22). Open list: C18-F1 (API-level fingerprint note), C15-F1
(latent, downgraded), the accepted minors, and the pending new-repo
decision. Local commit only; no push.

## Cycle 23 — 2026-10-31 21:29 WIB (hourly audit, AUDIT-ONLY)

**Mode:** AUDIT-ONLY. This run is outside the user's auto-approval
window (21:29 vs 10:28 WIB close), so per the task step 1 it applies
no fix, no commit, and no push. Baseline re-verified from the Cycle 22
commit (002f858) on branch `feature/struktura-engineering-platform`;
working tree clean before and after this run.

**Baseline evidence:** `npm test` **103/103 PASS** (12 files: 10
sample/project + 8+8+7+6+6+7+8 cycle regressions + 7 design-sections +
21 benchmarks) · `npm run build` PASS (tsc strict + vite; index JS
247.41 kB/gzip 79.12, CSS 61.85 kB/gzip 11.35, lazy editor chunk
622.72 kB/gzip 172.14 — identical to Cycle 22) · `npm run lint` 37
problems (6 errors, 31 warnings), unchanged from Cycles 6–22 · dist
total 933,384 bytes (Cycle 21's 932,704 + Cycle 22's +0.68 kB editor
chunk, consistent — not a regression).

**Release-criteria check:** project create/save/reopen covered by
tests/samples-projects.test.ts (10/10) · editor node/member/support
paths intact (no code touched) · truss/beam/frame analysis covered by
21 benchmark tests at ≤0.1% relative error, all passing ·
unimplemented scope marked UNSUPPORTED in src/struktura/report.ts
(2D linear static only; 3D, P-Delta, modal/response-spectrum and
geotechnical checks) · UI bundle sizes recorded above (dashboard
light; editor chunk >500 kB warning remains a known minor).

### New probes (this cycle, no fix applied — audit-only mode)
Probed two areas not yet covered by the audit chain: section-delete
cascade edges and export/import round-trip fidelity. Model: simply
supported 6 m beam, custom section, as in the Cycle 7 harness.
(A) `deleteSection` of the LAST section: members are reassigned to
`undefined` (fallback = first remaining key, of which there is none)
— but `analyze` does NOT throw: solver entry validation's
referential check fires first and returns the named reason
"references missing section". (B) `deleteSection` of one of two
sections reassigns its members to the remaining section and the model
still solves ok:true. (C) `exportProjectJSON` →
`importProjectJSON` round-trip of a model carrying a distributed
−10 kN/m load, a point load in case "live", and a custom section:
model deep-equal, fingerprint preserved verbatim (which is exactly
the carried C18-F1 trust behaviour, not a new defect), and reactions
bit-identical before/after. (D) Uniform −10 kN/m load on a TRUSS
member (memberType "truss"): carried, not dropped — reactions
Ry = 30 kN each end, exact equilibrium for 60 kN total, consistent
with the solver comment "now applies to trusses too post-v1.0.4".
Four probes, four guarded results; no new defect this cycle.
(Temporary probe file deleted after the run; tree state afterwards =
this entry only.)

### Findings
| ID | Severity | Finding | Disposition |
|---|---|---|---|
| C23-F1 | Note (carried) | C18-F1 (stale fingerprint trusted by `importProjectJSON`, neutralised in the UI flow by `saveProject`) still open; probe (C) re-confirms the verbatim preservation | NOT FIXED — audit-only mode; fix candidate unchanged (recompute on import) |
| C23-F2 | Note (carried, latent) | C15-F1 remains downgraded per Cycle 16: ghost combination terms cannot reach `combineResults` through import or the UI today | NOT FIXED — audit-only mode; fix candidate unchanged |
| C23-F3 | Minor (accepted, unchanged) | Lint still 37 problems (6 errors, 31 warnings) — same baseline as Cycles 6–22 | NOT CHANGED — same reasoning as prior cycles |
| C23-F4 | Minor (accepted, unchanged) | Lazy editor chunk 622.72 kB (gzip 172.14) still trips Vite's 500 kB warning; dashboard index JS stays light at 247.41 kB | NOT CHANGED — code-split work deferred to an in-window run |
| C23-F5 | Note (carried, awaiting user decision) | New-repo creation/selection for the STRUKTURA push (Cycle 14) is still pending: Vite base remains `/software-perhitungan-struktur/` until the new repository name is final; the old repo is abandoned per the user's 2026-10-31 13:35 decision, so the task body's old repo target is stale and no push was attempted | RECORDED — no push performed |
| C23-F6 | Note (pending user decision, NOT in tree) | Indonesian UI default (user decision 2026-10-31 21:27, slated as "Siklus 23" in the standing notes) is NOT yet implemented: grep for Indonesian UI terms (Simpul/Tumpuan/Beban Mati) in src/ + index.html returns 0 hits — the UI is still English. Translation is a fix, not an audit action, so it is out of this run's scope | RECORDED — needs a fresh user go-ahead (outside the auto-approval window); numbering note: this audit entry occupies the Cycle 23 slot, so the translation run should take the next cycle number or reconcile the numbering to avoid a duplicate Cycle 23 |
| C23-F7 | Note (closed by probe, no defect) | Section-delete edges are guarded: last-section delete yields a named solver rejection without throwing; normal delete reassigns members and still solves | CLOSED — no action |
| C23-F8 | Note (closed by probe, no defect) | Export/import round-trip is faithful (model, loads, custom section, reactions) and truss-member distributed loads are carried with exact equilibrium | CLOSED — no action |
| C23-F9 | Note (no defect) | This run is again outside the auto-approval window (21:29 vs 10:28 WIB close), so per task step 1 it is audit-only; any fix cycle (incl. C23-F6 translation) needs a fresh user go-ahead | RECORDED — no code change, no commit, no push this cycle; this entry left uncommitted |

**Cycle 23 verdict:** no critical defects; no new defect of any
severity — the section-delete cascade and the export/import path
both close with guarded results, and the truss distributed-load
question is closed with exact equilibrium. The open list is
unchanged except for one newly recorded pending item: C18-F1
(API-level fingerprint note), C15-F1 (latent, downgraded), the
accepted minors (editor chunk size, lint flags, 2D/linear scope,
localStorage-only persistence), the pending new-repository decision,
and the pending Indonesian-UI translation decision. No push
performed.

## Cycle 24 — Bahasa Indonesia as default UI language (user instruction)

**Trigger:** user instruction Sat 2026-10-31 21:27 WIB ("buat bahasa
indonesia untuk default"), resolving the pending C23-F6 decision.
**Numbering:** this run takes Cycle 24 because the hourly audit run at
21:29 WIB already occupied the Cycle 23 slot with an audit-only entry
(included unmodified in this same commit — not overwritten or
renumbered).

**Scope:** every user-visible UI string translated to natural,
professional Bahasa Indonesia, hardcoded (no i18n framework, no new
dependency, no language toggle — UI stays simple and light):
dashboard shell and new-project form, all 7 sample project titles /
descriptions / expected texts, editor tabs and toolbar tools,
status bar, all model / material / load / analyze / design side
panels and flyouts, template modals (beam / frame / truss) and the
example loader, analysis-issues dialog (including the Cycle-22
selfweight warning and the Cycle-12 "Analysis failed" wrapper),
design-run issue strings surfaced on the canvas, the print/report
generator (headings, table headers, load-type and location cells,
support-type labels, warnings/limitations, approval block), and
`index.html` (`lang="id"`, Indonesian title/meta). Terminology
applied consistently: simpul, elemen, tumpuan, sendi, rol, jepit,
beban titik, beban merata, reaksi, momen, geser, aksial,
lendutan/deformasi, bentang, penampang, kombinasi beban.

**Unchanged by design:** internal IDs and enum values (`loadCaseId`
values `"dead"`/`"selfweight"`/…, `TabType`, tool ids, issue `kind`
strings, `DesignReport` ids, localStorage keys, export filenames);
solver math and all numeric formatting of engineering outputs
(decimal dots kept, including in prose such as `K = 1.0` and
`0 < ν < 0.5`, because inputs parse with `parseFloat`); SNI
references and clause numbers; every numeric fact in sample texts.
Scope statements render as "TIDAK DIDUKUNG (UNSUPPORTED)" so the
`UNSUPPORTED` substring assertion still passes. Solver `reason`
strings stay verbatim English (surfaced verbatim in diagnostics per
Cycle 12), as do standard/code titles ("SNI 1727:2020",
"ACI 318-25", "AISC 360"), kind abbreviations (D/L/Lr/W/E/R),
notation (D/C, φMn, "O/S"), section designations (IWF/RHS/CHS),
and engine-generated classification values (`sectionClass`,
`bucklingMode`, `axialClass`, governing `equation`, steel
`warnings`/`notes`, RC `ArrangementCheck.text` / transverse notes /
spacing-row labels such as "Tie spacing").

**Defect found and fixed during this run:** the pre-existing
translation batch had dropped the closing `}` of a JSX expression
in `src/tabs/model/tools/material/advanced-panel.tsx` (Row label
`title`), breaking the build; bisected against HEAD and repaired —
the rebuilt file is byte-verified against the intended strings and
the build passes.

**Tests updated (none deleted):** `tests/cycle1-regressions.test.ts`
(`'Imported Model'` → `'Model Impor'`) and
`tests/samples-projects.test.ts` (import-error regexes
`/not valid JSON/` → `/bukan JSON yang valid/`,
`/missing meta\/model/` → `/meta\/model tidak ada/`).

**Verification:** `npm test` 103/103 PASS, `npm run build` PASS,
`npm run lint` 37 problems (6 errors + 31 warnings — the accepted
baseline, unchanged). Final `src/` sweep for leftover English UI
words (Projects, Members, Nodes, Analyze, Design, Load sample, No
saved projects) returns no user-visible hits; remaining English is
the intentional exceptions listed above.

### Findings
| ID | Severity | Finding | Disposition |
|---|---|---|---|
| C24-F1 | Fixed during run | Dropped JSX `}` in advanced-panel.tsx Row label broke `tsc` | FIXED — rebuilt file, build PASS |
| C24-F2 | Note (carried) | C18-F1, C15-F1 (latent), lint-37 baseline, editor chunk >500 kB, pending new-repo decision — all unchanged by this translation run | CARRIED — no action this cycle |

**Cycle 24 verdict:** translation complete; no regressions. No push
performed (new-repo decision still pending; Vite base unchanged).

## Cycle 25 — 2026-10-31 22:29 WIB (hourly audit, AUDIT-ONLY)

**Mode:** AUDIT-ONLY. This run is outside the user's auto-approval
window (22:29 vs 10:28 WIB close), so per the task step 1 it applies
no fix, no commit, and no push. Baseline verified at HEAD 6f1cbf8
on branch `feature/struktura-engineering-platform`; working tree
before and after this run: one pre-existing untracked file only
(`benchmarks/solver-benchmarks-2.test.ts`, not created by this run);
`dist/` is git-ignored.

**What changed since Cycle 24 (observed, not verified line-by-line
by this run):** four Sprint 1 commits landed 22:18–22:24 WIB —
47a92d7 (R-03 combination completeness), 5b93f97 (R-02 design-run
issues reach the user), a787cb7 (R-01 seismic verdict containment),
6f1cbf8 (R-07 Timoshenko fallback diagnosed) — plus the untracked
benchmark file above (Sprint 1 P5 numerical reliability, 7 tests).
No `docs/AUDIT_CYCLE.md` entry documents the Sprint 1 commits yet;
this entry records their presence and the suite-level evidence only.

**Baseline evidence:** `npm test` **143/143 PASS** (17 files: 103
pre-Sprint-1 tests + 33 Sprint 1 tests — 10 combination, 7 design
issues, 9 seismic, 7 Timoshenko — + 7 new benchmarks) · `npm run
build` PASS (tsc strict + vite; index JS 248.45 kB/gzip 79.54, CSS
62.93 kB/gzip 11.53, lazy editor chunk 631.88 kB/gzip 176.05) ·
`npm run lint` 38 problems (6 errors, 32 warnings) — one warning
above the Cycles 6–24 baseline of 37, traced below · dist total
944,669 bytes (Cycle 23's 933,384 + ~11.3 kB across index, CSS and
editor chunk, consistent with the Sprint 1 diagnostics strings —
not a size regression).

**Release-criteria check:** project create/save/reopen covered by
tests/samples-projects.test.ts (10/10) · editor node/member/support
paths intact (no code touched by this run) · truss/beam/frame
analysis covered by 28 benchmark tests (21 original + 7 new set 2)
at ≤0.1% relative error, all passing — the new set derives its
references independently (statics / textbook closed forms) and
includes a Timoshenko-vs-Euler closed-form comparison · unimplemented
scope marked UNSUPPORTED in src/struktura/report.ts (2D linear
static only; 3D, P-Delta, modal/response-spectrum and geotechnical
checks) · UI bundle sizes recorded above (dashboard light; editor
chunk >500 kB warning remains a known minor).

### Findings
| ID | Severity | Finding | Disposition |
|---|---|---|---|
| C25-F1 | Note (documentation gap) | Sprint 1 commits R-01/R-02/R-03/R-07 (22:18–22:24 WIB) have no AUDIT_CYCLE entry; their internal claims are NOT re-verified by this audit beyond the passing suite | RECORDED — a Sprint 1 close-out entry (or per-commit entries) still owed by an approved run |
| C25-F2 | Note (uncommitted work) | `benchmarks/solver-benchmarks-2.test.ts` (7 passing tests) is untracked: a fresh checkout would run 136 tests, not 143, and lose the Sprint 1 P5 benchmark coverage | NOT FIXED — audit-only mode; committing it needs an approved run, not this one |
| C25-F3 | Minor (new, +1 lint warning) | Lint 38 vs baseline 37: the extra warning is `EI` assigned but never used at benchmarks/solver-benchmarks-2.test.ts:24 (same untracked file); the 6 errors are unchanged | NOT FIXED — audit-only mode; fix candidate: remove the unused const or prefix `_` |
| C25-F4 | Note (stale comment, behaviour correct) | The new benchmark file's header says case B11 "pins a KNOWN PATHOLOGY", but B11 actually asserts the correct Timoshenko closed form (δ = 0.010741875 m, tol 1e-6) and passes — the comment is stale, not a solver defect | RECORDED — comment cleanup for an approved run |
| C25-F5 | Note (carried) | C18-F1 (stale fingerprint trusted by `importProjectJSON`, neutralised in the UI flow by `saveProject`) and C15-F1 (latent, downgraded) still open; editor chunk >500 kB and lint-37 baseline (now 38 per C25-F3) remain accepted minors | NOT FIXED — audit-only mode |
| C25-F6 | Note (carried, awaiting user decision) | New-repo creation/selection for the STRUKTURA push still pending: Vite base remains `/software-perhitungan-struktur/`; the old repo is abandoned per the user's 2026-10-31 13:35 decision, so the task body's old repo target is stale and no push was attempted | RECORDED — no push performed |

**Cycle 25 verdict:** no critical defects; test suite and build are
green at a new high of 143 tests, and the Sprint 1 diagnostics work
lands without breaking the baseline. The open list is unchanged in
substance, plus two bookkeeping items this cycle surfaces: the
missing Sprint 1 audit documentation (C25-F1) and the uncommitted
benchmark file (C25-F2). No code change, no commit, no push this
cycle; this entry left uncommitted.

## Cycle 26 — 2026-10-31 (Sprint 1 close-out: Downstream Safety Containment + Numerical Reliability)

**Mode:** User-approved remediation sprint (execution prompt 22:12 WIB).
This entry is the Sprint 1 close-out owed per C25-F1, and it also sweeps
in the hourly audit's uncommitted Cycle 25 entry above. Baseline at
start: HEAD abe8408 (Cycle 24), tree CLEAN (the execution prompt's
"dirty tree at 002f858" premise was stale — translation had completed);
tests 103/103 · build PASS · lint 37 (6 errors / 31 warnings). All work
local commits on `feature/struktura-engineering-platform`; no push.

**P1 — R-03 FIXED (commit 47a92d7).** `combineResults()` silently dropped
missing/disabled/failed combination terms and returned an ordinary
`ok:true` partial result (Cycle 15 latent at UI level). It now returns
`CombinationAnalysisResult` carrying a `CombinationCompleteness` audit
(new exported `auditCombination()`): every dropped term named with case
id, factor, and reason (`missing` / `disabled` / `failed` + the solver's
verbatim failure reason). Superposition math for contributing terms is
unchanged; all-dropped/no-terms still returns null. Design path:
`run-design.ts` records `incompleteCombos`, posts a "TIDAK LENGKAP"
issue per partial combination (incl. the internal gravity combo), and
flags affected members `demandsIncomplete`. Analyze path: new
`CombinationCompletenessBanner` (amber, non-dismissible) over the canvas
for the selected combination / envelope set. The one-click service
report consumes the same audit internally (its document already carries
the "ringkasan tidak terfaktor" honesty label — R-05 unchanged).

**P2 — R-02 FIXED (commit 5b93f97).** `DesignRunResult.issues` was
rendered by NO component. The run now also carries structured mirrors —
`failedCases` (id, name, solver reason), `skippedCombos`,
`incompleteCombos`, `gravityComboMissing`, `gravityComboIncomplete` —
and the Design tab renders the new `DesignIssuesPanel`: red banner,
nothing collapsible or dismissible, naming failed cases, skipped and
incomplete combinations, the gravity-combo state behind "Ve dihitung
tanpa Vg", members with incomplete demands, and the full issue list
verbatim. Genuinely independent valid results are preserved (only
affected members carry `demandsIncomplete`).

**P3 — R-01 CONTAINED (commit a787cb7).** No coefficient changed and
nothing is claimed validated. Every `SeismicChecks` / `ScwbResult` now
carries `verification: "unverified"` + `SEISMIC_UNVERIFIED_BASIS`
(D1.1 limits incl. the suspect I-web "high" set, §D1.2 coefficients,
program-convention Ry, §E3.4a Muv omission). The steel tool's seismic
verdict always reads "… — BELUM TERVERIFIKASI (UNVERIFIED)" (amber on
pass, red on fail) via `seismicVerdictPresentation()`; `SeismicCard`
opens with an UNVERIFIED banner naming the basis; canvas ductility pill
and steel SCWB badge use the advisory colour instead of the pass colour;
steel `JointCheckResult` propagates `verification`. Numerical output
preserved for review. (AISC 360 strength channels are untouched and
remain ordinary results.)

**P4 — R-07 FIXED (commit 6f1cbf8).** The deliberate Euler fallback in
`memberGAs()` (shear deformation requested, section Aκ2 not positive) is
preserved bit-exactly, but the solver now reports every affected member
on `AnalysisResult.shearFallbackMembers` (member + section ids, computed
from the same condition `memberGAs` uses). `mergeShearFallbacks()` folds
the union across cases into ONE diagnostics warning; the issues dialog
explains the Timoshenko formulation was NOT used for those members and
the remedy (fill Aκ2). No invented shear areas.

**P5 — numerical reliability (commit 4180f51; header fix f0e46f0).**
Audit (read-only): partial pivoting + per-DOF 1e-12 relative singularity
test in `gaussSolve`; trapezoidal FEF in `fixedEndForces`; truss
condensation; local/global transforms; unit conversions at assembly
(E ×1000, I ×1e-12, A ×1e-6) — no established math changed. New
independent benchmarks B7–B13 in `benchmarks/solver-benchmarks-2.test.ts`
(references from statics/textbook closed forms, never solver output):
SS central point load, cantilever UDL, overhang statics, inclined
member (transverse δ = P·cos θ·L³/48EI — a first hand derivation without
the cos θ factor was wrong, documented in the file), Timoshenko vs
Euler closed form (measured rel. error 1.5e-15), metamorphic portal
(linearity / load-order invariance / determinism / force+moment
equilibrium), and B12 below.

### Findings
| ID | Severity | Finding | Disposition |
|---|---|---|---|
| R-11 (NEW, from B12) | Medium | Near-zero-stiffness member (I × 1e-8) loaded by its own UDL solves `ok:true` with EXACT global equilibrium and sane stiff-span forces, but its far-end rotation is θ ≈ 2.8×10⁵ rad — physically meaningless, and no conditioning/plausibility warning exists. The per-DOF relative pivot test compares each pivot to its own row, so it cannot see this; equilibrium recovery still sums exactly, so reaction checks don't catch it either. | RECORDED as residual risk — pinned by benchmark B12 so the behaviour cannot change silently; a plausibility/conditioning guard is a Sprint 2+ candidate requiring a deliberate threshold decision. NOT fixed in Sprint 1. |
| C25-F1 | Note | Sprint 1 commits lacked an AUDIT_CYCLE entry | FIXED by this entry |
| C25-F2 | Note | P5 benchmark file untracked | FIXED by commit 4180f51 |
| C25-F3 | Minor | Lint 38 vs 37 baseline (unused `EI` const in the new benchmark file) | FIXED in commit 4180f51 (const removed); final lint back to 37 — see verdict |
| C25-F4 | Note | Benchmark header said pathology case B11; it is B12 | FIXED by commit f0e46f0 |
| C18-F1 / C15-F1 | Carried | Fingerprint-on-import (API level, UI-safe) / latent ghost-term drop now superseded at the combination layer by R-03 metadata (the underlying `combineResults` drop is now always audited) | OPEN, unchanged — Sprint 2 scope (R-04) |
| R-05 / R-06 | Carried | Factored governing combos absent from the one-click report (document is honestly labelled service-level) / verdict taxonomy lacks INCOMPLETE+UNVERIFIED classes | OPEN — not Sprint 1 scope, unchanged |

**Final evidence (this run):** `npm test` **143/143 PASS** (17 files;
+40 new tests vs the 103 baseline: 10 combination integrity, 7 design
issues incl. SSR visibility of both new banners, 9 seismic containment,
7 Timoshenko fallback, 7 benchmarks B7–B13) · `npm run build` PASS
(tsc strict + vite) · `npm run lint` **37 problems (6 errors,
31 warnings)** — identical rule-level set to the abe8408 baseline
(verified by JSON diff against a clean worktree of abe8408: zero new,
zero removed after the C25-F3 fix). Commits: 47a92d7, 5b93f97, a787cb7,
6f1cbf8, 4180f51, f0e46f0 (+ this docs commit). No push performed.

**Cycle 26 verdict:** Sprint 1 completion gate met on all 10 items
(omissions explicit; incomplete combinations cannot masquerade as
complete in Analyze or Design; design issues visible; unverified
seismic cannot present as verified PASS; Euler fallback diagnosed;
existing + new benchmarks pass; build/type-check pass; lint state
unchanged; pre-existing state preserved). Residual risks carried to
Sprint 2: R-04 (fingerprint), R-05 (report semantics), R-06 (verdict
taxonomy), R-11 (conditioning guard). Full report:
files/remediation/SPRINT-1-REPORT.md in the goal workspace.

## Cycle 27 — 2026-10-31 (Sprint 2: Numerical Trust, Verdict Integrity & Engineering Verification)

**Mode:** User-approved remediation sprint (SPRINT 2 MASTER EXECUTION
PROMPT 22:46 WIB). Baseline at start: HEAD 327f187 (Cycle 26), tree
CLEAN; tests 103→143 baseline re-verified as 143/143 · build PASS ·
lint 37 (6 errors / 31 warnings, captured as JSON for rule-level diff).
All work local commits on `feature/struktura-engineering-platform`;
no push, no deploy, Sprint 3 NOT started.

**P1 — R-11 FIXED (commit 294c5f7).** Every successful solve now
carries `NumericalDiagnostics` from three independent signals, computed
post-solve on the system actually solved (solver arithmetic untouched;
B12's θ still exactly 281250, equilibrium still exact):
(1) equilibrated pivot ratio ρ (symmetric equilibration makes it
unit-invariant; ρ<1e-12 → NUMERICALLY_UNRELIABLE, ρ<1e-8 →
ILL_CONDITIONED; documented as a pivot indicator, NOT κ₂);
(2) relative residual (>1e-8 → UNRELIABLE);
(3) rotation plausibility vs the small-angle assumption (|θ| or chord
rotation >0.1 rad → PHYSICALLY_IMPLAUSIBLE; >0.02 rad → large-rotation
flag; derivation θ²/6 linearization error vs the 0.1% project
tolerance). Measured probe evidence: B12 has ρ=0.5 and residual
3.4e-26 — HEALTHY on both numerical signals; plausibility is the only
signal that catches it. Perturbation measurements (1e-6 load/stiffness
→ ≈1e-6 relative response, both reference and B12 family) show the
pathology is plausibility, not sensitivity. Diagnostics merge into the
user report (error severity forces status unstable) and the issues
dialog names classification + node/DOF. Honest gap (NEW-1): a PRIMARY
ILL_CONDITIONED classification has no reproducing model in this
solver's model class — the band is reached together with implausibility
(flag asserted at soft-ratio 3e-9, ρ≈4.7e-9).

**P2 — R-06 FIXED (commit b6417b8).** Unified verdict taxonomy
(PASS/FAIL/INCOMPLETE/UNVERIFIED/UNSUPPORTED/NOT_EVALUATED) in
design/core/verdict.ts with documented precedence (worst wins:
FAIL > INCOMPLETE > UNSUPPORTED > UNVERIFIED > NOT_EVALUATED > PASS).
Empty rollup = NOT_EVALUATED (never a default PASS); steel seismic caps
members at UNVERIFIED (R-01), fails as FAIL; run verdict PASS only when
every member/joint passes AND no run-level incompleteness — never
inferred from a subset. designFromCases attaches member verdicts (after
the SCWB post-pass) + run verdict incl. early returns; DesignIssuesPanel
prints the run verdict when it renders.

**P3 — demand-integrity (commit 8e0f5b8).** Full consumer audit of
combineResults/auditCombination/envelopeResults (12 consumers, mapped
in the sprint report). Fixes: combineResults propagates worst-case
numerical + shear-fallback union; envelopeResults propagates both plus
the new `incompleteSourceCombos` (previously only the Analyze banner's
separate re-audit could see envelope incompleteness). RC Ve↔Vg pinned
by a DIFFERENTIAL test (identical design combo; gravity present vs
missing changes Ve by exactly the Vg term; missing-gravity run verdict
INCOMPLETE); partial gravity taints RC members with Ve computed and
labelled partial.

**P4 — report integrity (commit 8e0f5b8).** Service-result semantics
UNCHANGED (1.0× superposition). Report retitled "Laporan Hasil Analisis
Layan (Tak Terfaktor)" with a scope banner (BUKAN laporan desain /
BUKAN bukti kepatuhan), §9 rewritten (no design verdicts in the
document; seismic UNVERIFIED stated), §10 prints service integrity
warnings verbatim, §11 conclusion is qualified whenever warnings exist
or classification ≠ VALID — a B12-class result can no longer conclude
as a plain success. Both conclusion branches test-pinned. R-05 thereby
MITIGATED to sprint scope; a factored design report remains a future
product decision.

**P5 — integration coverage (commit 4484ad6).** tests/sprint2-integration
drives the real App pipeline end-to-end (diagnostics → merge chain →
solve → audit/combine/envelope → design+verdicts → service → report
HTML) for 8 scenarios: happy path, failed case, disabled case, missing
combo term, Timoshenko fallback, unsupported members, unverified
seismic cap, near-singular B12 (incl. dialog SSR). Stated in-file: no
browser E2E exists; this is NOT a substitute for it.

**Secondary (commit 96445d9).** R-04 FIXED: importProjectJSON always
recomputes the fingerprint (stored value never trusted; honest
round-trip unchanged). R-08 FIXED: every `validation/*` citation in
src/ now states the file is NOT shipped in this repository (guard test
added); DESIGN_RC.md carries the same note. The 6 baseline lint errors
were reviewed: both classes (App handler order, canvas ref reads)
require unrelated restructuring — left untouched, reported accurately.

### Findings
| ID | Severity | Finding | Disposition |
|---|---|---|---|
| R-11 | Medium (was) | No conditioning/plausibility guard; B12 masqueraded as ok | FIXED — diagnostics + merge + verdict mapping; B12 pin updated deliberately (numbers preserved) |
| R-06 | Medium (was) | No unified verdict taxonomy | FIXED — verdict.ts + run/member attachment |
| R-04 / C18-F1 | Minor (was) | Stale fingerprint trusted at API level | FIXED — always recompute |
| R-08 | Minor (was) | Dangling validation-file citations | FIXED — citations clarified in place + guard test |
| R-05 | Note | Report service-level only | MITIGATED — scope/warnings/conclusion made unmistakable; semantics unchanged by design |
| NEW-1 | Note | Primary ILL_CONDITIONED classification lacks a reproducing model (measured) | RECORDED — band/flag/precedence implemented and tested; honest evidence gap |
| NEW-2 | Note | Diagnostics add one O(n³) equilibrated elimination per solve | ACCEPTED for current model sizes; noted in report §10 |

**Final evidence (this run):** `npm test` **196/196 PASS** (22 files;
+53 vs the 143 baseline: 10 conditioning, 20 verdict, 9 integrity,
8 integration, 5 secondary, +1 B12) · `npm run build` PASS (tsc strict
+ vite) · `npm run lint` **37 problems (6 errors, 31 warnings)** —
rule-level JSON set IDENTICAL to the pre-sprint baseline capture.
Commits: 294c5f7, b6417b8, 8e0f5b8, 4484ad6, 96445d9 (+ this docs
commit). No push performed.

**Cycle 27 verdict:** Sprint 2 completion gate met on all 11 items —
recommendation **PASS** with residual risks carried forward (no browser
E2E; NEW-1 evidence gap; R-05 by-design scope; R-01 constants still
unverified under containment). Full report: docs/SPRINT_2_REPORT.md.

## Cycle 28 — 2026-10-31 23:29 WIB (hourly audit, AUDIT-ONLY)

**Mode:** Outside the user auto-approval window (ended Sat 2026-10-31
10:28 WIB). Audit + report only: NO code fixes applied, NO push, NO
deploy, Sprint 3 NOT started. Baseline at start: HEAD 0a4c1cd (Cycle 27
/ Sprint 2 close-out), tree CLEAN, branch
`feature/struktura-engineering-platform`.

**Commands run (verbatim results):**
- `npm test` — **196/196 PASS, 22 files** (identical to Cycle 27:
  incl. 21 + 8 solver benchmarks, 10 conditioning, 20 verdict,
  9 integrity, 8 integration, 5 secondary, 10 sample-project tests).
- `npm run build` — **PASS** (tsc strict + vite 6.4.1; 1937 modules).
- `npm run lint` — **37 problems (6 errors, 31 warnings)**, counts
  identical to the Cycle 27 baseline; no new lint class introduced.
- Bundle check — `dist/` 948K total (ignored by git, rebuilt by this
  run): JS index 254.39 kB (gzip 81.84 kB) + App 638.84 kB
  (gzip 178.50 kB); CSS 62.93 kB (gzip 11.53 kB). Vite repeats its
  >500 kB chunk-size warning for the App chunk.
- Spot checks — `grep TODO|FIXME|XXX src/` returns nothing;
  UNSUPPORTED verdict present in src/lib/design/core/verdict.ts,
  types.ts and src/struktura/report.ts (unimplemented items still
  cannot present as PASS). Tree still CLEAN after the build
  (dist/ ignored).

**Findings**

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| C28-F1 | Minor (pre-existing, not a regression) | App JS chunk 638.84 kB minified trips Vite's 500 kB chunk-size warning; total JS gzip ≈260 kB | RECORDED only — code-splitting is a future optimisation, not an audit-cycle fix outside the approval window |
| C28-F2 | Note (carried) | No browser E2E exists (integration tests drive the real pipeline, not a browser) | CARRIED from Sprint 2 |
| C28-F3 | Note (carried) | NEW-1: primary ILL_CONDITIONED classification still lacks a reproducing model in this solver's model class | CARRIED from Sprint 2 |
| C28-F4 | Note (carried) | R-01 seismic constants remain unverified transcriptions under UNVERIFIED containment; R-05 report stays service-level by design | CARRIED from Sprint 2 |
| C28-F5 | Note (carried) | Remote push unattempted this run (outside window); historic blocker was the 403 on the Git Trees endpoint, not user permissions (probe write succeeded 2026-10-31 23:01) | CARRIED — retry only on fresh user approval |

**Fixes applied:** NONE (audit-only mode).

**Cycle 28 verdict:** No regression vs Cycle 27 on any measured
signal (tests, build, lint counts, bundle shape). Release criteria
hold as audited in Cycle 27: projects create/save/reopen
(sample-project tests), editor node/member/support, truss/beam/frame
analysis, reactions/diagrams/deflection within the 0.1% analytic
benchmark tolerance, UNSUPPORTED labelling intact, UI unchanged.
Next action awaits the user: fresh approval for any fix, push retry,
or Sprint 3.

## Cycle 29 — 2026-11-01 00:29 WIB (hourly audit, AUDIT-ONLY)

**Mode:** Outside the user auto-approval window (ended Sat 2026-10-31
10:28 WIB). Audit + report only: NO code fixes applied, NO commit,
NO push, NO deploy, Sprint 3 NOT started. Baseline at start: HEAD
77fd6e1 (Cycle 28), tree CLEAN, branch
`feature/struktura-engineering-platform`.

**Commands run (verbatim results):**
- `npm test` — **196/196 PASS, 22 files** (identical to Cycles 27–28:
  incl. 21 + 8 solver benchmarks, 10 conditioning, 20 verdict,
  9 integrity, 8 integration, 5 secondary, 10 sample-project tests).
- `npm run build` — **PASS** (tsc strict + vite 6.4.1; 1937 modules;
  dist index JS 254.39 kB/gzip 81.84, App chunk 638.84 kB/gzip
  178.50, CSS 62.93 kB/gzip 11.53 — chunk hashes identical to
  Cycle 28, no drift).
- `npm run lint` — **37 problems (6 errors, 31 warnings)**, counts
  identical to the Cycle 27 baseline; no new lint class introduced.
- Bundle check — `dist/` 957,573 bytes (ignored by git, rebuilt by
  this run); Vite repeats its >500 kB chunk-size warning for the
  App chunk.
- Spot checks — `grep TODO|FIXME|XXX src/` returns nothing;
  UNSUPPORTED verdict present in src/lib/design/core/verdict.ts
  and src/struktura/report.ts (unimplemented items still cannot
  present as PASS). Tree CLEAN after the build (dist/ ignored)
  except for this entry itself.

**Release-criteria check:** project create/save/reopen covered by
tests/samples-projects.test.ts (10/10) · editor node/member/support
paths intact (no code touched) · truss/beam/frame analysis covered
by 21 + 8 benchmark tests at ≤0.1% relative error, all passing ·
unimplemented scope marked UNSUPPORTED (verdict taxonomy +
report) · UI bundle sizes recorded above (dashboard light;
editor/App chunk >500 kB warning remains a known minor).

### New probe (this cycle, no fix applied — audit-only mode)
Probed the next silent-drop candidate after Cycles 7/11 (distributed
loads, point loads): a uniform −10 kN/m distributed load on the
bottom chord of a stable triangle truss (pin + roller, 6 m chord,
total 60 kN). Result: `ok:true`, reactions Ry = 30 + 30 = 60 kN
(the FULL load is carried — no drop), chord end shears V1 = −30 /
V2 = +30 kN transfer the load to the joints, end moments M1 = M2
= 0 as required for a truss member by construction. Chord axial
N1 = N2 = 0 is CORRECT for this symmetric case (apex joint
unloaded, diagonals zero by symmetry, joint loads balanced
directly by the reactions) — the probe's first draft wrongly
expected non-zero axial, and its first two runs failed on the
probe author's own wrong result-field names (`memberForces`/`fy`/
`axial` vs the real `memberEndForces`/`Ry`/`N1`), not on solver
behaviour. Corrected probe confirms the truss distributed-load
path (solver.ts: "applies to trusses too post-v1.0.4") behaves
as documented. No defect; probe file deleted after use.

### Findings

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| C29-F1 | Minor (pre-existing, not a regression) | App JS chunk 638.84 kB minified trips Vite's 500 kB chunk-size warning; total JS gzip ≈260 kB | RECORDED only — code-splitting is a future optimisation, not an audit-cycle fix outside the approval window |
| C29-F2 | Note (carried) | No browser E2E exists (integration tests drive the real pipeline, not a browser) | CARRIED from Sprint 2 |
| C29-F3 | Note (carried) | NEW-1: primary ILL_CONDITIONED classification still lacks a reproducing model in this solver's model class | CARRIED from Sprint 2 |
| C29-F4 | Note (carried) | R-01 seismic constants remain unverified transcriptions under UNVERIFIED containment; R-05 report stays service-level by design | CARRIED from Sprint 2 |
| C29-F5 | Note (carried) | Remote push unattempted this run (outside window); historic blocker was the 403 on the Git Trees endpoint, not user permissions | CARRIED — retry only on fresh user approval |

**Fixes applied:** NONE (audit-only mode).

**Cycle 29 verdict:** No regression vs Cycles 27–28 on any measured
signal (tests, build, lint counts, bundle shape and hashes). No
new defect of any severity — the one new probe returned clean
once the probe's own field-name and symmetry errors were
corrected. Release criteria hold as audited in Cycle 27.
Next action awaits the user: fresh approval for any fix, push
retry, or Sprint 3. This entry is left uncommitted, following
the Cycle 9–11 precedent.

## Cycle 30 — 2026-11-01 01:29 WIB (hourly audit, AUDIT-ONLY)

**Mode:** Outside the user auto-approval window (ended Sat 2026-10-31
10:28 WIB). Audit + report only: NO code fixes applied, NO commit,
NO push, NO deploy, Sprint 3 NOT started. Baseline at start: HEAD
77fd6e1 (Cycle 28), tree carrying only the uncommitted Cycle 29
entry, branch `feature/struktura-engineering-platform`.

**Commands run (verbatim results):**
- `npm test` — **196/196 PASS, 22 files** (identical to Cycles 27–29:
  incl. 21 + 8 solver benchmarks, 10 conditioning, 20 verdict,
  9 integrity, 8 integration, 5 secondary, 10 sample-project tests).
- `npm run build` — **PASS** (tsc strict + vite 6.4.1; 1937 modules;
  dist index JS 254.39 kB/gzip 81.84, App chunk 638.84 kB/gzip
  178.50, CSS 62.93 kB/gzip 11.53 — chunk hashes identical to
  Cycle 29, no drift).
- `npm run lint` — **37 problems (6 errors, 31 warnings)**, counts
  identical to the Cycle 27 baseline; no new lint class introduced.
- Bundle check — `dist/` 957,573 bytes (ignored by git, rebuilt by
  this run; byte-identical to Cycle 29); Vite repeats its >500 kB
  chunk-size warning for the App chunk.
- Spot checks — `grep TODO|FIXME|XXX src/ tests/ benchmarks/`
  returns nothing; UNSUPPORTED verdict present in
  src/struktura/report.ts and src/lib/design/core/verdict.ts
  (unimplemented items still cannot present as PASS). Tree after
  the build and probe = Cycle 29 entry + this entry only (probe
  file deleted after use).

**Release-criteria check:** project create/save/reopen covered by
tests/samples-projects.test.ts (10/10) · editor node/member/support
paths intact (no code touched) · truss/beam/frame analysis covered
by 21 + 8 benchmark tests at ≤0.1% relative error, all passing ·
unimplemented scope marked UNSUPPORTED (verdict taxonomy +
report) · UI bundle sizes recorded above (dashboard light;
editor/App chunk >500 kB warning remains a known minor).

### New probe (this cycle, no fix applied — audit-only mode)
Probed the next silent-drop candidate after Cycles 7/11/29
(distributed loads, point loads, truss distributed loads): a point
load applied directly ON a support node, which looks dropped if
only member forces are inspected. Result: −10 kN on the pin node
→ Ry(pin) = 10 kN exactly, Ry(roller) = 0, every member end force
(N/V/M, both members) exactly 0; −10 kN on the roller node →
Ry(roller) = 10 kN exactly, Ry(pin) = 0. The load goes straight
into the restrained DOF with nothing lost and nothing spuriously
in the members — correct equilibrium, not a drop. No defect;
probe file deleted after use.

### Findings

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| C30-F1 | Minor (pre-existing, not a regression) | App JS chunk 638.84 kB minified trips Vite's 500 kB chunk-size warning; total JS gzip ≈260 kB | RECORDED only — code-splitting is a future optimisation, not an audit-cycle fix outside the approval window |
| C30-F2 | Note (carried) | No browser E2E exists (integration tests drive the real pipeline, not a browser) | CARRIED from Sprint 2 |
| C30-F3 | Note (carried) | NEW-1: primary ILL_CONDITIONED classification still lacks a reproducing model in this solver's model class | CARRIED from Sprint 2 |
| C30-F4 | Note (carried) | R-01 seismic constants remain unverified transcriptions under UNVERIFIED containment; R-05 report stays service-level by design | CARRIED from Sprint 2 |
| C30-F5 | Note (carried) | Remote push unattempted this run (outside window); historic blocker was the 403 on the Git Trees endpoint, not user permissions | CARRIED — retry only on fresh user approval |

**Fixes applied:** NONE (audit-only mode).

**Cycle 30 verdict:** No regression vs Cycles 27–29 on any measured
signal (tests, build, lint counts, bundle size and hashes). No
new defect of any severity — the one new probe returned clean
(support-node loads carried exactly by the reactions). Release
criteria hold as audited in Cycle 27. Next action awaits the user:
fresh approval for any fix, push retry, or Sprint 3. This entry
is left uncommitted, following the Cycle 9–11 precedent.

## Cycle 31 — 2026-11-01 02:29 WIB (hourly audit, AUDIT-ONLY)

**Mode:** Outside the user auto-approval window (ended Sat 2026-10-31
10:28 WIB). Audit + report only: NO code fixes applied, NO commit,
NO push, NO deploy, Sprint 3 NOT started. Baseline at start: HEAD
77fd6e1 (Cycle 28), tree carrying only the uncommitted Cycle 29
and Cycle 30 entries, branch `feature/struktura-engineering-platform`.

**Commands run (verbatim results):**
- `npm test` — **196/196 PASS, 22 files** (identical to Cycles 27–30:
  incl. 21 + 8 solver benchmarks, 10 conditioning, 20 verdict,
  9 integrity, 8 integration, 5 secondary, 10 sample-project tests).
- `npm run build` — **PASS** (tsc strict + vite 6.4.1; 1937 modules;
  dist index JS 254.39 kB/gzip 81.84, App chunk 638.84 kB/gzip
  178.50, CSS 62.93 kB/gzip 11.53 — chunk hashes identical to
  Cycles 29–30, no drift).
- `npm run lint` — **37 problems (6 errors, 31 warnings)**, counts
  identical to the Cycle 27 baseline; no new lint class introduced.
- Bundle check — `dist/` 957,573 bytes (ignored by git, rebuilt by
  this run; byte-identical to Cycles 29–30); Vite repeats its >500 kB
  chunk-size warning for the App chunk.
- Spot checks — `grep TODO|FIXME|XXX src/ tests/ benchmarks/`
  returns nothing; UNSUPPORTED verdict present in
  src/struktura/report.ts and src/lib/design/core/verdict.ts
  (unimplemented items still cannot present as PASS). Tree after
  the build = Cycle 29 + Cycle 30 entries + this entry only.

**Release-criteria check:** project create/save/reopen covered by
tests/samples-projects.test.ts (10/10) · editor node/member/support
paths intact (no code touched) · truss/beam/frame analysis covered
by 21 + 8 benchmark tests at ≤0.1% relative error, all passing ·
unimplemented scope marked UNSUPPORTED (verdict taxonomy +
report) · UI bundle sizes recorded above (dashboard light;
editor/App chunk >500 kB warning remains a known minor).

### New check (this cycle, no fix applied — audit-only mode)
Scanned the production `dist/` output for external runtime
references (self-containment / light-UI check). Findings: all JS
URLs are inert namespace identifiers (w3.org SVG/MathML/xlink)
or a React error-doc string, plus a tailwindcss.com comment in
CSS — none fetched at runtime. The one genuine runtime external
dependency is the Google Fonts stylesheet in source `index.html`
(Inter + JetBrains Mono, pre-existing, not build-injected): on an
offline or font-blocked connection the app falls back to system
fonts, with no functional impact. No new defect; self-hosting the
fonts is a future optimisation, not an audit-cycle fix outside
the approval window.

### Findings

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| C31-F1 | Minor (pre-existing, not a regression) | App JS chunk 638.84 kB minified trips Vite's 500 kB chunk-size warning; total JS gzip ≈260 kB | RECORDED only — code-splitting is a future optimisation, not an audit-cycle fix outside the approval window |
| C31-F2 | Note (new observation, pre-existing) | Production build loads Inter/JetBrains Mono from Google Fonts at runtime; offline use falls back to system fonts, no functional impact | RECORDED only — font self-hosting is a future optimisation |
| C31-F3 | Note (carried) | No browser E2E exists (integration tests drive the real pipeline, not a browser) | CARRIED from Sprint 2 |
| C31-F4 | Note (carried) | NEW-1: primary ILL_CONDITIONED classification still lacks a reproducing model in this solver's model class | CARRIED from Sprint 2 |
| C31-F5 | Note (carried) | R-01 seismic constants remain unverified transcriptions under UNVERIFIED containment; R-05 report stays service-level by design | CARRIED from Sprint 2 |
| C31-F6 | Note (carried) | Remote push unattempted this run (outside window); historic blocker was the 403 on the Git Trees endpoint, not user permissions | CARRIED — retry only on fresh user approval |

**Fixes applied:** NONE (audit-only mode).

**Cycle 31 verdict:** No regression vs Cycles 27–30 on any measured
signal (tests, build, lint counts, bundle size and hashes). No
new defect of any severity — the one new check surfaced only a
pre-existing runtime font dependency with fallback behaviour.
Release criteria hold as audited in Cycle 27. Next action awaits
the user: fresh approval for any fix, push retry, or Sprint 3.
This entry is left uncommitted, following the Cycle 9–11 precedent.
