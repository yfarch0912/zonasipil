import { describe, it } from 'vitest'
import { analyze } from '@/engine/solver'
import type { StructureModel, Section } from '@/engine/model'

const SEC: Section = { id: 's1', name: 'TEST', E: 200000, I33: 80e6, A: 5000 }

function shallow(h: number, memberType: 'frame' | 'truss', fx: number, fy: number): StructureModel {
  return {
    nodes: {
      a: { id: 'a', x: 0, y: 0 }, b: { id: 'b', x: 10, y: 0 }, c: { id: 'c', x: 5, y: h },
    },
    members: {
      m1: { id: 'm1', a: 'a', b: 'c', section: 's1', memberType },
      m2: { id: 'm2', a: 'c', b: 'b', section: 's1', memberType },
    },
    supports: { a: { nodeId: 'a', type: 'pin' }, b: { nodeId: 'b', type: 'pin' } },
    sections: { s1: SEC },
    loads: { l1: { id: 'l1', type: 'point', nodeId: 'c', loadCaseId: 'dead', fx, fy } },
  }
}

describe('probe: shallow two-bar, sweep apex height h', () => {
  it('reports diagnostics per h', () => {
    for (const type of ['truss', 'frame'] as const) {
      for (const h of [1e-1, 3e-2, 1e-2, 3e-3, 1e-3, 3e-4, 1e-4, 3e-5, 1e-5, 1e-6]) {
        // Load purely horizontal at apex (well-conditioned direction).
        const r = analyze(shallow(h, type, 10, 0))
        if (!r.ok) { console.log(`${type} h=${h}: SOLVE FAILED`); continue }
        const n = r.numerical
        const dc = r.nodeDisplacements['c']
        console.log(`${type} h=${h}: class=${n.classification} ratio=${n.equilibratedPivotRatio.toExponential(3)} resid=${n.relativeResidual.toExponential(2)} maxRot=${Math.max(Math.abs(n.maxAbsRotation.value), Math.abs(n.maxChordRotation?.value ?? 0)).toExponential(2)} uc=${dc?.u.toExponential(2)} vc=${dc?.v.toExponential(2)}`)
      }
    }
  })
})

function nearParallel(delta: number, memberType: 'frame' | 'truss'): StructureModel {
  // Apex C held by two bars to two supports almost on top of each other:
  // the bars' directions from C differ by ~delta/7 rad, so the apex
  // stiffness matrix is nearly rank-1 (near linear dependence).
  return {
    nodes: {
      a: { id: 'a', x: 0, y: 0 }, b: { id: 'b', x: delta, y: 0 }, c: { id: 'c', x: 5, y: 5 },
    },
    members: {
      m1: { id: 'm1', a: 'a', b: 'c', section: 's1', memberType },
      m2: { id: 'm2', a: 'b', b: 'c', section: 's1', memberType },
    },
    supports: { a: { nodeId: 'a', type: 'pin' }, b: { nodeId: 'b', type: 'pin' } },
    sections: { s1: SEC },
    // Load along the strong (bisector, ~ -45 deg) direction: fx=fy component.
    loads: { l1: { id: 'l1', type: 'point', nodeId: 'c', loadCaseId: 'dead', fx: -7.07, fy: -7.07 } },
  }
}

describe('probe: near-parallel bars, sweep support offset delta', () => {
  it('reports diagnostics per delta', () => {
    for (const type of ['truss', 'frame'] as const) {
      for (const d of [1e-1, 1e-2, 1e-3, 1e-4, 1e-5, 1e-6, 1e-7]) {
        const r = analyze(nearParallel(d, type))
        if (!r.ok) { console.log(`${type} d=${d}: SOLVE FAILED`); continue }
        const n = r.numerical
        const dc = r.nodeDisplacements['c']
        console.log(`${type} d=${d}: class=${n.classification} ratio=${n.equilibratedPivotRatio.toExponential(3)} resid=${n.relativeResidual.toExponential(2)} maxRot=${Math.max(Math.abs(n.maxAbsRotation.value), Math.abs(n.maxChordRotation?.value ?? 0)).toExponential(2)} uc=${dc?.u.toExponential(2)} vc=${dc?.v.toExponential(2)}`)
      }
    }
  })
})

describe('probe: near-parallel bars, load exactly on symmetry axis', () => {
  it('reports diagnostics per delta', () => {
    for (const type of ['truss', 'frame'] as const) {
      for (const d of [3e-3, 1e-3, 5e-4, 3e-4, 2e-4, 1e-4, 5e-5]) {
        const m = nearParallel(d, type)
        // Symmetry axis: C -> midpoint of AB = (d/2, 0). Rebuild load exactly on it.
        const vx = d / 2 - 5, vy = -5
        const nrm = Math.hypot(vx, vy)
        m.loads = { l1: { id: 'l1', type: 'point', nodeId: 'c', loadCaseId: 'dead', fx: 10 * vx / nrm, fy: 10 * vy / nrm } }
        const r = analyze(m)
        if (!r.ok) { console.log(`${type} d=${d}: SOLVE FAILED`); continue }
        const n = r.numerical
        const dc = r.nodeDisplacements['c']
        console.log(`${type} d=${d}: class=${n.classification} ratio=${n.equilibratedPivotRatio.toExponential(3)} resid=${n.relativeResidual.toExponential(2)} maxRot=${Math.max(Math.abs(n.maxAbsRotation.value), Math.abs(n.maxChordRotation?.value ?? 0)).toExponential(2)} uc=${dc?.u.toExponential(2)} vc=${dc?.v.toExponential(2)} worst=${n.worstDofs.map(w=>w.nodeId+'/'+w.direction+'@'+w.pivotRatio.toExponential(1)).join(',')}`)
      }
    }
  })
})
