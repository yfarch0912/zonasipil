/**
 * Regression tests for Audit Cycle 22 (fix of C19-F1, docs/AUDIT_CYCLE.md):
 *  A user load tagged `loadCaseId: "selfweight"` was silently dropped:
 *  solveCase("selfweight") REPLACES the model's whole load record with
 *  synthesized γ·A body forces, so such a load (reachable only via imported
 *  / hand-edited project files — the editor locks the selfweight case out
 *  of the load tools) contributed nothing to the case solve or to the
 *  one-click report, with ok:true and no diagnostic naming it.
 *
 *  Fix (diagnostics layer, Cycle-8 orphan pattern extended to the locked
 *  case): runDiagnostics now emits a "selfweight-case-loads" warning naming
 *  the affected load ids, which flows through the same merged diagnostics
 *  the status bar and issues dialog display. The loads are NOT folded into
 *  the synthesized slice (the selfweight case is body force only, by
 *  definition), NOT reassigned, and NOT deleted — the solve behaviour is
 *  deliberately unchanged; only the silence is removed.
 */
import { describe, it, expect } from 'vitest'
import {
  DEFAULT_LOAD_CASES,
  findSelfweightCaseLoadIds,
  type LoadCase,
} from '@/engine/load-cases'
import { runDiagnostics } from '@/engine/analysis-diagnostics'
import { solveCase } from '@/engine/analysis-pipeline'
import {
  exportProjectJSON,
  importProjectJSON,
  modelFingerprint,
  newProjectMeta,
  type StoredProject,
} from '@/struktura/projects'
import type { StructureModel, Section } from '@/engine/model'

// Same probe model as Cycle 19: 6 m simply supported beam (pin n1 + roller
// n3), section γ = 78.5 kN/m³, A = 5000 mm² → synthesized w = γ·A = 0.3925
// kN/m → total 2.355 kN → Ry = 1.1775 kN per end.
const SEC: Section = { id: 's1', name: 'T', E: 200000, I33: 80e6, A: 5000, gamma: 78.5 }
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

describe('C19-F1 — selfweight-tagged user loads are named in diagnostics', () => {
  it('findSelfweightCaseLoadIds names only selfweight-tagged loads', () => {
    const loads = {
      pDead: point('pDead', 'dead'),
      pSw: point('pSw', 'selfweight'),
      pLive: point('pLive', 'live'),
    }
    expect(findSelfweightCaseLoadIds(loads)).toEqual(['pSw'])
    expect(findSelfweightCaseLoadIds({ pDead: point('pDead', 'dead') })).toEqual([])
    expect(findSelfweightCaseLoadIds({})).toEqual([])
  })

  it('(a) runDiagnostics warns, naming the dropped load id', () => {
    const report = runDiagnostics(
      beam({ pDead: point('pDead', 'dead'), pSw: point('pSw', 'selfweight') }),
      DEFAULT_LOAD_CASES(),
    )
    const issue = report.issues.find((i) => i.kind === 'selfweight-case-loads')
    expect(issue).toBeDefined()
    if (issue && issue.kind === 'selfweight-case-loads') {
      expect(issue.severity).toBe('warning')
      expect(issue.loadIds).toEqual(['pSw'])
    }
  })

  it('(a) the warning does not fabricate an error: status and other cases unaffected', () => {
    const report = runDiagnostics(
      beam({ pSw: point('pSw', 'selfweight') }),
      DEFAULT_LOAD_CASES(),
    )
    expect(report.issues.some((i) => i.severity === 'error')).toBe(false)
    // 3m + r = 3·2 + 3 = 9 = 3j → determinate, exactly as without the load.
    expect(report.status).toBe('determinate')
  })

  it('(b) a normal model produces NO selfweight-case-loads issue', () => {
    const cases = DEFAULT_LOAD_CASES()
    const normal = beam({ pDead: point('pDead', 'dead') })
    expect(runDiagnostics(normal, cases).issues.some((i) => i.kind === 'selfweight-case-loads')).toBe(false)
    // Selfweight case present but no loads at all: still silent.
    expect(runDiagnostics(beam({}), cases).issues.some((i) => i.kind === 'selfweight-case-loads')).toBe(false)
    // Back-compat: without a case record the check stays off (Cycle-8 contract).
    const tagged = beam({ pSw: point('pSw', 'selfweight') })
    expect(runDiagnostics(tagged).issues.some((i) => i.kind === 'selfweight-case-loads')).toBe(false)
  })

  it('(b) when the selfweight case is absent, the load is an orphan — not double-reported', () => {
    const noSw: Record<string, LoadCase> = {
      dead: { id: 'dead', name: 'Dead', kind: 'Dead', enabled: true },
    }
    const report = runDiagnostics(beam({ pSw: point('pSw', 'selfweight') }), noSw)
    expect(report.issues.some((i) => i.kind === 'selfweight-case-loads')).toBe(false)
    const orphan = report.issues.find((i) => i.kind === 'orphaned-loads')
    expect(orphan).toBeDefined()
    if (orphan && orphan.kind === 'orphaned-loads') {
      expect(orphan.loadIds).toEqual(['pSw'])
    }
  })

  it('(c) synthesized selfweight behaviour is unchanged (γ·A exact), tagged load still excluded BY DESIGN', () => {
    const bare = solveCase(beam({}), 'selfweight')
    expect(bare.ok).toBe(true)
    if (bare.ok) {
      expect(bare.reactions['n1'].Ry).toBeCloseTo(1.1775, 6)
      expect(bare.reactions['n3'].Ry).toBeCloseTo(1.1775, 6)
    }
    // With the −12 kN load tagged "selfweight": identical reactions. The
    // drop itself is the case's definition (body force only) — Cycle 22
    // removes the SILENCE via the diagnostic above, not the semantics.
    const withTagged = solveCase(beam({ pSw: point('pSw', 'selfweight') }), 'selfweight')
    expect(withTagged.ok).toBe(true)
    if (withTagged.ok && bare.ok) {
      expect(withTagged.reactions).toEqual(bare.reactions)
    }
  })

  it('(c) control: the same load tagged "dead" solves normally (drop is selfweight-slice specific)', () => {
    const dead = solveCase(beam({ pDead: point('pDead', 'dead') }), 'dead')
    expect(dead.ok).toBe(true)
    if (dead.ok) {
      expect(dead.reactions['n1'].Ry).toBeCloseTo(6, 6)
      expect(dead.reactions['n3'].Ry).toBeCloseTo(6, 6)
    }
  })

  it('(d) import path: a project file carrying a selfweight-tagged load surfaces the warning after import', () => {
    const model = beam({ pSw: point('pSw', 'selfweight') })
    const p: StoredProject = {
      meta: newProjectMeta('Imported SW load'),
      model,
      fingerprint: modelFingerprint(model),
    }
    const back = importProjectJSON(exportProjectJSON(p))
    // The imported model is loaded into App state, whose live case record is
    // DEFAULT_LOAD_CASES() — exactly what runDiagnostics receives there.
    const report = runDiagnostics(back.model, DEFAULT_LOAD_CASES())
    const issue = report.issues.find((i) => i.kind === 'selfweight-case-loads')
    expect(issue).toBeDefined()
    if (issue && issue.kind === 'selfweight-case-loads') {
      expect(issue.loadIds).toEqual(['pSw'])
    }
  })
})
