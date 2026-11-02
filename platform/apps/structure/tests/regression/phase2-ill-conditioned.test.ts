/**
 * Phase 2 — ILL_CONDITIONED reproduction (closes the NEW-1 evidence gap).
 *
 * Model: a free node C=(5,5) held by two bars to two pin supports
 * A=(0,0) and B=(δ,0) that almost coincide. The bars' directions from C
 * differ by ~δ/7 rad, so C's stiffness matrix is nearly rank-1: the two
 * translational DOFs are almost linearly dependent. Symmetric
 * equilibration cannot hide this (unlike a single weak-but-decoupled
 * DOF, which equilibrates to a unit pivot — see the Phase 2
 * investigation report for the negative results).
 *
 * The load (10 kN) acts exactly along the symmetry axis C → midpoint(AB),
 * so the weak mode is not excited: displacements stay ~1e-4 m, chord
 * rotations ~1e-5 rad, and the relative residual stays ~1e-17. The
 * ILL_CONDITIONED classification is therefore driven purely by the
 * equilibrated pivot ratio, which scales as ~δ² (truss: ratio ≈ δ²/4
 * with these parameters — δ=5e-4 → 2.5e-9, inside [1e-12, 1e-8)).
 *
 * These tests assert the classifier's documented band behaviour against
 * this deterministic model. No threshold was changed to make them pass.
 */
import { describe, it, expect } from 'vitest'
import { analyze } from '@/engine/solver'
import type { StructureModel, Section } from '@/engine/model'

const SEC: Section = { id: 's1', name: 'TEST 200k/80M', E: 200000, I33: 80e6, A: 5000 }

function nearParallel(delta: number, memberType: 'frame' | 'truss'): StructureModel {
  const vx = delta / 2 - 5
  const vy = -5
  const nrm = Math.hypot(vx, vy)
  return {
    nodes: {
      a: { id: 'a', x: 0, y: 0 },
      b: { id: 'b', x: delta, y: 0 },
      c: { id: 'c', x: 5, y: 5 },
    },
    members: {
      m1: { id: 'm1', a: 'a', b: 'c', section: 's1', memberType },
      m2: { id: 'm2', a: 'b', b: 'c', section: 's1', memberType },
    },
    supports: { a: { nodeId: 'a', type: 'pin' }, b: { nodeId: 'b', type: 'pin' } },
    sections: { s1: SEC },
    loads: {
      l1: { id: 'l1', type: 'point', nodeId: 'c', loadCaseId: 'dead', fx: (10 * vx) / nrm, fy: (10 * vy) / nrm },
    },
  }
}

describe('Phase 2 — ILL_CONDITIONED reproduction (near-parallel bars)', () => {
  it('truss, δ=5e-4 m: classifies ILL_CONDITIONED on the pivot signal alone', () => {
    const r = analyze(nearParallel(5e-4, 'truss'))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const n = r.numerical
    expect(n.classification).toBe('ILL_CONDITIONED')
    expect(n.equilibratedPivotRatio).toBeGreaterThanOrEqual(1e-12)
    expect(n.equilibratedPivotRatio).toBeLessThan(1e-8)
    expect(n.equilibratedPivotRatio).toBeCloseTo(2.5e-9, 10)
    // The other two signals stay healthy — the pivot signal did this.
    expect(n.relativeResidual).toBeLessThan(1e-10)
    expect(Math.abs(n.maxAbsRotation.value)).toBeLessThan(0.1)
    expect(n.worstDofs[0]).toMatchObject({ nodeId: 'c', direction: 'v' })
  })

  it('frame, δ=2e-4 m: classifies ILL_CONDITIONED (worst DOF is c/θ)', () => {
    const r = analyze(nearParallel(2e-4, 'frame'))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const n = r.numerical
    expect(n.classification).toBe('ILL_CONDITIONED')
    expect(n.equilibratedPivotRatio).toBeGreaterThanOrEqual(1e-12)
    expect(n.equilibratedPivotRatio).toBeLessThan(1e-8)
    expect(n.relativeResidual).toBeLessThan(1e-10)
    expect(Math.abs(n.maxAbsRotation.value)).toBeLessThan(0.1)
  })

  it('truss, δ=1e-3 m: sits on the 1e-8 boundary and stays VALID (band is strict <)', () => {
    const r = analyze(nearParallel(1e-3, 'truss'))
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.numerical.equilibratedPivotRatio).toBeCloseTo(1e-8, 10)
    expect(r.numerical.classification).toBe('VALID')
  })
})
