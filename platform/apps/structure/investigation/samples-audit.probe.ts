import { describe, it } from 'vitest'
import { analyze } from '@/engine/solver'
import { SAMPLES } from '@/struktura/samples'

describe('probe: audit all dashboard samples', () => {
  it('reports per-sample solver state + equilibrium', () => {
    for (const s of SAMPLES) {
      const m = s.build()
      const r = analyze(m)
      let appliedFy = 0, appliedFx = 0
      for (const l of Object.values(m.loads)) {
        if (l.type === 'point') { appliedFx += l.fx ?? 0; appliedFy += l.fy ?? 0 }
        if (l.type === 'distributed') {
          const mem = m.members[l.memberId]
          const a = m.nodes[mem.a], b = m.nodes[mem.b]
          const L = Math.hypot(b.x - a.x, b.y - a.y)
          appliedFy += ((l.wStart + l.wEnd) / 2) * L
        }
      }
      if (!r.ok) { console.log(`${s.id}: SOLVE FAILED ${r.reason}`); continue }
      let sRx = 0, sRy = 0
      for (const rx of Object.values(r.reactions)) { sRx += rx.Rx; sRy += rx.Ry }
      const secs = [...new Set(Object.values(m.members).map((mm) => mm.section))]
      console.log(`${s.id}: class=${r.numerical.classification} resid=${r.numerical.relativeResidual.toExponential(1)} maxRot=${Math.max(Math.abs(r.numerical.maxAbsRotation.value), Math.abs(r.numerical.maxChordRotation?.value ?? 0)).toExponential(2)} eqFx=${(sRx + appliedFx).toExponential(1)} eqFy=${(sRy + appliedFy).toExponential(1)} nodes=${Object.keys(m.nodes).length} members=${Object.keys(m.members).length} sections=[${secs.join(',')}] loads=${Object.keys(m.loads).length}`)
      console.log(`   expected-field: ${s.expected.slice(0, 110)}`)
    }
  })
})
