# ZONASIPIL STRUCTURE — LAPORAN GABUNGAN PHASE 7

Accessibility Completion, React Hooks Reliability & Interaction Hardening · 2026-11-01

Gabungan 9 dokumen Phase 7 dari `docs/`. Isi sama persis dengan berkas asalnya.

---

<!-- ===== docs/PHASE-7-BASELINE.md ===== -->

# Phase 7 — Baseline

Date: **2026-11-01** · Environment: Node v24.22.1, npm 10.9.4,
Playwright 1.64.1 (Chromium Headless Shell 156).

| Check | Result |
|---|---|
| Suite | **222/222 PASS (26 files)** |
| Build + typecheck | PASS |
| Lint | **33 problems: 6 errors, 27 warnings** (target this phase: 0 errors) |
| E2E | **14/14 PASS** (smoke 1, workflows 7, accessibility 6) |
| Security | `npm audit` NOT RUN (endpoint error; retried at baseline — log `2026-11-01T09_19_45_473Z`) |
| Lockfile | sha256 prefix `b294dc3d153cb492` — unchanged since Phase 5 |
| External runtime requests | zero (Phase 6 font self-hosting verified) |
| Original STRUKTURA | untouched: HEAD `77fd6e1bf537…`, only ` M docs/AUDIT_CYCLE.md` |

Open items carried in: F3 (no live announcements), F4 (canvas
pointer-only), screen-reader walkthrough and mobile accessibility
NOT_EVALUATED, 6 hooks lint errors, GESER SIMPUL drag without E2E.
No unexpected modifications found; workstreams proceed.

---

<!-- ===== docs/PHASE-7-REACT-HOOKS-REMEDIATION.md ===== -->

# Phase 7 — React Hooks Remediation

Date: **2026-11-01** · Result: **lint errors 6 → 0** (warnings 27 → 20;
the remaining 20 are all `react-refresh/only-export-components`
DX-only findings, documented since Phase 5). No eslint-disable was
added anywhere. Full gates after the change: suite 222/222, build
PASS, E2E 14/14.

## 1. The original six errors and their fixes

### App.tsx — `react-hooks/immutability` ×2 (use before declaration)
`handleCanvasClick` referenced `handleSelectItems` /
`handleDeselectItems`, which were declared ~270 lines later. The
handlers only depend on state setters, selection helpers and `model`,
all in scope much earlier, so the two declarations were **moved above
`handleCanvasClick`** verbatim (bodies and dep arrays unchanged).

### structural-canvas.tsx — `react-hooks/refs` ×4 (refs during render)
- **boxPreview memo (×3 entries):** the memo read
  `containerRef.current.getBoundingClientRect()` to size its
  screen→world conversion. The container size is now **state**
  (`containerSize`), maintained by a `ResizeObserver` effect; the memo
  consumes the state and lists it in its deps. Behaviour: previously
  the rect was sampled whenever the memo happened to recompute; now a
  resize explicitly recomputes it — strictly fresher, same values.
- **cursorClass (×1):** render read `dragNodeRef.current` to pick the
  grabbing cursor. The component already receives the reactive
  **`draggingNodeId` prop** (the parent tracks the same drag via the
  canvas's own onDragNodeStart/End callbacks), so the render now reads
  the prop. Same signal, no ref.

## 2. The unmasking effect (important, recorded honestly)

Fixing the six errors raised the reported total before it fell:
**33 (6e) → 45 (18e) → 20 (0e)**. The React Compiler linter stops
analysing a component at its first bailout error, so components
containing the six errors had **12 further diagnostics suppressed**:
2 `set-state-in-effect` and 10 `preserve-manual-memoization` in the
canvas, plus 2 more `preserve-manual-memoization` for
`handleCanvasClick`. These were latent, not introduced — the edits
that "caused" them touch none of those lines. All 14 were fixed:

- **`preserve-manual-memoization` ×12** — every case was a dep array
  missing values the callback genuinely reads: unit-derived values in
  the canvas draw callbacks (`forceScale`, `forceLabel`,
  `momentLabel`, `distLoadLabel`, `lengthUnit`, and `boxPreview` in
  `drawLoads`) and `selection`, `handleSelectItems`,
  `handleDeselectItems` in `handleCanvasClick`. The missing deps were
  **added**. This is a correctness improvement, not cosmetics: e.g.
  diagram drawers previously kept stale closures over unit scales
  until some unrelated dep changed.
- **`set-state-in-effect` ×2 (App.tsx):**
  1. The load-view filter effect merely mirrored derived inputs into
     state; it is now the documented **adjust-state-during-render**
     pattern keyed on `${isPlacingLoad}:${activeLoadCaseId}` — same
     semantics, no effect pass.
  2. The analysis-issues dialog auto-open was an effect watching
     Analyze-tab entry edges. The trigger moved into
     **`handleTabChange`** — the single UI path that enters the tab —
     opening the dialog when the current merged report contains an
     error-severity issue. User-visible behaviour is identical for UI
     navigation (verified by the unstable-model E2E, which enters
     Analisis and surfaces the diagnostics).

## 3. Regression protection

- Existing suites unchanged and green: unit/regression 222/222,
  Playwright 14/14 (includes canvas modelling, analysis, flyout and
  diagnostics flows that exercise the touched components).
- The 7 `exhaustive-deps` warnings from Phase 5 also cleared as a side
  effect of the dep completions; remaining warnings are exclusively
  the DX-only react-refresh class.
- Manual canvas verification: box-selection preview, node drag
  (Workstream F adds a dedicated drag E2E this phase), cursor states
  and diagram rendering all exercised through the E2E flows above.

---

<!-- ===== docs/PHASE-7-LIVE-ANNOUNCEMENTS.md ===== -->

# Phase 7 — Accessible Live Announcements (F3 resolved)

Date: **2026-11-01** · Status: **PASS** for the implemented scope —
verified by `e2e/live-announcements.spec.ts` (4 tests, all PASS).

## Implementation

- `src/shared/announce.ts` — a tiny announcement bus
  (`announceStatus(text, priority)` dispatching a window event).
- `src/shared/live-announcer.tsx` — `LiveAnnouncer`: a polite region
  (`aria-live="polite"`, `role="status"`) and an assertive region
  (`aria-live="assertive"`, `role="alert"`), both `sr-only`, mounted
  once by `StrukturaRoot` in **both** dashboard and editor views, so
  the regions exist before any update can occur. The listener
  clear-then-sets text (40 ms) so a repeated identical message is
  still announced.
- Producers:
  - **App (analysis outcomes):** an effect keyed on the classification
    set / failure reason of `caseResults`. Solver failure →
    assertive, announced wherever it occurs (Analyze/Design tabs,
    where results exist). Completed analysis → polite, announced when
    the outcome completes on the Analyze tab or the user enters it.
    Non-VALID classifications that make results untrustworthy
    (PHYSICALLY_IMPLAUSIBLE, NUMERICALLY_UNRELIABLE) escalate to
    assertive. Language: Bahasa Indonesia, e.g. "Analisis selesai.
    Klasifikasi: valid." / "Analisis gagal. …".
  - **StrukturaRoot (save + root errors):** successful
    `handleSaveToProject` → polite "Proyek berhasil disimpan."; any
    root error state (save/report/import failures) → assertive
    "Terjadi kesalahan: …" via an effect on the error state.

## Decisions recorded

- **"Analysis started" is not announced.** The solve is
  synchronous/derived in this app; a start message would be replaced
  by the outcome within the same tick, producing noise without
  information. The evaluated alternative (announce on tab entry) is
  what the completion-on-entry announcement already covers.
- **No announcements while modelling on the Model tab for successful
  solves** — `caseResults` only exists on Analyze/Design tabs, and
  re-solves during editing would spam the region. The classification
  key guard also suppresses repeat announcements when a re-solve
  yields the same outcome.
- **Empty models are excluded:** a model with no members has nothing
  to analyse, so its solver failure is not announced (it is not an
  event, and announcing it on every new project would train users to
  ignore the assertive channel).
- No fabricated success: announcements fire only from the actual
  success/failure branches of the save handler and solver results.

## Tests

`e2e/live-announcements.spec.ts`: regions present and empty at first
paint; sample 01 → Analisis announces completion + "valid" politely;
unstable model → entering Analisis announces "Analisis gagal."
assertively; Simpan proyek announces save completion politely.

---

<!-- ===== docs/PHASE-7-KEYBOARD-MODELLING-DESIGN.md ===== -->

# Phase 7 — Keyboard-Accessible Modelling: Design

Date: **2026-11-01** · Resolves the architectural half of Phase 6
finding **F4** (canvas modelling is pointer-only).

## Problem

All model editing in the editor is canvas pointer interaction
(place/drag nodes, click members, click supports). A keyboard-only
user cannot create or edit a model at all, even though every result
the app produces (reactions, diagrams as data, design checks) is
inherently tabular.

## Design decision

Add a **"Data Tabel" tab** alongside Model/Beban/Analisis/Desain that
renders a form-and-table editor over the **same** `StructureModel`
state the canvas uses:

- **Same state, same ops.** The view receives App's `model` and
  `setModel`. Mutations go through the engine's existing operations
  where they exist (`addNode`, `deleteNode`, `deleteMember` from
  `src/engine/model.ts` / `geometry.ts` — including their cascade
  rules) and through the same plain-record construction the canvas
  handlers use elsewhere (supports, loads, member section). There is
  no second model and no second calculation path.
- **Same solver.** Its analysis button calls `solveAllCases` from
  `src/engine/analysis-pipeline.ts` — the exact pipeline the Analisis
  tab renders — and displays classification + reactions as text
  tables.
- **Native controls only.** `<table>`, `<input>`, `<select>`,
  `<button>`, `<label>` — everything reachable and operable by
  keyboard by construction, with visible focus from the app's existing
  styles. Numeric fields commit on blur/Enter so typing is natural.
- **Destructive actions are explicit.** Delete buttons state their
  cascade in a native `confirm()` ("menghapus simpul juga menghapus
  elemen, tumpuan, dan beban yang terhubung") — the dependency
  feedback the engine's cascade makes true.
- **Canvas untouched.** The canvas remains the primary editor; the
  Data tab is an alternative front-end to the same document, and
  switching tabs mid-session shows the same model in both.

## Vertical slice scope (this sprint)

Implemented: node create/edit-coordinates/delete (with cascade),
support assignment per node, member create (node pair + section) /
edit endpoints and section / delete (with cascade), point-load
create/edit/delete, distributed-load list + delete, run analysis
(all cases) and read classification + reactions as tables.

Explicitly **INCOMPLETE** (recorded, not hidden): editing distributed
loads' magnitudes in the table (they are listed and deletable;
creating/editing them remains a canvas task in this slice), load-case
and combination management, section geometry editing (the MATERIAL
library editor already exists as a form UI and is keyboard-reachable
in the Model tab), and design-tab inputs. F4 therefore remains
INCOMPLETE overall — the core modelling loop (geometry → supports →
section → load → analysis → results) is keyboard-completable, the
long tail is not.

---

<!-- ===== docs/PHASE-7-KEYBOARD-MODELLING-IMPLEMENTATION.md ===== -->

# Phase 7 — Keyboard-Accessible Modelling: Implementation

Date: **2026-11-01** · Status: **vertical slice IMPLEMENTED and
E2E-verified; F4 remains INCOMPLETE** for the gaps listed in the
design document (distributed-load editing, load-case/combination
management, section geometry editing in-table).

## What was built

- **New "Data Tabel" tab** (`TabType` gains `"Data"`; NavBar label
  "Data Tabel"; the tool sidebar renders no canvas tools for it).
- **`src/components/data-model-editor.tsx`** (~430 lines), rendered by
  App in place of the canvas when the Data tab is active. It receives
  App's own `model`/`setModel` and `loadCases` — the same state the
  canvas edits — and mutates it through the engine's operations
  (`addNode`, `deleteNode`, `deleteMember`, with their built-in
  cascades) and the same record shapes the canvas handlers use.
- **Capabilities:** node add / coordinate edit (commit on blur/Enter)
  / delete with a confirm dialog that names the cascade; per-node
  support select (Tanpa/Sendi/Rol/Jepit); member add (node pair +
  section) / endpoint and section edit / delete with cascade confirm;
  point-load add / retarget / Fy edit / delete; distributed loads
  listed with their limitation stated in the UI itself; **Jalankan
  Analisis** runs `solveAllCases` (the Analisis tab's own pipeline)
  and renders classification + a reactions table per case.
- No canvas code was removed or altered for this feature; switching
  tabs shows the same model in both editors. The Phase 7 hooks work
  stayed green throughout: build PASS, lint 0 errors / 20 warnings.

## Verification

`e2e/keyboard-modelling.spec.ts` (PASS): creates a project, enters
the Data tab by keyboard, and builds a 5 m simply supported beam
**entirely with the keyboard** — three nodes typed in, pin/roller
supports chosen with arrow keys on native selects, two members
added, a −10 kN mid-span point load — then runs the analysis from
the table and reads **Ry = +5.000 kN at both supports** and
classification VALID from the rendered results table, with zero page
errors. Model contents are cross-checked in the autosave (3 nodes,
2 members, 1 load, 2 supports).

## Honest limits

The slice proves the core loop (geometry → supports → section →
load → analysis → results) is keyboard-completable on the real
model/solver. It does not make the whole product keyboard-complete:
load combinations, distributed-load editing, and the design tab's
deeper forms remain canvas/pointer-first, so F4 stays INCOMPLETE.

---

<!-- ===== docs/PHASE-7-ACCESSIBILITY-VALIDATION.md ===== -->

# Phase 7 — Mobile & Screen-Reader Validation

Date: **2026-11-01** · Status: **INCOMPLETE** — the checks below were
executed and two real defects were found and fixed, but a genuine
screen-reader walkthrough remains NOT_EVALUATED (see §4).
Evidence: `e2e/mobile-a11y.spec.ts` (5 tests, all PASS).

## 1. Mobile viewport (Pixel 7 emulation, 412×915, touch)

- **F6a — dashboard horizontal overflow: FOUND & FIXED.** The
  dashboard rendered 491 px wide on a 412 px viewport (new-project
  form locked to 3 columns; project header row unwrappable with a
  fixed 220 px search field). Fixed in StrukturaRoot using the
  existing `useIsMobile` hook: the form goes single-column and the
  header row wraps with a full-width search field on mobile. Verified:
  page-level overflow now ≤1 px.
- **F6b — editor tabs unreachable on mobile: FOUND & FIXED.** The
  NavBar's absolutely-centred tab group placed the (new) Data Tabel
  tab at x=416 px — outside the viewport, with no scroll container.
  On mobile the group is now an in-flow, horizontally scrollable
  strip with compact padding and the wordmark hidden. Verified by
  tapping through to the Data Tabel tab in the test.
- **Advisory modal (by design, recorded):** the editor opens behind a
  full-screen "Lebih Baik di Layar Lanskap atau PC Desktop" modal
  with a "Tetap Lanjutkan" dismissal. It is a plain div without
  dialog semantics (same class as F5); not changed in this phase —
  recorded here so the gap is explicit. The Data Tabel view gives
  phone users a workable path once past it.
- **Touch targets (WCAG 2.5.8):** Data Tabel's own controls measure
  ≥26 px — PASS. **F7 (open):** the status-bar STATUS pill button is
  16 px tall, below the 24 px AA minimum. Left open deliberately:
  the status bar's density is a product-wide design decision, not an
  isolated defect; recorded for a future chrome pass.
- **Narrow/zoom proxy:** at 320 px width (roughly 200% zoom of a
  small phone) the dashboard remains operable; the Phase 6 viewport
  fix (zoom not disabled) still holds.

## 2. Screen-reader semantics (DOM inspection)

- Landmarks: dashboard has `header`; editor has `nav`, exactly one
  `main`, and `aside` — PASS.
- Data Tabel tables expose real `<th>` header cells (≥3 per table) —
  PASS.
- **F5 — analysis-issues dialog semantics: FOUND & FIXED.** The
  dialog was a plain div: no `role="dialog"`, no `aria-modal`, focus
  never moved into it. It now carries role/aria-modal/aria-label and
  focuses itself on open (verified: document.activeElement is inside
  the dialog).
- **Escape reliability (found during F5 verification):** real
  keydowns reached App-registered window listeners but the dialog's
  own subscription was not reliably live — its effect re-subscribes
  on every render because App passes an inline `onClose`, and
  listener-registry instrumentation showed add/remove churn with the
  subscription absent at rest. Escape-to-close is now also handled in
  App's existing window keydown listener (state-local, dependable);
  verified end-to-end by the test.
- Live regions (F3, Workstream C) verified separately in
  `e2e/live-announcements.spec.ts`.

## 3. Canvas alternative navigation

The Data Tabel tab (Workstream D) is the canvas alternative: full
modelling loop operable by keyboard, results as text tables
(`e2e/keyboard-modelling.spec.ts`).

## 4. NOT_EVALUATED — stated plainly

**No NVDA, JAWS, or VoiceOver session was executed** — those tools
are not available in this environment, and nothing in this document
should be read as screen-reader verification. What exists is DOM
semantics inspection, focus behaviour, live-region behaviour, and
keyboard operability, all exercised in a real browser. A human
screen-reader walkthrough (NVDA + Chrome at minimum) remains the
outstanding validation step before any "accessible" claim.

---

<!-- ===== docs/PHASE-7-CANVAS-DRAG-E2E.md ===== -->

# Phase 7 — Canvas Drag-Move E2E (GESER SIMPUL)

Date: **2026-11-01** · Status: **PASS** — `e2e/drag-move.spec.ts`
(1 test, green in the full suite run).

## Scenario

Sample 01 (span 5 m centred on the origin: supports x=−2.5/+2.5,
loaded node x=−0.5, i.e. 2 m from the left support):

1. Open sample 01; read the autosaved model — the loaded node and
   support positions come from the model itself, not assumptions (an
   early draft of this test assumed 0/2/5 m coordinates and failed
   against the real template geometry; the test now derives every
   coordinate from the autosave).
2. Activate **GESER SIMPUL**; drag the loaded node with the mouse from
   x=−0.5 to x=+0.5 (3 m from the left support), using a pixel↔world
   mapper calibrated live from the editor's status-bar readout (the
   same technique as the workflows spec — fixed fractions are
   unreliable because the view re-fits).
3. Verify from the autosave: node coordinates changed to the target
   (±0.01 m), y unchanged; connected member lengths are now 3 m and
   2 m.
4. Re-run analysis on the Analisis tab: the Ringkasan reactions are
   **+4 kN / +6 kN** — the exact statics of the new geometry
   (R_left = 10·(5−3)/5), mirrored from the original 6/4.
5. Zero page errors throughout.

This closes the Phase 6 coverage gap: canvas drag editing is now
covered by a deterministic browser test that goes through the real
pointer interaction and the real solver, and it doubles as the manual
canvas verification for the Phase 7 hooks remediation (the drag path
exercises `draggingNodeId`, `handleMoveNode`, and the canvas render
loop whose ref-read was removed).

---

<!-- ===== docs/PHASE-7-SECURITY-AUDIT.md ===== -->

# Phase 7 — Security Audit

Date: **2026-11-01** · Status: **NOT RUN / INCOMPLETE** (seventh
consecutive phase).

- Attempted at Phase 7 baseline: `npm audit`, Node v24.22.1 /
  npm 10.9.4, registry `https://registry.npmjs.org/`, lockfile sha256
  prefix `b294dc3d153cb492` (unchanged since Phase 5).
- Result: `npm error audit endpoint returned an error`; log
  `~/.npm/_logs/2026-11-01T09_19_45_473Z-debug-0.log`.
- No TLS/registry control bypassed, no `audit fix`, no counts
  fabricated, no alternative environment available to the agent.
- Consequence per the Phase 7 definition of done: commercial release
  readiness remains INCOMPLETE. Closure remains a one-command user-side
  action on any normal network (`npm audit` in a checkout with this
  lockfile), to be filed as an addendum here.

---

<!-- ===== docs/PHASE-7-STATUS-MATRIX.md ===== -->

# Phase 7 — Status Matrix

Date: **2026-11-01** · Sprint verdict: **INCOMPLETE** by its own
definition of done — security audit still NOT RUN, F4 only partially
resolved, and no real screen-reader walkthrough exists. Everything
executable in this environment was executed and is evidenced below.

## Final gates (vs Phase 7 baseline)

| Gate | Baseline | Final |
|---|---|---|
| Unit/regression suite | 222/222 | **222/222 PASS** (no test removed or weakened) |
| Build + typecheck | PASS | PASS |
| Lint | 33 (6 errors, 27 warnings) | **20 (0 errors, 20 warnings)** — warnings are all DX-only react-refresh |
| Playwright E2E | 14/14 | **25/25 PASS** |
| External runtime requests | zero | zero |
| Lockfile | `b294dc3d153cb492` | unchanged |
| Original STRUKTURA | HEAD `77fd6e1…`, ` M docs/AUDIT_CYCLE.md` | identical |
| Solver provenance | engine = original modulo imports | re-verified: solver diff 0 lines modulo imports; **no engine file touched in Phase 7** |

## Workstreams

| WS | Status | Evidence |
|---|---|---|
| A. Baseline | PASS | docs/PHASE-7-BASELINE.md |
| B. React hooks reliability | **PASS** | 6 original errors fixed; fixing them unmasked 14 latent compiler diagnostics (2 set-state-in-effect, 12 preserve-manual-memoization), all fixed without eslint-disable; final 0 errors. docs/PHASE-7-REACT-HOOKS-REMEDIATION.md |
| C. Live announcements (F3) | **PASS** | polite/assertive live regions mounted in both views; analysis outcomes + save outcomes announced in Bahasa Indonesia; 4 E2E. docs/PHASE-7-LIVE-ANNOUNCEMENTS.md |
| D. Keyboard modelling (F4) | **INCOMPLETE** | Working vertical slice: "Data Tabel" tab over the same model/ops/solver; full beam built keyboard-only in E2E with correct reactions (+5.000 kN ×2). Gaps: distributed-load editing, load-case/combination management, in-table section geometry. docs/PHASE-7-KEYBOARD-MODELLING-{DESIGN,IMPLEMENTATION}.md |
| E. Mobile & SR validation | **INCOMPLETE** | Mobile: dashboard overflow (F6a) and unreachable editor tabs (F6b) found & fixed; Data controls ≥26 px; F7 open (status pill 16 px). SR: landmarks/tables PASS; dialog semantics F5 found & fixed (+ Escape reliability moved to App listener). **Screen-reader walkthrough NOT_EVALUATED** (no NVDA/JAWS/VoiceOver available). docs/PHASE-7-ACCESSIBILITY-VALIDATION.md |
| F. Drag-move E2E | **PASS** | GESER SIMPUL drag −0.5→+0.5 m; autosave geometry + swapped reactions 4/6 kN verified. docs/PHASE-7-CANVAS-DRAG-E2E.md |
| G. Security audit | **NOT RUN / INCOMPLETE** | 7th consecutive endpoint failure; no counts fabricated. docs/PHASE-7-SECURITY-AUDIT.md |

## Files changed in Phase 7

Source: `src/App.tsx`, `src/canvas/structural-canvas.tsx`,
`src/components/analysis-issues-dialog.tsx`,
`src/components/nav-bar.tsx`, `src/components/tool-sidebar.tsx`,
`src/struktura/StrukturaRoot.tsx`; new:
`src/components/data-model-editor.tsx`, `src/shared/announce.ts`,
`src/shared/live-announcer.tsx`.
Tests (all new): `e2e/live-announcements.spec.ts`,
`e2e/drag-move.spec.ts`, `e2e/keyboard-modelling.spec.ts`,
`e2e/mobile-a11y.spec.ts`. Docs: the nine Phase 7 deliverables.
No `src/engine/**` file was modified.

## Remaining blockers

1. `npm audit` has never executed (7 phases) — commercial release
   readiness stays INCOMPLETE until it runs somewhere with registry
   access against this lockfile.
2. F4 long tail (distributed-load editing, combinations, section
   geometry in table form).
3. F7 status-bar target size; mobile advisory modal lacks dialog
   semantics.
4. Human screen-reader walkthrough outstanding.
