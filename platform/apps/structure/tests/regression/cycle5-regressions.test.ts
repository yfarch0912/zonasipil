/**
 * Regression tests for Audit Cycle 5 findings (docs/AUDIT_CYCLE.md):
 *  C5-F1 solver threw a raw TypeError (or failed later with a cryptic
 *        "Singular stiffness matrix") on malformed model shapes: a missing
 *        collection, a record key differing from the entity's own id, or
 *        two nodes sharing one id field. Now named errors at solver entry,
 *        same hardening pattern as Cycles 2 (C2-F1) and 4 (C4-F1).
 */
import { describe, it, expect } from 'vitest'
import { analyze } from '@/engine/solver'
import { importProjectJSON } from '@/struktura/projects'
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

describe('C5-F1 — malformed model shapes are named errors, never throws or cryptic singular failures', () => {
  it('baseline still solves downward (sanity anchor)', () => {
    const r = analyze(beam())
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.nodeDisplacements['n2'].v).toBeLessThan(0)
  })
  it('node record key != id field rejected by name (previously cryptic singular error)', () => {
    const r = analyze(beam((m) => { m.nodes.n1 = { id: 'nX', x: 0, y: 0 } }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/does not match its id/)
  })
  it('two nodes sharing one id field rejected by name (previously cryptic singular error)', () => {
    const r = analyze(beam((m) => { m.nodes.n3 = { id: 'n2', x: 6, y: 0 } }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/does not match its id/)
  })
  it('support record key != nodeId rejected by name', () => {
    const r = analyze(beam((m) => { m.supports.n1 = { nodeId: 'nZ', type: 'pin' } }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/does not match its nodeId/)
  })
  it('member record key != id rejected by name', () => {
    const r = analyze(beam((m) => { m.members.m1 = { id: 'mX', a: 'n1', b: 'n2', section: 's1' } }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/does not match its id/)
  })
  it('missing collection rejected by name, never a TypeError (bare import without supports/loads)', () => {
    const bare = { nodes: { n1: { id: 'n1', x: 0, y: 0 } }, members: {}, sections: {} }
    const p = importProjectJSON(JSON.stringify(bare))
    let r: ReturnType<typeof analyze>
    expect(() => { r = analyze(p.model) }).not.toThrow()
    expect(r!.ok).toBe(false)
    if (!r!.ok) expect(r!.reason).toMatch(/incomplete/)
  })
  it('null model rejected by name, never a TypeError', () => {
    let r: ReturnType<typeof analyze>
    expect(() => { r = analyze(null as unknown as StructureModel) }).not.toThrow()
    expect(r!.ok).toBe(false)
  })
})
