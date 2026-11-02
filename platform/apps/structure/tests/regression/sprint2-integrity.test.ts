/**
 * Sprint 2 — P3 (design-demand integrity) + P4 (report integrity).
 *
 * P3: completeness/reliability metadata must survive EVERY combination
 * consumer — combineResults, envelopeResults, the gravity combo behind
 * RC capacity shear Ve, and the service result. Each test names the seam
 * it pins.
 *
 * P4: the one-click report must be unmistakable about its scope
 * (service-level, unfactored, no design verdicts, no compliance claim),
 * must print integrity warnings, and must never conclude an incomplete
 * or numerically implausible result as a plain success.
 */
import { describe, it, expect } from 'vitest'
import {
  solveAllCases,
  solveCase,
  combineResults,
  envelopeResults,
} from '@/engine/analysis-pipeline'
import { DEFAULT_LOAD_CASES, type LoadCase, type LoadCombination } from '@/engine/load-cases'
import { designFromCases } from '@/engine/design/core/run-design'
import { defaultDesignCriteria } from '@/engine/design/core/criteria'
import { buildParametricSection } from '@/engine/sections/compute'
import { serviceResult } from '@/struktura/service-result'
import { generateReportHTML } from '@/struktura/report'
import type { StructureModel, Section } from '@/engine/model'

const SEC: Section = { id: 's1', name: 'T', E: 200000, I33: 80e6, A: 5000, gamma: 0 }
const pt = (id: string, loadCaseId: string, fy: number, nodeId = 'n2') => ({
  id, type: 'point' as const, nodeId, loadCaseId, fx: 0, fy,
})
const udl = (id: string, memberId: string, loadCaseId: string, w: number) => ({
  id, type: 'distributed' as const, memberId, loadCaseId, wStart: w, wEnd: w,
})
const beam = (loads: StructureModel['loads'], sections: StructureModel['sections'] = { s1: SEC }): StructureModel => ({
  nodes: {
    n1: { id: 'n1', x: 0, y: 0 }, n2: { id: 'n2', x: 3, y: 0 }, n3: { id: 'n3', x: 6, y: 0 },
  },
  members: {
    m1: { id: 'm1', a: 'n1', b: 'n2', section: 's1' },
    m2: { id: 'm2', a: 'n2', b: 'n3', section: 's1' },
  },
  supports: { n1: { nodeId: 'n1', type: 'pin' }, n3: { nodeId: 'n3', type: 'roller' } },
  sections,
  loads,
})
const LIVE: LoadCase = { id: 'live', name: 'Beban Hidup', kind: 'Live', enabled: true }
const WIND: LoadCase = { id: 'wind', name: 'Angin', kind: 'Wind', enabled: true }
const combo = (id: string, name: string, terms: { factor: number; caseId: string }[]): LoadCombination => ({
  id, name, terms, source: 'custom', enabled: true,
})
const cases = (extra: Record<string, LoadCase> = {}) => ({ ...DEFAULT_LOAD_CASES(), ...extra })

const B12 = (): StructureModel => {
  const TINY: Section = { id: 's9', name: 'tiny', E: 200000, I33: 80e6 * 1e-8, A: 5000, gamma: 0 }
  return {
    nodes: { n1: { id: 'n1', x: 0, y: 0 }, n2: { id: 'n2', x: 6, y: 0 }, n3: { id: 'n3', x: 12, y: 0 } },
    members: { m1: { id: 'm1', a: 'n1', b: 'n2', section: 's1' }, m2: { id: 'm2', a: 'n2', b: 'n3', section: 's9' } },
    supports: { n1: { nodeId: 'n1', type: 'pin' }, n2: { nodeId: 'n2', type: 'roller' }, n3: { nodeId: 'n3', type: 'roller' } },
    sections: { s1: SEC, s9: TINY },
    loads: { u1: udl('u1', 'm1', 'dead', -10), u2: udl('u2', 'm2', 'dead', -10) },
  }
}

describe('P3 — combineResults propagates numerical + fallback metadata', () => {
  it('implausible case → combined result is PHYSICALLY_IMPLAUSIBLE', () => {
    const lc = cases()
    const res = solveAllCases(B12(), lc)
    const combined = combineResults(res, combo('k', '1.0D', [{ factor: 1, caseId: 'dead' }]), lc)
    expect(combined).not.toBeNull()
    expect(combined!.numerical.classification).toBe('PHYSICALLY_IMPLAUSIBLE')
  })

  it('shear-fallback members survive combination (union)', () => {
    const lc = cases({ live: LIVE })
    const model = beam({ d1: pt('d1', 'dead', -10), l1: pt('l1', 'live', -5) })
    const res = solveAllCases(model, lc, { shearDeformation: true })
    const combined = combineResults(res, combo('k', '1.2D+1.6L', [
      { factor: 1.2, caseId: 'dead' }, { factor: 1.6, caseId: 'live' },
    ]), lc)
    expect(combined!.shearFallbackMembers?.map((m) => m.memberId).sort()).toEqual(['m1', 'm2'])
  })
})

describe('P3 — envelopeResults preserves completeness + reliability metadata', () => {
  it('partial source combo is named in incompleteSourceCombos', () => {
    const lc = cases({ live: LIVE, wind: { ...WIND, enabled: false } })
    const model = beam({ d1: pt('d1', 'dead', -10), l1: pt('l1', 'live', -5) })
    const res = solveAllCases(model, lc)
    const combos: Record<string, LoadCombination> = {
      kfull: combo('kfull', '1.2D+1.6L', [{ factor: 1.2, caseId: 'dead' }, { factor: 1.6, caseId: 'live' }]),
      kpart: combo('kpart', '1.2D+1.0W', [{ factor: 1.2, caseId: 'dead' }, { factor: 1.0, caseId: 'wind' }]),
    }
    const comboResults = {
      kfull: combineResults(res, combos.kfull, lc),
      kpart: combineResults(res, combos.kpart, lc),
    }
    const env = envelopeResults(comboResults, ['kfull', 'kpart'], combos)
    expect(env).not.toBeNull()
    expect(env!.incompleteSourceCombos).toEqual(['kpart'])
    // And a clean envelope carries no such marker.
    const envClean = envelopeResults({ kfull: comboResults.kfull }, ['kfull'], combos)
    expect(envClean!.incompleteSourceCombos).toBeUndefined()
  })

  it('envelope of an implausible combo inherits the classification', () => {
    const lc = cases()
    const res = solveAllCases(B12(), lc)
    const k = combineResults(res, combo('k', '1.0D', [{ factor: 1, caseId: 'dead' }]), lc)
    const env = envelopeResults({ k }, ['k'])
    expect(env!.numerical.classification).toBe('PHYSICALLY_IMPLAUSIBLE')
  })
})

describe('P3 — gravity combo integrity drives RC Ve honestly', () => {
  const rcSection = buildParametricSection({
    id: 'beton', name: 'B 300x500', materialClass: 'concrete', shape: 'rect',
    dims: { b: 300, h: 500 }, strength: { fc: 25 },
  })
  const rcBeam = (loads: StructureModel['loads']) => beam(loads, { s1: { ...rcSection, id: 's1' } })
  const LOADS: StructureModel['loads'] = {
    d1: udl('d1', 'm1', 'dead', -10), d2: udl('d2', 'm2', 'dead', -10),
    w1: pt('w1', 'wind', -30),
  }
  const imf = () => {
    const c = defaultDesignCriteria()
    c.rc.frameType = 'IMF'
    return c
  }
  const windCombo = { kw: combo('kw', '1.0W', [{ factor: 1.0, caseId: 'wind' }]) }
  const veOf = (run: ReturnType<typeof designFromCases>) =>
    run.members['m1'].zones?.['end-i'].shear.Ve

  it('gravity present vs missing changes ONLY Vg: Ve drops when gravity is missing, and the run says so', () => {
    const model = rcBeam(LOADS)
    // Run A: dead + selfweight enabled → gravity combo (1.2D) exists.
    const lcA = cases({ wind: WIND })
    const runA = designFromCases(solveAllCases(model, lcA), {
      model, loadCases: lcA, combinations: windCombo, criteria: imf(), inputs: {},
    })
    // Run B: dead + selfweight disabled → gravity combo has no terms.
    const lcB = cases({ wind: WIND })
    lcB['dead'] = { ...lcB['dead'], enabled: false }
    lcB['selfweight'] = { ...lcB['selfweight'], enabled: false }
    const runB = designFromCases(solveAllCases(model, lcB), {
      model, loadCases: lcB, combinations: windCombo, criteria: imf(), inputs: {},
    })
    expect(runA.gravityComboMissing).toBe(false)
    expect(runB.gravityComboMissing).toBe(true)
    expect(runB.issues.some((s) => s.includes('Ve dihitung tanpa Vg'))).toBe(true)
    // The design combination is IDENTICAL (1.0W) in both runs, so the
    // flexural design (hence Mn/Mpr) is the same; the only difference in
    // Ve is the Vg term, which is positive for a downward UDL.
    const veA = veOf(runA)
    const veB = veOf(runB)
    expect(typeof veA).toBe('number')
    expect(typeof veB).toBe('number')
    expect(veA!).toBeGreaterThan(veB!)
    expect(runB.verdict!.status).toBe('INCOMPLETE')
  })

  it('gravity combo partial (live case failed) → gravityComboIncomplete, members tainted, Ve still computed', () => {
    const lc = cases({ live: LIVE, wind: WIND })
    const model = rcBeam({ ...LOADS, g1: pt('g1', 'live', -5, 'ghost') })
    const run = designFromCases(solveAllCases(model, lc), {
      model, loadCases: lc,
      combinations: { kd: combo('kd', '1.2D', [{ factor: 1.2, caseId: 'dead' }]) },
      criteria: imf(), inputs: {},
    })
    expect(run.gravityComboIncomplete).toBe(true)
    expect(run.gravityComboMissing).toBe(false)
    const m1 = run.members['m1']
    expect(m1.status).toBe('designed')
    expect(m1.demandsIncomplete).toBe(true)
    expect(typeof m1.zones?.['end-i'].shear.Ve).toBe('number')
    expect(run.verdict!.status).not.toBe('PASS')
  })
})

describe('P4 — service result + report integrity', () => {
  it('clean model: service result has no warnings; report scope is unmistakable', () => {
    const model = beam({ d1: pt('d1', 'dead', -10), d2: pt('d2', 'dead', -5, 'n3') })
    const svc = serviceResult(model)
    expect(svc.ok).toBe(true)
    if (!svc.ok) throw new Error(svc.reason)
    expect(svc.warnings).toEqual([])
    expect(svc.completeness.complete).toBe(true)
    const html = generateReportHTML(null, model, svc.result, new Date(), { warnings: svc.warnings })
    expect(html).toContain('Laporan Hasil Analisis Layan (Tak Terfaktor)')
    expect(html).toContain('BUKAN laporan desain')
    expect(html).toContain('BUKAN bukti kepatuhan')
    expect(html).toContain('Tidak ada verdict desain elemen di dalam dokumen ini')
    expect(html).toContain('BELUM TERVERIFIKASI (UNVERIFIED)')
    expect(html).toContain('Analisis selesai dengan sukses untuk model')
  })

  it('B12 model: service result warns PHYSICALLY_IMPLAUSIBLE and the report conclusion is qualified', () => {
    const model = B12()
    const svc = serviceResult(model)
    expect(svc.ok).toBe(true)
    if (!svc.ok) throw new Error(svc.reason)
    expect(svc.warnings.some((w) => w.includes('PHYSICALLY_IMPLAUSIBLE'))).toBe(true)
    const html = generateReportHTML(null, model, svc.result, new Date(), { warnings: svc.warnings })
    expect(html).toContain('PHYSICALLY_IMPLAUSIBLE')
    expect(html).toContain('DENGAN PERINGATAN INTEGRITAS')
    expect(html).not.toContain('Analisis selesai dengan sukses untuk model')
  })

  it('incomplete-combination warning reaches the printed page verbatim and qualifies the conclusion', () => {
    const model = beam({ d1: pt('d1', 'dead', -10) })
    const r = solveCase(model, 'dead')
    expect(r.ok).toBe(true)
    if (!r.ok) throw new Error(r.reason)
    const warning = 'Kombinasi layan TIDAK LENGKAP — term "live" (1.6×, failed) dihilangkan; angka dalam laporan ini PARSIAL.'
    const html = generateReportHTML(null, model, r, new Date(), { warnings: [warning] })
    expect(html).toContain('TIDAK LENGKAP')
    expect(html).toContain('DENGAN PERINGATAN INTEGRITAS')
    expect(html).not.toContain('Analisis selesai dengan sukses untuk model')
  })
})
