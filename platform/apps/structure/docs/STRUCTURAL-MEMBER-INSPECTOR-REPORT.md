# ZonaSipil Structure — Interactive Member Inspector: Implementation Report

Status: **PARTIALLY COMPLETE** (see §6 for what is partial and why)
Mode: LOCAL ONLY. No push, no deploy, no DNS, no production change.
Solver: **unchanged** (proven by hash, §7).

## 1. What was built

An interactive result inspector for the Analyze view:

- **Click a member on the canvas (Analyze tab)** → the inspector
  panel opens with that member's identity and results. Clicking
  another member switches the inspection (replace semantics,
  Analyze-only); clicking the same member toggles it off; clicking
  empty canvas clears the selection and closes the panel.
- **Click a node on the canvas (Analyze tab)** → the node variant
  of the inspector (coordinates, support, solver displacements,
  reactions where a support exists).
- **Inspector panel** (`Inspektor Elemen <id>`): start/end nodes,
  length (m), section name, material class where the section
  carries one, related supports; end-force table (N1/V1/M1,
  N2/V2/M2 in kN / kN·m) taken verbatim from the solver result;
  end displacements (u, v, θ) from `nodeDisplacements`.
- **Continuous inspection**: a position slider (x/L, 0..1,
  keyboard-operable) evaluates N(x), V(x), M(x) through the
  engine's own `memberInternalForces` recovery — the same function
  the N/V/M diagrams are drawn from — and shows x in metres.
- **Canvas marker**: an amber ring on the member axis at the
  inspected xi, moving with the slider (brand colours navy/amber).
- **Honest absence**: when the displayed result has no data for the
  selected member (e.g. unstable model), the panel shows identity
  plus "Hasil analisis tidak tersedia untuk elemen ini." — no
  invented numbers anywhere.
- Sign conventions are printed in the panel, copied from the
  engine's own documentation: N positive = tension, V = SAP2000
  convention, M positive = sagging.

## 2. Files created / changed

Created:
- `src/visualization/inspector.ts` — read-only adapter:
  `inspectMember`, `inspectNode`, `internalForcesAt`,
  `memberLength`. All values come from solver outputs
  (`memberEndForces`, `nodeDisplacements`, `reactions`) and the
  engine recovery function; missing data → `null`, never a guess.
- `src/components/member-inspector.tsx` — the panel (member and
  node variants, sign-convention footnote).
- `tests/unit/inspector.test.ts` — 7 adapter tests (§4).
- `e2e/inspector.spec.ts` — 3 browser tests (§5).

Changed:
- `src/canvas/structural-canvas.tsx` — (a) new optional prop
  `inspectionPoint` + `drawInspectionMarker` (one draw callback,
  called inside the Analyze draw block); (b) click handling:
  Analyze-tab clicks now perform selection (previously clicks in
  Analyze did nothing — selection only existed under the SELECT /
  Model DELETE tools), with node-first semantics in Analyze and a
  new optional `onReplaceSelection` prop used only there. Pan
  suppression, box selection, drag/zoom and all Model/Load flows
  are untouched.
- `src/App.tsx` — `inspectionXi` state, inspector targets derived
  from the existing shared `selection` state, `MemberInspector`
  rendered in the Analyze flow under the simulation controls,
  `handleReplaceSelection`, `inspectionPoint` passed to the canvas.

NOT changed: `src/engine/**` (hash-proven), the model schema,
localStorage keys, the lockfile, any existing component's
behaviour outside Analyze click selection.

## 3. Solver data actually used

- `AnalysisResult.memberEndForces[id]` → end-force table and the
  input to `memberInternalForces(ef, x, L)`.
- `AnalysisResult.nodeDisplacements[id]` → end displacements and
  node displacements.
- `AnalysisResult.reactions[id]` → node inspector (supports only).
- Model data (nodes/members/sections/supports) → identity fields.
- The displayed result is the same `displayedResult` the canvas
  draws (case / combination / envelope via the existing picker),
  so the inspector can never disagree with the diagrams about
  WHICH result is on screen.

## 4. Accuracy validation (unit)

Canonical beam (SS, L = 5 m as two 2.5 m members, P = 10 kN at the
joint; independent statics: reactions 5/5, joint moment PL/4 =
12.5 kN·m sagging, linear 0 → 12.5 on the left member, N = 0):

- `internalForcesAt` agrees **exactly** (bit-for-bit, `toBe`) with
  direct `memberInternalForces` calls at xi = 0, .25, .5, .75, 1 —
  the adapter adds no arithmetic of its own.
- Through that recovery it reproduces the independent statics:
  M(0) = 0, M(L/2 of member) = 6.25, M(joint) = 12.5 from BOTH
  adjoining members (continuity), |V| = 5, N = 0.
- xi is clamped to [0, 1] (no extrapolation); unknown member or
  missing result → `null`; identity remains available without a
  result; node inspection returns reactions only at supports and
  the correct sagging displacement sign at midspan.

7/7 tests pass; full unit suite **237/237** (was 230).

## 5. Browser validation (Playwright E2E)

`e2e/inspector.spec.ts`, 3 tests, all pass; full suite **39/39**
(was 36):

1. Desktop flow on sample 01: no inspector before selection →
   click left member (L = 2 m) → identity + end forces (V −6.000,
   joint M 12.000 = 6 kN × 2 m from the 6/4 reactions) → default
   xi 0.50 gives M(x) = 6.000 at x = 1.000 m → keyboard End sets
   xi = 1.00 (M(x) = 12.000), Home sets xi = 0 (M(x) ≈ 0.000) →
   click right member (L = 3 m) switches → switch displayed load
   case (Beban Mati → Berat Sendiri): same member stays inspected
   → click empty canvas clears → click the loaded node: node
   inspector shows (−0.500, 0.000) m → zero page errors throughout.
2. No-result honesty: a member built in Data Tabel with no
   supports — after dismissing the instability warning dialog,
   clicking it shows identity (4.000 m) plus the explicit
   "hasil tidak tersedia" message.
3. Mobile (landscape phone viewport, the orientation the app's
   own advisory recommends): member click → panel present with
   correct identity and joint moment.

Canvas-click test technique note: the status-bar readout is
grid-snapped (0.5 m), so the spec calibrates a least-squares
pixel↔model fit over hover probes after scrolling the canvas
fully into view, and clicks nodes via their snap-to-node plateau.

## 6. What is PARTIAL, and why (honest scope)

1. **Diagram-curve marker (prompt §3/§4) — PARTIAL.** The
   inspection marker is drawn on the member axis at xi. It is NOT
   projected onto the N/V/M diagram curves: each diagram's
   scale/offset transform is computed privately inside its draw
   callback, and duplicating those transforms in a second place
   would risk the marker disagreeing with the diagram it marks.
   Synchronisation is exact at the DATA level (same xi, same
   recovery function, same displayed result); the visual marker
   lives on the member, not on the curves.
2. **Interactive diagrams (prompt §4) — NOT IMPLEMENTED as
   diagram hit-testing.** The diagrams remain display-only;
   selection and inspection happen on the member/node themselves,
   which is the same data path. Hovering a diagram does not move
   the inspection point.
3. **Selection persistence scope.** The selection persists across
   result-view changes WITHIN Analisis (case / combination /
   envelope — verified for case switching in E2E). Switching
   editor TABS resets the selection — that is the pre-existing
   behaviour of the app's tab-change handler and was left as is.
4. **Material label.** Shown only when the section record carries
   a material class (Beton/Baja). The sample templates' sections
   carry none, so the field honestly shows "—" rather than a
   guessed material.

## 7. Gates and integrity

- Unit/regression: **237/237 PASS** (28 files).
- Playwright E2E: **39/39 PASS**.
- Build (incl. typecheck): **PASS**.
- ESLint: **0 errors, 20 warnings** — unchanged from baseline.
- `src/engine/solver.ts` sha256 prefix `ca5a9240af0699cb` —
  unchanged. No file under `src/engine/` was modified.
- `package-lock.json` sha256 prefix `b294dc3d153cb492` —
  unchanged. No new dependencies.
- Original STRUKTURA (`~/workspace/struktura/`): HEAD `77fd6e1`,
  working tree still shows only the protected pre-existing
  ` M docs/AUDIT_CYCLE.md`. Untouched.
- Canvas hash changed intentionally (marker + Analyze selection):
  `e4916a85fdc0022b`.

## 8. Status

PARTIALLY COMPLETE — the member inspector, node inspector,
continuous x/L inspection with engine-exact values, canvas
position marker, result-view persistence, no-result honesty, and
mobile panel are implemented and test-proven. The two recorded
partials are the diagram-curve marker projection and diagram
hit-testing (§6.1–6.2), both deferred rather than faked.

No further work follows from this report without a new
instruction. STOP.
