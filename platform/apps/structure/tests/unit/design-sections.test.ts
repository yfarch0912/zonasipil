/**
 * Section-property and SNI design-formula tests against hand calculations.
 * Design references: SNI 2847:2019 (RC), SNI 1729:2020 / AISC 360 (steel helpers).
 * These verify the implemented subset only — see docs/SNI_IMPLEMENTATION_MATRIX.md
 * for what is UNSUPPORTED.
 */
import { describe, it, expect } from 'vitest'
import { buildParametricSection } from '@/engine/sections/compute'
import { beta1, asMin } from '@/engine/design/rc/codes/sni2847-19/rules'
import { phiMnProvided, vc } from '@/engine/design/rc/codes/sni2847-19/beam'
import { defaultRcCriteria } from '@/engine/design/rc/criteria'

const rel = (got: number, want: number) => Math.abs(got - want) / Math.abs(want)

describe('Section properties — hand-calculated', () => {
  it('rectangular 300×500: A = bh, I33 = bh³/12', () => {
    const s = buildParametricSection({
      id: 't', name: 'T', materialClass: 'concrete', shape: 'rect',
      dims: { b: 300, h: 500 }, strength: { fc: 25 },
    })
    expect(rel(s.A, 150000)).toBeLessThan(1e-9)
    expect(rel(s.I33, (300 * 500 ** 3) / 12)).toBeLessThan(1e-9)
    // S33 = I/(h/2) = 12.5×10⁶ mm³
    expect(rel(s.derived!.S33b, 12.5e6)).toBeLessThan(1e-6)
  })
  it('circular D=400: A = πD²/4, I = πD⁴/64', () => {
    const s = buildParametricSection({
      id: 't', name: 'T', materialClass: 'concrete', shape: 'circle',
      dims: { d: 400 }, strength: { fc: 25 },
    })
    expect(rel(s.A, (Math.PI * 400 ** 2) / 4)).toBeLessThan(1e-9)
    expect(rel(s.I33, (Math.PI * 400 ** 4) / 64)).toBeLessThan(1e-9)
  })
  it('IWF 200×100×5.5×8 area from flange+web rectangles', () => {
    const s = buildParametricSection({
      id: 't', name: 'T', materialClass: 'steel', shape: 'iwf',
      dims: { b: 100, h: 200, tf: 8, tw: 5.5 }, strength: { fy: 240, fu: 400, E: 200000 },
    })
    const want = 2 * 100 * 8 + (200 - 2 * 8) * 5.5
    expect(rel(s.A, want)).toBeLessThan(1e-9)
  })
})

describe('SNI 2847:2019 — verified subset', () => {
  it('β1 = 0.85 for fc = 25 MPa (Table 22.2.2.4.3)', () => {
    expect(beta1(25)).toBeCloseTo(0.85, 12)
    expect(beta1(35)).toBeCloseTo(0.85 - 0.05 * ((35 - 28) / 7), 12) // 0.80
  })
  it('As,min for b=300, d=440, fc=25, fy=400', () => {
    // max(0.25√fc/fy, 1.4/fy)·bw·d = max(0.003125, 0.0035)·300·440 = 462 mm²
    expect(rel(asMin(25, 400, 300, 440), 462)).toBeLessThan(1e-9)
  })
  it('Vc = 0.17λ√fc·bw·d (22.5.5.1) = 112.2 kN for bw=300, d=440, fc=25', () => {
    expect(rel(vc(1, 25, 300, 440), 112.2)).toBeLessThan(1e-9)
  })
  it('φMn of 300×440 beam, As = 1473 mm² (3D25), fc=25, fy=400 — textbook hand calc', () => {
    // Hand calc: a = As·fy/(0.85·fc·b) = 92.42 mm; Mn = As·fy·(d − a/2) = 232.0 kN·m
    // c = a/β1 = 108.7 mm → εt = 0.00914 > 0.005 → φ = 0.90 → φMn = 208.8 kN·m
    const cr = { ...defaultRcCriteria(), fy: 400, fyt: 400 }
    const g = { b: 300, d: 440, dPrimeC: 60, fc: 25 }
    const r = phiMnProvided(1473, 0, g, cr)
    expect(rel(r.Mn, 232.0)).toBeLessThan(0.005)
    expect(rel(r.phiMn, 208.8)).toBeLessThan(0.005)
    expect(r.phi).toBeCloseTo(0.9, 6)
  })
})
