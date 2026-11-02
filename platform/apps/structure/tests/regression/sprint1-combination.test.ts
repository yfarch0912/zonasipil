/**
 * Sprint 1 — R-03 (was C15-F1): combination term dropping must be explicit.
 *
 * Before this sprint, `combineResults` silently skipped terms whose case was
 * missing, disabled or failed, and returned the partial superposition as
 * `ok:true` with no marker — an envelope or design demand could understate a
 * factored combination while looking complete.
 *
 * Behaviour now pinned by these tests:
 *  - Every dropped term is named on the result's `combination` audit with
 *    its case id, its factor and a reason (missing / disabled / failed,
 *    the last carrying the solver's failure reason verbatim).
 *  - The superposition of the CONTRIBUTING terms is unchanged (exact).
 *  - All-terms-dropped and no-terms still return null; `auditCombination`
 *    still explains why.
 *  - The design run consumes the audit: partial combinations are named in
 *    `incompleteCombos`, announced in `issues`, and every member designed
 *    from them is flagged `demandsIncomplete`.
 */
import { describe, it, expect } from 'vitest'
import {
  auditCombination,
  combineResults,
  solveAllCases,
} from '@/engine/analysis-pipeline'
import type { SolverResult } from '@/engine/solver'
import {
  DEFAULT_LOAD_CASES,
  type LoadCase,
  type LoadCombination,
} from '@/engine/load-cases'
import { buildParametricSection } from '@/engine/sections/compute'
import { designFromCases } from '@/engine/design/core/run-design'
import { defaultDesignCriteria } from '@/engine/design/core/criteria'
import type { StructureModel } from '@/engine/model'

// 6 m simply supported beam (pin n1, roller n3), mid node n2.
const SEC = { id: 's1', name: 'T', E: 200000, I33: 80e6, A: 5000, gamma: 0 }
const beam = (loads: StructureModel['loads']): StructureModel => ({
  nodes: {
    n1: { id: 'n1', x: 0, y: 0 },
    n2: { id: 'n2', x: 3, y: 0 },
    n3: { id: 'n3', x: 6, y: 0 },
  },
  members: {
    m1: { id: 'm1', a: 'n1', b: 'n2', section: 's1' },
    m2: { id: 'm2', a: 'n2', b: 'n3', section: 's1' },
  },
  supports: { n1: { nodeId: 'n1', type: 'pin' }, n3: { nodeId: 'n3', type: 'roller' } },
  sections: { s1: SEC },
  loads,
})
const pt = (id: string, loadCaseId: string, fy: number, nodeId = 'n2') => ({
  id, type: 'point' as const, nodeId, loadCaseId, fx: 0, fy,
})
const cases = (patch: Record<string, Partial<LoadCase>> = {}) => {
  const rec = DEFAULT_LOAD_CASES()
  // DEFAULT_LOAD_CASES ships only selfweight + dead; the tests need a live case.
  rec['live'] = { id: 'live', name: 'Beban Hidup', kind: 'Live', enabled: true }
  for (const [id, p] of Object.entries(patch)) if (rec[id]) Object.assign(rec[id], p)
  return rec
}
const combo = (id: string, terms: { factor: number; caseId: string }[]): LoadCombination => ({
  id, name: id, terms, source: 'custom', enabled: true,
})

const LOADS = { d1: pt('d1', 'dead', -10), l1: pt('l1', 'live', -20) }

describe('R-03/A — combination integrity', () => {
  it('complete valid combination: no drops, exact superposition', () => {
    const lc = cases()
    const res = solveAllCases(beam(LOADS), lc)
    const out = combineResults(res, combo('K', [
      { factor: 1.2, caseId: 'dead' }, { factor: 1.6, caseId: 'live' },
    ]), lc)
    expect(out).not.toBeNull()
    expect(out!.combination.complete).toBe(true)
    expect(out!.combination.droppedTerms).toEqual([])
    // Ry at n1 = 1.2·(10/2) + 1.6·(20/2) = 6 + 16 = 22 kN (exact superposition)
    expect(out!.reactions['n1'].Ry).toBeCloseTo(22, 9)
  })

  it('missing case: term dropped with reason "missing", partial result kept and marked', () => {
    const lc = cases()
    const res = solveAllCases(beam(LOADS), lc)
    const out = combineResults(res, combo('K', [
      { factor: 1.2, caseId: 'dead' }, { factor: 1.0, caseId: 'wind' },
    ]), lc)
    expect(out).not.toBeNull()
    expect(out!.combination.complete).toBe(false)
    expect(out!.combination.droppedTerms).toEqual([
      { caseId: 'wind', factor: 1.0, reason: 'missing' },
    ])
    // Only the dead term contributes: Ry = 1.2·5 = 6 kN — the value itself is
    // honest; the audit is what stops it being read as the full combination.
    expect(out!.reactions['n1'].Ry).toBeCloseTo(6, 9)
  })

  it('disabled case: term dropped with reason "disabled" (distinct from missing)', () => {
    const lc = cases({ wind: { id: 'wind', name: 'Angin', kind: 'Wind', enabled: false } })
    lc['wind'] = { id: 'wind', name: 'Angin', kind: 'Wind', enabled: false }
    const res = solveAllCases(beam(LOADS), lc)
    expect(res['wind']).toBeUndefined() // disabled cases are never solved
    const out = combineResults(res, combo('K', [
      { factor: 1.2, caseId: 'dead' }, { factor: 1.0, caseId: 'wind' },
    ]), lc)
    expect(out!.combination.droppedTerms).toEqual([
      { caseId: 'wind', factor: 1.0, reason: 'disabled' },
    ])
  })

  it('failed case: term dropped with reason "failed" and the solver reason verbatim', () => {
    const failed: SolverResult = { ok: false, reason: 'Load l1 references missing node "ghost"' }
    const lc = cases()
    const res = { ...solveAllCases(beam(LOADS), lc), live: failed }
    const out = combineResults(res, combo('K', [
      { factor: 1.2, caseId: 'dead' }, { factor: 1.6, caseId: 'live' },
    ]), lc)
    expect(out!.combination.complete).toBe(false)
    expect(out!.combination.droppedTerms).toEqual([
      {
        caseId: 'live', factor: 1.6, reason: 'failed',
        failureReason: 'Load l1 references missing node "ghost"',
      },
    ])
  })

  it('multiple omitted terms: every one is listed', () => {
    const lc = cases()
    const res = solveAllCases(beam(LOADS), lc)
    const out = combineResults(res, combo('K', [
      { factor: 1.2, caseId: 'dead' },
      { factor: 1.0, caseId: 'wind' },
      { factor: 0.9, caseId: 'quake' },
    ]), lc)
    expect(out!.combination.droppedTerms.map((t) => t.caseId)).toEqual(['wind', 'quake'])
    expect(out!.combination.complete).toBe(false)
  })

  it('all terms omitted: result is null, audit still names every dropped term', () => {
    const lc = cases()
    const res = solveAllCases(beam(LOADS), lc)
    const c = combo('K', [
      { factor: 1.0, caseId: 'wind' }, { factor: 1.0, caseId: 'quake' },
    ])
    expect(combineResults(res, c, lc)).toBeNull()
    const audit = auditCombination(res, c, lc)
    expect(audit.complete).toBe(false)
    expect(audit.droppedTerms).toHaveLength(2)
    expect(audit.comboId).toBe('K')
  })

  it('no terms: result is null; audit reports nothing dropped', () => {
    const lc = cases()
    const res = solveAllCases(beam(LOADS), lc)
    const c = combo('KOSONG', [])
    expect(combineResults(res, c, lc)).toBeNull()
    expect(auditCombination(res, c, lc)).toEqual({
      comboId: 'KOSONG', complete: true, droppedTerms: [],
    })
  })

  it('failed-only combination returns null (Cycle-20 behaviour preserved)', () => {
    const lc = cases()
    const res = solveAllCases(beam({ g1: pt('g1', 'live', -5, 'ghost') }), lc)
    expect(res['live'].ok).toBe(false)
    expect(combineResults(res, combo('K', [{ factor: 1.0, caseId: 'live' }]), lc)).toBeNull()
  })
})

describe('R-03/A — design never consumes a partial combination silently', () => {
  const rcSection = buildParametricSection({
    id: 'beton', name: 'B 300x500', materialClass: 'concrete', shape: 'rect',
    dims: { b: 300, h: 500 }, strength: { fc: 25 },
  })
  const rcBeam = (loads: StructureModel['loads']): StructureModel => ({
    ...beam(loads),
    sections: { s1: { ...rcSection, id: 's1' } },
  })

  it('partial combo → incompleteCombos names it, issues announce it, members flagged', () => {
    const lc = cases()
    lc['wind'] = { id: 'wind', name: 'Angin', kind: 'Wind', enabled: false }
    const model = rcBeam(LOADS)
    const caseResults = solveAllCases(model, lc)
    const run = designFromCases(caseResults, {
      model, loadCases: lc,
      combinations: {
        k1: { id: 'k1', name: '1.2D + 1.0W', source: 'custom', enabled: true, terms: [
          { factor: 1.2, caseId: 'dead' }, { factor: 1.0, caseId: 'wind' },
        ] },
      },
      criteria: defaultDesignCriteria(),
      inputs: {},
    })
    expect(run.ok).toBe(true)
    expect(run.incompleteCombos).toHaveLength(1)
    expect(run.incompleteCombos![0].comboId).toBe('k1')
    expect(run.incompleteCombos![0].droppedTerms[0]).toMatchObject({ caseId: 'wind', reason: 'disabled' })
    expect(run.issues.some((s) => s.includes('1.2D + 1.0W') && s.includes('TIDAK LENGKAP'))).toBe(true)
    const designed = Object.values(run.members).filter((m) => m.status === 'designed')
    expect(designed.length).toBeGreaterThan(0)
    for (const m of designed) expect(m.demandsIncomplete).toBe(true)
  })

  it('complete combo → no incomplete markers anywhere', () => {
    const lc = cases()
    const model = rcBeam(LOADS)
    const caseResults = solveAllCases(model, lc)
    const run = designFromCases(caseResults, {
      model, loadCases: lc,
      combinations: {
        k1: { id: 'k1', name: '1.2D + 1.6L', source: 'custom', enabled: true, terms: [
          { factor: 1.2, caseId: 'dead' }, { factor: 1.6, caseId: 'live' },
        ] },
      },
      criteria: defaultDesignCriteria(),
      inputs: {},
    })
    expect(run.incompleteCombos).toEqual([])
    for (const m of Object.values(run.members)) expect(m.demandsIncomplete).toBeUndefined()
  })
})
