/**
 * STRUKTURA sample engineering projects — directive §17.
 * Educational samples with independently known expected results (see the
 * `expected` note and benchmarks/solver-benchmarks.test.ts). They are NOT
 * approved real-world designs.
 */
import type { StructureModel } from '@/engine/model'
import { defaultSections } from '@/engine/model'
import { template1SimpleBeam, template2Cantilever, template3Portal } from '@/templates/examples'

export interface SampleProject {
  id: string
  title: string
  description: string
  expected: string
  build: () => StructureModel
}

function base(): StructureModel {
  return { nodes: {}, members: {}, supports: {}, sections: { ...defaultSections }, loads: {} }
}

/** Two equal continuous spans, UDL — coefficients 0.375 / 1.25 / −wL²/8. */
function twoSpanContinuous(): StructureModel {
  const m = base()
  m.nodes = {
    n1: { id: 'n1', x: 0, y: 0 }, n2: { id: 'n2', x: 5, y: 0 }, n3: { id: 'n3', x: 10, y: 0 },
  }
  m.members = {
    m1: { id: 'm1', a: 'n1', b: 'n2', section: 'iwf200' },
    m2: { id: 'm2', a: 'n2', b: 'n3', section: 'iwf200' },
  }
  m.supports = {
    n1: { nodeId: 'n1', type: 'pin' }, n2: { nodeId: 'n2', type: 'roller' }, n3: { nodeId: 'n3', type: 'roller' },
  }
  m.loads = {
    l1: { id: 'l1', type: 'distributed', memberId: 'm1', loadCaseId: 'dead', wStart: -10, wEnd: -10 },
    l2: { id: 'l2', type: 'distributed', memberId: 'm2', loadCaseId: 'dead', wStart: -10, wEnd: -10 },
  }
  return m
}

/** Pratt truss, 12 m span, 4 panels, panel-point loads. */
function truss2d(): StructureModel {
  const m = base()
  const nodes: StructureModel['nodes'] = {}
  for (let i = 0; i <= 4; i++) nodes[`b${i}`] = { id: `b${i}`, x: 3 * i, y: 0 }
  for (let i = 1; i <= 3; i++) nodes[`t${i}`] = { id: `t${i}`, x: 3 * i, y: 3 }
  m.nodes = nodes
  const members: StructureModel['members'] = {}
  let k = 0
  const add = (a: string, b: string) => {
    k++
    members[`m${k}`] = { id: `m${k}`, a, b, section: 'iwf150', memberType: 'truss' }
  }
  for (let i = 0; i < 4; i++) add(`b${i}`, `b${i + 1}`) // bottom chord
  add('b0', 't1'); add('t1', 't2'); add('t2', 't3'); add('t3', 'b4') // top chord
  add('t1', 'b1'); add('t2', 'b2'); add('t3', 'b3') // verticals
  add('t1', 'b2'); add('t3', 'b2') // diagonals to centre
  m.members = members
  m.supports = { b0: { nodeId: 'b0', type: 'pin' }, b4: { nodeId: 'b4', type: 'roller' } }
  m.loads = {
    l1: { id: 'l1', type: 'point', nodeId: 'b1', loadCaseId: 'live', fx: 0, fy: -15 },
    l2: { id: 'l2', type: 'point', nodeId: 'b2', loadCaseId: 'live', fx: 0, fy: -15 },
    l3: { id: 'l3', type: 'point', nodeId: 'b3', loadCaseId: 'live', fx: 0, fy: -15 },
  }
  return m
}

/** Generic rigid frame: `bays` × bayWidth, `storeys` × storeyHeight, beam UDL. */
function frame(bays: number, storeys: number, bayW: number, storeyH: number, w: number): StructureModel {
  const m = base()
  const nodes: StructureModel['nodes'] = {}
  const members: StructureModel['members'] = {}
  const supports: StructureModel['supports'] = {}
  const loads: StructureModel['loads'] = {}
  const nid = (col: number, lvl: number) => `n_${col}_${lvl}`
  for (let lvl = 0; lvl <= storeys; lvl++)
    for (let col = 0; col <= bays; col++)
      nodes[nid(col, lvl)] = { id: nid(col, lvl), x: col * bayW, y: lvl * storeyH }
  let mk = 0, lk = 0
  for (let lvl = 0; lvl < storeys; lvl++)
    for (let col = 0; col <= bays; col++) {
      mk++
      members[`m${mk}`] = { id: `m${mk}`, a: nid(col, lvl), b: nid(col, lvl + 1), section: 'rc300x500' }
    }
  for (let lvl = 1; lvl <= storeys; lvl++)
    for (let col = 0; col < bays; col++) {
      mk++
      const id = `m${mk}`
      members[id] = { id, a: nid(col, lvl), b: nid(col + 1, lvl), section: 'rc300x500' }
      lk++
      loads[`l${lk}`] = {
        id: `l${lk}`, type: 'distributed', memberId: id, loadCaseId: 'dead', wStart: w, wEnd: w,
      }
    }
  for (let col = 0; col <= bays; col++)
    supports[nid(col, 0)] = { nodeId: nid(col, 0), type: 'fixed' }
  m.nodes = nodes; m.members = members; m.supports = supports; m.loads = loads
  return m
}

export const SAMPLES: SampleProject[] = [
  {
    id: '01-simple-beam',
    title: '01 · Balok Tumpuan Sederhana',
    description: 'Balok baja, beban titik + beban merata (templat bawaan).',
    expected: 'Reaksi dari templat bawaan terverifikasi pada evidence run: Ry = 6 kN / 4 kN pada kedua tumpuan (lihat docs/NUMERICAL_VALIDATION.md).',
    build: template1SimpleBeam,
  },
  {
    id: '02-cantilever',
    title: '02 · Balok Kantilever',
    description: 'Kantilever dengan jepit di pangkal (templat bawaan).',
    expected: 'Reaksi pangkal Ry = 50 kN, Mz = 125 kN·m pada evidence run — sama dengan beban ujung yang diterapkan dan kesetimbangan P·L.',
    build: template2Cantilever,
  },
  {
    id: '03-two-span',
    title: '03 · Balok Menerus Dua Bentang',
    description: '2 bentang × 5 m, beban merata 10 kN/m, IWF 200.',
    expected: 'R_ujung = 0.375wL = 18.75 kN, R_tengah = 1.25wL = 62.5 kN, M_tumpuan = −wL²/8 = −31.25 kN·m (Benchmark 3, eksak).',
    build: twoSpanContinuous,
  },
  {
    id: '04-truss',
    title: '04 · Rangka Batang Pratt 2D',
    description: 'Bentang 12 m, 4 panel, beban titik simpul 3 × 15 kN.',
    expected: 'Kesetimbangan global: ΣRy = 45 kN, reaksi simetris 22.5 kN masing-masing; gaya batang tepi dengan metode titik simpul (Benchmark 4 mencakup kasus segitiga secara eksak).',
    build: truss2d,
  },
  {
    id: '05-portal-1',
    title: '05 · Portal Satu Lantai',
    description: 'Portal kaku (templat bawaan).',
    expected: 'Terselesaikan; reaksi tercatat pada evidence run (docs/NUMERICAL_VALIDATION.md). Invarian portal simetris adalah Benchmark 5.',
    build: template3Portal,
  },
  {
    id: '06-portal-2',
    title: '06 · Portal Dua Lantai',
    description: 'Bentang 6 m, 2 lantai × 3 m, beban merata balok 12 kN/m per lantai, pangkal jepit.',
    expected: 'Kesetimbangan global: ΣRy = 2 lantai × 12 kN/m × 6 m = 144 kN; terverifikasi oleh rangkaian uji contoh.',
    build: () => frame(1, 2, 6, 3, -12),
  },
  {
    id: '07-multistorey',
    title: '07 · Portal Tiga Lantai',
    description: '2 bentang × 6 m, 3 lantai × 3 m, beban merata balok 10 kN/m, pangkal jepit.',
    expected: 'Kesetimbangan global: ΣRy = 3 lantai × 2 bentang × 10 kN/m × 6 m = 360 kN; terverifikasi oleh rangkaian uji contoh.',
    build: () => frame(2, 3, 6, 3, -10),
  },
]
