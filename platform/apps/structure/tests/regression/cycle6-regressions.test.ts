/**
 * Regression tests for Audit Cycle 6 findings (docs/AUDIT_CYCLE.md):
 *  C6-F1 solver silently reinterpreted unknown enum values instead of
 *        rejecting them: an unknown load type vanished (ok:true, all-zero
 *        forces), an unknown support type behaved as a roller, an unknown
 *        memberType solved as a frame, and an unknown distributed-load
 *        mode dropped its local-axis loads. Now named errors at solver
 *        entry, same hardening pattern as Cycles 2 (C2-F1), 4 (C4-F1)
 *        and 5 (C5-F1).
 */
import { describe, it, expect } from 'vitest'
import { analyze } from '@/engine/solver'
import type { StructureModel, Section } from '@/engine/model'

const SEC: Section = { id: 's1', name: 'T', E: 200000, I33: 80e6, A: 5000 }
const beam = (mutate?: (m: StructureModel) => void): StructureModel => {
  const m: StructureModel = {
    nodes: { n1: { id: 'n1', x: 0, y: 0 }, n2: { id: 'n2', x: 3, y: 0 }, n3: { id: 'n3', x: 6, y: 0 } },
    members: {
      m1: { id: 'm1', a: 'n1', b: 'n2', section: 's1' },
      m2: { id: 'm2', a: 'n2', b: 'n3', section: 's1' },
    },
    supports: { n1: { nodeId: 'n1', type: 'pin' }, n3: { nodeId: 'n3', type: 'roller' } },
    sections: { s1: SEC },
    loads: { l1: { id: 'l1', type: 'point', nodeId: 'n2', loadCaseId: 'dead', fx: 0, fy: -10 } },
  }
  mutate?.(m)
  return m
}

describe('C6-F1 — unknown enum values are named errors, never silently reinterpreted', () => {
  it('baseline still solves downward (sanity anchor)', () => {
    const r = analyze(beam())
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.nodeDisplacements['n2'].v).toBeLessThan(0)
  })
  it('unknown load type rejected by name (previously ok:true with all-zero forces — load vanished)', () => {
    const r = analyze(beam((m) => {
      ;(m.loads.l1 as unknown as { type: string }).type = 'bogus'
    }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/unknown type/)
  })
  it('unknown support type rejected by name even with enough valid reactions (previously ok:true, acted as roller)', () => {
    const r = analyze(beam((m) => {
      m.supports = {
        n1: { nodeId: 'n1', type: 'pin' },
        n2: { nodeId: 'n2', type: 'bogus' } as never,
        n3: { nodeId: 'n3', type: 'fixed' },
      }
    }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/unknown type/)
  })
  it('unknown memberType rejected by name (previously ok:true, solved as frame)', () => {
    const r = analyze(beam((m) => {
      ;(m.members.m1 as unknown as { memberType: string }).memberType = 'trus'
    }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/unknown memberType/)
  })
  it('unknown distributed-load mode rejected by name (previously ok:true, wStart/wEnd ignored)', () => {
    const r = analyze(beam((m) => {
      m.loads = {
        l1: { id: 'l1', type: 'distributed', memberId: 'm1', loadCaseId: 'dead', mode: 'bogus' as never, wStart: -10, wEnd: -10 },
      }
    }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/unknown mode/)
  })
  it('valid enum values still accepted (truss memberType, global-axis mode)', () => {
    // Stable triangle truss (a lone truss member spliced into the beam
    // chain is a genuine linear mechanism — rigid rotation about the
    // roller — and correctly reports singular, so it is not used here).
    const triangle: StructureModel = {
      nodes: { n1: { id: 'n1', x: 0, y: 0 }, n2: { id: 'n2', x: 3, y: 0 }, n3: { id: 'n3', x: 1.5, y: 2 } },
      members: {
        m1: { id: 'm1', a: 'n1', b: 'n2', section: 's1', memberType: 'truss' },
        m2: { id: 'm2', a: 'n1', b: 'n3', section: 's1', memberType: 'truss' },
        m3: { id: 'm3', a: 'n2', b: 'n3', section: 's1', memberType: 'truss' },
      },
      supports: { n1: { nodeId: 'n1', type: 'pin' }, n2: { nodeId: 'n2', type: 'roller' } },
      sections: { s1: SEC },
      loads: { l1: { id: 'l1', type: 'point', nodeId: 'n3', loadCaseId: 'dead', fx: 0, fy: -10 } },
    }
    const truss = analyze(triangle)
    expect(truss.ok).toBe(true)
    const global = analyze(beam((m) => {
      m.loads = {
        l1: { id: 'l1', type: 'distributed', memberId: 'm1', loadCaseId: 'dead', mode: 'global-axis', wyStart: -10, wyEnd: -10 },
      }
    }))
    expect(global.ok).toBe(true)
    if (global.ok) expect(global.memberEndForces['m1'].q1).not.toBe(0)
  })
})
