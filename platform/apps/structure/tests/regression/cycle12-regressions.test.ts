/**
 * Regression tests for Audit Cycle 12 finding C10-F1 (docs/AUDIT_CYCLE.md,
 * Cycles 10–11; fix user-approved 2026-10-31):
 *  Non-singular solver failures were invisible in the UI. analyze() failed
 *  safely with a NAMED reason (e.g. "Member m1 has zero length (nodes n1
 *  and n2 coincide)"), but App's mergedReport only merged `singularDof`
 *  failures, so the reason never reached runDiagnostics' report, the issues
 *  dialog, or the STATUS pill — the pill kept claiming DETERMINATE for a
 *  model that could not solve at all, and the Analyze tools showed only
 *  "No results". Reachable in-editor by dragging a node exactly onto
 *  another (handleMoveNode had no coincidence guard).
 *
 * Fix: `mergeSolverFailures` (analysis-diagnostics.ts) merges EVERY solver
 * failure — singular ones as located singular-at-dof errors (unchanged),
 * all others as `solver-failure` errors carrying the reason verbatim — and
 * forces status "unstable" on any merge. App.tsx now routes mergedReport
 * through it. Plus a coincidence guard: `findCoincidentNode` backs
 * handleMoveNode so a node can no longer be dropped onto another.
 */
import { describe, it, expect } from 'vitest'
import { analyze } from '@/engine/solver'
import { runDiagnostics, mergeSolverFailures } from '@/engine/analysis-diagnostics'
import { findCoincidentNode } from '@/engine/geometry'
import type { StructureModel, Section } from '@/engine/model'

const SEC: Section = { id: 's1', name: 'T', E: 200000, I33: 80e6, A: 5000 }

// Two-member beam, pin n1 + roller n3. `n2x` places the middle node: 3 is
// the valid beam; 0 drops n2 exactly onto n1, making member m1 zero-length.
const beam = (n2x: number): StructureModel => ({
  nodes: {
    n1: { id: 'n1', x: 0, y: 0 },
    n2: { id: 'n2', x: n2x, y: 0 },
    n3: { id: 'n3', x: 6, y: 0 },
  },
  members: {
    m1: { id: 'm1', a: 'n1', b: 'n2', section: 's1' },
    m2: { id: 'm2', a: 'n2', b: 'n3', section: 's1' },
  },
  supports: { n1: { nodeId: 'n1', type: 'pin' }, n3: { nodeId: 'n3', type: 'roller' } },
  sections: { s1: SEC },
  loads: {
    p1: { id: 'p1', type: 'point', nodeId: 'n2', loadCaseId: 'dead', fx: 0, fy: -12 },
  },
})

describe('C10-F1 — non-singular solver failures surface in diagnostics', () => {
  it('(a) zero-length member: solver names the error AND the reason reaches the merged report', () => {
    const model = beam(0)
    const res = analyze(model)
    expect(res.ok).toBe(false)
    if (res.ok) throw new Error('unreachable')
    expect(res.reason).toContain('zero length')
    expect(res.singularDof).toBeUndefined()

    const merged = mergeSolverFailures(
      runDiagnostics(model),
      [res],
      Object.keys(model.nodes),
    )
    const failures = merged.issues.filter((i) => i.kind === 'solver-failure')
    expect(failures).toHaveLength(1)
    expect(failures[0]).toMatchObject({ severity: 'error', reason: res.reason })
  })

  it('(a2) the same failure repeated per load case merges only once', () => {
    const model = beam(0)
    const res = analyze(model)
    const merged = mergeSolverFailures(
      runDiagnostics(model),
      [res, res, res],
      Object.keys(model.nodes),
    )
    expect(merged.issues.filter((i) => i.kind === 'solver-failure')).toHaveLength(1)
  })

  it('(b) STATUS derivation: the failed model no longer claims DETERMINATE', () => {
    const model = beam(0)
    // Pre-flight topology checks alone see a connected, fully-reacted model…
    const base = runDiagnostics(model)
    expect(base.status).toBe('determinate')
    expect(base.issues.some((i) => i.severity === 'error')).toBe(false)
    // …but once the solver failure is merged the pill must say UNSTABLE.
    const merged = mergeSolverFailures(base, [analyze(model)], Object.keys(model.nodes))
    expect(merged.status).toBe('unstable')
    expect(merged.status).not.toBe('determinate')
  })

  it('(c) a valid model analyses clean — no spurious solver-failure issue', () => {
    const model = beam(3)
    const res = analyze(model)
    expect(res.ok).toBe(true)
    const base = runDiagnostics(model)
    const merged = mergeSolverFailures(base, [res], Object.keys(model.nodes))
    expect(merged.issues.filter((i) => i.kind === 'solver-failure')).toHaveLength(0)
    expect(merged.issues.some((i) => i.severity === 'error')).toBe(false)
    expect(merged.status).toBe('determinate')
    // Nothing merged → the report object is returned untouched.
    expect(merged).toBe(base)
  })

  it('singular failures still merge as located singular-at-dof errors (not generic failures)', () => {
    const model = beam(3)
    const merged = mergeSolverFailures(
      runDiagnostics(model),
      [{ ok: false, reason: 'Singular stiffness matrix', singularDof: 5 }],
      Object.keys(model.nodes),
    )
    expect(merged.status).toBe('unstable')
    expect(merged.issues).toContainEqual({
      kind: 'singular-at-dof', severity: 'error', nodeId: 'n2', direction: 'θ',
    })
    expect(merged.issues.some((i) => i.kind === 'solver-failure')).toBe(false)
  })
})

describe('C10-F1 — handleMoveNode coincidence guard helper', () => {
  const nodes = beam(3).nodes
  it('(d) names the other node at the exact drop position', () => {
    expect(findCoincidentNode(nodes, 'n2', 0, 0)).toBe('n1')
    expect(findCoincidentNode(nodes, 'n2', 6, 0)).toBe('n3')
  })
  it('(d) staying on its own current position is not a coincidence', () => {
    expect(findCoincidentNode(nodes, 'n2', 3, 0)).toBeNull()
  })
  it('(d) a near miss stays legal (guard is exact, matching snap-to-node writes)', () => {
    expect(findCoincidentNode(nodes, 'n2', 0.001, 0)).toBeNull()
    expect(findCoincidentNode(nodes, 'n2', 2, 1)).toBeNull()
  })
})
