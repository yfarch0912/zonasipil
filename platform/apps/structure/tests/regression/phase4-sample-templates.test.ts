/**
 * Phase 4 — analytical regression tests for the corrected sample
 * templates (docs/PHASE-3-SAMPLE-MODEL-AUDIT.md,
 * docs/PHASE-4-SECTION-CORRECTION-REPORT.md).
 *
 * Expected values are INDEPENDENT closed-form results (Euler-Bernoulli
 * beam theory), not solver outputs copied back:
 *
 * Section (both templates): 300x500 concrete beam —
 *   E = 23500 MPa = 23.5e6 kN/m^2, I33 = 3.125e9 mm^4 = 3.125e-3 m^4,
 *   EI = 73 437.5 kN·m^2, A = 150 000 mm^2.
 * Solver sign conventions: fy negative = downward; v negative = downward
 * displacement; theta negative = clockwise for these sagging cases.
 *
 * Template 1 — simply supported, L=5 m, P=10 kN at a=2 m (b=3 m):
 *   R_left = P*b/L = 6 kN,  R_right = P*a/L = 4 kN     (statics, EI-free)
 *   theta_left = P*a*b*(L+b)/(6*EI*L) = 480/2203125 = 2.178723e-4 rad
 *   delta at load point = P*a^2*b^2/(3*EI*L) = 360/1101562.5 = 3.268085e-4 m
 *
 * Template 2 — cantilever, L=5 m, fixed at left, UDL w=10 kN/m downward
 * (template definition: local-axis wStart=wEnd=-10 on the single member):
 *   theta_tip = w*L^3/(6*EI) = 1250/440625 = 2.836879e-3 rad
 *   delta_tip = w*L^4/(8*EI) = 6250/587500 = 1.063830e-2 m
 *   R_fixed = w*L = 50 kN,  M_fixed = w*L^2/2 = 125 kN·m
 */
import { describe, it, expect } from 'vitest'
import { analyze } from '@/engine/solver'
import type { StructureModel } from '@/engine/model'
import { template1SimpleBeam, template2Cantilever, template3Portal, template5AsymmetricRafter } from '@/templates/examples'

const EI = 23.5e6 * 3.125e-3 // 73 437.5 kN·m^2
const byX = (m: StructureModel, x: number) => Object.values(m.nodes).find((n) => n.x === x)!
const relErr = (got: number, want: number) => Math.abs(got - want) / Math.abs(want)

describe('Phase 4 — template 01 (simply supported beam, corrected section)', () => {
  const m = template1SimpleBeam()
  const r = analyze(m)
  it('solves and classifies VALID (no implausible-rotation warning)', () => {
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.numerical.classification).toBe('VALID')
    expect(r.numerical.relativeResidual).toBeLessThan(1e-8)
  })
  it('reactions remain the EI-independent statics: 6 kN / 4 kN', () => {
    if (!r.ok) throw new Error('solve failed')
    expect(r.reactions[byX(m, -2.5).id].Ry).toBeCloseTo(6, 9)
    expect(r.reactions[byX(m, 2.5).id].Ry).toBeCloseTo(4, 9)
  })
  it('left support rotation matches closed form within 1%', () => {
    if (!r.ok) throw new Error('solve failed')
    const want = (10 * 2 * 3 * (5 + 3)) / (6 * EI * 5) // 2.178723e-4 rad
    const got = r.nodeDisplacements[byX(m, -2.5).id].theta
    expect(got).toBeLessThan(0) // clockwise under a downward load (solver convention)
    expect(relErr(Math.abs(got), want)).toBeLessThan(0.01)
  })
  it('deflection at the load point matches closed form within 1%', () => {
    if (!r.ok) throw new Error('solve failed')
    const want = (10 * 2 ** 2 * 3 ** 2) / (3 * EI * 5) // 3.268085e-4 m
    const got = r.nodeDisplacements[byX(m, -0.5).id].v
    expect(got).toBeLessThan(0)
    expect(relErr(Math.abs(got), want)).toBeLessThan(0.01)
  })
})

describe('Phase 4 — template 02 (cantilever, UDL, corrected section)', () => {
  const m = template2Cantilever()
  const r = analyze(m)
  it('solves and classifies VALID', () => {
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.numerical.classification).toBe('VALID')
    expect(r.numerical.relativeResidual).toBeLessThan(1e-8)
  })
  it('fixed-end resultants match statics: Ry = wL = 50 kN, |Mz| = wL^2/2 = 125 kN·m', () => {
    if (!r.ok) throw new Error('solve failed')
    const fix = r.reactions[byX(m, -2.5).id]
    expect(fix.Ry).toBeCloseTo(50, 9)
    expect(Math.abs(fix.Mz)).toBeCloseTo(125, 6)
  })
  it('tip rotation and deflection match closed form within 1%', () => {
    if (!r.ok) throw new Error('solve failed')
    const tip = r.nodeDisplacements[byX(m, 2.5).id]
    const wantTheta = (10 * 5 ** 3) / (6 * EI) // 2.836879e-3 rad
    const wantDelta = (10 * 5 ** 4) / (8 * EI) // 1.063830e-2 m
    expect(tip.theta).toBeLessThan(0)
    expect(tip.v).toBeLessThan(0)
    expect(relErr(Math.abs(tip.theta), wantTheta)).toBeLessThan(0.01)
    expect(relErr(Math.abs(tip.v), wantDelta)).toBeLessThan(0.01)
  })
})

describe('Phase 4 — hand-written section constants consistency guard', () => {
  it('SECTION_DEFAULT (via templates 1/2) now equals the parametric rc300x500 exactly', () => {
    // The Phase 3 root cause: the hand-written constant described the
    // same 300x500 beam as the parametric default section but with I33
    // 1000x smaller. The guard: both representations must agree on
    // E, A and I33 — any future transcription drift fails here.
    for (const build of [template1SimpleBeam, template2Cantilever]) {
      const secs = build().sections
      const hand = secs['section']
      const param = secs['rc300x500']
      expect(hand.E).toBe(param.E)
      expect(hand.A).toBe(param.A)
      expect(hand.I33).toBe(param.I33)
    }
  })
  it('rectangular formula check where dimensions are explicit (parametric defaults)', () => {
    // rc300x500: b=300, h=500 -> I33 = b*h^3/12 = 3.125e9 mm^4.
    // rc500x500: b=h=500   -> I33 = 500^4/12  = 5.208333e9 mm^4.
    const t1 = template1SimpleBeam().sections['rc300x500']
    expect(relErr(t1.I33, (300 * 500 ** 3) / 12)).toBeLessThan(0.001)
    const t3 = template3Portal().sections['rc500x500']
    expect(relErr(t3.I33, (500 * 500 ** 3) / 12)).toBeLessThan(0.001)
  })
  it('all hand-written/parametric template sections are finite and positive', () => {
    const models = [template1SimpleBeam(), template2Cantilever(), template3Portal(), template5AsymmetricRafter()]
    for (const m of models)
      for (const s of Object.values(m.sections)) {
        expect(Number.isFinite(s.E) && s.E > 0, `${s.id} E`).toBe(true)
        expect(Number.isFinite(s.I33) && s.I33 > 0, `${s.id} I33`).toBe(true)
        expect(Number.isFinite(s.A) && s.A > 0, `${s.id} A`).toBe(true)
      }
    // SECTION_C30 (template 5, stored under key 'section'): its constant
    // declares NO dimensions, so per the audit rule no rectangular
    // comparison is made — finite/positive (above) is the full guard,
    // and the ambiguity is recorded here rather than guessed away.
  })
})
