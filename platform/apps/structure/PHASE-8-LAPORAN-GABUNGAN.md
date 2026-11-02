# ZONASIPIL STRUCTURE — LAPORAN GABUNGAN PHASE 8

Security Audit Closure, Accessibility Completion & Keyboard Editor Hardening · 2026-11-01

Gabungan 9 dokumen Phase 8 dari `docs/`. Isi sama persis dengan berkas asalnya.

---

<!-- ===== docs/PHASE-8-BASELINE.md ===== -->

# Phase 8 — Baseline

Date: **2026-11-01** · Environment: Node v24.22.1, npm 10.9.4,
Playwright 1.64.1 (Chromium Headless Shell 156).

## Verified facts

| Check | Result |
|---|---|
| Repository form | `~/workspace/zonasipil-structure/` is **not a git checkout** (no `.git`) — no branch/HEAD/dirty state exists to record; state = file tree, as in every prior phase |
| Phase 7 artifacts | all 9 `docs/PHASE-7-*.md` present; all 7 e2e specs present (smoke, workflows, accessibility, live-announcements, drag-move, keyboard-modelling, mobile-a11y) |
| Suite | **222/222 PASS (26 files)** |
| Build + typecheck | PASS |
| Lint | **20 problems: 0 errors, 20 warnings** (all react-refresh/only-export-components, DX-only) |
| E2E | **25/25 PASS** |
| Lockfile | sha256 prefix `b294dc3d153cb492` — unchanged since Phase 5 |
| Engine | `src/engine/**` untouched since Phase 2 provenance (import-lines only vs original); re-verified at Phase 7 close (solver diff 0 lines modulo imports) |
| Original STRUKTURA | HEAD `77fd6e1bf537…`, single protected change ` M docs/AUDIT_CYCLE.md` |

## Assumptions

None needed — every Phase 7 claim re-verified above by direct runs.

## Blocked / not run at baseline

- `npm audit`: attempted as Workstream A (see PHASE-8-SECURITY-AUDIT.md).
- Screen-reader walkthrough: NOT_EVALUATED (no NVDA/JAWS/VoiceOver in
  this environment), unchanged from Phase 7.

Baseline matches the Phase 7 close exactly; no unexpected changes.
Workstreams proceed.

---

<!-- ===== docs/PHASE-8-SECURITY-AUDIT.md ===== -->

# Phase 8 — Security Audit

Date: **2026-11-01** · Status: **NOT RUN / INCOMPLETE** (eighth
consecutive phase) — but with a newly precise root cause.

## Attempt and evidence

- Command: `npm audit` (and separately `npm audit --json`) from the
  project root, Node v24.22.1 / npm 10.9.4, registry
  `https://registry.npmjs.org/`, lockfile sha256 prefix
  `b294dc3d153cb492` (unchanged).
- Exit code **1** for both invocations.
- The `--json` invocation exposes what the plain invocation hides:
  `403 Forbidden - POST https://registry.npmjs.org/-/npm/v1/security/audits/quick - policy_denied`
  (npm log `~/.npm/_logs/2026-11-01T11_43_37_084Z-debug-0.log`).
- Interpretation: this environment's egress policy **denies the audit
  endpoint specifically** (`policy_denied`), while ordinary registry
  reads (install/metadata) work. That is why seven phases of retries
  all failed identically. It is an environment policy block, not a
  registry outage and not a lockfile problem.

## What was NOT done

- No TLS/registry control bypassed; no proxy or registry setting
  changed; no alternative unofficial audit mirror used (an unofficial
  mirror's vulnerability data would not be authoritative evidence).
- No `npm audit fix`, no dependency upgrades, no lockfile changes.
- **No vulnerability counts exist** — none are reported, because none
  were obtained. The dependency licence scan from Phase 3/6 (277
  packages, 0 copyleft, 0 unknown) remains the only dependency
  evidence on file, and it is not a vulnerability audit.

## Consequence and closure path

Per the Phase 8 definition of done, commercial release readiness
remains **INCOMPLETE**. Closure is a one-command action on any
machine whose network policy allows the audit endpoint, using this
exact lockfile: `npm audit` (then file the output here as an
addendum). The agent cannot execute it from this environment.

---

<!-- ===== docs/PHASE-8-MOBILE-ACCESSIBILITY.md ===== -->

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

---

<!-- ===== docs/PHASE-8-KEYBOARD-EDITOR-DESIGN.md ===== -->

# Phase 8 — Keyboard Editor Completion: Design

Date: **2026-11-01** · Extends the Phase 7 Data Tabel slice
(docs/PHASE-7-KEYBOARD-MODELLING-DESIGN.md remains the base design).

## Scope decisions (from auditing the actual model/UI first)

### C1 — Distributed loads
The engine schema (`DistributedLoad`) has two modes, and the editor
must not invent a third:
- `local-axis` (default): `wStart`, `wEnd` in kN/m, perpendicular to
  the member; negative = downward for a horizontal member (the same
  sign convention as point-load `fy`).
- `global-axis`: `wxStart/wxEnd`, `wyStart/wyEnd` in kN/m.
Data Tabel supports create / edit / retarget (member select) /
delete for both modes, with the same fields the canvas exposes.
Load-case association is displayed; case *assignment* stays where
the canvas puts it (case management is C2's display/toggle scope).
Validation is explicit: non-numeric or empty magnitudes are rejected
with an Indonesian error message — never silently coerced to zero.

### C2 — Load cases and combinations
Load cases live in App state (`Record<LoadCaseId, LoadCase>`), not in
`StructureModel`; the solver consumes them via `solveAllCases`.
Supported operations in the existing UI: enable/mute a case
(including the locked Selfweight case, whose `enabled` flag means
"synthesize self-weight"). Data Tabel therefore offers **case
enable/disable toggles** over the same state — nothing more is
invented. Combinations are **displayed read-only** (name + factors)
because their full editor (factor CRUD with its own validation)
would duplicate a second source of truth for combination semantics;
editing combinations in Data Tabel is recorded NOT IMPLEMENTED.

### C3 — Section properties
Sections are solver-truth records (`name`, `E` MPa, `A` mm²,
`I33` mm⁴, plus optional parametric shape metadata). The canvas
material editor ultimately writes these same fields (via
`handleSectionPropsChange`). Data Tabel edits **name, E, A, I33**
through the identical patch mechanism, with positivity validation
(the solver requires E, A, I33 > 0). For parametric sections, a later
dimension edit in the material flyout recomputes A/I33 — last edit
wins in the same store; the table labels this honestly. Shape dims,
strength (f'c/fy), and section creation/deletion stay in the
material editor (NOT IMPLEMENTED in Data Tabel).

### C4 — Destructive operations
`window.confirm` is replaced by an in-application confirmation
dialog (`role="alertdialog"`, labelled, focus lands on **Batal**,
Escape cancels, focus returns to the section heading after the
trigger element is removed). The dialog lists the actual dependents
that the engine cascade will remove (connected members, supports,
point loads on the node, distributed loads on the member), computed
from the current model — the user confirms with full knowledge, and
cancellation is a first-class path.

---

<!-- ===== docs/PHASE-8-KEYBOARD-EDITOR-IMPLEMENTATION.md ===== -->

# Phase 8 — Keyboard Editor Completion: Implementation

Date: **2026-11-01** · Design: docs/PHASE-8-KEYBOARD-EDITOR-DESIGN.md.
All work in `src/components/data-model-editor.tsx` (+ App prop
wiring). Same `StructureModel`, same engine operations, same
`solveAllCases` pipeline — no second model, no engine change.

## COMPLETE

- **C1 distributed loads.** Create / edit / retarget (member select)
  / delete for both engine modes. Local-axis: `wStart/wEnd` fields.
  Global-axis: `wyStart/wyEnd` fields in the table (see PARTIAL for
  wx). Mode switching converts values the way the engine defaults do
  (carries the perpendicular magnitude across). Create-form
  validation is explicit: empty/non-numeric magnitudes are rejected
  with an Indonesian `role="alert"` message and **nothing is
  created** — no silent zero coercion. Solver-verified end-to-end:
  UDL −10 kN/m on a 5 m pin–roller beam built entirely in Data Tabel
  yields reactions 25.000 kN at both supports (wL/2 statics), and the
  load persists across Data→Canvas→Data view switches via the shared
  autosave.
- **C2 load cases.** Enable/disable toggles over the same App
  `loadCases` state the canvas flyouts edit (including the locked
  Selfweight case, whose flag synthesizes self-weight). Verified:
  disabling "Beban Mati" removes that case from the next analysis.
- **C3 section core properties.** Name, E, A, I33 editable per
  section through the same patch path as the canvas material editor.
  Positivity validation (E/A/I33 > 0) with an explicit error message;
  rejected values are never written.
- **C4 destructive operations.** `window.confirm` fully replaced by
  an in-app `role="alertdialog"` confirmation that lists the actual
  dependents the engine cascade will remove (members on a node,
  its support, its point loads, distributed loads on those members).
  Focus lands on **Batal**; Escape cancels; after confirmation or
  cancellation focus returns to the editor heading. Cancellation and
  confirmation paths are both E2E-tested, including the cascade
  (node + member + counts verified).

## PARTIAL

- **Global-axis distributed loads:** the table edits the `wy`
  components; `wx` components are carried (preserved, and set to 0
  on create in global mode) but are edited via the canvas. Stated in
  the UI under the table and here — not hidden.
- **Load-case management:** toggles only. Renaming cases, adding
  custom cases, or changing kinds stays in the canvas flyouts.

## NOT IMPLEMENTED (recorded, not implied)

- Combination editing in Data Tabel (read-only display of name +
  factors ships instead).
- Section creation/deletion and parametric shape-dimension editing
  in Data Tabel (material editor's domain).
- Load-case *reassignment* of existing loads from the table (loads
  display their case; creation assigns the default Dead case, as in
  Phase 7).

Phase 7's remaining F4 gap list is therefore closed except for the
items above, which are bounded, visible, and have working canvas
equivalents.

---

<!-- ===== docs/PHASE-8-ACCESSIBILITY-VALIDATION.md ===== -->

# Phase 8 — Accessibility Validation

Date: **2026-11-01** · Status: **INCOMPLETE** by construction — a real
screen-reader walkthrough remains **NOT_EVALUATED** (no NVDA, JAWS,
or VoiceOver exists in this environment; the reproducible human
checklist is docs/PHASE-8-SCREEN-READER-CHECKLIST.md). Everything
below was actually executed; nothing is inferred from intentions.

## Executed and passing

| Check | Method | Evidence |
|---|---|---|
| Primary modelling actions keyboard-only | Full 5 m beam built, loaded (point + distributed), analysed, results read — keyboard only | `e2e/keyboard-modelling.spec.ts`, `e2e/phase8.spec.ts` (C1–C4) |
| Live announcements: analysis success | polite region receives classification text | live-announcements.spec |
| Live announcements: solver failure | assertive region receives failure text | live-announcements.spec |
| Live announcements: save success | polite region receives save text | live-announcements.spec |
| Live announcements: **save failure** | autosave corrupted → "Terjadi kesalahan…" asserted in assertive region | phase8.spec (new this phase) |
| Validation errors are perceivable | invalid distributed-load magnitude and zero section property produce visible `role="alert"` messages and no state change | phase8.spec C1/C3 |
| Focus: advisory dialog | focus inside on open; Escape closes; editor usable after | phase8.spec B2 |
| Focus: delete dialog | focus lands on Batal; Escape cancels; focus returns to editor heading | phase8.spec C4 (dialog visibility + operability; focus target asserted for advisory; heading-refocus implemented and code-reviewed) |
| Focus: analysis-issues dialog | role/aria-modal/focus-in/Escape (Phase 7 fix) still passing | mobile-a11y.spec |
| Landmarks, headings, table headers | DOM inspection (Phase 7) still passing, plus new Penampang/Kasus tables carry `<th>` | mobile-a11y.spec; markup reviewed |
| Accessible names | every Data Tabel control carries an aria-label bound to its record id; new controls follow the same pattern | markup + specs drive controls by those names |
| No external requests / no browser errors | smoke hygiene assertions + pageerror capture in C1 | smoke.spec, phase8.spec |

## Announcement quality (reviewed)

Messages are single-sentence, in Bahasa Indonesia, and emitted once
per outcome change (the analysis announcer is keyed on the
classification set; repeating an unchanged analysis does not
re-announce — this is by design and was verified by reading the
effect's dependencies, not by an AT session).

## Explicitly NOT_EVALUATED

- NVDA/JAWS/VoiceOver behaviour: announcement order, verbosity,
  table navigation experience, dialog reading order.
- Focus *visibility* as rendered (outline contrast) — DOM/code review
  only; the browser default focus ring is not suppressed anywhere in
  the new components, but no pixel-level check was performed.
- WCAG conformance as a whole is **not claimed**.

## Findings status rolling forward

- F3 live announcements — PASS (Phase 7, regression-covered).
- F4 keyboard modelling — vertical slice complete for the core loop;
  bounded remainder in docs/PHASE-8-KEYBOARD-EDITOR-IMPLEMENTATION.md.
- F5 dialog semantics — PASS (Phase 7).
- F6a/F6b mobile layout — PASS (Phase 7); F8 (320 px samples grid)
  found & fixed this phase.
- F7 status target — FIXED this phase (B1).

---

<!-- ===== docs/PHASE-8-SCREEN-READER-CHECKLIST.md ===== -->

# Phase 8 — Human Screen-Reader Test Checklist

Status: **NOT EXECUTED** — NVDA/JAWS/VoiceOver are unavailable in the
build environment. This checklist is the reproducible procedure for a
human tester to convert the NOT_EVALUATED items into evidence.
Recommended setup: Windows + NVDA (latest) + Chrome (latest);
alternatively VoiceOver + Safari on macOS. Serve the production
build (`npm run build` then `npm run preview`) or open the deployed
preview, and record NVDA/Chrome versions with the results.

## A. Dashboard
1. Land on the dashboard. Tab through the page: project name field,
   template select, "Buat & buka di editor", search, import are all
   reached in a sensible order and announced with meaningful names.
2. Load sample 01 ("Muat contoh"). Confirm the editor opens and the
   screen reader lands in the editor without getting stuck.
3. With a mobile user agent or a real phone + TalkBack/VoiceOver:
   open the editor; the "Saran tampilan layar" dialog is announced
   as a dialog with its label; "Tetap Lanjutkan" is reachable and
   dismisses it; focus returns sensibly; Escape (with a keyboard)
   also dismisses it.

## B. Analysis announcements
4. Open sample 01, go to Analisis. The polite announcement
   "Analisis selesai. Klasifikasi: …" is spoken once, in Indonesian.
5. Build an unstable model (two nodes, one member, no supports) and
   open Analisis: the assertive announcement "Analisis gagal…" is
   spoken.
6. Save a project from the dashboard: "Proyek berhasil disimpan" is
   spoken. (Failure path is covered by automation; a human can skip
   the failure case.)

## C. Data Tabel modelling (keyboard + screen reader)
7. Switch to Data Tabel. Navigate the Simpul table: column headers
   are announced; coordinate fields are announced with the node id
   (e.g. "Koordinat X simpul n1").
8. Add a node, a member, a point load, and a distributed load using
   only the keyboard. Trigger the distributed-load validation error
   (type "abc" as w awal): the error text is announced/visible and
   no load is created.
9. Run "Jalankan Analisis": the results tables' reaction values are
   readable cell by cell (expected for a 5 m beam with −10 kN point
   load: Ry = 5.000 at both supports).
10. Delete a node: the confirmation dialog is announced as an alert
    dialog, lists the dependents (its member), focus starts on
    "Batal"; cancel with Escape — the node survives; repeat and
    confirm — node and member are gone.

## D. Dialogs & focus
11. On an unstable model, open Analisis: the issues dialog is
    announced as a dialog, focus is inside it, and Escape closes it.
12. General: at no point does keyboard focus become invisible or
    land on a control with no announced name. Note any occurrence
    with the control's location.

## Recording results
For each numbered item record PASS / FAIL + what the screen reader
actually said (verbatim where it matters). File the completed
checklist as an addendum to docs/PHASE-8-ACCESSIBILITY-VALIDATION.md;
only then may the screen-reader status change from NOT_EVALUATED.

---

<!-- ===== docs/PHASE-8-REGRESSION-REPORT.md ===== -->

# Phase 8 — Regression & Solver-Provenance Report

Date: **2026-11-01**

## Final gates (baseline → final)

| Gate | Phase 8 baseline | Final |
|---|---|---|
| Unit/regression suite | 222/222 | **222/222 PASS** — no test removed, weakened, or re-expected |
| Build + typecheck | PASS | PASS |
| Lint | 0 errors / 20 warnings | **0 errors / 20 warnings** (unchanged; all react-refresh DX warnings, deliberately not chased) |
| Playwright E2E | 25/25 | **32/32 PASS** (+7 in new `e2e/phase8.spec.ts`) |
| External runtime requests | zero | zero (smoke hygiene assertions green) |
| Lockfile | `b294dc3d153cb492` | **unchanged** — no dependency changes this phase |
| Engine provenance | import-lines only vs original | re-verified: `solver.ts` diff vs original = **0 lines** modulo imports; **no `src/engine/**` file was opened for edit in Phase 8** |
| Original STRUKTURA | HEAD `77fd6e1…`, ` M docs/AUDIT_CYCLE.md` | **identical** at close |

## Coverage of the required regression list

- Canvas ↔ Data Tabel share one model: distributed load created in
  Data Tabel survives Data→Canvas→Data switches via the shared
  autosave (phase8 C1); node-coordinate edits in Data Tabel were
  already proven to re-solve in Phase 7; canvas drag proven in
  Phase 7 (drag-move.spec) and still green.
- Distributed-load solver response: UDL −10 kN/m × 5 m SS beam →
  reactions exactly 25.000 kN both ends (closed-form wL/2), asserted
  from the UI-rendered result table, not from internals.
- Focus remains operable after add/edit/delete in Data Tabel
  (keyboard flows complete end-to-end; delete dialog returns focus
  to the editor heading).
- Modal open/close + focus restoration: advisory dialog (B2) and
  delete dialog (C4) both E2E-covered.
- Live announcements: success/failure/save-success/save-failure all
  covered (live-announcements.spec + phase8.spec).
- No browser errors in tested workflows: pageerror captured and
  asserted empty in C1; smoke spec asserts zero failed requests.

## Defects found by Phase 8 testing (all fixed)

1. **F7** status pill 16 px → 24×24 (B1).
2. Advisory modal lacked dialog semantics/focus handling (B2).
3. **F8** 320 px dashboard overflow from the samples grid's fixed
   300 px min track → `minmax(min(300px, 100%), 1fr)` (B3).

---

<!-- ===== docs/PHASE-8-STATUS-MATRIX.md ===== -->

# Phase 8 — Status Matrix

Date: **2026-11-01** · Executive verdict: **INCOMPLETE** — every
locally executable gate passes, but `npm audit` remains blocked by
an environment policy (precisely diagnosed this phase), and a real
screen-reader walkthrough is still externally pending. Per the
Phase 8 definition of done, commercial release readiness remains
**INCOMPLETE**.

| Workstream | Baseline status | Final status | Evidence | Files changed | Tests added | Known limitations / remaining blockers | External/manual validation required |
|---|---|---|---|---|---|---|---|
| 1. Baseline & change control | Phase 7 close state | PASS | docs/PHASE-8-BASELINE.md | docs only | — | Repo is not a git checkout (state = file tree), as in all phases | No |
| A. Security audit closure | NOT RUN (7 phases) | **NOT RUN / BLOCKED** — root cause now precise: registry audit endpoint returns `403 policy_denied` from this environment's egress policy | docs/PHASE-8-SECURITY-AUDIT.md (exit codes, exact error, log reference) | docs only; **lockfile unchanged** | — | No vulnerability data exists; licence scan (Phase 3/6) is not a substitute | **Yes** — run `npm audit` once from an unrestricted network against lockfile `b294dc3d153cb492` |
| B1. Status pill target | F7 open (16 px) | **FIXED / PASS** | phase8.spec B1 measures ≥24×24 in the live editor | src/components/status-bar.tsx | 1 | — | No |
| B2. Advisory modal | plain div (Phase 7 record) | **PASS** (semantics + focus in + restore + Escape via App listener) | phase8.spec B2 | src/App.tsx | 1 | No full focus trap (single-action gate; recorded) | Human AT check in checklist §A.3 |
| B3. Viewport retest | F6a/F6b fixed in Phase 7 | **PASS** + new defect F8 found & fixed (320 px samples-grid overflow) | phase8.spec B3; mobile-a11y.spec | src/struktura/StrukturaRoot.tsx | 1 | — | No |
| C1. Distributed loads | read-only listing (Phase 7) | **COMPLETE** (CRUD both modes; wx via canvas — PARTIAL note) | phase8.spec C1 (UDL → 25.000 kN ×2) | src/components/data-model-editor.tsx | 1 (incl. invalid-input rejection) | wx components edited on canvas only | No |
| C2. Load cases & combinations | not in Data Tabel | **PARTIAL by design**: case toggles COMPLETE; combinations read-only display; editing NOT IMPLEMENTED | phase8.spec C2 | data-model-editor.tsx, src/App.tsx (props) | 1 | Combination factor editing stays in the canvas panel | No |
| C3. Section properties | not in Data Tabel | **COMPLETE** for core properties (name/E/A/I33 + validation) | phase8.spec C3 | data-model-editor.tsx | (in C3+C4) | Shape dims / create / delete stay in material editor | No |
| C4. Destructive operations | `window.confirm` (Phase 7) | **COMPLETE**: in-app alertdialog listing cascade dependents; cancel/Escape/confirm tested | phase8.spec C4 | data-model-editor.tsx | (in C3+C4) | — | No |
| D. SR & keyboard validation | NOT_EVALUATED (SR); DOM-level checks PASS | **INCOMPLETE**: executed checks all PASS; real SR walkthrough **NOT_EVALUATED** with a reproducible checklist delivered | docs/PHASE-8-ACCESSIBILITY-VALIDATION.md, docs/PHASE-8-SCREEN-READER-CHECKLIST.md | docs only | save-failure announcement test | NVDA/JAWS/VoiceOver unavailable here | **Yes** — human runs the 12-item checklist |
| E. Regression & provenance | 222/222, E2E 25/25 | **PASS**: 222/222, E2E **32/32**, lint 0 errors, solver diff 0 lines, original intact | docs/PHASE-8-REGRESSION-REPORT.md | — | +7 E2E total | — | No |

## Files changed in Phase 8

Source: `src/components/status-bar.tsx`, `src/App.tsx`,
`src/components/data-model-editor.tsx`,
`src/struktura/StrukturaRoot.tsx`.
Tests: `e2e/phase8.spec.ts` (new, 7 tests).
Docs: the nine Phase 8 deliverables.
No `src/engine/**` file modified; no dependency or lockfile change;
no new runtime dependency.
