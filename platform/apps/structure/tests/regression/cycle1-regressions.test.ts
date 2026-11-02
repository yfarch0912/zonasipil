/**
 * Regression tests for Audit Cycle 1 findings (docs/AUDIT_CYCLE.md):
 *  C1-F4 dashboard import must accept a bare editor model JSON.
 *  C1-F5a SNI 1727:2020 preset must generate the Pasal 2.3.2 LRFD set with
 *         the standard reference stored on every generated combination.
 *  C1-F5b project store CRUD must work against storage (localStorage stub).
 *  C1-F6 report must be built from the service combination INCLUDING
 *         self-weight, and its HTML must contain the real computed values.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { generateCodeCombinations } from '@/engine/combinations-presets'
import { DEFAULT_LOAD_CASES, type LoadCase } from '@/engine/load-cases'
import {
  saveProject, listProjects, getProject, deleteProject,
  importProjectJSON, newProjectMeta, modelFingerprint,
} from '@/struktura/projects'
import { createEmptyModel, defaultSections, type StructureModel } from '@/engine/model'
import { serviceResult } from '@/struktura/service-result'
import { generateReportHTML } from '@/struktura/report'

class LocalStorageStub {
  private m = new Map<string, string>()
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null }
  setItem(k: string, v: string) { this.m.set(k, String(v)) }
  removeItem(k: string) { this.m.delete(k) }
  clear() { this.m.clear() }
}
beforeEach(() => {
  ;(globalThis as { localStorage?: unknown }).localStorage = new LocalStorageStub()
})

describe('C1-F5a — SNI 1727:2020 preset (Pasal 2.3.2 LRFD)', () => {
  const cases: Record<string, LoadCase> = {
    ...DEFAULT_LOAD_CASES(),
    live: { id: 'live', name: 'Live', kind: 'Live', enabled: true },
    wind: { id: 'wind', name: 'Wind', kind: 'Wind', enabled: true },
    seis: { id: 'seis', name: 'Seismic', kind: 'Seismic', enabled: true },
    roof: { id: 'roof', name: 'Roof Live', kind: 'Roof Live', enabled: true },
  }
  const combos = generateCodeCombinations('SNI 1727:2020', cases)
  it('generates the core LRFD combinations', () => {
    const names = combos.map((c) => c.name)
    expect(names).toContain('1.4D')
    expect(names).toContain('1.2D + 1.6L + 0.5Lr')
    expect(names).toContain('1.2D + 1.0E + L')
    expect(names).toContain('0.9D + 1.0W')
    expect(names).toContain('0.9D + 1.0E')
  })
  it('every combination stores its standard reference', () => {
    for (const c of combos) {
      expect(c.source).toBe('preset')
      expect(c.presetCode).toBe('SNI 1727:2020')
    }
  })
  it('1.4D terms are all factor 1.4 on Dead-kind cases', () => {
    // Kind-matching expands "Dead" to every Dead-kind case present
    // (Selfweight + Dead here) — two terms, both at 1.4. That is the app's
    // documented combination semantics, not a duplicate.
    const c = combos.find((x) => x.name === '1.4D')!
    expect(c.terms.length).toBeGreaterThanOrEqual(1)
    for (const t of c.terms) {
      expect(t.factor).toBeCloseTo(1.4, 12)
      expect(cases[t.caseId].kind).toBe('Dead')
    }
  })
})

describe('C1-F5b — project store CRUD (§13 persistence)', () => {
  it('save → list → get → delete round-trip with version bump', () => {
    const meta = newProjectMeta('Gudang A')
    const model = createEmptyModel()
    const s1 = saveProject(meta, model)
    expect(s1.fingerprint).toBe(modelFingerprint(model))
    expect(listProjects().map((p) => p.meta.name)).toContain('Gudang A')
    const s2 = saveProject(s1.meta, model)
    expect(s2.meta.modelVersion).toBe(s1.meta.modelVersion + 1)
    expect(getProject(meta.id)?.meta.modelVersion).toBe(s2.meta.modelVersion)
    deleteProject(meta.id)
    expect(getProject(meta.id)).toBeUndefined()
    expect(listProjects()).toHaveLength(0)
  })
})

describe('C1-F4 — import accepts a bare editor model JSON', () => {
  it('wraps a raw model in fresh project metadata', () => {
    const model = createEmptyModel()
    const p = importProjectJSON(JSON.stringify(model))
    expect(p.meta.name).toBe('Model Impor')
    expect(p.fingerprint).toBe(modelFingerprint(model))
  })
})

describe('C1-F6 — report service combination includes self-weight', () => {
  // SS beam 6 m, RC 300×500 section, UDL 10 kN/m (dead).
  // γ_concrete = 24 kN/m³ (parametric default) → w_sw = 24 × 0.15 m² = 3.6 kN/m.
  // Expected ΣRy = (10 + 3.6) × 6 = 81.6 kN.
  const model: StructureModel = {
    nodes: { n1: { id: 'n1', x: 0, y: 0 }, n2: { id: 'n2', x: 6, y: 0 } },
    members: { m1: { id: 'm1', a: 'n1', b: 'n2', section: 'rc300x500' } },
    supports: { n1: { nodeId: 'n1', type: 'pin' }, n2: { nodeId: 'n2', type: 'roller' } },
    sections: { rc300x500: defaultSections['rc300x500'] },
    loads: {
      l1: { id: 'l1', type: 'distributed', memberId: 'm1', loadCaseId: 'dead', wStart: -10, wEnd: -10 },
    },
  }
  it('section carries a self-weight (γ > 0)', () => {
    expect((defaultSections['rc300x500'].gamma ?? 0)).toBeGreaterThan(0)
  })
  it('ΣRy = (UDL + γA)·L', () => {
    const gamma = defaultSections['rc300x500'].gamma!
    const A = defaultSections['rc300x500'].A * 1e-6
    const want = (10 + gamma * A) * 6
    const svc = serviceResult(model)
    expect(svc.ok).toBe(true)
    if (!svc.ok) return
    const sum = Object.values(svc.result.reactions).reduce((a, r) => a + r.Ry, 0)
    expect(Math.abs(sum - want) / want).toBeLessThan(0.001)
  })
  it('report HTML contains the real reactions, fingerprint and versions', () => {
    const svc = serviceResult(model)
    expect(svc.ok).toBe(true)
    if (!svc.ok) return
    const meta = newProjectMeta('Report Test')
    const html = generateReportHTML(meta, model, svc.result)
    const ry = svc.result.reactions['n1'].Ry.toFixed(3)
    expect(html).toContain(ry)
    expect(html).toContain(modelFingerprint(model))
    expect(html).toContain('STRUKTURA 1.0.0')
    expect(html).toContain('Report Test')
    expect(html).toContain('UNSUPPORTED')
  })
})
