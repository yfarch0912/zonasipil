/**
 * Sample-project verification (§17) + project store (§13) tests.
 * Equilibrium invariant: sum of vertical reactions must equal total applied
 * vertical load (point fy + ∫w over horizontal members) for every sample.
 */
import { describe, it, expect } from 'vitest'
import { analyze } from '@/engine/solver'
import { SAMPLES } from '@/struktura/samples'
import {
  stableStringify, modelFingerprint, importProjectJSON, exportProjectJSON,
  type StoredProject, newProjectMeta,
} from '@/struktura/projects'
import { createEmptyModel } from '@/engine/model'

function totalVerticalLoad(m: (typeof SAMPLES)[0]['build'] extends () => infer T ? T : never): number {
  let total = 0
  const model = m as import('@/engine/model').StructureModel
  for (const l of Object.values(model.loads)) {
    if (l.type === 'point') total += l.fy
    else {
      const mem = model.members[l.memberId]
      const a = model.nodes[mem.a], b = model.nodes[mem.b]
      const L = Math.hypot(b.x - a.x, b.y - a.y)
      if (Math.abs(b.y - a.y) < 1e-9) {
        // horizontal member, local-axis UDL: vertical load = mean w × L
        total += ((l.wStart ?? 0) + (l.wEnd ?? 0)) / 2 * L
      }
    }
  }
  return total
}

describe('Sample projects all solve and satisfy global equilibrium', () => {
  for (const s of SAMPLES) {
    it(s.title, () => {
      const model = s.build()
      const r = analyze(model)
      expect(r.ok).toBe(true)
      if (!r.ok) return
      const sumRy = Object.values(r.reactions).reduce((acc, x) => acc + x.Ry, 0)
      const applied = totalVerticalLoad(model as never)
      // Reactions balance applied load: ΣRy + Σ(applied fy) = 0
      expect(Math.abs(sumRy + applied)).toBeLessThan(Math.max(1e-6, Math.abs(applied) * 1e-9))
    })
  }
})

describe('Project store helpers (§13)', () => {
  it('fingerprint is stable under key reordering and changes with the model', () => {
    const a = createEmptyModel()
    const fp1 = modelFingerprint(a)
    const reordered = JSON.parse(stableStringify(a)) as typeof a
    expect(modelFingerprint(reordered)).toBe(fp1)
    const b = createEmptyModel()
    b.nodes['x1'] = { id: 'x1', x: 1, y: 2 }
    expect(modelFingerprint(b)).not.toBe(fp1)
  })
  it('export → import round-trips a project', () => {
    const p: StoredProject = {
      meta: newProjectMeta('Round Trip'),
      model: createEmptyModel(),
      fingerprint: modelFingerprint(createEmptyModel()),
    }
    const back = importProjectJSON(exportProjectJSON(p))
    expect(back.meta.name).toBe('Round Trip')
    expect(back.fingerprint).toBe(p.fingerprint)
  })
  it('import rejects garbage with a clear error', () => {
    expect(() => importProjectJSON('not json')).toThrow(/bukan JSON yang valid/)
    expect(() => importProjectJSON('{}')).toThrow(/meta\/model tidak ada/)
  })
})
