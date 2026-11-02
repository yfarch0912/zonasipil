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
