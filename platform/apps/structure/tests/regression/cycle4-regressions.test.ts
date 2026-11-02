/**
 * Regression tests for Audit Cycle 4 findings (docs/AUDIT_CYCLE.md):
 *  C4-F1 solver accepted non-finite / non-positive physical inputs and
 *        returned ok:true — negative E/I flipped the deflection sign,
 *        NaN/Infinity surfaced as nulls in JSON output. Now named errors
 *        at solver entry, same hardening pattern as Cycle 2 (C2-F1).
 */
import { describe, it, expect } from 'vitest'
import { analyze } from '@/engine/solver'
import type { StructureModel, Section } from '@/engine/model'

const SEC: Section = { id: 's1', name: 'T', E: 200000, I33: 80e6, A: 5000 }
const beam = (sec: Section, mutate?: (m: StructureModel) => void): StructureModel => {
  const m: StructureModel = {
    nodes: { n1: { id: 'n1', x: 0, y: 0 }, n2: { id: 'n2', x: 3, y: 0 }, n3: { id: 'n3', x: 6, y: 0 } },
    members: {
      m1: { id: 'm1', a: 'n1', b: 'n2', section: 's1' },
      m2: { id: 'm2', a: 'n2', b: 'n3', section: 's1' },
    },
    supports: { n1: { nodeId: 'n1', type: 'pin' }, n3: { nodeId: 'n3', type: 'roller' } },
    sections: { s1: sec },
    loads: { l1: { id: 'l1', type: 'point', nodeId: 'n2', loadCaseId: 'dead', fx: 0, fy: -10 } },
  }
  mutate?.(m)
  return m
}

describe('C4-F1 — non-finite / non-positive inputs are named errors, never ok:true', () => {
  it('baseline still solves downward (sanity anchor for the sign-flip probes)', () => {
    const r = analyze(beam(SEC))
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.nodeDisplacements['n2'].v).toBeLessThan(0)
  })
  it('negative E rejected (previously ok:true, deflection sign flipped)', () => {
    const r = analyze(beam({ ...SEC, E: -200000 }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/elastic modulus/)
  })
  it('negative I33 rejected (previously ok:true, deflection sign flipped)', () => {
    const r = analyze(beam({ ...SEC, I33: -80e6 }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/I33/)
  })
  it('zero / negative area rejected', () => {
    for (const A of [0, -5000]) {
      const r = analyze(beam({ ...SEC, A }))
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.reason).toMatch(/area A/)
    }
  })
  it('NaN node coordinate rejected (previously ok:true with null outputs)', () => {
    const r = analyze(beam(SEC, (m) => { m.nodes.n2.x = NaN }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/non-finite coordinate/)
  })
  it('NaN section modulus rejected', () => {
    const r = analyze(beam({ ...SEC, E: NaN }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/elastic modulus/)
  })
  it('NaN / Infinity load components rejected', () => {
    const nan = analyze(beam(SEC, (m) => { (m.loads.l1 as { fy: number }).fy = NaN }))
    expect(nan.ok).toBe(false)
    const inf = analyze(beam(SEC, (m) => { (m.loads.l1 as { fy: number }).fy = Infinity }))
    expect(inf.ok).toBe(false)
    const w = analyze(beam(SEC, (m) => {
      m.loads.l2 = { id: 'l2', type: 'distributed', memberId: 'm1', loadCaseId: 'dead', wStart: NaN, wEnd: NaN }
    }))
    expect(w.ok).toBe(false)
    if (!w.ok) expect(w.reason).toMatch(/non-finite/)
  })
})
