# Architecture

## Stack (v1)
- React 19 + TypeScript + Vite 6, Tailwind CSS 4. No backend, no database:
  persistence is versioned JSON in browser localStorage. A PostgreSQL/FastAPI
  backend is roadmap only (docs/ROADMAP.md) — nothing in v1 pretends it exists.
- The editor chunk is lazy-loaded; the dashboard is the light first paint.

## Layers
```
src/
  lib/
    solver.ts            Numerical core — UI-independent. Direct Stiffness,
                         2D frame (3 DOF/node) + condensed truss elements,
                         Gaussian elimination w/ per-DOF singularity detection.
    analysis-pipeline.ts Case slicing, self-weight synthesis, combination and
                         envelope by exact linear superposition.
    analysis-diagnostics.ts  Singularity/disconnection diagnostics → user text.
    model.ts             StructureModel schema + CRUD helpers + validation guard.
    load-cases.ts        Load cases, combinations, code preset registry.
    combinations-presets.ts  Preset factor sets with standard references.
    sections/            Parametric section property computation + materials.
    design/              Design layer: core (demands/verdicts), rc/ (SNI 2847:2019
                         + ACI 318-25), steel/ (SNI 1729:2020 / AISC 360).
    diagram-utils.ts, svg-renderer.ts, geometry.ts, units.ts
  canvas/                SVG structural canvas (editor rendering).
  components/, tabs/, templates/   Editor UI.
  struktura/             STRUKTURA additions:
    StrukturaRoot.tsx    Dashboard ⇄ editor shell (plain components).
    projects.ts          Project store, fingerprint (FNV-1a over stable JSON),
                         import/export with schema validation.
    samples.ts           7 verified sample projects.
    service-result.ts    1.0×(SW + all cases) superposition for reporting.
    report.ts            Print/PDF calculation report from real results.
tests/, benchmarks/      Vitest unit tests + analytical benchmark suite.
```

## Data & staleness (§13)
- A project = `{ meta (§6.2 fields), model, fingerprint }`.
- Analysis/design results in the editor are `useMemo` derivations of the
  current model + cases + combinations — a model edit recomputes them; there
  is no cached result object that can go stale in the UI.
- Reports embed the model fingerprint; any model change changes the
  fingerprint, so an outdated report is detectable.

## Units
Internal solver units: kN, m. Sections/materials: MPa, mm. UI unit settings
convert for display (src/lib/units.ts).

## Error handling
Solver failures return `{ ok:false, reason, singularDof? }` — never zeros.
Diagnostics translate singular DOFs to node/direction messages.
