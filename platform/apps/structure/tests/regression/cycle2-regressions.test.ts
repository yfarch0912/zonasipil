/**
 * Regression tests for Audit Cycle 2 findings (docs/AUDIT_CYCLE.md):
 *  C2-F1 solver silently ignored loads/members with dangling references —
 *        now a hard, named error. Plus the full §19 portal-frame workflow
 *        exercised at module level (model → analyze → diagrams → service
 *        result → report → save → reload → fingerprint equality).
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { analyze, memberInternalForces } from '@/engine/solver'
import type { StructureModel, Section } from '@/engine/model'
import { SAMPLES } from '@/struktura/samples'
import { serviceResult } from '@/struktura/service-result'
import { generateReportHTML } from '@/struktura/report'
import {
  saveProject, getProject, newProjectMeta, modelFingerprint, stableStringify,
} from '@/struktura/projects'

const SEC: Section = { id: 's1', name: 'T', E: 200000, I33: 80e6, A: 5000 }
function model(p: Partial<StructureModel>): StructureModel {
  return { nodes: {}, members: {}, supports: {}, sections: { s1: SEC }, loads: {}, ...p }
}
const beam = (extra: Partial<StructureModel>): StructureModel =>
  model({
    nodes: { n1: { id: 'n1', x: 0, y: 0 }, n2: { id: 'n2', x: 3, y: 0 } },
    members: { m1: { id: 'm1', a: 'n1', b: 'n2', section: 's1' } },
    supports: { n1: { nodeId: 'n1', type: 'fixed' } },
    ...extra,
  })

describe('C2-F1 — dangling references are named errors, never silent zeros', () => {
  it('point load on a missing node', () => {
    const r = analyze(beam({
      loads: { l1: { id: 'l1', type: 'point', nodeId: 'ghost', loadCaseId: 'dead', fx: 0, fy: -5 } },
    }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/missing node "ghost"/)
  })
  it('distributed load on a missing member', () => {
    const r = analyze(beam({
      loads: { l1: { id: 'l1', type: 'distributed', memberId: 'ghost', loadCaseId: 'dead', wStart: -5, wEnd: -5 } },
    }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/missing member "ghost"/)
  })
  it('member with a missing section', () => {
    const r = analyze(beam({
      members: { m1: { id: 'm1', a: 'n1', b: 'n2', section: 'nope' } },
    }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/missing section "nope"/)
  })
  it('zero-length member', () => {
    const r = analyze(beam({
      nodes: { n1: { id: 'n1', x: 1, y: 1 }, n2: { id: 'n2', x: 1, y: 1 } },
    }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/zero length/)
  })
  it('support on a missing node', () => {
    const r = analyze(beam({ supports: { gx: { nodeId: 'gx', type: 'pin' } } }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/Support references missing node/)
  })
  it('valid model still solves (guard has no false positives)', () => {
    const r = analyze(beam({
      loads: { l1: { id: 'l1', type: 'point', nodeId: 'n2', loadCaseId: 'dead', fx: 0, fy: -5 } },
    }))
    expect(r.ok).toBe(true)
  })
})

class LocalStorageStub {
  private m = new Map<string, string>()
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null }
  setItem(k: string, v: string) { this.m.set(k, String(v)) }
  removeItem(k: string) { this.m.delete(k) }
  clear() { this.m.clear() }
}

describe('§19 workflow — portal frame end-to-end (module level)', () => {
  beforeEach(() => {
    ;(globalThis as { localStorage?: unknown }).localStorage = new LocalStorageStub()
  })
  const portal = SAMPLES.find((s) => s.id === '06-portal-2')!

  it('model → analyze → diagrams → report → save → reload, fingerprint stable', () => {
    const m = portal.build()
    // analyze
    const r = analyze(m)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    // diagrams come from the same interpolation the renderer uses
    for (const mem of Object.values(m.members)) {
      const ef = r.memberEndForces[mem.id]
      const a = m.nodes[mem.a], b = m.nodes[mem.b]
      const L = Math.hypot(b.x - a.x, b.y - a.y)
      for (const x of [0, L / 2, L]) {
        const f = memberInternalForces(ef, x, L)
        expect(Number.isFinite(f.N + f.V + f.M)).toBe(true)
      }
    }
    // service result + report contain real numbers
    const svc = serviceResult(m)
    expect(svc.ok).toBe(true)
    if (!svc.ok) return
    const meta = newProjectMeta('Portal Workflow')
    const html = generateReportHTML(meta, m, svc.result)
    expect(html).toContain(modelFingerprint(m))
    expect(html).toContain('Portal Workflow')
    // save → simulate reload via JSON round-trip → fingerprint must not change
    const stored = saveProject(meta, m)
    const reloaded = JSON.parse(stableStringify(getProject(meta.id)!.model)) as StructureModel
    expect(modelFingerprint(reloaded)).toBe(stored.fingerprint)
    const r2 = analyze(reloaded)
    expect(r2.ok).toBe(true)
  })

  it('editing the model after analysis changes the fingerprint (stale detection)', () => {
    const m = portal.build()
    const before = modelFingerprint(m)
    const edited = portal.build()
    const firstNode = Object.values(edited.nodes)[0]
    firstNode.x += 0.5
    expect(modelFingerprint(edited)).not.toBe(before)
  })
})
