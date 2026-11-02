import { describe, it } from 'vitest'
import { analyze, memberInternalForces } from '@/engine/solver'
import type { StructureModel, Section } from '@/engine/model'
const SEC: Section = { id: 's1', name: 'T', E: 200000, I33: 80e6, A: 5000 }
const base = (p: Partial<StructureModel>): StructureModel => ({ nodes: {}, members: {}, supports: {}, sections: { s1: SEC }, loads: {}, ...p })

describe('probe signs', () => {
  it('propped cantilever UDL', () => {
    const m = base({
      nodes: { a: { id: 'a', x: 0, y: 0 }, b: { id: 'b', x: 6, y: 0 } },
      members: { m1: { id: 'm1', a: 'a', b: 'b', section: 's1' } },
      supports: { a: { nodeId: 'a', type: 'fixed' }, b: { nodeId: 'b', type: 'roller' } },
      loads: { l1: { id: 'l1', type: 'distributed', memberId: 'm1', loadCaseId: 'dead', wStart: -10, wEnd: -10 } },
    })
    const r = analyze(m); if (!r.ok) return console.log('FAIL')
    console.log('PROPPED reactions', JSON.stringify(r.reactions), 'endForces', JSON.stringify(r.memberEndForces['m1']))
  })
  it('fixed-fixed central point', () => {
    const m = base({
      nodes: { a: { id: 'a', x: 0, y: 0 }, c: { id: 'c', x: 3, y: 0 }, b: { id: 'b', x: 6, y: 0 } },
      members: { m1: { id: 'm1', a: 'a', b: 'c', section: 's1' }, m2: { id: 'm2', a: 'c', b: 'b', section: 's1' } },
      supports: { a: { nodeId: 'a', type: 'fixed' }, b: { nodeId: 'b', type: 'fixed' } },
      loads: { l1: { id: 'l1', type: 'point', nodeId: 'c', loadCaseId: 'dead', fx: 0, fy: -20 } },
    })
    const r = analyze(m); if (!r.ok) return console.log('FAIL')
    console.log('FF reactions', JSON.stringify(r.reactions))
    console.log('FF disp c', JSON.stringify(r.nodeDisplacements['c']))
    console.log('FF ef m1', JSON.stringify(r.memberEndForces['m1']), 'ef m2', JSON.stringify(r.memberEndForces['m2']))
  })
  it('SS UDL internal forces', () => {
    const m = base({
      nodes: { a: { id: 'a', x: 0, y: 0 }, c: { id: 'c', x: 3, y: 0 }, b: { id: 'b', x: 6, y: 0 } },
      members: { m1: { id: 'm1', a: 'a', b: 'c', section: 's1' }, m2: { id: 'm2', a: 'c', b: 'b', section: 's1' } },
      supports: { a: { nodeId: 'a', type: 'pin' }, b: { nodeId: 'b', type: 'roller' } },
      loads: {
        l1: { id: 'l1', type: 'distributed', memberId: 'm1', loadCaseId: 'dead', wStart: -10, wEnd: -10 },
        l2: { id: 'l2', type: 'distributed', memberId: 'm2', loadCaseId: 'dead', wStart: -10, wEnd: -10 },
      },
    })
    const r = analyze(m); if (!r.ok) return console.log('FAIL')
    const ef = r.memberEndForces['m1']
    console.log('SS midspan via memberInternalForces(m1, 3, 3):', JSON.stringify(memberInternalForces(ef, 3, 3)), 'V at 0:', JSON.stringify(memberInternalForces(ef, 0, 3)))
  })
})
