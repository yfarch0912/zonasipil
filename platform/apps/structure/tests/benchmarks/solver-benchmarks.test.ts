/**
 * STRUKTURA numerical benchmark suite.
 *
 * Every case compares the Direct Stiffness solver (src/engine/solver.ts) against
 * a closed-form analytical solution (Euler–Bernoulli beam theory / method of
 * joints / standard continuous-beam coefficients) — NOT against another
 * implementation of the same algorithm.
 *
 * Internal acceptance target (directive §8.2): relative error ≤ 0.1 % for
 * forces and displacements, absolute tolerance near zero.
 *
 * Sign conventions of the solver under test:
 *  - Point load fy: positive = upward (downward load is negative).
 *  - Distributed load, local-axis mode: positive w acts in +local-2, which for
 *    a left→right horizontal member is upward (downward UDL is negative).
 *  - Member end force N: tension positive. M: sagging positive.
 *  - Displacements: u right, v up, theta CCW (metres / radians).
 *  - Reactions are forces exerted BY the support ON the structure.
 */
import { describe, it, expect } from 'vitest'
import { analyze, memberInternalForces } from '@/engine/solver'
import type { StructureModel, Section } from '@/engine/model'

// Steel test section: E = 200 000 MPa, A = 5 000 mm², I33 = 80×10⁶ mm⁴
// EI = 200e9 Pa × 80e-6 m⁴ = 16 000 kN·m² ; EA = 1 000 000 kN
const SEC: Section = { id: 's1', name: 'TEST 200k/80M', E: 200000, I33: 80e6, A: 5000 }
const EI = 16000 // kN·m²

function model(partial: Partial<StructureModel>): StructureModel {
  return {
    nodes: {}, members: {}, supports: {},
    sections: { s1: SEC }, loads: {}, ...partial,
  }
}
const rel = (got: number, want: number) => Math.abs(got - want) / Math.abs(want)

describe('Benchmark 1 — Simply supported beam, UDL', () => {
  // L = 6 m, w = 10 kN/m downward. Analytical: R = wL/2 = 30 kN,
  // Mmax = wL²/8 = 45 kN·m, δmid = 5wL⁴/(384EI) = 0.010546875 m
  const m = model({
    nodes: {
      n1: { id: 'n1', x: 0, y: 0 }, n2: { id: 'n2', x: 3, y: 0 }, n3: { id: 'n3', x: 6, y: 0 },
    },
    members: {
      m1: { id: 'm1', a: 'n1', b: 'n2', section: 's1' },
      m2: { id: 'm2', a: 'n2', b: 'n3', section: 's1' },
    },
    supports: { n1: { nodeId: 'n1', type: 'pin' }, n3: { nodeId: 'n3', type: 'roller' } },
    loads: {
      l1: { id: 'l1', type: 'distributed', memberId: 'm1', loadCaseId: 'dead', wStart: -10, wEnd: -10 },
      l2: { id: 'l2', type: 'distributed', memberId: 'm2', loadCaseId: 'dead', wStart: -10, wEnd: -10 },
    },
  })
  const r = analyze(m)
  it('solves', () => { expect(r.ok).toBe(true) })
  if (!r.ok) return
  it('reactions = wL/2 = 30 kN each', () => {
    expect(rel(r.reactions['n1'].Ry, 30)).toBeLessThan(0.001)
    expect(rel(r.reactions['n3'].Ry, 30)).toBeLessThan(0.001)
    expect(Math.abs(r.reactions['n1'].Rx)).toBeLessThan(1e-9)
  })
  it('mid-span moment = wL²/8 = 45 kN·m', () => {
    const ef = r.memberEndForces['m1']
    const mid = memberInternalForces(ef, 3, 3)
    expect(rel(mid.M, 45)).toBeLessThan(0.001)
    // Shear sign: the solver stores V in the SAP2000 convention documented in
    // solver.ts (V_SAP = −V_conventional, dM/dx = −V_SAP). The conventional
    // engineering shear at the left support is therefore −V1 = +30 kN, and the
    // shear must cross zero at mid-span. Both facts are asserted, so a real
    // sign/magnitude error would still fail this benchmark.
    expect(rel(-ef.V1, 30)).toBeLessThan(0.001)
    expect(Math.abs(mid.V)).toBeLessThan(1e-9)
  })
  it('mid-span deflection = 5wL⁴/384EI', () => {
    const want = (5 * 10 * 6 ** 4) / (384 * EI)
    expect(rel(r.nodeDisplacements['n2'].v, -want)).toBeLessThan(0.001)
  })
})

describe('Benchmark 2 — Cantilever, tip point load', () => {
  // L = 3 m, P = 10 kN downward. δtip = PL³/3EI = 0.005625 m, Mbase = PL = 30 kN·m
  const m = model({
    nodes: { n1: { id: 'n1', x: 0, y: 0 }, n2: { id: 'n2', x: 3, y: 0 } },
    members: { m1: { id: 'm1', a: 'n1', b: 'n2', section: 's1' } },
    supports: { n1: { nodeId: 'n1', type: 'fixed' } },
    loads: { l1: { id: 'l1', type: 'point', nodeId: 'n2', loadCaseId: 'dead', fx: 0, fy: -10 } },
  })
  const r = analyze(m)
  it('solves', () => { expect(r.ok).toBe(true) })
  if (!r.ok) return
  it('tip deflection = PL³/3EI', () => {
    const want = (10 * 27) / (3 * EI)
    expect(rel(r.nodeDisplacements['n2'].v, -want)).toBeLessThan(0.001)
  })
  it('base reactions: Ry = 10 kN, |Mz| = PL = 30 kN·m', () => {
    expect(rel(r.reactions['n1'].Ry, 10)).toBeLessThan(0.001)
    expect(rel(Math.abs(r.reactions['n1'].Mz), 30)).toBeLessThan(0.001)
  })
  it('fixed-end moment magnitude = 30 kN·m (hogging)', () => {
    expect(rel(Math.abs(r.memberEndForces['m1'].M1), 30)).toBeLessThan(0.001)
  })
})

describe('Benchmark 3 — Two-span continuous beam, UDL', () => {
  // 2 × 5 m spans, w = 10 kN/m. Standard coefficients:
  // R_end = 0.375wL = 18.75 kN, R_mid = 1.25wL = 62.5 kN, M_support = −wL²/8 = −31.25 kN·m
  const m = model({
    nodes: {
      n1: { id: 'n1', x: 0, y: 0 }, n2: { id: 'n2', x: 5, y: 0 }, n3: { id: 'n3', x: 10, y: 0 },
    },
    members: {
      m1: { id: 'm1', a: 'n1', b: 'n2', section: 's1' },
      m2: { id: 'm2', a: 'n2', b: 'n3', section: 's1' },
    },
    supports: {
      n1: { nodeId: 'n1', type: 'pin' }, n2: { nodeId: 'n2', type: 'roller' }, n3: { nodeId: 'n3', type: 'roller' },
    },
    loads: {
      l1: { id: 'l1', type: 'distributed', memberId: 'm1', loadCaseId: 'dead', wStart: -10, wEnd: -10 },
      l2: { id: 'l2', type: 'distributed', memberId: 'm2', loadCaseId: 'dead', wStart: -10, wEnd: -10 },
    },
  })
  const r = analyze(m)
  it('solves', () => { expect(r.ok).toBe(true) })
  if (!r.ok) return
  it('reactions match continuous-beam coefficients', () => {
    expect(rel(r.reactions['n1'].Ry, 18.75)).toBeLessThan(0.001)
    expect(rel(r.reactions['n2'].Ry, 62.5)).toBeLessThan(0.001)
    expect(rel(r.reactions['n3'].Ry, 18.75)).toBeLessThan(0.001)
  })
  it('interior support moment = −wL²/8 (hogging)', () => {
    expect(rel(r.memberEndForces['m1'].M2, -31.25)).toBeLessThan(0.001)
    expect(rel(r.memberEndForces['m2'].M1, -31.25)).toBeLessThan(0.001)
  })
})

describe('Benchmark 4 — Symmetric triangular truss, apex load', () => {
  // A(0,0) pin, B(6,0) roller, C(3,4) apex; P = 20 kN down at C.
  // Method of joints: top chords F = −12.5 kN (compression), bottom chord +7.5 kN (tension), R = 10 kN.
  const m = model({
    nodes: {
      n1: { id: 'n1', x: 0, y: 0 }, n2: { id: 'n2', x: 6, y: 0 }, n3: { id: 'n3', x: 3, y: 4 },
    },
    members: {
      m1: { id: 'm1', a: 'n1', b: 'n2', section: 's1', memberType: 'truss' },
      m2: { id: 'm2', a: 'n1', b: 'n3', section: 's1', memberType: 'truss' },
      m3: { id: 'm3', a: 'n3', b: 'n2', section: 's1', memberType: 'truss' },
    },
    supports: { n1: { nodeId: 'n1', type: 'pin' }, n2: { nodeId: 'n2', type: 'roller' } },
    loads: { l1: { id: 'l1', type: 'point', nodeId: 'n3', loadCaseId: 'dead', fx: 0, fy: -20 } },
  })
  const r = analyze(m)
  it('solves', () => { expect(r.ok).toBe(true) })
  if (!r.ok) return
  it('reactions = 10 kN each', () => {
    expect(rel(r.reactions['n1'].Ry, 10)).toBeLessThan(0.001)
    expect(rel(r.reactions['n2'].Ry, 10)).toBeLessThan(0.001)
  })
  it('chord forces match method of joints', () => {
    expect(rel(r.memberEndForces['m2'].N2, -12.5)).toBeLessThan(0.001)
    expect(rel(r.memberEndForces['m3'].N2, -12.5)).toBeLessThan(0.001)
    expect(rel(r.memberEndForces['m1'].N2, 7.5)).toBeLessThan(0.001)
  })
  it('truss members carry ~zero end moment', () => {
    expect(Math.abs(r.memberEndForces['m2'].M1)).toBeLessThan(1e-6)
    expect(Math.abs(r.memberEndForces['m2'].M2)).toBeLessThan(1e-6)
  })
})

describe('Benchmark 5 — Single-storey portal frame, symmetric UDL on beam', () => {
  // 6 m wide × 3 m high, both bases fixed, beam UDL 10 kN/m down.
  // No closed-form end forces used here; verified by global equilibrium and
  // symmetry — the exact invariants a correct DSM solution must satisfy.
  const m = model({
    nodes: {
      n1: { id: 'n1', x: 0, y: 0 }, n2: { id: 'n2', x: 6, y: 0 },
      n3: { id: 'n3', x: 0, y: 3 }, n4: { id: 'n4', x: 6, y: 3 }, n5: { id: 'n5', x: 3, y: 3 },
    },
    members: {
      m1: { id: 'm1', a: 'n1', b: 'n3', section: 's1' },
      m2: { id: 'm2', a: 'n3', b: 'n5', section: 's1' },
      m3: { id: 'm3', a: 'n5', b: 'n4', section: 's1' },
      m4: { id: 'm4', a: 'n2', b: 'n4', section: 's1' },
    },
    supports: { n1: { nodeId: 'n1', type: 'fixed' }, n2: { nodeId: 'n2', type: 'fixed' } },
    loads: {
      l1: { id: 'l1', type: 'distributed', memberId: 'm2', loadCaseId: 'dead', wStart: -10, wEnd: -10 },
      l2: { id: 'l2', type: 'distributed', memberId: 'm3', loadCaseId: 'dead', wStart: -10, wEnd: -10 },
    },
  })
  const r = analyze(m)
  it('solves', () => { expect(r.ok).toBe(true) })
  if (!r.ok) return
  it('global equilibrium: ΣRy = 60 kN, ΣRx = 0', () => {
    const sy = r.reactions['n1'].Ry + r.reactions['n2'].Ry
    const sx = r.reactions['n1'].Rx + r.reactions['n2'].Rx
    expect(rel(sy, 60)).toBeLessThan(1e-8)
    expect(Math.abs(sx)).toBeLessThan(1e-6)
  })
  it('symmetry: equal vertical reactions, mirror sway, opposite joint rotations', () => {
    expect(rel(r.reactions['n1'].Ry, r.reactions['n2'].Ry)).toBeLessThan(1e-9)
    // Mirror symmetry: beam joints displace horizontally by equal and opposite
    // amounts (the beam shortens under its frame-action axial compression —
    // u = 0 would be wrong for an axially deformable beam), the beam midpoint
    // does not sway, and joint rotations are equal and opposite.
    const u3 = r.nodeDisplacements['n3'].u, u4 = r.nodeDisplacements['n4'].u
    expect(Math.abs(u3 + u4)).toBeLessThan(1e-12)
    expect(Math.abs(r.nodeDisplacements['n5'].u)).toBeLessThan(1e-12)
    const t3 = r.nodeDisplacements['n3'].theta, t4 = r.nodeDisplacements['n4'].theta
    expect(Math.abs(t3 + t4)).toBeLessThan(1e-9)
  })
  it('beam mid-point deflects downward', () => {
    expect(r.nodeDisplacements['n5'].v).toBeLessThan(0)
  })
})

describe('Benchmark 6 — Failure diagnostics (never silent zeros)', () => {
  it('unrestrained beam (single pin) is rejected', () => {
    const m = model({
      nodes: { n1: { id: 'n1', x: 0, y: 0 }, n2: { id: 'n2', x: 3, y: 0 } },
      members: { m1: { id: 'm1', a: 'n1', b: 'n2', section: 's1' } },
      supports: { n1: { nodeId: 'n1', type: 'pin' } },
      loads: { l1: { id: 'l1', type: 'point', nodeId: 'n2', loadCaseId: 'dead', fx: 0, fy: -10 } },
    })
    const r = analyze(m)
    expect(r.ok).toBe(false)
  })
  it('empty model is rejected with a reason', () => {
    const r = analyze(model({}))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason.length).toBeGreaterThan(0)
  })
})
