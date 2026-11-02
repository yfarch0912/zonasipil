/**
 * Visualization adapter + animation progress — validation.
 *
 * The deformation adapter is checked against the solver's own nodal
 * results (identity at member ends) and against the closed-form
 * Euler–Bernoulli deflection of a simply supported beam with a
 * central point load, for which the cubic Hermite field is the
 * EXACT elastic curve (no distributed load on the members):
 *   δ(x) = P·x·(3L² − 4x²) / (48EI),  δ_mid = PL³/(48EI).
 * Section: E = 23 500 MPa, I33 = 3.125e9 mm⁴ → EI = 73 437.5 kN·m².
 */
import { describe, it, expect } from 'vitest'
import { analyze } from '@/engine/solver'
import type { StructureModel, Section } from '@/engine/model'
import { sampleMemberDeformation, peakNodalDisplacement } from '@/visualization/deformation'
import { advanceProgress, ANIMATION_PERIOD_MS } from '@/visualization/animation'

const SEC: Section = { id: 's1', name: 'TEST', E: 23500, I33: 3.125e9, A: 150000 }
const EI = 73437.5
const L = 5
const P = 10

const beam: StructureModel = {
  nodes: {
    a: { id: 'a', x: 0, y: 0 },
    mid: { id: 'mid', x: L / 2, y: 0 },
    b: { id: 'b', x: L, y: 0 },
  },
  members: {
    m1: { id: 'm1', a: 'a', b: 'mid', section: 's1' },
    m2: { id: 'm2', a: 'mid', b: 'b', section: 's1' },
  },
  supports: {
    a: { nodeId: 'a', type: 'pin' },
    b: { nodeId: 'b', type: 'roller' },
  },
  sections: { s1: SEC },
  loads: {
    l1: { id: 'l1', type: 'point', nodeId: 'mid', loadCaseId: 'dead', fx: 0, fy: -P },
  },
}

describe('deformation adapter — Hermite sampling of solver results', () => {
  const r = analyze(beam)
  if (!r.ok) throw new Error('benchmark beam must solve')

  it('reproduces solver nodal displacements exactly at member ends', () => {
    const pts = sampleMemberDeformation(beam, r, 'm1', 20)
    expect(pts).toHaveLength(21)
    expect(pts[0].dispY).toBeCloseTo(r.nodeDisplacements['a'].v, 12)
    expect(pts[20].dispY).toBeCloseTo(r.nodeDisplacements['mid'].v, 12)
    expect(pts[0].dispX).toBeCloseTo(r.nodeDisplacements['a'].u, 12)
    expect(pts[20].dispX).toBeCloseTo(r.nodeDisplacements['mid'].u, 12)
  })

  it('matches the exact EB deflection at x = L/4 (point load, no distributed load)', () => {
    const pts = sampleMemberDeformation(beam, r, 'm1', 20)
    const atQuarter = pts[10] // xi = 0.5 of member 1 -> x = 1.25 m
    const x = 1.25
    const expected = -(P * x * (3 * L * L - 4 * x * x)) / (48 * EI)
    expect(atQuarter.x).toBeCloseTo(x, 9)
    expect(Math.abs(atQuarter.dispY - expected) / Math.abs(expected)).toBeLessThan(0.005)
  })

  it('peak nodal displacement is the loaded mid node at PL^3/(48EI)', () => {
    const peak = peakNodalDisplacement(r)
    expect(peak?.nodeId).toBe('mid')
    const expected = (P * L ** 3) / (48 * EI)
    expect(Math.abs((peak?.mag ?? 0) - expected) / expected).toBeLessThan(0.005)
  })

  it('is read-only: sampling does not mutate model or result', () => {
    const beforeModel = JSON.stringify(beam)
    const beforeResult = JSON.stringify(r.nodeDisplacements)
    sampleMemberDeformation(beam, r, 'm2', 40)
    peakNodalDisplacement(r)
    expect(JSON.stringify(beam)).toBe(beforeModel)
    expect(JSON.stringify(r.nodeDisplacements)).toBe(beforeResult)
  })

  it('returns [] for a missing member instead of fabricating points', () => {
    // @ts-expect-error deliberately unknown id
    expect(sampleMemberDeformation(beam, r, 'nope', 4)).toEqual([])
  })
})

describe('animation progress — deterministic interpolation parameter', () => {
  it('advances linearly with dt and speed', () => {
    const step = advanceProgress(0, ANIMATION_PERIOD_MS / 4, 1)
    expect(step.t).toBeCloseTo(0.25, 9)
    expect(step.done).toBe(false)
    const fast = advanceProgress(0, ANIMATION_PERIOD_MS / 4, 2)
    expect(fast.t).toBeCloseTo(0.5, 9)
  })

  it('clamps at t = 1 and reports done', () => {
    const end = advanceProgress(0.9, ANIMATION_PERIOD_MS, 1)
    expect(end.t).toBe(1)
    expect(end.done).toBe(true)
  })

  it('is deterministic and ignores non-positive dt', () => {
    expect(advanceProgress(0.3, 0, 1)).toEqual({ t: 0.3, done: false })
    expect(advanceProgress(0.3, 100, 1)).toEqual(advanceProgress(0.3, 100, 1))
  })
})
