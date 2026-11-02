/**
 * Sprint 2 — P5: integration coverage over the REAL application flow.
 *
 * The repository has no browser-E2E layer (Vitest runs in node), and this
 * file does NOT pretend otherwise. What it does is drive the exact
 * pipeline the app wires in App.tsx / StrukturaRoot.tsx, end to end, at
 * the module level:
 *
 *   build model → runDiagnostics → solveAllCases
 *     → mergeSolverFailures + mergeShearFallbacks + mergeNumericalDiagnostics
 *     → auditCombination / combineResults / envelopeResults
 *     → designFromCases (with Sprint 2 verdicts)
 *     → serviceResult → generateReportHTML
 *
 * plus SSR markup of the real issues dialog for the near-singular case
 * (the strongest visibility evidence available without a DOM — the same
 * standard Sprint 1 set, and still not a substitute for browser E2E).
 *
 * Scenarios: happy path, failed case, disabled case, missing combo term,
 * incomplete gravity combo (also P3), Timoshenko fallback, unverified
 * seismic, near-singular result, unsupported member.
 */
import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  runDiagnostics,
  mergeSolverFailures,
  mergeShearFallbacks,
  mergeNumericalDiagnostics,
  type DiagnosticsReport,
} from '@/engine/analysis-diagnostics'
import {
  solveAllCases,
  auditCombination,
  combineResults,
  envelopeResults,
} from '@/engine/analysis-pipeline'
import { DEFAULT_LOAD_CASES, type LoadCase, type LoadCombination } from '@/engine/load-cases'
import { designFromCases } from '@/engine/design/core/run-design'
import { defaultDesignCriteria } from '@/engine/design/core/criteria'
import { analysisVerdict } from '@/engine/design/core/verdict'
import { buildParametricSection } from '@/engine/sections/compute'
import { serviceResult } from '@/struktura/service-result'
import { generateReportHTML } from '@/struktura/report'
import { AnalysisIssuesDialog } from '@/components/analysis-issues-dialog'
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
const WIND_OFF: LoadCase = { id: 'wind', name: 'Angin', kind: 'Wind', enabled: false }
const combo = (id: string, name: string, terms: { factor: number; caseId: string }[]): LoadCombination => ({
  id, name, terms, source: 'custom', enabled: true,
})
const cases = (extra: Record<string, LoadCase> = {}) => ({ ...DEFAULT_LOAD_CASES(), ...extra })

/** The exact merge chain App.tsx applies to diagnostics. */
function mergedReport(model: StructureModel, lc: Record<string, LoadCase>, opts?: { shearDeformation?: boolean }): {
  report: DiagnosticsReport
  caseResults: ReturnType<typeof solveAllCases>
} {
  const caseResults = solveAllCases(model, lc, opts)
  const solverResults = Object.values(caseResults)
  const report = mergeNumericalDiagnostics(
    mergeShearFallbacks(
      mergeSolverFailures(runDiagnostics(model, lc), solverResults, Object.keys(model.nodes)),
      solverResults,
    ),
    solverResults,
  )
  return { report, caseResults }
}

const rcSection = buildParametricSection({
  id: 'beton', name: 'B 300x500', materialClass: 'concrete', shape: 'rect',
  dims: { b: 300, h: 500 }, strength: { fc: 25 },
})

describe('P5 — happy path, full flow', () => {
  it('model → diagnostics → solve → combine → design verdicts → service report', () => {
    const lc = cases({ live: LIVE })
    const model = beam(
      { d1: pt('d1', 'dead', -10), l1: pt('l1', 'live', -20) },
      { s1: { ...rcSection, id: 's1' } },
    )
    const { report, caseResults } = mergedReport(model, lc)
    expect(report.status).not.toBe('unstable')
    expect(report.issues.filter((i) => i.severity === 'error')).toEqual([])
    for (const r of Object.values(caseResults)) {
      expect(r.ok).toBe(true)
      if (r.ok) expect(analysisVerdict(r.numerical.classification).status).toBe('PASS')
    }
    const k1 = combo('k1', '1.2D + 1.6L', [{ factor: 1.2, caseId: 'dead' }, { factor: 1.6, caseId: 'live' }])
    expect(auditCombination(caseResults, k1, lc).complete).toBe(true)
    const combined = combineResults(caseResults, k1, lc)
    expect(combined!.numerical.classification).toBe('VALID')
    const env = envelopeResults({ k1: combined }, ['k1'], { k1 })
    expect(env!.incompleteSourceCombos).toBeUndefined()

    const run = designFromCases(caseResults, {
      model, loadCases: lc, combinations: { k1 }, criteria: defaultDesignCriteria(), inputs: {},
    })
    expect(run.ok).toBe(true)
    expect(run.verdict).toBeDefined()
    for (const m of Object.values(run.members)) expect(m.verdict).toBeDefined()

    const svc = serviceResult(model)
    expect(svc.ok).toBe(true)
    if (!svc.ok) throw new Error(svc.reason)
    expect(svc.warnings).toEqual([])
    const html = generateReportHTML(null, model, svc.result, new Date(), { warnings: svc.warnings })
    expect(html).toContain('Analisis selesai dengan sukses untuk model')
  })
})

describe('P5 — failure-path scenarios through the full flow', () => {
  it('failed load case: diagnostics error, design names it, verdict INCOMPLETE', () => {
    const lc = cases({ live: LIVE })
    const model = beam({ d1: pt('d1', 'dead', -10), g1: pt('g1', 'live', -5, 'ghost') })
    const { report, caseResults } = mergedReport(model, lc)
    expect(report.status).toBe('unstable')
    expect(report.issues.some((i) => i.kind === 'solver-failure')).toBe(true)
    const run = designFromCases(caseResults, {
      model, loadCases: lc,
      combinations: { k1: combo('k1', '1.2D', [{ factor: 1.2, caseId: 'dead' }]) },
      criteria: defaultDesignCriteria(), inputs: {},
    })
    expect(run.failedCases).toHaveLength(1)
    expect(run.verdict!.status).toBe('INCOMPLETE')
  })

  it('disabled case in a combination: audit names it, combined result partial, design INCOMPLETE', () => {
    const lc = cases({ wind: WIND_OFF })
    const model = beam({ d1: pt('d1', 'dead', -10) }, { s1: { ...rcSection, id: 's1' } })
    const { caseResults } = mergedReport(model, lc)
    const k = combo('k', '1.2D + 1.0W', [{ factor: 1.2, caseId: 'dead' }, { factor: 1.0, caseId: 'wind' }])
    const audit = auditCombination(caseResults, k, lc)
    expect(audit.complete).toBe(false)
    expect(audit.droppedTerms[0]).toMatchObject({ caseId: 'wind', reason: 'disabled' })
    const run = designFromCases(caseResults, {
      model, loadCases: lc, combinations: { k }, criteria: defaultDesignCriteria(), inputs: {},
    })
    expect(run.incompleteCombos).toHaveLength(1)
    expect(run.verdict!.status).toBe('INCOMPLETE')
  })

  it('missing combination term (unknown case id): audit reason "missing"', () => {
    const lc = cases()
    const model = beam({ d1: pt('d1', 'dead', -10) })
    const { caseResults } = mergedReport(model, lc)
    const k = combo('k', '1.2D + 1.0Q', [{ factor: 1.2, caseId: 'dead' }, { factor: 1.0, caseId: 'quake' }])
    const audit = auditCombination(caseResults, k, lc)
    expect(audit.droppedTerms).toEqual([{ caseId: 'quake', factor: 1.0, reason: 'missing' }])
    const combined = combineResults(caseResults, k, lc)
    expect(combined!.combination.complete).toBe(false)
  })

  it('Timoshenko fallback: warning merged into diagnostics and carried by combinations', () => {
    const lc = cases()
    const model = beam({ u1: udl('u1', 'm1', 'dead', -10), u2: udl('u2', 'm2', 'dead', -10) })
    const { report, caseResults } = mergedReport(model, lc, { shearDeformation: true })
    const issue = report.issues.find((i) => i.kind === 'shear-fallback')
    expect(issue).toBeDefined()
    if (issue?.kind === 'shear-fallback') {
      expect(issue.members.map((m) => m.memberId).sort()).toEqual(['m1', 'm2'])
    }
    const combined = combineResults(caseResults, combo('k', '1.0D', [{ factor: 1, caseId: 'dead' }]), lc)
    expect(combined!.shearFallbackMembers).toHaveLength(2)
  })

  it('unsupported member: plain section designs nothing — member + run verdict UNSUPPORTED', () => {
    const lc = cases({ live: LIVE })
    const model = beam({ d1: pt('d1', 'dead', -10), l1: pt('l1', 'live', -20) })
    const { caseResults } = mergedReport(model, lc)
    const run = designFromCases(caseResults, {
      model, loadCases: lc,
      combinations: { k1: combo('k1', '1.2D + 1.6L', [{ factor: 1.2, caseId: 'dead' }, { factor: 1.6, caseId: 'live' }]) },
      criteria: defaultDesignCriteria(), inputs: {},
    })
    const statuses = Object.values(run.members).map((m) => m.verdict!.status)
    expect(statuses.length).toBeGreaterThan(0)
    expect(statuses.every((s) => s === 'UNSUPPORTED')).toBe(true)
    expect(run.verdict!.status).toBe('UNSUPPORTED')
  })
})

describe('P5 — unverified seismic through the full flow', () => {
  it('steel IMF member: seismic present + unverified, member verdict capped at UNVERIFIED', () => {
    const section = buildParametricSection({
      id: 'iwf', name: 'IWF 200', materialClass: 'steel', shape: 'iwf',
      dims: { b: 200, h: 200, tf: 12, tw: 8 }, strength: { fy: 250, fu: 410, E: 200000 },
    })
    const model: StructureModel = {
      nodes: {
        n1: { id: 'n1', x: 0, y: 0 }, n2: { id: 'n2', x: 3, y: 0 }, n3: { id: 'n3', x: 6, y: 0 },
      },
      members: {
        m1: { id: 'm1', a: 'n1', b: 'n2', section: 'iwf' },
        m2: { id: 'm2', a: 'n2', b: 'n3', section: 'iwf' },
      },
      supports: { n1: { nodeId: 'n1', type: 'pin' }, n3: { nodeId: 'n3', type: 'roller' } },
      sections: { iwf: section },
      loads: { d1: pt('d1', 'dead', -30) },
    }
    const lc = cases()
    const criteria = defaultDesignCriteria()
    criteria.steel.frameType = 'IMF'
    const run = designFromCases(solveAllCases(model, lc), {
      model, loadCases: lc,
      combinations: { k1: combo('k1', '1.2D', [{ factor: 1.2, caseId: 'dead' }]) },
      criteria, inputs: {},
    })
    const designed = Object.values(run.members).filter((m) => m.status === 'designed')
    expect(designed.length).toBeGreaterThan(0)
    for (const m of designed) {
      expect(m.steel!.seismic!.verification).toBe('unverified')
      // PASS is impossible while a governing channel is UNVERIFIED —
      // the member is UNVERIFIED (or FAIL if a channel failed).
      expect(['UNVERIFIED', 'FAIL']).toContain(m.verdict!.status)
    }
    expect(run.verdict!.status).not.toBe('PASS')
  })
})

describe('P5 — near-singular result through the full flow', () => {
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

  it('diagnostics error + unstable status; dialog SSR shows PHYSICALLY_IMPLAUSIBLE; report qualified', () => {
    const model = B12()
    const lc = cases()
    const { report, caseResults } = mergedReport(model, lc)
    expect(report.status).toBe('unstable')
    const issue = report.issues.find((i) => i.kind === 'numerical-reliability')
    expect(issue?.severity).toBe('error')
    const dead = caseResults['dead']
    expect(dead.ok).toBe(true)
    if (dead.ok) expect(analysisVerdict(dead.numerical.classification).status).toBe('FAIL')

    const html = renderToStaticMarkup(createElement(AnalysisIssuesDialog, {
      open: true, onClose: () => {}, report,
    }))
    expect(html).toContain('PHYSICALLY_IMPLAUSIBLE')
    expect(html).toContain('TIDAK boleh dibaca sebagai terverifikasi')

    const svc = serviceResult(model)
    expect(svc.ok).toBe(true)
    if (!svc.ok) throw new Error(svc.reason)
    const docHtml = generateReportHTML(null, model, svc.result, new Date(), { warnings: svc.warnings })
    expect(docHtml).toContain('DENGAN PERINGATAN INTEGRITAS')
    expect(docHtml).not.toContain('Analisis selesai dengan sukses untuk model')
  })
})
