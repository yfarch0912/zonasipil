/**
 * Solver benchmarks, set 2 (STRUKTURA Sprint 1, P5 — numerical reliability).
 *
 * Every reference value below is derived INDEPENDENTLY of the solver
 * (statics / textbook closed forms), stated in the comment of each case
 * with its tolerance justification. Nothing here was copied from solver
 * output; where a first-principles derivation and the solver disagreed
 * during development, the derivation was re-checked first (two cases —
 * the inclined member's cos θ load component — and the disagreement was
 * in the hand derivation, which is documented where it matters).
 *
 * Shared section unless stated: E = 200 000 MPa, I33 = 80×10⁶ mm⁴,
 * A = 5 000 mm², γ = 0  ⇒  EI = 16 000 kN·m², EA = 1 000 000 kN.
 * Loads in kN / kN·m⁻¹, geometry in m, deflections in m.
 *
 * One case (B12) pins a KNOWN PATHOLOGY rather than a correct value; it is
 * labelled as such and exists so the behaviour cannot change silently.
 * (Since Sprint 2 the B12 pathology is DIAGNOSED — see the case itself.)
 */
import { describe, it, expect } from 'vitest'
import { analyze, type AnalysisResult } from '@/engine/solver'
import type { StructureModel, Section } from '@/engine/model'

const SEC: Section = { id: 's1', name: 'T', E: 200000, I33: 80e6, A: 5000, gamma: 0 }
// (EI for this section = 200 000 MPa × 80×10⁶ mm⁴ = 16 000 kN·m².)
const ok = (r: ReturnType<typeof analyze>): AnalysisResult => {
  expect(r.ok).toBe(true)
  if (!r.ok) throw new Error(r.reason)
  return r
}
const relErr = (actual: number, expected: number) => Math.abs(actual - expected) / Math.abs(expected)

describe('B7 — simply supported beam, central point load', () => {
  // Geometry: L = 6 m in two 3 m elements, pin at 0, roller at 6.
  // Load: P = 48 kN downward at the mid node.
  // Independent reference (statics + standard beam tables):
  //   R = P/2 = 24 kN each;  M_mid = PL/4 = 72 kN·m;
  //   δ_mid = PL³/(48EI) = 48·216/(48·16000) = 0.0135 m.
  // Euler beam elements are exact for nodal point loads ⇒ tol 1e-9 rel.
  const model: StructureModel = {
    nodes: { n1: { id: 'n1', x: 0, y: 0 }, nm: { id: 'nm', x: 3, y: 0 }, n2: { id: 'n2', x: 6, y: 0 } },
    members: { m1: { id: 'm1', a: 'n1', b: 'nm', section: 's1' }, m2: { id: 'm2', a: 'nm', b: 'n2', section: 's1' } },
    supports: { n1: { nodeId: 'n1', type: 'pin' }, n2: { nodeId: 'n2', type: 'roller' } },
    sections: { s1: SEC },
    loads: { p: { id: 'p', type: 'point', nodeId: 'nm', loadCaseId: 'dead', fx: 0, fy: -48 } },
  }
  it('reactions, midspan deflection and equilibrium match statics', () => {
    const r = ok(analyze(model))
    expect(relErr(r.reactions['n1'].Ry, 24)).toBeLessThan(1e-9)
    expect(relErr(r.reactions['n2'].Ry, 24)).toBeLessThan(1e-9)
    expect(relErr(r.nodeDisplacements['nm'].v, -0.0135)).toBeLessThan(1e-9)
    // End force on the element at the mid joint: magnitude = M_mid = 72
    // (sign follows the solver's element-force convention).
    expect(r.memberEndForces['m1'].M2).toBeCloseTo(72, 6)
  })
})

describe('B8 — cantilever under full UDL', () => {
  // Geometry: L = 4 m, fixed at x = 0, free tip at x = 4.
  // Load: w = 5 kN/m downward over the whole member.
  // Reference: δ_tip = wL⁴/(8EI) = 5·256/(8·16000) = 0.01 m;
  //   fixed-end moment = wL²/2 = 40 kN·m;  base shear = wL = 20 kN.
  // Beam element with consistent FEF is exact here ⇒ tol 1e-9 rel.
  const model: StructureModel = {
    nodes: { n1: { id: 'n1', x: 0, y: 0 }, n2: { id: 'n2', x: 4, y: 0 } },
    members: { m1: { id: 'm1', a: 'n1', b: 'n2', section: 's1' } },
    supports: { n1: { nodeId: 'n1', type: 'fixed' } },
    sections: { s1: SEC },
    loads: { u: { id: 'u', type: 'distributed', memberId: 'm1', loadCaseId: 'dead', wStart: -5, wEnd: -5 } },
  }
  it('tip deflection, base moment and shear match closed form', () => {
    const r = ok(analyze(model))
    expect(relErr(r.nodeDisplacements['n2'].v, -0.01)).toBeLessThan(1e-9)
    expect(relErr(r.reactions['n1'].Ry, 20)).toBeLessThan(1e-9)
    expect(relErr(Math.abs(r.reactions['n1'].Mz), 40)).toBeLessThan(1e-9)
  })
})

describe('B9 — overhanging beam by pure statics', () => {
  // Geometry: free end x = 0, pin at x = 2, roller at x = 8, tip x = 10.
  // Load: P = 20 kN downward at the overhang tip (x = 10) only.
  // Statics: ΣM about pin ⇒ R_roller·6 = 20·8 ⇒ R_roller = 26.667 kN up;
  //   ΣFy ⇒ R_pin = 20 − 26.667 = −6.667 kN (downward hold-down).
  // Determinate ⇒ stiffness-independent, tol 1e-9 rel.
  const model: StructureModel = {
    nodes: {
      a: { id: 'a', x: 0, y: 0 }, b: { id: 'b', x: 2, y: 0 },
      c: { id: 'c', x: 8, y: 0 }, d: { id: 'd', x: 10, y: 0 },
    },
    members: {
      m1: { id: 'm1', a: 'a', b: 'b', section: 's1' },
      m2: { id: 'm2', a: 'b', b: 'c', section: 's1' },
      m3: { id: 'm3', a: 'c', b: 'd', section: 's1' },
    },
    supports: { b: { nodeId: 'b', type: 'pin' }, c: { nodeId: 'c', type: 'roller' } },
    sections: { s1: SEC },
    loads: { p: { id: 'p', type: 'point', nodeId: 'd', loadCaseId: 'dead', fx: 0, fy: -20 } },
  }
  it('reactions match statics including the downward pin reaction', () => {
    const r = ok(analyze(model))
    expect(relErr(r.reactions['c'].Ry, 80 / 3)).toBeLessThan(1e-9)
    expect(relErr(r.reactions['b'].Ry, -20 / 3)).toBeLessThan(1e-9)
  })
})

describe('B10 — inclined member: local/global transformation', () => {
  // Geometry: pin at (0,0), roller at (3,4) — member axis at θ = 53.13°
  // (cos θ = 0.6, sin θ = 0.8), total L = 5 m in two 2.5 m elements.
  // Load: vertical P = 50 kN at the mid node (1.5, 2).
  // Statics (reactions are global): ΣM about pin ⇒ R_roller·3 = 50·1.5
  //   ⇒ R_roller = R_pin = 25 kN vertical, Rx = 0.
  // Transverse (local) deflection: only the load component PERPENDICULAR
  // to the axis bends the beam, P⊥ = P·cos θ = 30 kN, so
  //   δ_t = P⊥L³/(48EI) = 30·125/(48·16000) = 0.0048828125 m.
  // (An earlier hand-derivation using the full P overestimates by 1/cos θ;
  // the solver was right.) The axial mid-node displacement is NOT asserted:
  // the axial load path is indeterminate — it depends on how the far
  // roller's vertical restraint couples into the member axis — so there is
  // no honest closed form independent of the FE model itself.
  // Tol 1e-9 rel (nodal load on prismatic elements is exact).
  const model: StructureModel = {
    nodes: { a: { id: 'a', x: 0, y: 0 }, m: { id: 'm', x: 1.5, y: 2 }, b: { id: 'b', x: 3, y: 4 } },
    members: { e1: { id: 'e1', a: 'a', b: 'm', section: 's1' }, e2: { id: 'e2', a: 'm', b: 'b', section: 's1' } },
    supports: { a: { nodeId: 'a', type: 'pin' }, b: { nodeId: 'b', type: 'roller' } },
    sections: { s1: SEC },
    loads: { p: { id: 'p', type: 'point', nodeId: 'm', loadCaseId: 'dead', fx: 0, fy: -50 } },
  }
  it('reactions by statics; transverse deflection = P·cosθ closed form', () => {
    const r = ok(analyze(model))
    expect(relErr(r.reactions['a'].Ry, 25)).toBeLessThan(1e-9)
    expect(relErr(r.reactions['b'].Ry, 25)).toBeLessThan(1e-9)
    expect(Math.abs(r.reactions['a'].Rx)).toBeLessThan(1e-9)
    const d = r.nodeDisplacements['m']
    const th = Math.atan2(4, 3)
    const transverse = -d.u * Math.sin(th) + d.v * Math.cos(th)
    expect(relErr(transverse, -0.0048828125)).toBeLessThan(1e-9)
  })
})

describe('B11 — Timoshenko vs Euler–Bernoulli, SS beam under UDL', () => {
  // Geometry: L = 6 m (mid node), pin/roller. Load: w = 10 kN/m on both
  // elements. Section as SEC plus Aκ2 = 3 000 mm², ν = 0.3
  //   ⇒ G = E/(2(1+ν)) = 76 923.08 MPa, GAs = 230 769.23 kN.
  // Reference (Timoshenko beam theory, simply supported UDL):
  //   δ_mid = 5wL⁴/(384EI) + wL²/(8·GAs)
  //         = 0.010546875 + 0.000195 = 0.010741875 m.
  // The Φ-formulation element reproduces this nodal value exactly for the
  // UDL case (measured rel. error 1.5e-15 during Sprint 1); tol 1e-6 rel
  // leaves generous room while still catching formulation regressions.
  const SHEAR_SEC: Section = { ...SEC, id: 's2', 'Aκ2': 3000, nu: 0.3 }
  const model: StructureModel = {
    nodes: { n1: { id: 'n1', x: 0, y: 0 }, nm: { id: 'nm', x: 3, y: 0 }, n2: { id: 'n2', x: 6, y: 0 } },
    members: { m1: { id: 'm1', a: 'n1', b: 'nm', section: 's2' }, m2: { id: 'm2', a: 'nm', b: 'n2', section: 's2' } },
    supports: { n1: { nodeId: 'n1', type: 'pin' }, n2: { nodeId: 'n2', type: 'roller' } },
    sections: { s2: SHEAR_SEC },
    loads: {
      u1: { id: 'u1', type: 'distributed', memberId: 'm1', loadCaseId: 'dead', wStart: -10, wEnd: -10 },
      u2: { id: 'u2', type: 'distributed', memberId: 'm2', loadCaseId: 'dead', wStart: -10, wEnd: -10 },
    },
  }
  it('Timoshenko midspan deflection = bending + shear closed form; Euler run = bending only', () => {
    const tim = ok(analyze(model, { shearDeformation: true }))
    const eul = ok(analyze(model, { shearDeformation: false }))
    expect(relErr(tim.nodeDisplacements['nm'].v, -0.010741875)).toBeLessThan(1e-6)
    expect(relErr(eul.nodeDisplacements['nm'].v, -0.010546875)).toBeLessThan(1e-9)
    expect(tim.shearFallbackMembers).toBeUndefined()
  })
})

describe('B12 — near-singular but solvable model (I₂ = I₁×10⁻⁸) + KNOWN PATHOLOGY, NOW DIAGNOSED', () => {
  // Geometry: two-span beam 6 + 6 m, pin + 2 rollers, UDL 10 kN/m on both
  // spans; span 2's I33 scaled by 1e-8 (a "floppy" member).
  // Well-posed expectations, asserted: the system still solves (the per-DOF
  // relative singularity test passes), GLOBAL EQUILIBRIUM is exact
  // (ΣRy = 120 kN), and the STIFF span's forces stay at the continuous-beam
  // values (end 22.5 / centre contribution 37.5 kN).
  // KNOWN PATHOLOGY (pinned, NOT endorsed): the floppy span's far-end
  // rotation solves to θ ≈ 2.8×10⁵ rad — physically meaningless. Its FEF
  // moment (wL²/12) must be equilibrated by a rotational stiffness of
  // 4EI₂/L ≈ 10⁻⁴ kN·m/rad, and the per-DOF relative pivot test compares
  // each pivot with its OWN row, so nothing flags it at solve level;
  // equilibrium-based reaction recovery still sums exactly, which is why
  // forces look sane.
  // Sprint 2 (R-11) DISPOSITION: the raw numbers are still the pinned
  // ones (the solver's arithmetic is NOT changed and nothing is clamped),
  // but the result now carries numerical diagnostics classifying it
  // PHYSICALLY_IMPLAUSIBLE via the rotation-plausibility signal. Note the
  // measured evidence asserted below: the equilibrated pivot ratio is
  // HEALTHY (0.5) and the relative residual is ~1e-26 — this pathology is
  // not a conditioning failure, which is exactly why three independent
  // diagnostic signals exist. Full test matrix: tests/sprint2-conditioning.test.ts.
  const TINY: Section = { id: 's9', name: 'tiny', E: 200000, I33: 80e6 * 1e-8, A: 5000, gamma: 0 }
  const model: StructureModel = {
    nodes: { n1: { id: 'n1', x: 0, y: 0 }, n2: { id: 'n2', x: 6, y: 0 }, n3: { id: 'n3', x: 12, y: 0 } },
    members: { m1: { id: 'm1', a: 'n1', b: 'n2', section: 's1' }, m2: { id: 'm2', a: 'n2', b: 'n3', section: 's9' } },
    supports: { n1: { nodeId: 'n1', type: 'pin' }, n2: { nodeId: 'n2', type: 'roller' }, n3: { nodeId: 'n3', type: 'roller' } },
    sections: { s1: SEC, s9: TINY },
    loads: {
      u1: { id: 'u1', type: 'distributed', memberId: 'm1', loadCaseId: 'dead', wStart: -10, wEnd: -10 },
      u2: { id: 'u2', type: 'distributed', memberId: 'm2', loadCaseId: 'dead', wStart: -10, wEnd: -10 },
    },
  }
  it('solves with exact equilibrium and sane stiff-span forces; floppy rotation is the pinned pathology', () => {
    const r = ok(analyze(model))
    const sumRy = Object.values(r.reactions).reduce((s, x) => s + x.Ry, 0)
    expect(relErr(sumRy, 120)).toBeLessThan(1e-9)
    expect(relErr(r.reactions['n1'].Ry, 22.5)).toBeLessThan(1e-6)
    // Pathology pin: |θ at n3| is absurd (> 1 rad). See header comment.
    expect(Math.abs(r.nodeDisplacements['n3'].theta)).toBeGreaterThan(1)
  })

  it('Sprint 2 (R-11): the pathology is DIAGNOSED as PHYSICALLY_IMPLAUSIBLE, numbers untouched', () => {
    const r = ok(analyze(model))
    // The raw value is still the pinned one — nothing was clamped.
    expect(relErr(r.nodeDisplacements['n3'].theta, 281250)).toBeLessThan(1e-9)
    const n = r.numerical
    expect(n.classification).toBe('PHYSICALLY_IMPLAUSIBLE')
    expect(n.flags).toContain('implausible-rotation')
    expect(n.maxAbsRotation.nodeId).toBe('n3')
    // Measured evidence (Sprint 2 probe): conditioning and residual are
    // both healthy for this model — plausibility is the ONLY signal that
    // catches it. If either assertion starts failing, the diagnostic
    // architecture has changed and this must be re-derived, not edited.
    expect(n.equilibratedPivotRatio).toBeGreaterThan(0.1)
    expect(n.relativeResidual).toBeLessThan(1e-12)
  })
})

describe('B13 — metamorphic properties on a portal frame', () => {
  // Portal: columns 3 m at x = 0 and x = 4 (pin bases), beam across the
  // top, lateral load H at the top-left joint. Linear system ⇒
  //  (a) doubling every load doubles every displacement and reaction;
  //  (b) the ORDER of keys in the loads record cannot change the result;
  //  (c) repeated solves are bit-identical (determinism).
  // Tolerances: (a) 1e-9 rel (floating-point reordering noise only),
  // (b)/(c) exact deep equality — assembly iterates the model's records,
  // whose key order follows insertion; (b) uses the same insertion order
  // for members/nodes and only permutes the loads record, which the
  // pipeline iterates deterministically per member/node lookups.
  const portal = (fy: number, fx: number, swapLoads: boolean): StructureModel => {
    const loads: StructureModel['loads'] = swapLoads
      ? {
          v: { id: 'v', type: 'point', nodeId: 'tr', loadCaseId: 'dead', fx: 0, fy },
          h: { id: 'h', type: 'point', nodeId: 'tl', loadCaseId: 'dead', fx, fy: 0 },
        }
      : {
          h: { id: 'h', type: 'point', nodeId: 'tl', loadCaseId: 'dead', fx, fy: 0 },
          v: { id: 'v', type: 'point', nodeId: 'tr', loadCaseId: 'dead', fx: 0, fy },
        }
    return {
      nodes: {
        bl: { id: 'bl', x: 0, y: 0 }, br: { id: 'br', x: 4, y: 0 },
        tl: { id: 'tl', x: 0, y: 3 }, tr: { id: 'tr', x: 4, y: 3 },
      },
      members: {
        c1: { id: 'c1', a: 'bl', b: 'tl', section: 's1' },
        c2: { id: 'c2', a: 'br', b: 'tr', section: 's1' },
        bm: { id: 'bm', a: 'tl', b: 'tr', section: 's1' },
      },
      supports: { bl: { nodeId: 'bl', type: 'pin' }, br: { nodeId: 'br', type: 'pin' } },
      sections: { s1: SEC },
      loads,
    }
  }
  it('linearity, load-order invariance, determinism, moment equilibrium', () => {
    const r1 = ok(analyze(portal(-30, 20, false)))
    const r2 = ok(analyze(portal(-60, 40, false)))
    for (const id of Object.keys(r1.nodeDisplacements)) {
      for (const k of ['u', 'v', 'theta'] as const) {
        const a = r1.nodeDisplacements[id][k]
        const b = r2.nodeDisplacements[id][k]
        if (Math.abs(a) > 1e-12) expect(relErr(b, 2 * a)).toBeLessThan(1e-9)
        else expect(Math.abs(b)).toBeLessThan(1e-9)
      }
    }
    const rSwap = ok(analyze(portal(-30, 20, true)))
    expect(rSwap.nodeDisplacements).toEqual(r1.nodeDisplacements)
    expect(rSwap.reactions).toEqual(r1.reactions)
    const rAgain = ok(analyze(portal(-30, 20, false)))
    expect(rAgain).toEqual(r1)
    // Moment equilibrium about the origin: Σ (x·Ry − y·Rx + Mz) over
    // supports + Σ (x·Fy − y·Fx) over applied point loads = 0.
    let m = 0
    for (const [nodeId, r] of Object.entries(r1.reactions)) {
      const nd = portal(-30, 20, false).nodes[nodeId]
      m += nd.x * r.Ry - nd.y * r.Rx + r.Mz
    }
    m += (4 * -30 - 3 * 0) + (0 * 0 - 3 * 20) // loads at tr (4,3) and tl (0,3): x·Fy − y·Fx
    expect(Math.abs(m)).toBeLessThan(1e-6)
    // Force equilibrium too.
    const sFx = Object.values(r1.reactions).reduce((s, r) => s + r.Rx, 0)
    const sFy = Object.values(r1.reactions).reduce((s, r) => s + r.Ry, 0)
    expect(Math.abs(sFx + 20)).toBeLessThan(1e-9)
    expect(Math.abs(sFy - 30)).toBeLessThan(1e-9)
  })
})
