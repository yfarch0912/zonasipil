/**
 * Sprint 2 — P1 (R-11): numerical conditioning & plausibility diagnostics.
 *
 * Every reference value below is either a closed form (stated inline) or
 * a quantity MEASURED during the Sprint 2 investigation probe and pinned
 * with its derivation (pivot ratios of the alternating-stiffness family
 * scale linearly with the soft-span ratio — measured at three ratios).
 * Nothing was copied from a single solver run without a stated reason.
 *
 * Shared section: E = 200 000 MPa, I33 = 80×10⁶ mm⁴, A = 5 000 mm²
 *   ⇒ EI = 16 000 kN·m², EA = 1 000 000 kN.
 */
import { describe, it, expect } from 'vitest'
import { analyze, type AnalysisResult } from '@/engine/solver'
import {
  runDiagnostics,
  mergeNumericalDiagnostics,
  dofToLocation,
} from '@/engine/analysis-diagnostics'
import type { StructureModel, Section } from '@/engine/model'

const SEC: Section = { id: 's1', name: 'T', E: 200000, I33: 80e6, A: 5000, gamma: 0 }
const ok = (r: ReturnType<typeof analyze>): AnalysisResult => {
  expect(r.ok).toBe(true)
  if (!r.ok) throw new Error(r.reason)
  return r
}
const relErr = (a: number, e: number) => Math.abs(a - e) / Math.abs(e)
const pt = (id: string, nodeId: string, fx: number, fy: number) =>
  ({ id, type: 'point' as const, nodeId, loadCaseId: 'dead', fx, fy })
const udl = (id: string, memberId: string, w: number) =>
  ({ id, type: 'distributed' as const, memberId, loadCaseId: 'dead', wStart: w, wEnd: w })

const ssBeam = (section: Section, fy: number): StructureModel => ({
  nodes: { n1: { id: 'n1', x: 0, y: 0 }, nm: { id: 'nm', x: 3, y: 0 }, n2: { id: 'n2', x: 6, y: 0 } },
  members: { m1: { id: 'm1', a: 'n1', b: 'nm', section: section.id }, m2: { id: 'm2', a: 'nm', b: 'n2', section: section.id } },
  supports: { n1: { nodeId: 'n1', type: 'pin' }, n2: { nodeId: 'n2', type: 'roller' } },
  sections: { [section.id]: section },
  loads: { p: pt('p', 'nm', 0, fy) },
})

describe('P1 — well-conditioned reference model stays VALID', () => {
  it('SS beam, central point load: VALID, no flags, closed-form deflection', () => {
    const r = ok(analyze(ssBeam(SEC, -48)))
    // δ_mid = PL³/(48EI) = 48·216/(48·16000) = 0.0135 m (benchmark B7).
    expect(relErr(r.nodeDisplacements['nm'].v, -0.0135)).toBeLessThan(1e-9)
    expect(r.numerical.classification).toBe('VALID')
    expect(r.numerical.flags).toEqual([])
    // Measured probe values: ρ = 0.375, residual ≈ 2e-18.
    expect(r.numerical.equilibratedPivotRatio).toBeGreaterThan(0.1)
    expect(r.numerical.relativeResidual).toBeLessThan(1e-12)
  })
})

describe('P1 — small but VALID stiffness must not be flagged', () => {
  it('I×10⁻⁴ section with load×10⁻⁴ reproduces the reference response exactly', () => {
    // Linear system: scaling EI and the load by the same factor leaves
    // displacements invariant. A diagnostic keyed on absolute stiffness
    // magnitude (instead of response/conditioning) would false-positive
    // here; the Sprint 2 signals must not.
    const SMALL: Section = { id: 's8', name: 'small', E: 200000, I33: 80e6 * 1e-4, A: 5000, gamma: 0 }
    const r = ok(analyze(ssBeam(SMALL, -48 * 1e-4)))
    expect(relErr(r.nodeDisplacements['nm'].v, -0.0135)).toBeLessThan(1e-9)
    expect(r.numerical.classification).toBe('VALID')
    expect(r.numerical.flags).toEqual([])
  })
})

describe('P1 — large but LEGITIMATE displacement stays VALID', () => {
  it('cantilever at δ/L = 1/20: VALID with the large-rotation flag only', () => {
    // w = 100 kN/m, L = 4: δ_tip = wL⁴/(8EI) = 0.2 m = L/20;
    // θ_tip = wL³/(6EI) = 0.0667 rad — beyond the 0.02 warning band,
    // inside the 0.1 plausibility bound (linearization error θ²/6 ≈
    // 7.4e-4). Must warn, must NOT classify implausible.
    const model: StructureModel = {
      nodes: { n1: { id: 'n1', x: 0, y: 0 }, n2: { id: 'n2', x: 4, y: 0 } },
      members: { m1: { id: 'm1', a: 'n1', b: 'n2', section: 's1' } },
      supports: { n1: { nodeId: 'n1', type: 'fixed' } },
      sections: { s1: SEC },
      loads: { u: udl('u', 'm1', -100) },
    }
    const r = ok(analyze(model))
    expect(relErr(r.nodeDisplacements['n2'].v, -0.2)).toBeLessThan(1e-9)
    expect(relErr(Math.abs(r.nodeDisplacements['n2'].theta), 1 / 15)).toBeLessThan(1e-9)
    expect(r.numerical.classification).toBe('VALID')
    expect(r.numerical.flags).toEqual(['large-rotation'])
  })
})

describe('P1 — true mechanism is a solver failure (SINGULAR path)', () => {
  it('beam on three rollers: horizontal rigid-body mode is singular at (n3, u)', () => {
    // Three rollers give 3 reaction components (passes the count gate)
    // but nothing restrains horizontal translation.
    const model: StructureModel = {
      nodes: { n1: { id: 'n1', x: 0, y: 0 }, n2: { id: 'n2', x: 3, y: 0 }, n3: { id: 'n3', x: 6, y: 0 } },
      members: { m1: { id: 'm1', a: 'n1', b: 'n2', section: 's1' }, m2: { id: 'm2', a: 'n2', b: 'n3', section: 's1' } },
      supports: { n1: { nodeId: 'n1', type: 'roller' }, n2: { nodeId: 'n2', type: 'roller' }, n3: { nodeId: 'n3', type: 'roller' } },
      sections: { s1: SEC },
      loads: { p: pt('p', 'n2', 0, -10) },
    }
    const r = analyze(model)
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('unreachable')
    expect(r.reason).toBe('Singular stiffness matrix')
    expect(r.singularDof).toBeDefined()
    // DOF 6 = node index 2 (n3), direction u — the unrestrained mode.
    expect(dofToLocation(r.singularDof!, ['n1', 'n2', 'n3'])).toEqual({ nodeId: 'n3', direction: 'u' })
  })
})

describe('P1 — near-singular family: pivot ratio degrades with soft-span ratio', () => {
  // Continuous beam on END supports only, spans alternating stiff / soft.
  // Measured in the Sprint 2 probe: ρ ≈ 1.57 × (soft ratio) — 1.57e-4 at
  // 1e-4, 1.57e-5 at 1e-5, 1.57e-6 at 1e-6. The assertions pin the ORDER
  // and the scaling law (factor-3 tolerance), not a single copied digit.
  const alternating = (softRatio: number): StructureModel => {
    const SOFT: Section = { id: 's7', name: 'soft', E: 200000, I33: 80e6 * softRatio, A: 5000, gamma: 0 }
    return {
      nodes: {
        n0: { id: 'n0', x: 0, y: 0 }, n1: { id: 'n1', x: 3, y: 0 }, n2: { id: 'n2', x: 6, y: 0 },
        n3: { id: 'n3', x: 9, y: 0 }, n4: { id: 'n4', x: 12, y: 0 },
      },
      members: {
        m0: { id: 'm0', a: 'n0', b: 'n1', section: 's1' }, m1: { id: 'm1', a: 'n1', b: 'n2', section: 's7' },
        m2: { id: 'm2', a: 'n2', b: 'n3', section: 's1' }, m3: { id: 'm3', a: 'n3', b: 'n4', section: 's7' },
      },
      supports: { n0: { nodeId: 'n0', type: 'pin' }, n4: { nodeId: 'n4', type: 'roller' } },
      sections: { s1: SEC, s7: SOFT },
      loads: { p: pt('p', 'n2', 0, -20) },
    }
  }

  it('ρ scales with the soft-span ratio and the ill-conditioned band is reached', () => {
    const r4 = ok(analyze(alternating(1e-4)))
    const r5 = ok(analyze(alternating(1e-5)))
    const r6 = ok(analyze(alternating(1e-6)))
    expect(r4.numerical.equilibratedPivotRatio).toBeGreaterThan(0.5e-4)
    expect(r4.numerical.equilibratedPivotRatio).toBeLessThan(5e-4)
    expect(r5.numerical.equilibratedPivotRatio).toBeLessThan(r4.numerical.equilibratedPivotRatio / 5)
    expect(r6.numerical.equilibratedPivotRatio).toBeLessThan(r5.numerical.equilibratedPivotRatio / 5)
    // All three are ALSO physically implausible (their unsupported soft
    // spans rotate by tens of radians) — precedence gives IMPLAUSIBLE.
    for (const r of [r4, r5, r6]) {
      expect(r.numerical.classification).toBe('PHYSICALLY_IMPLAUSIBLE')
      expect(r.numerical.flags).toContain('implausible-rotation')
    }
    // At ratio 3e-9 the pivot ratio enters the ill-conditioned band
    // [1e-12, 1e-8): ρ ≈ 1.57 × 3e-9 ≈ 4.7e-9 (scaling law above).
    const r9 = ok(analyze(alternating(3e-9)))
    expect(r9.numerical.equilibratedPivotRatio).toBeGreaterThan(1e-12)
    expect(r9.numerical.equilibratedPivotRatio).toBeLessThan(1e-8)
    expect(r9.numerical.flags).toContain('ill-conditioned')
    // Honest structural fact this family demonstrates: in this solver,
    // the ill-conditioned band is reached TOGETHER with implausibility —
    // the weakly-restrained DOFs are exactly the ones whose response
    // explodes. The band remains a distinct flag so the cause is named.
    expect(r9.numerical.classification).toBe('PHYSICALLY_IMPLAUSIBLE')
  })
})

describe('P1 — perturbation sensitivity (measured, not assumed)', () => {
  it('well-conditioned model: 1e-6 load and stiffness perturbations amplify ≈ ×1', () => {
    const base = ok(analyze(ssBeam(SEC, -48)))
    const pertLoad = ok(analyze(ssBeam(SEC, -48 * (1 + 1e-6))))
    const stiff: Section = { ...SEC, I33: 80e6 * (1 + 1e-6) }
    const pertK = ok(analyze(ssBeam(stiff, -48)))
    const d0 = base.nodeDisplacements['nm'].v
    expect(relErr(pertLoad.nodeDisplacements['nm'].v, d0)).toBeLessThan(2e-6)
    expect(relErr(pertK.nodeDisplacements['nm'].v, d0)).toBeLessThan(2e-6)
  })

  it('B12 family: RELATIVE sensitivity stays ≈ ×1 — the pathology is plausibility, not sensitivity', () => {
    // Perturbing the floppy member's I by 1e-6 changes θ(n3) by ≈1e-6
    // RELATIVE — the linear solve is componentwise tame; the value is
    // meaningless because 2.8e5 rad violates the small-angle assumption,
    // not because roundoff amplified. This is the measured justification
    // for classifying B12 by plausibility instead of conditioning.
    const mk = (ratio: number): StructureModel => {
      const TINY: Section = { id: 's9', name: 'tiny', E: 200000, I33: 80e6 * ratio, A: 5000, gamma: 0 }
      return {
        nodes: { n1: { id: 'n1', x: 0, y: 0 }, n2: { id: 'n2', x: 6, y: 0 }, n3: { id: 'n3', x: 12, y: 0 } },
        members: { m1: { id: 'm1', a: 'n1', b: 'n2', section: 's1' }, m2: { id: 'm2', a: 'n2', b: 'n3', section: 's9' } },
        supports: { n1: { nodeId: 'n1', type: 'pin' }, n2: { nodeId: 'n2', type: 'roller' }, n3: { nodeId: 'n3', type: 'roller' } },
        sections: { s1: SEC, s9: TINY },
        loads: { u1: udl('u1', 'm1', -10), u2: udl('u2', 'm2', -10) },
      }
    }
    const base = ok(analyze(mk(1e-8)))
    const pert = ok(analyze(mk(1e-8 * (1 + 1e-6))))
    const t0 = base.nodeDisplacements['n3'].theta
    expect(relErr(pert.nodeDisplacements['n3'].theta, t0)).toBeLessThan(2e-6)
    expect(base.numerical.classification).toBe('PHYSICALLY_IMPLAUSIBLE')
  })
})

describe('P1 — diagnostics merge reaches the user-facing report', () => {
  const b12Model = (): StructureModel => {
    const TINY: Section = { id: 's9', name: 'tiny', E: 200000, I33: 80e6 * 1e-8, A: 5000, gamma: 0 }
    return {
      nodes: { n1: { id: 'n1', x: 0, y: 0 }, n2: { id: 'n2', x: 6, y: 0 }, n3: { id: 'n3', x: 12, y: 0 } },
      members: { m1: { id: 'm1', a: 'n1', b: 'n2', section: 's1' }, m2: { id: 'm2', a: 'n2', b: 'n3', section: 's9' } },
      supports: { n1: { nodeId: 'n1', type: 'pin' }, n2: { nodeId: 'n2', type: 'roller' }, n3: { nodeId: 'n3', type: 'roller' } },
      sections: { s1: SEC, s9: TINY },
      loads: { u1: udl('u1', 'm1', -10), u2: udl('u2', 'm2', -10) },
    }
  }

  it('implausible result merges as an ERROR and forces status unstable', () => {
    const model = b12Model()
    const base = runDiagnostics(model)
    const merged = mergeNumericalDiagnostics(base, [analyze(model)])
    const issue = merged.issues.find((i) => i.kind === 'numerical-reliability')
    expect(issue).toBeDefined()
    if (issue?.kind !== 'numerical-reliability') throw new Error('unreachable')
    expect(issue.severity).toBe('error')
    expect(issue.classification).toBe('PHYSICALLY_IMPLAUSIBLE')
    expect(issue.maxRotationNodeId).toBe('n3')
    expect(merged.status).toBe('unstable')
  })

  it('clean result leaves the report untouched (same object)', () => {
    const model = ssBeam(SEC, -48)
    const base = runDiagnostics(model)
    expect(mergeNumericalDiagnostics(base, [analyze(model)])).toBe(base)
  })

  it('large-rotation-only result merges as a WARNING, status preserved', () => {
    const model: StructureModel = {
      nodes: { n1: { id: 'n1', x: 0, y: 0 }, n2: { id: 'n2', x: 4, y: 0 } },
      members: { m1: { id: 'm1', a: 'n1', b: 'n2', section: 's1' } },
      supports: { n1: { nodeId: 'n1', type: 'fixed' } },
      sections: { s1: SEC },
      loads: { u: udl('u', 'm1', -100) },
    }
    const base = runDiagnostics(model)
    const merged = mergeNumericalDiagnostics(base, [analyze(model)])
    const issue = merged.issues.find((i) => i.kind === 'numerical-reliability')
    expect(issue?.severity).toBe('warning')
    expect(merged.status).toBe(base.status)
  })
})
