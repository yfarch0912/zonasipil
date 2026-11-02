import { describe, it } from 'vitest'
import { analyze } from '@/engine/solver'
import { template1SimpleBeam, template2Cantilever } from '@/templates/examples'

describe('probe: sample 01 / template 1 audit', () => {
  it('reports model + solver output', () => {
    const m = template1SimpleBeam()
    console.log('NODES', JSON.stringify(m.nodes))
    console.log('MEMBERS', JSON.stringify(m.members))
    console.log('SUPPORTS', JSON.stringify(m.supports))
    console.log('LOADS', JSON.stringify(m.loads))
    console.log('SECTIONS', JSON.stringify(m.sections))
    const r = analyze(m)
    if (!r.ok) { console.log('SOLVE FAILED', r.reason); return }
    console.log('REACTIONS', JSON.stringify(r.reactions))
    console.log('DISPLACEMENTS', JSON.stringify(r.nodeDisplacements))
    console.log('NUMERICAL', JSON.stringify(r.numerical))
  })
  it('template 2 (same SECTION_DEFAULT) for comparison', () => {
    const m = template2Cantilever()
    const r = analyze(m)
    if (!r.ok) { console.log('T2 SOLVE FAILED', r.reason); return }
    console.log('T2 NUMERICAL', JSON.stringify(r.numerical))
  })
})
