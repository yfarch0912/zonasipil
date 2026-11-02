import { describe, it } from 'vitest'
import { analyze } from '@/engine/solver'
import { SAMPLES } from '@/struktura/samples'
describe('probe: verify documented sample expectations', () => {
  it('checks reactions for 03, 04, 06, 07', () => {
    for (const id of ['03-two-span', '04-truss', '06-portal-2', '07-multistorey']) {
      const s = SAMPLES.find((x) => x.id === id)!
      const r = analyze(s.build())
      if (!r.ok) { console.log(id, 'FAIL'); continue }
      const rys = Object.entries(r.reactions).map(([n, v]) => `${n}:${v.Ry.toFixed(3)}`).join(' ')
      const sum = Object.values(r.reactions).reduce((a, v) => a + v.Ry, 0)
      console.log(`${id}: ΣRy=${sum.toFixed(4)} | ${rys}`)
    }
  })
})
