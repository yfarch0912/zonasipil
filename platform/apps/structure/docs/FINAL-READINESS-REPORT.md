# ZonaSipil Structure — Final Readiness Report

Date: **2026-11-01** · Basis: Phase 8 verified evidence
(docs/PHASE-8-STATUS-MATRIX.md and the reports it cites).

## Change check since Phase 8 (performed for this closure)

- File timestamps: **no file under `src/` or `e2e/` is newer than the
  Phase 8 regression report** — zero code changes since the final
  gates ran. Phase 8 evidence is therefore reused as-is; the full
  suites were not re-run merely to restamp them.
- Lockfile sha256 prefix: `b294dc3d153cb492` (unchanged).
- Solver provenance: `src/engine/solver.ts` diff vs the original
  STRUKTURA = 0 lines modulo imports.
- Original STRUKTURA: HEAD `77fd6e1bf537…`, single protected change
  ` M docs/AUDIT_CYCLE.md` — untouched.

## Current verified results (Phase 8, 2026-11-01)

| Gate | Result |
|---|---|
| Unit/regression tests | **222/222 PASS** (26 files; analytical benchmarks + regressions) |
| Build + typecheck | PASS |
| Lint | **0 errors**, 20 warnings (all react-refresh, developer-experience only) |
| Playwright E2E | **32/32 PASS** (7 spec files) |
| External runtime requests | zero in tested workflows |
| Dependencies | no changes; lockfile unchanged |

## Core workflow readiness (all nine steps evidenced by tests)

| Step | Status | Evidence |
|---|---|---|
| 1. Open the application | READY | smoke.spec (dashboard renders, zero failed requests) |
| 2. Open an example or create a model | READY | workflows.spec (sample load, new-project form, templates) |
| 3. Edit nodes and members | READY | keyboard-modelling.spec, phase8.spec, drag-move.spec (canvas drag) |
| 4. Materials, section properties, supports | READY | workflows.spec (material edit recomputes A), phase8.spec C3 (section E/A/I33), support selects in keyboard flows |
| 5. Point + distributed loads | READY | keyboard-modelling.spec (point); phase8.spec C1 (distributed, both modes) |
| 6. Run analysis | READY | all analysis specs; solver benchmarked against closed-form statics (222 unit tests) |
| 7. Read reactions, classification, diagnostics | READY | reaction tables in Data Tabel; classification announcements; issues dialog |
| 8. Save and reopen | READY | workflows.spec (autosave + reload persistence), project save/list flows |
| 9. Invalid/unstable models fail honestly | READY | workflows.spec (STATUS "TIDAK STABIL", no fabricated results), invalid-JSON import rejected, assertive failure announcement |

## Findings by class

- **CRITICAL BLOCKER (internal testing): none.**
- **INTERNAL TESTING LIMITATION:**
  - Screen-reader behaviour is unverified (see below) — internal
    testers who rely on AT should run the checklist first.
  - The landscape advisory dialog has no full focus trap
    (single-action gate; semantics and focus handling verified).
  - Data Tabel edits distributed-load `wy` components; `wx` is
    canvas-only. Combination editing is canvas-only. Both have
    working equivalents in the primary UI.
- **COMMERCIAL RELEASE BLOCKER:**
  - `npm audit` has never executed (security, below).
  - Screen-reader validation outstanding — blocks any accessibility
    conformance claim, not internal use.
- **NON-BLOCKING WARNING:** 20 react-refresh lint warnings (DX
  only); lucide-react icon debt vs the Anti-Slop protocol (tracked,
  cosmetic/policy, no functional impact).
- **DEFERRED FEATURE:** combination editing and section
  create/delete inside Data Tabel; platform routing (`/apps/*` vs
  subdomain) undecided; GitHub repository creation/push not yet
  authorised; Calculator Mode and 3D remain UNSUPPORTED by design.

## Security audit status

**NOT RUN.** The registry audit endpoint is policy-blocked in the
build environment: `403 Forbidden - POST
https://registry.npmjs.org/-/npm/v1/security/audits/quick -
policy_denied` (proven via `npm audit --json`, Phase 8). No
vulnerability counts exist and none are claimed; the Phase 3/6
licence scan (277 packages, no copyleft, no unknown licences) is
not a vulnerability audit.
**Exact closure action:** from any authorised network, in a checkout
with this lockfile (sha256 `b294dc3d153cb492…`), run `npm audit`
and file the complete output as an addendum to
docs/PHASE-8-SECURITY-AUDIT.md. This blocks a verified
commercial-release security decision; it does not invalidate the
functional evidence above.

## Screen-reader validation status

**NOT_EVALUATED.** NVDA/JAWS/VoiceOver are unavailable in the build
environment; no session was simulated or fabricated. DOM semantics,
focus behaviour, live announcements, and full keyboard operability
are test-verified (docs/PHASE-8-ACCESSIBILITY-VALIDATION.md). The
reproducible human procedure is
docs/PHASE-8-SCREEN-READER-CHECKLIST.md (12 items). No WCAG
conformance is claimed.

## Run locally

```bash
cd ~/workspace/zonasipil-structure
npm ci            # only if node_modules is absent
npm run dev       # development server (Vite)
# or production build:
npm run build && npm run preview
npm test          # unit/regression suite
npm run test:e2e  # Playwright suite (serves the build on 127.0.0.1:4317)
```

## Manual smoke-test checklist (±10 minutes)

1. Open the app; load sample 01 — editor shows 3 nodes, 2 members.
2. Tab Analisis: status reads a VALID classification; reactions
   +6/+4 kN.
3. Data Tabel: change node 2's X by +1 m, re-run analysis from the
   table — reactions change accordingly.
4. Add a distributed load −10 kN/m to a member in Data Tabel;
   reactions increase symmetrically.
5. Delete a node via Data Tabel — the dialog names the member that
   will be removed; cancel once, confirm once.
6. Save the project; reload the page; reopen it — model intact.
7. Remove all supports; status must read TIDAK STABIL and no
   "success" results may appear.
8. On a phone (or 360 px viewport): dashboard has no sideways
   scroll; the advisory dialog appears in the editor and
   "Tetap Lanjutkan" dismisses it.

## Decision

**READY FOR INTERNAL TESTING.**

**Commercial release: NOT READY** — gated on exactly two external
actions: (1) one `npm audit` run from an authorised network, and
(2) one human screen-reader pass through the 12-item checklist.
No other known blocker exists.
