import type { StructureModel, MemberId } from "@/engine/model"
import type { AnalysisResult } from "@/engine/solver"

/**
 * Read-only visualization adapter over existing solver results.
 *
 * Deformation sampling uses the cubic Hermite shape functions of the
 * Euler–Bernoulli frame element — the same formulation the canvas
 * renderer uses, and the same shape functions the solver's element
 * interpolation is built on. Given the solver's nodal translations
 * and rotations, this reproduces the finite-element displacement
 * field between nodes. It is exact for members without distributed
 * loads (where the EB solution is cubic); under distributed loads
 * the true elastic curve is higher-order and the Hermite field is
 * the element-consistent representation of the FE result, which is
 * what professional FE postprocessors draw. This adapter never
 * modifies the model or the result.
 */

export interface DeformedPoint {
  /** Position along the member, 0 at node A, 1 at node B. */
  xi: number
  /** Undeformed world coordinates (m). */
  x: number
  y: number
  /** Solver displacement at this point (m), unscaled. */
  dispX: number
  dispY: number
  /** Displacement magnitude (m). */
  mag: number
}

export function sampleMemberDeformation(
  model: StructureModel,
  result: AnalysisResult,
  memberId: MemberId,
  segments = 20,
): DeformedPoint[] {
  const member = model.members[memberId]
  if (!member) return []
  const nA = model.nodes[member.a]
  const nB = model.nodes[member.b]
  const dA = result.nodeDisplacements[member.a]
  const dB = result.nodeDisplacements[member.b]
  if (!nA || !nB || !dA || !dB) return []
  const dx = nB.x - nA.x
  const dy = nB.y - nA.y
  const L = Math.hypot(dx, dy)
  if (L < 1e-9) return []
  const c = dx / L
  const s = dy / L
  const u1 = c * dA.u + s * dA.v
  const v1 = -s * dA.u + c * dA.v
  const th1 = dA.theta
  const u2 = c * dB.u + s * dB.v
  const v2 = -s * dB.u + c * dB.v
  const th2 = dB.theta

  const pts: DeformedPoint[] = []
  for (let i = 0; i <= segments; i++) {
    const xi = i / segments
    const uLoc = (1 - xi) * u1 + xi * u2
    const H1 = 1 - 3 * xi * xi + 2 * xi * xi * xi
    const H2 = L * xi * (1 - xi) * (1 - xi)
    const H3 = 3 * xi * xi - 2 * xi * xi * xi
    const H4 = L * xi * xi * (xi - 1)
    const vLoc = H1 * v1 + H2 * th1 + H3 * v2 + H4 * th2
    const dispX = c * uLoc - s * vLoc
    const dispY = s * uLoc + c * vLoc
    pts.push({
      xi,
      x: nA.x + xi * dx,
      y: nA.y + xi * dy,
      dispX,
      dispY,
      mag: Math.hypot(dispX, dispY),
    })
  }
  return pts
}

export interface PeakDisplacement {
  nodeId: string
  u: number
  v: number
  mag: number
}

/** Largest nodal displacement magnitude in a result (unscaled, metres). */
export function peakNodalDisplacement(result: AnalysisResult): PeakDisplacement | null {
  let best: PeakDisplacement | null = null
  for (const [nodeId, d] of Object.entries(result.nodeDisplacements)) {
    const mag = Math.hypot(d.u, d.v)
    if (!best || mag > best.mag) best = { nodeId, u: d.u, v: d.v, mag }
  }
  return best
}
