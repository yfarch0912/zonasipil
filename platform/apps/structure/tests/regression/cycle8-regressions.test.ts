/**
 * Regression tests for Audit Cycle 8 findings (docs/AUDIT_CYCLE.md):
 *  C8-F1 deleting a load case stranded its loads as orphans: the deleted
 *        case's loads stayed in model.loads, were silently excluded from
 *        every analysis solveAllCases can display (it iterates cases, not
 *        loads), yet remained solvable if addressed by the deleted id
 *        directly — with no warning anywhere. handleDeleteLoadCase trimmed
 *        combinations but never touched loads. Now the delete cascades into
 *        loads, and runDiagnostics warns about orphans arriving via imported
 *        or saved files.
 */
import { describe, it, expect } from 'vitest'
import { findOrphanedLoadIds, removeLoadsOfCase, type LoadCase } from '@/engine/load-cases'
import { runDiagnostics } from '@/engine/analysis-diagnostics'
import { solveAllCases } from '@/engine/analysis-pipeline'
import type { StructureModel, Section } from '@/engine/model'

const SEC: Section = { id: 's1', name: 'T', E: 200000, I33: 80e6, A: 5000 }
// 2-member beam, pin n1 + roller n3, central node n2 carries both point loads.
const beam = (loads: StructureModel['loads']): StructureModel => ({
  nodes: { n1: { id: 'n1', x: 0, y: 0 }, n2: { id: 'n2', x: 3, y: 0 }, n3: { id: 'n3', x: 6, y: 0 } },
  members: {
    m1: { id: 'm1', a: 'n1', b: 'n2', section: 's1' },
    m2: { id: 'm2', a: 'n2', b: 'n3', section: 's1' },
  },
  supports: { n1: { nodeId: 'n1', type: 'pin' }, n3: { nodeId: 'n3', type: 'roller' } },
  sections: { s1: SEC },
  loads,
})
const point = (id: string, loadCaseId: string) => ({
  id, type: 'point' as const, nodeId: 'n2', loadCaseId, fx: 0, fy: -12,
})
const CASES: Record<string, LoadCase> = {
  dead: { id: 'dead', name: 'Dead', kind: 'Dead', enabled: true },
  live: { id: 'live', name: 'Live', kind: 'Live', enabled: true },
}

describe('C8-F1 — case-delete cascade into loads', () => {
  it('removeLoadsOfCase drops only the deleted case\'s loads', () => {
    const loads = { pDead: point('pDead', 'dead'), pWind: point('pWind', 'wind'), pLive: point('pLive', 'live') }
    const out = removeLoadsOfCase(loads, 'wind')
    expect(Object.keys(out).sort()).toEqual(['pDead', 'pLive'])
    // Pure: input untouched.
    expect(Object.keys(loads).sort()).toEqual(['pDead', 'pLive', 'pWind'])
  })
  it('removeLoadsOfCase is a no-op for an unknown case id', () => {
    const loads = { pDead: point('pDead', 'dead') }
    expect(Object.keys(removeLoadsOfCase(loads, 'nope'))).toEqual(['pDead'])
  })
  it('findOrphanedLoadIds names loads whose case no longer exists', () => {
    const loads = { pDead: point('pDead', 'dead'), pWind: point('pWind', 'wind') }
    expect(findOrphanedLoadIds(loads, CASES)).toEqual(['pWind'])
  })
  it('a disabled-but-existing case does NOT orphan its loads', () => {
    const loads = { pLive: point('pLive', 'live') }
    const cases = { ...CASES, live: { ...CASES['live'], enabled: false } }
    expect(findOrphanedLoadIds(loads, cases)).toEqual([])
  })
  it('runDiagnostics warns about orphans when given the case record', () => {
    const report = runDiagnostics(
      beam({ pDead: point('pDead', 'dead'), pWind: point('pWind', 'wind') }),
      CASES,
    )
    const orphan = report.issues.find((i) => i.kind === 'orphaned-loads')
    expect(orphan).toBeDefined()
    if (orphan && orphan.kind === 'orphaned-loads') {
      expect(orphan.severity).toBe('warning')
      expect(orphan.loadIds).toEqual(['pWind'])
    }
  })
  it('runDiagnostics stays silent without orphans, and without a case record (back-compat)', () => {
    const clean = beam({ pDead: point('pDead', 'dead') })
    expect(runDiagnostics(clean, CASES).issues.some((i) => i.kind === 'orphaned-loads')).toBe(false)
    const orphanModel = beam({ pWind: point('pWind', 'wind') })
    expect(runDiagnostics(orphanModel).issues.some((i) => i.kind === 'orphaned-loads')).toBe(false)
  })
  it('pipeline documents the exclusion the warning now guards: orphan contributes to no case', () => {
    const results = solveAllCases(
      beam({ pDead: point('pDead', 'dead'), pWind: point('pWind', 'wind') }),
      CASES,
    )
    expect(Object.keys(results).sort()).toEqual(['dead', 'live'])
    const dead = results['dead']
    expect(dead.ok).toBe(true)
    if (dead.ok) {
      // Only the dead 12 kN: 6 kN per end. If the orphan leaked in, 12 per end.
      expect(dead.reactions['n1'].Ry).toBeCloseTo(6, 6)
      expect(dead.reactions['n3'].Ry).toBeCloseTo(6, 6)
    }
  })
})
