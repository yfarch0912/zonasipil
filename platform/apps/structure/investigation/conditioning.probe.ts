/**
 * Phase 3 Workstream C probe: rho (production solver diagnostic) versus
 * kappa2(K) computed INDEPENDENTLY in this file: the reduced stiffness
 * matrix of the Phase 2 near-parallel-bars family is assembled here from
 * the textbook DSM element stiffness, and singular values come from a
 * cyclic-Jacobi eigensolver written for this investigation (for a
 * symmetric matrix, singular values = |eigenvalues|). The solver itself
 * is only used through its public analyze() to obtain rho/residual/
 * rotation/classification. Matrices are dumped to
 * investigation/conditioning-data.json for a numpy cross-check.
 */
import { describe, it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { analyze } from '@/engine/solver'
import type { StructureModel, Section } from '@/engine/model'

const SEC: Section = { id: 's1', name: 'TEST', E: 200000, I33: 80e6, A: 5000 }
const E = 200000 * 1000 // MPa -> kN/m^2
const A = 5000e-6       // mm^2 -> m^2
const I = 80e6 * 1e-12  // mm^4 -> m^4

function model(delta: number, memberType: 'frame' | 'truss'): StructureModel {
  const vx = delta / 2 - 5, vy = -5, nrm = Math.hypot(vx, vy)
  return {
    nodes: { a: { id: 'a', x: 0, y: 0 }, b: { id: 'b', x: delta, y: 0 }, c: { id: 'c', x: 5, y: 5 } },
    members: {
      m1: { id: 'm1', a: 'a', b: 'c', section: 's1', memberType },
      m2: { id: 'm2', a: 'b', b: 'c', section: 's1', memberType },
    },
    supports: { a: { nodeId: 'a', type: 'pin' }, b: { nodeId: 'b', type: 'pin' } },
    sections: { s1: SEC },
    loads: { l1: { id: 'l1', type: 'point', nodeId: 'c', loadCaseId: 'dead', fx: (10 * vx) / nrm, fy: (10 * vy) / nrm } },
  }
}

/** Cyclic Jacobi eigenvalue algorithm for symmetric matrices. */
function jacobiEigenvalues(Min: number[][]): number[] {
  const n = Min.length
  const M = Min.map((r) => [...r])
  for (let sweep = 0; sweep < 100; sweep++) {
    let off = 0
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += M[p][q] * M[p][q]
    if (Math.sqrt(off) < 1e-300) break
    for (let p = 0; p < n - 1; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(M[p][q]) < 1e-300) continue
      const tau = (M[q][q] - M[p][p]) / (2 * M[p][q])
      // Stable tangent formula; tau=0 (equal diagonals) must give t=1 (45 deg),
      // NOT 0 — an earlier Math.sign(tau) form returned t=0 there and silently
      // reported kappa=1 for exactly-equilibrated 2x2 blocks. Fixed in-probe.
      const t = tau >= 0 ? 1 / (tau + Math.sqrt(1 + tau * tau)) : -1 / (-tau + Math.sqrt(1 + tau * tau))
      const c = 1 / Math.sqrt(1 + t * t), s = t * c
      for (let k = 0; k < n; k++) {
        const mkp = M[k][p], mkq = M[k][q]
        M[k][p] = c * mkp - s * mkq; M[k][q] = s * mkp + c * mkq
      }
      for (let k = 0; k < n; k++) {
        const mpk = M[p][k], mqk = M[q][k]
        M[p][k] = c * mpk - s * mqk; M[q][k] = s * mpk + c * mqk
      }
    }
  }
  return M.map((r, i) => r[i])
}
const kappa = (K: number[][]) => {
  const ev = jacobiEigenvalues(K).map(Math.abs).sort((x, y) => x - y)
  return { k: ev[ev.length - 1] / ev[0], lmin: ev[0], lmax: ev[ev.length - 1] }
}
const equilibrate = (K: number[][]) => {
  const s = K.map((r, i) => 1 / Math.sqrt(Math.abs(K[i][i])))
  return K.map((row, i) => row.map((v, j) => v * s[i] * s[j]))
}

/** Assemble the reduced (free-DOF) stiffness matrix independently. */
function assemble(delta: number, memberType: 'frame' | 'truss'): { dofs: string[]; K: number[][] } {
  const nodes: Record<string, [number, number]> = { a: [0, 0], b: [delta, 0], c: [5, 5] }
  if (memberType === 'truss') {
    // Free DOFs: c/u, c/v. Axial-only stiffness.
    const K = [[0, 0], [0, 0]]
    for (const s of ['a', 'b'] as const) {
      const [x1, y1] = nodes[s]; const [x2, y2] = nodes.c
      const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy)
      const d = [dx / L, dy / L], k = (E * A) / L
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) K[i][j] += k * d[i] * d[j]
    }
    return { dofs: ['c/u', 'c/v'], K }
  }
  // Frame: free DOFs a/th, b/th, c/u, c/v, c/th (pins restrain a,b translations).
  const idx: Record<string, number> = { 'a/θ': 0, 'b/θ': 1, 'c/u': 2, 'c/v': 3, 'c/θ': 4 }
  const K = Array.from({ length: 5 }, () => new Array(5).fill(0))
  const add = (dof: string, row: number[], vals: Record<string, number>) => {
    const i = idx[dof]; for (const [d2, v] of Object.entries(vals)) K[i][idx[d2]] += v; void row
  }
  for (const s of ['a', 'b'] as const) {
    const [x1, y1] = nodes[s]; const [x2, y2] = nodes.c
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy)
    const cx = dx / L, cy = dy / L
    const ka = (E * A) / L, k1 = (12 * E * I) / L ** 3, k2 = (6 * E * I) / L ** 2, k3 = (4 * E * I) / L, k4 = (2 * E * I) / L
    // Global stiffness rows for c/u, c/v, c/th and s/th from the standard
    // transformed 6x6 frame element (Euler-Bernoulli).
    // Local axes: x' along member, y' perpendicular (-cy, cx)... use standard T.
    // Element global stiffness (both ends), DOFs [s/u,s/v,s/th, c/u,c/v,c/th]:
    const ke = [
      [ka, 0, 0, -ka, 0, 0],
      [0, k1, k2, 0, -k1, k2],
      [0, k2, k3, 0, -k2, k4],
      [-ka, 0, 0, ka, 0, 0],
      [0, -k1, -k2, 0, k1, -k2],
      [0, k2, k4, 0, -k2, k3],
    ]
    // Rotation matrix (block diag per node): [cx cy 0; -cy cx 0; 0 0 1]
    const R = [cx, cy, -cy, cx]
    const rot = (v: number[]) => {
      const o = new Array(6).fill(0)
      for (let nd = 0; nd < 2; nd++) {
        const b = nd * 3
        o[b] = R[0] * v[b] + R[1] * v[b + 1]
        o[b + 1] = R[2] * v[b] + R[3] * v[b + 1]
        o[b + 2] = v[b + 2]
      }
      return o
    }
    // Kg = T^T ke T  where T maps global->local via rot on vectors.
    const tmp = ke.map((row) => rot(row.map((_, j) => row[j]))) // placeholder, replaced below
    void tmp
    // Compute Kg properly: Kg[i][j] = sum_ab T[a][i] ke[a][b] T[b][j]; with T block = [[cx, cy,0],[-cy,cx,0],[0,0,1]] per node (local = T * global).
    const T: number[][] = Array.from({ length: 6 }, () => new Array(6).fill(0))
    for (let nd = 0; nd < 2; nd++) {
      const b = nd * 3
      T[b][b] = cx; T[b][b + 1] = cy; T[b + 1][b] = -cy; T[b + 1][b + 1] = cx; T[b + 2][b + 2] = 1
    }
    const Kg = Array.from({ length: 6 }, () => new Array(6).fill(0))
    for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) {
      let ssum = 0
      for (let a2 = 0; a2 < 6; a2++) for (let b2 = 0; b2 < 6; b2++) ssum += T[a2][i] * ke[a2][b2] * T[b2][j]
      Kg[i][j] = ssum
    }
    const dofNames = [`${s}/u`, `${s}/v`, `${s}/θ`, 'c/u', 'c/v', 'c/θ']
    for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) {
      const di = idx[dofNames[i]], dj = idx[dofNames[j]]
      if (di !== undefined && dj !== undefined) K[di][dj] += Kg[i][j]
    }
    void add
  }
  return { dofs: ['a/θ', 'b/θ', 'c/u', 'c/v', 'c/θ'], K }
}

describe('probe: conditioning study', () => {
  it('sweeps delta for truss and frame', () => {
    const rows: Record<string, unknown>[] = []
    const dump: Record<string, unknown> = {}
    for (const type of ['truss', 'frame'] as const) {
      for (const d of [1e-1, 3e-2, 1e-2, 3e-3, 1e-3, 5e-4, 3e-4, 2e-4, 1e-4, 5e-5, 3e-5, 1e-5, 3e-6, 1e-6]) {
        const { K } = assemble(d, type)
        const raw = kappa(K)
        const eq = kappa(equilibrate(K))
        const r = analyze(model(d, type))
        const row: Record<string, unknown> = {
          type, delta: d, kappaRaw: raw.k, kappaEquilibrated: eq.k,
          solverOk: r.ok,
          rho: r.ok ? r.numerical.equilibratedPivotRatio : null,
          classification: r.ok ? r.numerical.classification : 'SOLVE_FAILED',
          residual: r.ok ? r.numerical.relativeResidual : null,
          maxRot: r.ok ? Math.max(Math.abs(r.numerical.maxAbsRotation.value), Math.abs(r.numerical.maxChordRotation?.value ?? 0)) : null,
        }
        rows.push(row)
        dump[`${type}:${d}`] = { K, Keq: equilibrate(K) }
        console.log(`${type} d=${d}: rho=${r.ok ? r.numerical.equilibratedPivotRatio.toExponential(3) : 'FAIL'} kRaw=${raw.k.toExponential(3)} kEq=${eq.k.toExponential(3)} class=${row.classification}`)
      }
    }
    writeFileSync('investigation/conditioning-data.json', JSON.stringify({ rows, dump }, null, 1))
  })
})
