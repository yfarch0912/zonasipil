/**
 * Sprint 2 — P2 (R-06): unified verdict taxonomy.
 *
 * Pins the taxonomy's invariants:
 *   - precedence FAIL > INCOMPLETE > UNSUPPORTED > UNVERIFIED >
 *     NOT_EVALUATED > PASS, worst wins, reasons preserved;
 *   - an empty rollup is NOT_EVALUATED, never a default PASS;
 *   - UNVERIFIED never counts as a verified pass;
 *   - a member cannot be PASS with INCOMPLETE demands or an UNVERIFIED
 *     governing channel (steel seismic, R-01);
 *   - a whole-run PASS is never inferred from a subset of members;
 *   - analysis classifications map onto the same language.
 *
 * Member fixtures are fabricated MemberDesignResult objects (the channel
 * fields are the primary record the rollup reads); two integration cases
 * run the real design pipeline end to end.
 */
import { describe, it, expect } from 'vitest'
import {
  combineVerdicts,
  verdict,
  isVerifiedPass,
  memberVerdict,
  jointVerdict,
  designRunVerdict,
  analysisVerdict,
  seismicVerdict,
  VERDICT_SEVERITY,
} from '@/engine/design/core/verdict'
import type {
  DesignRunResult,
  JointCheckResult,
  MemberDesignResult,
  VerdictStatus,
} from '@/engine/design/core/types'
import { solveAllCases } from '@/engine/analysis-pipeline'
import { DEFAULT_LOAD_CASES, type LoadCase, type LoadCombination } from '@/engine/load-cases'
import { designFromCases } from '@/engine/design/core/run-design'
import { defaultDesignCriteria } from '@/engine/design/core/criteria'
import { buildParametricSection } from '@/engine/sections/compute'
import type { StructureModel } from '@/engine/model'

describe('P2 — precedence and combination rules', () => {
  const ORDER: VerdictStatus[] = ['FAIL', 'INCOMPLETE', 'UNSUPPORTED', 'UNVERIFIED', 'NOT_EVALUATED', 'PASS']

  it('severity order matches the documented precedence', () => {
    for (let i = 0; i < ORDER.length - 1; i++) {
      expect(VERDICT_SEVERITY[ORDER[i]]).toBeGreaterThan(VERDICT_SEVERITY[ORDER[i + 1]])
    }
  })

  it('every pair combines to the worse status, reasons preserved', () => {
    for (const a of ORDER) {
      for (const b of ORDER) {
        const combined = combineVerdicts([verdict(a, `r-${a}`), verdict(b, `r-${b}`)])
        const expected = VERDICT_SEVERITY[a] >= VERDICT_SEVERITY[b] ? a : b
        expect(combined.status).toBe(expected)
        expect(combined.reasons).toEqual([`r-${a}`, `r-${b}`])
      }
    }
  })

  it('all-PASS combines to PASS; empty rollup is NOT_EVALUATED, never PASS', () => {
    expect(combineVerdicts([verdict('PASS'), verdict('PASS')]).status).toBe('PASS')
    expect(combineVerdicts([]).status).toBe('NOT_EVALUATED')
  })

  it('UNVERIFIED is not a verified pass', () => {
    expect(isVerifiedPass(verdict('UNVERIFIED'))).toBe(false)
    expect(isVerifiedPass(verdict('PASS'))).toBe(true)
    expect(combineVerdicts([verdict('PASS'), verdict('UNVERIFIED')]).status).toBe('UNVERIFIED')
  })
})

describe('P2 — analysis and seismic mappings', () => {
  it('analysis classifications map onto the taxonomy', () => {
    expect(analysisVerdict('VALID').status).toBe('PASS')
    expect(analysisVerdict('ILL_CONDITIONED').status).toBe('UNVERIFIED')
    expect(analysisVerdict('PHYSICALLY_IMPLAUSIBLE').status).toBe('FAIL')
    expect(analysisVerdict('NUMERICALLY_UNRELIABLE').status).toBe('FAIL')
    expect(analysisVerdict('SINGULAR').status).toBe('FAIL')
  })

  it('seismic: pass is UNVERIFIED (R-01), fail is FAIL', () => {
    expect(seismicVerdict(true).status).toBe('UNVERIFIED')
    expect(seismicVerdict(false).status).toBe('FAIL')
  })

  it('joints: RC pass/fail are PASS/FAIL; steel unverified pass is UNVERIFIED', () => {
    const rc: JointCheckResult = { nodeId: 'n1', sumMnc: 100, sumMnb: 50, ratio: 1.67, pass: true, columnIds: [] }
    expect(jointVerdict(rc).status).toBe('PASS')
    expect(jointVerdict({ ...rc, pass: false, ratio: 0.5 }).status).toBe('FAIL')
    const steel: JointCheckResult = { ...rc, material: 'steel', verification: 'unverified' }
    expect(jointVerdict(steel).status).toBe('UNVERIFIED')
    expect(jointVerdict({ ...steel, pass: false }).status).toBe('FAIL')
  })
})

const baseMember = (over: Partial<MemberDesignResult>): MemberDesignResult => ({
  memberId: 'm1',
  status: 'designed',
  material: 'rc',
  kind: 'beam',
  zones: {
    'end-i': {
      flexure: { MuPos: 10, MuNeg: -10, dc: 0.5, adequate: true },
      shear: { Vu: 10, Vdesign: 10, phiVc: 50, phiVmax: 100, pass: true, crossSectionOk: true },
    },
    midspan: {
      flexure: { MuPos: 10, MuNeg: -10, dc: 0.4, adequate: true },
      shear: { Vu: 10, Vdesign: 10, phiVc: 50, phiVmax: 100, pass: true, crossSectionOk: true },
    },
    'end-j': {
      flexure: { MuPos: 10, MuNeg: -10, dc: 0.5, adequate: true },
      shear: { Vu: 10, Vdesign: 10, phiVc: 50, phiVmax: 100, pass: true, crossSectionOk: true },
    },
  },
  ...over,
})

describe('P2 — member verdicts', () => {
  it('clean designed RC beam → PASS', () => {
    expect(memberVerdict(baseMember({})).status).toBe('PASS')
  })

  it('flexure D/C > 1 → FAIL; shear failure → FAIL', () => {
    const m = baseMember({})
    m.zones!['midspan'].flexure.dc = 1.2
    expect(memberVerdict(m).status).toBe('FAIL')
    const m2 = baseMember({})
    m2.zones!['end-i'].shear.pass = false
    expect(memberVerdict(m2).status).toBe('FAIL')
  })

  it('incomplete demands block PASS → INCOMPLETE', () => {
    const v = memberVerdict(baseMember({ demandsIncomplete: true }))
    expect(v.status).toBe('INCOMPLETE')
    expect(v.reasons.join(' ')).toContain('PARSIAL')
  })

  it('FAIL + INCOMPLETE → FAIL (precedence), both reasons preserved', () => {
    const m = baseMember({ demandsIncomplete: true })
    m.zones!['end-j'].flexure.adequate = false
    m.zones!['end-j'].flexure.dc = Infinity
    const v = memberVerdict(m)
    expect(v.status).toBe('FAIL')
    expect(v.reasons.length).toBeGreaterThanOrEqual(2)
  })

  it('pre-taxonomy statuses map without defaulting to PASS', () => {
    expect(memberVerdict({ memberId: 'x', status: 'not-implemented', note: 'n/a' }).status).toBe('UNSUPPORTED')
    expect(memberVerdict({ memberId: 'x', status: 'not-designable', note: 'n/a' }).status).toBe('UNSUPPORTED')
    expect(memberVerdict({ memberId: 'x', status: 'no-result' }).status).toBe('NOT_EVALUATED')
    expect(memberVerdict({ memberId: 'x', status: 'axial-exceeded' }).status).toBe('FAIL')
  })

  it('column channels: interaction D/C, confinement, SCWB all gate the verdict', () => {
    const colBase: MemberDesignResult = {
      memberId: 'c1', status: 'designed', material: 'rc', kind: 'column',
      column: { rhoG: 0.01, Ast: 1000, worstDC: 0.8, adequate: true },
    }
    expect(memberVerdict(colBase).status).toBe('PASS')
    expect(memberVerdict({ ...colBase, column: { ...colBase.column!, worstDC: 1.3 } }).status).toBe('FAIL')
    expect(memberVerdict({
      ...colBase,
      column: { ...colBase.column!, confinement: [{ status: 'fail', text: 't', clause: '18.7.5' }] },
    }).status).toBe('FAIL')
    expect(memberVerdict({ ...colBase, column: { ...colBase.column!, scwbPass: false } }).status).toBe('FAIL')
  })

  it('steel member with passing seismic checks is capped at UNVERIFIED', () => {
    const steel: MemberDesignResult = {
      memberId: 's1', status: 'designed', material: 'steel', kind: 'beam',
      steel: {
        sectionClass: 'Compact', axialClass: 'Compact', ratio: 0.5, equation: 'H1-1a',
        PcComp: 100, PcTens: 100, Mc33: 100, Vc: 100, Pn: 100, Mn: 100, Mp: 100, Vn: 100,
        flexureLimit: 'LTB', Vr: 100, shearRatio: 0.3, PrMax: 10, MrMax: 10, pass: true,
        warnings: [],
        seismic: {
          frameType: 'SMF', level: 'high', ductilityPass: true, verification: 'unverified',
          elements: [], checks: [],
        } as unknown as NonNullable<MemberDesignResult['steel']>['seismic'],
      },
    }
    expect(memberVerdict(steel).status).toBe('UNVERIFIED')
    const failed = structuredClone(steel)
    ;(failed.steel!.seismic as { ductilityPass: boolean }).ductilityPass = false
    expect(memberVerdict(failed).status).toBe('FAIL')
    const noSeismic = structuredClone(steel)
    delete noSeismic.steel!.seismic
    expect(memberVerdict(noSeismic).status).toBe('PASS')
  })
})

describe('P2 — whole-run verdicts', () => {
  const runWith = (members: Record<string, MemberDesignResult>, over: Partial<DesignRunResult> = {}): DesignRunResult => ({
    ok: true, issues: [], members, joints: [],
    failedCases: [], skippedCombos: [], incompleteCombos: [],
    gravityComboMissing: false, gravityComboIncomplete: false,
    ...over,
  })

  it('all members PASS → run PASS', () => {
    expect(designRunVerdict(runWith({ m1: baseMember({}) })).status).toBe('PASS')
  })

  it('one UNSUPPORTED member blocks the run PASS (no subset inference)', () => {
    const run = runWith({ m1: baseMember({}), m2: { memberId: 'm2', status: 'not-designable', note: 'x' } })
    expect(designRunVerdict(run).status).toBe('UNSUPPORTED')
  })

  it('run-level incompleteness (skipped combo, missing gravity) blocks PASS', () => {
    expect(designRunVerdict(runWith({ m1: baseMember({}) }, {
      skippedCombos: [{ comboId: 'k', name: 'K' }],
    })).status).toBe('INCOMPLETE')
    expect(designRunVerdict(runWith({ m1: baseMember({}) }, {
      gravityComboMissing: true,
    })).status).toBe('INCOMPLETE')
  })

  it('a failed run (!ok) is INCOMPLETE; an empty run is NOT_EVALUATED', () => {
    expect(designRunVerdict({ ok: false, issues: ['x'], members: {} }).status).toBe('INCOMPLETE')
    expect(designRunVerdict(runWith({})).status).toBe('NOT_EVALUATED')
  })
})

describe('P2 — integration through the real design pipeline', () => {
  const rcSection = buildParametricSection({
    id: 'beton', name: 'B 300x500', materialClass: 'concrete', shape: 'rect',
    dims: { b: 300, h: 500 }, strength: { fc: 25 },
  })
  const SEC = { id: 's1', name: 'T', E: 200000, I33: 80e6, A: 5000, gamma: 0 }
  const beam = (loads: StructureModel['loads']): StructureModel => ({
    nodes: {
      n1: { id: 'n1', x: 0, y: 0 }, n2: { id: 'n2', x: 3, y: 0 }, n3: { id: 'n3', x: 6, y: 0 },
    },
    members: {
      m1: { id: 'm1', a: 'n1', b: 'n2', section: 's1' },
      m2: { id: 'm2', a: 'n2', b: 'n3', section: 's1' },
    },
    supports: { n1: { nodeId: 'n1', type: 'pin' }, n3: { nodeId: 'n3', type: 'roller' } },
    sections: { s1: SEC },
    loads,
  })
  const pt = (id: string, loadCaseId: string, fy: number) => ({
    id, type: 'point' as const, nodeId: 'n2', loadCaseId, fx: 0, fy,
  })
  const LIVE: LoadCase = { id: 'live', name: 'Beban Hidup', kind: 'Live', enabled: true }
  const combo = (id: string, name: string, terms: { factor: number; caseId: string }[]): LoadCombination => ({
    id, name, terms, source: 'custom', enabled: true,
  })

  it('clean run: members carry verdicts and the run verdict is a real status', () => {
    const lc = { ...DEFAULT_LOAD_CASES(), live: LIVE }
    const model = { ...beam({ d1: pt('d1', 'dead', -10), l1: pt('l1', 'live', -20) }), sections: { s1: { ...rcSection, id: 's1' } } }
    const run = designFromCases(solveAllCases(model, lc), {
      model, loadCases: lc,
      combinations: { k1: combo('k1', '1.2D + 1.6L', [{ factor: 1.2, caseId: 'dead' }, { factor: 1.6, caseId: 'live' }]) },
      criteria: defaultDesignCriteria(),
      inputs: {},
    })
    expect(run.ok).toBe(true)
    for (const m of Object.values(run.members)) {
      expect(m.verdict).toBeDefined()
      expect(m.verdict!.status).toBe(memberVerdict(m).status)
    }
    expect(run.verdict).toBeDefined()
    // The rollup must equal the combination of the member verdicts for a
    // structurally clean run.
    expect(run.verdict!.status).toBe(
      combineVerdicts(Object.values(run.members).map((m) => m.verdict!)).status,
    )
  })

  it('partial-combination run: run verdict is INCOMPLETE, members INCOMPLETE-or-worse', () => {
    const lc = { ...DEFAULT_LOAD_CASES(), live: LIVE, wind: { id: 'wind', name: 'Angin', kind: 'Wind' as const, enabled: false } }
    const model = { ...beam({ d1: pt('d1', 'dead', -10), l1: pt('l1', 'live', -20) }), sections: { s1: { ...rcSection, id: 's1' } } }
    const run = designFromCases(solveAllCases(model, lc), {
      model, loadCases: lc,
      combinations: { k1: combo('k1', '1.2D + 1.0W', [{ factor: 1.2, caseId: 'dead' }, { factor: 1.0, caseId: 'wind' }]) },
      criteria: defaultDesignCriteria(),
      inputs: {},
    })
    expect(run.verdict!.status).toBe('INCOMPLETE')
    const designed = Object.values(run.members).filter((m) => m.status === 'designed')
    expect(designed.length).toBeGreaterThan(0)
    for (const m of designed) {
      expect(['INCOMPLETE', 'FAIL']).toContain(m.verdict!.status)
      expect(m.verdict!.status).not.toBe('PASS')
    }
  })
})
