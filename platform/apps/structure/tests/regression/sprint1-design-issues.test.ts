/**
 * Sprint 1 — R-02: design-stage issues must reach the user.
 *
 * Before this sprint, `designFromCases` collected failed cases, skipped
 * combinations and missing-gravity warnings into `DesignRunResult.issues`,
 * and NO UI component rendered them — the Design tab presented ordinary
 * D/C colours computed from whichever combinations survived.
 *
 * Now the run also carries structured mirrors (`failedCases`,
 * `skippedCombos`, `gravityComboMissing`, …) and the Design tab renders
 * `DesignIssuesPanel`. These tests pin the propagation at the domain level
 * and prove visibility by server-rendering the actual panel component to
 * HTML (the repo has no DOM/e2e test layer — Vitest runs in node — so SSR
 * markup of the real component is the strongest visibility evidence
 * available without new dependencies).
 */
import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { solveAllCases } from '@/engine/analysis-pipeline'
import { DEFAULT_LOAD_CASES, type LoadCase, type LoadCombination } from '@/engine/load-cases'
import { designFromCases } from '@/engine/design/core/run-design'
import { defaultDesignCriteria } from '@/engine/design/core/criteria'
import { DesignIssuesPanel } from '@/components/design-issues-panel'
import { CombinationCompletenessBanner } from '@/components/combination-completeness-banner'
import type { StructureModel } from '@/engine/model'

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
const withCases = (extra: Record<string, LoadCase>) => ({ ...DEFAULT_LOAD_CASES(), ...extra })
const LIVE: LoadCase = { id: 'live', name: 'Beban Hidup', kind: 'Live', enabled: true }
const WIND: LoadCase = { id: 'wind', name: 'Angin', kind: 'Wind', enabled: true }
const combo = (id: string, name: string, terms: { factor: number; caseId: string }[]): LoadCombination => ({
  id, name, terms, source: 'custom', enabled: true,
})

// Live case carries a load on a non-existent node → its slice fails at
// solver entry (Cycle-2 referential check) while the dead case solves.
const GHOST_LOADS = { d1: pt('d1', 'dead', -10), g1: pt('g1', 'live', -5, 'ghost') }

function failedCaseRun() {
  const lc = withCases({ live: LIVE })
  const model = beam(GHOST_LOADS)
  return designFromCases(solveAllCases(model, lc), {
    model, loadCases: lc,
    combinations: {
      kgood: combo('kgood', '1.2D', [{ factor: 1.2, caseId: 'dead' }]),
      kbad: combo('kbad', '1.6L saja', [{ factor: 1.6, caseId: 'live' }]),
    },
    criteria: defaultDesignCriteria(),
    inputs: {},
  })
}

describe('R-02/B — design issue propagation', () => {
  it('failed case: named in failedCases with the solver reason, and in issues', () => {
    const run = failedCaseRun()
    expect(run.failedCases).toHaveLength(1)
    expect(run.failedCases![0].caseId).toBe('live')
    expect(run.failedCases![0].name).toBe('Beban Hidup')
    expect(run.failedCases![0].reason.length).toBeGreaterThan(0)
    expect(run.issues.some((s) => s.includes('Beban Hidup') && s.includes('gagal'))).toBe(true)
  })

  it('skipped combination: combo whose only case failed is named in skippedCombos', () => {
    const run = failedCaseRun()
    expect(run.skippedCombos).toEqual([{ comboId: 'kbad', name: '1.6L saja' }])
    expect(run.issues.some((s) => s.includes('1.6L saja') && s.includes('dilewati'))).toBe(true)
    // The surviving combination still designed — valid independent work is preserved.
    expect(run.ok).toBe(true)
  })

  it('missing internal gravity combo: flagged, Ve-without-Vg warning issued', () => {
    const lc = withCases({ wind: WIND })
    lc['selfweight'] = { ...lc['selfweight'], enabled: false }
    lc['dead'] = { ...lc['dead'], enabled: false }
    const model = beam({ w1: pt('w1', 'wind', -8) })
    const criteria = defaultDesignCriteria()
    criteria.rc.frameType = 'IMF' // gravity combo is built for IMF/SMF
    const run = designFromCases(solveAllCases(model, lc), {
      model, loadCases: lc,
      combinations: { kw: combo('kw', '1.0W', [{ factor: 1.0, caseId: 'wind' }]) },
      criteria,
      inputs: {},
    })
    expect(run.ok).toBe(true)
    expect(run.gravityComboMissing).toBe(true)
    expect(run.issues.some((s) => s.includes('Ve dihitung tanpa Vg'))).toBe(true)
  })

  it('clean run: no structural fields populated', () => {
    const lc = withCases({ live: LIVE })
    const model = beam({ d1: pt('d1', 'dead', -10), l1: pt('l1', 'live', -20) })
    const run = designFromCases(solveAllCases(model, lc), {
      model, loadCases: lc,
      combinations: { k1: combo('k1', '1.2D + 1.6L', [
        { factor: 1.2, caseId: 'dead' }, { factor: 1.6, caseId: 'live' },
      ]) },
      criteria: defaultDesignCriteria(),
      inputs: {},
    })
    expect(run.failedCases).toEqual([])
    expect(run.skippedCombos).toEqual([])
    expect(run.incompleteCombos).toEqual([])
    expect(run.gravityComboMissing).toBe(false)
  })
})

describe('R-02/B — the issues are VISIBLE (SSR of the real components)', () => {
  it('DesignIssuesPanel renders failed case, skipped combo and issue text', () => {
    const html = renderToStaticMarkup(createElement(DesignIssuesPanel, { result: failedCaseRun() }))
    expect(html).toContain('data-testid="design-issues-panel"')
    expect(html).toContain('Masalah desain')
    expect(html).toContain('Beban Hidup')
    expect(html).toContain('1.6L saja')
    expect(html).toContain('gagal diselesaikan')
  })

  it('DesignIssuesPanel renders nothing for a problem-free run', () => {
    const html = renderToStaticMarkup(createElement(DesignIssuesPanel, {
      result: { ok: true, issues: [], members: {} },
    }))
    expect(html).toBe('')
  })

  it('CombinationCompletenessBanner renders dropped terms, and hides when complete', () => {
    const incomplete = renderToStaticMarkup(createElement(CombinationCompletenessBanner, {
      items: [{
        name: '1.2D + 1.0W',
        audit: {
          comboId: 'k1', complete: false,
          droppedTerms: [{ caseId: 'wind', factor: 1.0, reason: 'disabled' as const }],
        },
      }],
    }))
    expect(incomplete).toContain('data-testid="combination-incomplete-banner"')
    expect(incomplete).toContain('wind')
    expect(incomplete).toContain('PARSIAL')

    const complete = renderToStaticMarkup(createElement(CombinationCompletenessBanner, {
      items: [{ name: 'K', audit: { comboId: 'k', complete: true, droppedTerms: [] } }],
    }))
    expect(complete).toBe('')
  })
})
