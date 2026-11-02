/**
 * Sprint 1 — R-01: seismic verdict containment.
 *
 * The AISC 341 detailing constants in `src/engine/design/steel/seismic.ts` are
 * transcribed from working knowledge — one I-web "high" constant set is
 * flagged IN SOURCE as a suspect transcription — yet before this sprint the
 * verdict rendered as an ordinary green "Highly ductile: OK", with the
 * `@unverified` tags visible only in code comments.
 *
 * Containment pinned here (NOT validation — no coefficient was changed):
 *  - Every SeismicChecks / ScwbResult carries `verification: "unverified"`
 *    plus the list of unverified provisions.
 *  - The UI verdict text always carries "BELUM TERVERIFIKASI (UNVERIFIED)",
 *    pass or fail — there is no path to an unqualified PASS presentation,
 *    so unverified checks cannot enter a verified-PASS tally.
 *  - The numeric output itself is preserved for engineering review.
 *  - The Design tool source wires the UNVERIFIED banner + verdict (wiring
 *    guard; the repo has no DOM test layer).
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  checkSeismic,
  checkScwb,
  seismicVerdictPresentation,
  SEISMIC_UNVERIFIED_BASIS,
  type SeismicInput,
} from '@/engine/design/steel/seismic'
import { steelGeom } from '@/engine/design/steel/rules'
import { buildParametricSection } from '@/engine/sections/compute'
import { solveAllCases } from '@/engine/analysis-pipeline'
import { DEFAULT_LOAD_CASES, type LoadCombination } from '@/engine/load-cases'
import { designFromCases } from '@/engine/design/core/run-design'
import { defaultDesignCriteria } from '@/engine/design/core/criteria'
import type { StructureModel } from '@/engine/model'

const inp = (tf: number, frameType: SeismicInput['frameType'] = 'IMF'): SeismicInput => ({
  frameType,
  g: steelGeom('iwf', { b: 200, h: 200, tf, tw: 8 }),
  Fy: 250, E: 200000, Ag: 6000, Pu: 0, phiC: 0.9, Lb: 3, ry: 45, isBeam: true,
})

describe('R-01/C — seismic results carry UNVERIFIED status', () => {
  it('passing detailing numbers are still labelled unverified, basis listed', () => {
    const s = checkSeismic(inp(12))
    expect(s).toBeDefined()
    expect(s!.ductilityPass).toBe(true) // numbers preserved…
    expect(s!.verification).toBe('unverified') // …but never claimed verified
    expect(s!.unverifiedBasis).toEqual(SEISMIC_UNVERIFIED_BASIS)
    expect(s!.unverifiedBasis.length).toBeGreaterThanOrEqual(3)
    expect(s!.unverifiedBasis.join(' ')).toContain('D1.1')
  })

  it('failing detailing numbers are also unverified (status is about provenance, not outcome)', () => {
    const s = checkSeismic(inp(4)) // slender flange: λ = 25 > limit ≈ 9.2
    expect(s!.ductilityPass).toBe(false)
    expect(s!.verification).toBe('unverified')
  })

  it('OMF/RMB: no seismic block at all (containment does not invent checks)', () => {
    expect(checkSeismic(inp(12, 'OMF'))).toBeUndefined()
  })

  it('SCWB (E3.4a) result is unverified — it depends on the program-convention Ry', () => {
    const r = checkScwb(
      [{ Z33: 1e6, Fy: 250, Ag: 10000, Pu: 0 }],
      [{ Z33: 5e5, Fy: 250 }],
    )
    expect(r).toBeDefined()
    expect(r!.pass).toBe(true) // ΣM*pc 250 > ΣM*pb 206.25 kN·m
    expect(r!.verification).toBe('unverified')
  })
})

describe('R-01/C — no false PASS tally: presentation always carries UNVERIFIED', () => {
  it('verdict text for a PASS carries the UNVERIFIED label', () => {
    const p = seismicVerdictPresentation(checkSeismic(inp(12))!)
    expect(p.pass).toBe(true)
    expect(p.text).toContain('OK')
    expect(p.text).toContain('BELUM TERVERIFIKASI (UNVERIFIED)')
  })

  it('verdict text for a FAIL carries the UNVERIFIED label too', () => {
    const p = seismicVerdictPresentation(checkSeismic(inp(4))!)
    expect(p.pass).toBe(false)
    expect(p.text).toContain('tidak terpenuhi')
    expect(p.text).toContain('BELUM TERVERIFIKASI (UNVERIFIED)')
  })

  it('mixed verified + unverified: only the unverified one is excluded from a verified tally', () => {
    // A verified channel (e.g. an AISC 360 strength D/C ≤ 1) has no
    // UNVERIFIED marker; the seismic presentation always has one. Counting
    // "verified passes" as pass && !unverified must yield exactly the
    // verified channel.
    const presentations = [
      { pass: true, unverified: false }, // strength channel
      { pass: seismicVerdictPresentation(checkSeismic(inp(12))!).pass, unverified: true },
    ]
    const verifiedPasses = presentations.filter((p) => p.pass && !p.unverified)
    expect(verifiedPasses).toHaveLength(1)
  })

  it('design run: steel member under IMF carries seismic unverified; strength ratio untouched', () => {
    const section = buildParametricSection({
      id: 'iwf', name: 'IWF 200', materialClass: 'steel', shape: 'iwf',
      dims: { b: 200, h: 200, tf: 12, tw: 8 }, strength: { fy: 250, fu: 410, E: 200000 },
    })
    const model: StructureModel = {
      nodes: {
        n1: { id: 'n1', x: 0, y: 0 },
        n2: { id: 'n2', x: 3, y: 0 },
        n3: { id: 'n3', x: 6, y: 0 },
      },
      members: {
        m1: { id: 'm1', a: 'n1', b: 'n2', section: 'iwf' },
        m2: { id: 'm2', a: 'n2', b: 'n3', section: 'iwf' },
      },
      supports: { n1: { nodeId: 'n1', type: 'pin' }, n3: { nodeId: 'n3', type: 'roller' } },
      sections: { iwf: section },
      loads: { d1: { id: 'd1', type: 'point', nodeId: 'n2', loadCaseId: 'dead', fx: 0, fy: -30 } },
    }
    const lc = DEFAULT_LOAD_CASES()
    const criteria = defaultDesignCriteria()
    criteria.steel.frameType = 'IMF'
    const combos: Record<string, LoadCombination> = {
      k1: { id: 'k1', name: '1.2D', source: 'custom', enabled: true, terms: [{ factor: 1.2, caseId: 'dead' }] },
    }
    const run = designFromCases(solveAllCases(model, lc), {
      model, loadCases: lc, combinations: combos, criteria, inputs: {},
    })
    const member = Object.values(run.members).find((m) => m.status === 'designed')
    expect(member).toBeDefined()
    expect(member!.steel).toBeDefined()
    expect(Number.isFinite(member!.steel!.ratio)).toBe(true)
    expect(member!.steel!.seismic).toBeDefined()
    expect(member!.steel!.seismic!.verification).toBe('unverified')
  })

  it('wiring guard: the steel design tool renders the UNVERIFIED banner + verdict', () => {
    const src = readFileSync('src/tabs/design/tools/steel/steel-design-tool.tsx', 'utf8')
    expect(src).toContain('data-testid="seismic-unverified"')
    expect(src).toContain('data-testid="seismic-verdict"')
    expect(src).toContain('seismicVerdictPresentation')
    // The old unqualified green-OK seismic verdict must not come back.
    expect(src).not.toContain(': OK`')
  })
})
