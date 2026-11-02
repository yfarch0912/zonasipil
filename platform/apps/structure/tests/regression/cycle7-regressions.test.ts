/**
 * Regression tests for Audit Cycle 7 findings (docs/AUDIT_CYCLE.md):
 *  C7-F1 solver silently dropped every distributed load after the first on
 *        the same member: both the assembly loop and the force-recovery loop
 *        `break` after the first match, so two −5 kN/m loads gave Ry = 15 kN
 *        (one load's worth) instead of 30 kN, with ok:true. The editor's
 *        distributed-load tool replaces same-member/same-case loads, but an
 *        imported/hand-edited model can carry several, and stacking loads is
 *        legitimate superposition. Now all distributed loads on a member are
 *        summed (fixedEndForces is linear in q1/q2/qx1/qx2, so this is exact).
 */
import { describe, it, expect } from 'vitest'
import { analyze } from '@/engine/solver'
import type { StructureModel, Section } from '@/engine/model'

const SEC: Section = { id: 's1', name: 'T', E: 200000, I33: 80e6, A: 5000 }
const beam = (loads: StructureModel['loads']): StructureModel => ({
  nodes: { n1: { id: 'n1', x: 0, y: 0 }, n2: { id: 'n2', x: 6, y: 0 } },
  members: { m1: { id: 'm1', a: 'n1', b: 'n2', section: 's1' } },
  supports: { n1: { nodeId: 'n1', type: 'pin' }, n2: { nodeId: 'n2', type: 'roller' } },
  sections: { s1: SEC },
  loads,
})
const dist = (id: string, patch: Record<string, number | string>) => ({
  id, type: 'distributed' as const, memberId: 'm1', loadCaseId: 'dead', mode: 'local-axis' as const, ...patch,
})

describe('C7-F1 — multiple distributed loads on one member superpose, none dropped', () => {
  it('sanity anchor: single uniform −10 kN/m gives Ry = 30 kN each end', () => {
    const r = analyze(beam({ l1: dist('l1', { wStart: -10, wEnd: -10 }) }))
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.reactions['n1'].Ry).toBeCloseTo(30, 6)
      expect(r.reactions['n2'].Ry).toBeCloseTo(30, 6)
    }
  })
  it('two uniform −5 kN/m loads equal one −10 kN/m load (previously Ry = 15 kN — second load dropped)', () => {
    const r = analyze(beam({
      l1: dist('l1', { wStart: -5, wEnd: -5 }),
      l2: dist('l2', { wStart: -5, wEnd: -5 }),
    }))
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.reactions['n1'].Ry).toBeCloseTo(30, 6)
      expect(r.reactions['n2'].Ry).toBeCloseTo(30, 6)
      expect(r.memberEndForces['m1'].q1).toBeCloseTo(-10, 9)
      expect(r.memberEndForces['m1'].q2).toBeCloseTo(-10, 9)
    }
  })
  it('two complementary trapezoidal loads sum to uniform −10 kN/m', () => {
    const r = analyze(beam({
      l1: dist('l1', { wStart: -4, wEnd: -6 }),
      l2: dist('l2', { wStart: -6, wEnd: -4 }),
    }))
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.reactions['n1'].Ry).toBeCloseTo(30, 6)
      expect(r.memberEndForces['m1'].q1).toBeCloseTo(-10, 9)
      expect(r.memberEndForces['m1'].q2).toBeCloseTo(-10, 9)
    }
  })
  it('mixed modes sum: local −5 plus global-axis wy −5 on a horizontal member equals −10', () => {
    const r = analyze(beam({
      l1: dist('l1', { wStart: -5, wEnd: -5 }),
      l2: dist('l2', { mode: 'global-axis', wxStart: 0, wxEnd: 0, wyStart: -5, wyEnd: -5 }),
    }))
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.reactions['n1'].Ry).toBeCloseTo(30, 6)
      expect(r.memberEndForces['m1'].q1).toBeCloseTo(-10, 9)
      expect(r.memberEndForces['m1'].qx1).toBeCloseTo(0, 9)
    }
  })
  it('three loads sum, and end moments match the single-load result', () => {
    const single = analyze(beam({ l1: dist('l1', { wStart: -12, wEnd: -12 }) }))
    const triple = analyze(beam({
      l1: dist('l1', { wStart: -4, wEnd: -4 }),
      l2: dist('l2', { wStart: -4, wEnd: -4 }),
      l3: dist('l3', { wStart: -4, wEnd: -4 }),
    }))
    expect(single.ok).toBe(true)
    expect(triple.ok).toBe(true)
    if (single.ok && triple.ok) {
      expect(triple.reactions['n1'].Ry).toBeCloseTo(single.reactions['n1'].Ry, 6)
      expect(triple.memberEndForces['m1'].M1).toBeCloseTo(single.memberEndForces['m1'].M1, 6)
      expect(triple.memberEndForces['m1'].M2).toBeCloseTo(single.memberEndForces['m1'].M2, 6)
    }
  })
  it('a single load on a member is unchanged by the fix (no double counting)', () => {
    const r = analyze(beam({ l1: dist('l1', { wStart: -10, wEnd: -10 }) }))
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.memberEndForces['m1'].q1).toBeCloseTo(-10, 9)
  })
})
