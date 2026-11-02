/**
 * Phase 5 — additional independent validation cases.
 *
 * Every expected value below is a classical closed-form result from
 * structural mechanics references (strength-of-materials / structural
 * analysis standard tables), derived independently of this solver:
 *
 *  V1 Propped cantilever, UDL w, span L (indeterminate to the 1st degree):
 *     R_prop = 3wL/8, R_fixed = 5wL/8, |M_fixed| = wL^2/8.
 *  V2 Fixed-fixed beam, central point load P, span L:
 *     R = P/2 each, |M_ends| = PL/8, M_midspan = PL/8,
 *     delta_midspan = PL^3/(192 EI).
 *  V3 Simply supported beam, UDL: internal forces recovered along the
 *     member — V(0+) magnitude wL/2, M(L/2) = wL^2/8.
 *  V4 Global equilibrium on an asymmetric portal (mixed gravity +
 *     lateral loads): sum of reactions must balance applied loads in
 *     Fx, Fy and moment about the origin — a necessary condition from
 *     statics alone, independent of any stiffness formulation.
 *
 * Section (all): E = 200 000 MPa, A = 5 000 mm^2, I33 = 80e6 mm^4
 *   -> EI = 16 000 kN·m^2. Tolerances: 0.1% (the benchmark gate),
 *   equilibrium: 1e-6 relative.
 */
import { describe, it, expect } from 'vitest'
import { analyze, memberInternalForces } from '@/engine/solver'
import type { StructureModel, Section } from '@/engine/model'

const SEC: Section = { id: 's1', name: 'TEST 200k/80M', E: 200000, I33: 80e6, A: 5000 }
const EI = 16000
const model = (p: Partial<StructureModel>): StructureModel => ({
  nodes: {}, members: {}, supports: {}, sections: { s1: SEC }, loads: {}, ...p,
})
const rel = (got: number, want: number) => Math.abs(got - want) / Math.abs(want)

describe('V1 — propped cantilever, UDL (indeterminate)', () => {
  const L = 6, w = 10
  const r = analyze(model({
    nodes: { a: { id: 'a', x: 0, y: 0 }, b: { id: 'b', x: L, y: 0 } },
    members: { m1: { id: 'm1', a: 'a', b: 'b', section: 's1' } },
    supports: { a: { nodeId: 'a', type: 'fixed' }, b: { nodeId: 'b', type: 'roller' } },
    loads: { l1: { id: 'l1', type: 'distributed', memberId: 'm1', loadCaseId: 'dead', wStart: -w, wEnd: -w } },
  }))
  it('reactions: R_prop = 3wL/8 = 22.5, R_fixed = 5wL/8 = 37.5', () => {
    expect(r.ok).toBe(true); if (!r.ok) return
    expect(rel(r.reactions['b'].Ry, (3 * w * L) / 8)).toBeLessThan(0.001)
    expect(rel(r.reactions['a'].Ry, (5 * w * L) / 8)).toBeLessThan(0.001)
  })
  it('|M_fixed| = wL^2/8 = 45 (reaction moment and member end force agree)', () => {
    if (!r.ok) return
    expect(rel(Math.abs(r.reactions['a'].Mz), (w * L * L) / 8)).toBeLessThan(0.001)
    expect(rel(Math.abs(r.memberEndForces['m1'].M1), (w * L * L) / 8)).toBeLessThan(0.001)
  })
})

describe('V2 — fixed-fixed beam, central point load', () => {
  const L = 6, P = 20
  const r = analyze(model({
    nodes: { a: { id: 'a', x: 0, y: 0 }, c: { id: 'c', x: L / 2, y: 0 }, b: { id: 'b', x: L, y: 0 } },
    members: {
      m1: { id: 'm1', a: 'a', b: 'c', section: 's1' },
      m2: { id: 'm2', a: 'c', b: 'b', section: 's1' },
    },
    supports: { a: { nodeId: 'a', type: 'fixed' }, b: { nodeId: 'b', type: 'fixed' } },
    loads: { l1: { id: 'l1', type: 'point', nodeId: 'c', loadCaseId: 'dead', fx: 0, fy: -P } },
  }))
  it('reactions P/2, end moments PL/8 = 15', () => {
    expect(r.ok).toBe(true); if (!r.ok) return
    expect(rel(r.reactions['a'].Ry, P / 2)).toBeLessThan(0.001)
    expect(rel(r.reactions['b'].Ry, P / 2)).toBeLessThan(0.001)
    expect(rel(Math.abs(r.reactions['a'].Mz), (P * L) / 8)).toBeLessThan(0.001)
    expect(rel(Math.abs(r.reactions['b'].Mz), (P * L) / 8)).toBeLessThan(0.001)
  })
  it('midspan deflection = PL^3/(192EI), midspan moment = +PL/8 (sagging)', () => {
    if (!r.ok) return
    const want = (P * L ** 3) / (192 * EI)
    expect(rel(Math.abs(r.nodeDisplacements['c'].v), want)).toBeLessThan(0.001)
    expect(rel(r.memberEndForces['m1'].M2, (P * L) / 8)).toBeLessThan(0.001)
  })
})

describe('V3 — SS beam UDL: internal force recovery along the member', () => {
  const L = 6, w = 10
  const r = analyze(model({
    nodes: { a: { id: 'a', x: 0, y: 0 }, c: { id: 'c', x: L / 2, y: 0 }, b: { id: 'b', x: L, y: 0 } },
    members: {
      m1: { id: 'm1', a: 'a', b: 'c', section: 's1' },
      m2: { id: 'm2', a: 'c', b: 'b', section: 's1' },
    },
    supports: { a: { nodeId: 'a', type: 'pin' }, b: { nodeId: 'b', type: 'roller' } },
    loads: {
      l1: { id: 'l1', type: 'distributed', memberId: 'm1', loadCaseId: 'dead', wStart: -w, wEnd: -w },
      l2: { id: 'l2', type: 'distributed', memberId: 'm2', loadCaseId: 'dead', wStart: -w, wEnd: -w },
    },
  }))
  it('M(midspan) = wL^2/8 = 45, |V(0+)| = wL/2 = 30 (SAP sign convention)', () => {
    expect(r.ok).toBe(true); if (!r.ok) return
    const ef = r.memberEndForces['m1']
    const mid = memberInternalForces(ef, L / 2, L / 2)
    const atSupport = memberInternalForces(ef, 0, L / 2)
    expect(rel(mid.M, (w * L * L) / 8)).toBeLessThan(0.001)
    expect(rel(Math.abs(atSupport.V), (w * L) / 2)).toBeLessThan(0.001)
    expect(Math.abs(mid.V)).toBeLessThan(1e-6) // shear crosses zero at midspan
  })
})

describe('V4 — global equilibrium, asymmetric portal with lateral load', () => {
  // Columns 4 m, beam 5 m; UDL 12 kN/m on beam + 8 kN lateral at top-left.
  const m = model({
    nodes: {
      bl: { id: 'bl', x: 0, y: 0 }, br: { id: 'br', x: 5, y: 0 },
      tl: { id: 'tl', x: 0, y: 4 }, tr: { id: 'tr', x: 5, y: 4 },
    },
    members: {
      c1: { id: 'c1', a: 'bl', b: 'tl', section: 's1' },
      c2: { id: 'c2', a: 'br', b: 'tr', section: 's1' },
      bm: { id: 'bm', a: 'tl', b: 'tr', section: 's1' },
    },
    supports: { bl: { nodeId: 'bl', type: 'fixed' }, br: { nodeId: 'br', type: 'fixed' } },
    loads: {
      l1: { id: 'l1', type: 'distributed', memberId: 'bm', loadCaseId: 'dead', wStart: -12, wEnd: -12 },
      l2: { id: 'l2', type: 'point', nodeId: 'tl', loadCaseId: 'live', fx: 8, fy: 0 },
    },
  })
  const r = analyze(m)
  it('sum of reactions balances applied loads in Fx, Fy, and moment about origin', () => {
    expect(r.ok).toBe(true); if (!r.ok) return
    let sRx = 0, sRy = 0, sM = 0
    for (const [nodeId, rx] of Object.entries(r.reactions)) {
      const n = m.nodes[nodeId]
      sRx += rx.Rx; sRy += rx.Ry
      sM += rx.Mz + n.x * rx.Ry - n.y * rx.Rx // moment of reaction about origin + couple
    }
    // Applied: Fx = +8, Fy = -12*5 = -60; moment about origin from the
    // beam UDL = -(12*5) * 2.5 = -150; lateral load at (0,4): moment
    // = -y*Fx = -32. Total applied moment = -182.
    expect(Math.abs(sRx + 8)).toBeLessThan(1e-6)
    expect(Math.abs(sRy - 60)).toBeLessThan(1e-6)
    expect(rel(sM, 182)).toBeLessThan(1e-6)
    expect(r.numerical.relativeResidual).toBeLessThan(1e-8)
    expect(r.numerical.classification).toBe('VALID')
  })
})
