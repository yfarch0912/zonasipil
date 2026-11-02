/**
 * Member inspector adapter — accuracy validation.
 *
 * Canonical case: simply supported beam, L = 5 m (two 2.5 m
 * members), central point load P = 10 kN.
 * Independent statics: reactions 5/5 kN; joint moment PL/4 = 12.5
 * kN·m (sagging +); moment grows linearly 0 -> 12.5 on the left
 * member; axial force zero.
 *
 * The adapter must (a) agree EXACTLY with the engine's own
 * memberInternalForces recovery (it is a presentation layer over
 * it), and (b) reproduce the independent statics above through it.
 */
import { describe, it, expect } from 'vitest'
import { analyze, memberInternalForces } from '@/engine/solver'
import type { StructureModel, Section } from '@/engine/model'
import { inspectMember, inspectNode, internalForcesAt, memberLength } from '@/visualization/inspector'

const SEC: Section = { id: 's1', name: 'TEST', E: 200000, I33: 80e6, A: 5000 }
const beam: StructureModel = {
  nodes: { a: { id: 'a', x: 0, y: 0 }, mid: { id: 'mid', x: 2.5, y: 0 }, b: { id: 'b', x: 5, y: 0 } },
  members: {
    m1: { id: 'm1', a: 'a', b: 'mid', section: 's1' },
    m2: { id: 'm2', a: 'mid', b: 'b', section: 's1' },
  },
  supports: { a: { nodeId: 'a', type: 'pin' }, b: { nodeId: 'b', type: 'roller' } },
  sections: { s1: SEC },
  loads: { l1: { id: 'l1', type: 'point', nodeId: 'mid', loadCaseId: 'dead', fx: 0, fy: -10 } },
}

describe('member inspector adapter', () => {
  const r = analyze(beam)
  if (!r.ok) throw new Error('canonical beam must solve')

  it('identity: length, endpoints, section, supports', () => {
    const insp = inspectMember(beam, r, 'm1')
    expect(insp).not.toBeNull()
    expect(insp!.length).toBeCloseTo(2.5, 9)
    expect(insp!.a).toBe('a')
    expect(insp!.b).toBe('mid')
    expect(insp!.sectionName).toBe('TEST')
    expect(insp!.supportA).toBe('Sendi')
    expect(insp!.supportB).toBeNull()
    expect(memberLength(beam, 'm2')).toBeCloseTo(2.5, 9)
  })

  it('agrees exactly with memberInternalForces at sampled positions', () => {
    const ef = r.memberEndForces['m1']
    for (const xi of [0, 0.25, 0.5, 0.75, 1]) {
      const got = internalForcesAt(beam, r, 'm1', xi)!
      const want = memberInternalForces(ef, xi * 2.5, 2.5)
      expect(got.N).toBe(want.N)
      expect(got.V).toBe(want.V)
      expect(got.M).toBe(want.M)
      expect(got.x).toBeCloseTo(xi * 2.5, 9)
    }
  })

  it('reproduces independent statics through the recovery', () => {
    expect(internalForcesAt(beam, r, 'm1', 0)!.M).toBeCloseTo(0, 6)
    expect(internalForcesAt(beam, r, 'm1', 0.5)!.M).toBeCloseTo(6.25, 6)
    expect(internalForcesAt(beam, r, 'm1', 1)!.M).toBeCloseTo(12.5, 6) // PL/4
    expect(internalForcesAt(beam, r, 'm2', 0)!.M).toBeCloseTo(12.5, 6) // joint continuity
    expect(Math.abs(internalForcesAt(beam, r, 'm1', 0.5)!.V)).toBeCloseTo(5, 6)
    expect(internalForcesAt(beam, r, 'm1', 0.5)!.N).toBeCloseTo(0, 9)
  })

  it('clamps xi into [0, 1] instead of extrapolating', () => {
    expect(internalForcesAt(beam, r, 'm1', 1.7)!.xi).toBe(1)
    expect(internalForcesAt(beam, r, 'm1', -0.2)!.xi).toBe(0)
  })

  it('missing result -> null forces, identity still available', () => {
    const insp = inspectMember(beam, null, 'm1')
    expect(insp).not.toBeNull()
    expect(insp!.endForces).toBeNull()
    expect(internalForcesAt(beam, null, 'm1', 0.5)).toBeNull()
  })

  it('unknown member -> null, never fabricated', () => {
    // @ts-expect-error deliberately unknown id
    expect(inspectMember(beam, r, 'nope')).toBeNull()
    // @ts-expect-error deliberately unknown id
    expect(internalForcesAt(beam, r, 'nope', 0.5)).toBeNull()
  })

  it('node inspection: support, displacement, reaction from the solver', () => {
    const n = inspectNode(beam, r, 'a')
    expect(n!.support).toBe('Sendi')
    expect(n!.reaction!.Ry).toBeCloseTo(5, 6)
    expect(n!.disp!.v).toBeCloseTo(0, 9)
    const mid = inspectNode(beam, r, 'mid')
    expect(mid!.reaction).toBeNull() // no support at mid
    expect(mid!.disp!.v).toBeLessThan(0) // sags downward
  })
})
