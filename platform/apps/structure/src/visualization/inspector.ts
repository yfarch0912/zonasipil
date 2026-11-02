import type { StructureModel, MemberId, NodeId } from "@/engine/model"
import {
  memberInternalForces,
  type AnalysisResult,
  type MemberEndForces,
  type NodeDisplacement,
} from "@/engine/solver"

/**
 * Read-only member/node inspector over existing solver results.
 *
 * Every number here comes from the solver's own outputs:
 * `memberEndForces`, `nodeDisplacements`, `reactions`, and the
 * engine's `memberInternalForces` recovery (the same function the
 * N/V/M diagrams are drawn from). Sign conventions are the engine's,
 * documented on memberInternalForces: N positive = tension,
 * V positive = SAP2000 convention, M positive = sagging.
 * Nothing is computed independently and nothing is fabricated:
 * when a result is absent, the corresponding field is null and the
 * UI says so.
 */

export interface MemberInspection {
  memberId: MemberId
  a: NodeId
  b: NodeId
  length: number
  sectionId: string
  sectionName: string
  materialLabel: string
  supportA: string | null
  supportB: string | null
  endForces: MemberEndForces | null
  dispA: NodeDisplacement | null
  dispB: NodeDisplacement | null
}

const SUPPORT_LABELS: Record<string, string> = {
  pin: "Sendi",
  roller: "Rol",
  fixed: "Jepit",
}

export function memberLength(model: StructureModel, memberId: MemberId): number | null {
  const m = model.members[memberId]
  if (!m) return null
  const nA = model.nodes[m.a]
  const nB = model.nodes[m.b]
  if (!nA || !nB) return null
  return Math.hypot(nB.x - nA.x, nB.y - nA.y)
}

export function inspectMember(
  model: StructureModel,
  result: AnalysisResult | null,
  memberId: MemberId,
): MemberInspection | null {
  const m = model.members[memberId]
  if (!m) return null
  const length = memberLength(model, memberId)
  if (length === null) return null
  const section = model.sections[m.section]
  return {
    memberId,
    a: m.a,
    b: m.b,
    length,
    sectionId: m.section,
    sectionName: section?.name ?? m.section,
    materialLabel:
      section?.materialClass === "concrete"
        ? "Beton"
        : section?.materialClass === "steel"
          ? "Baja"
          : "—",
    supportA: model.supports[m.a] ? (SUPPORT_LABELS[model.supports[m.a].type] ?? model.supports[m.a].type) : null,
    supportB: model.supports[m.b] ? (SUPPORT_LABELS[model.supports[m.b].type] ?? model.supports[m.b].type) : null,
    endForces: result?.memberEndForces[memberId] ?? null,
    dispA: result?.nodeDisplacements[m.a] ?? null,
    dispB: result?.nodeDisplacements[m.b] ?? null,
  }
}

export interface InternalForcesAt {
  xi: number
  x: number
  N: number
  V: number
  M: number
}

/**
 * N/V/M at relative position xi (0..1) along a member, evaluated
 * with the engine's own memberInternalForces recovery — identical
 * values to what the diagrams draw.
 */
export function internalForcesAt(
  model: StructureModel,
  result: AnalysisResult | null,
  memberId: MemberId,
  xi: number,
): InternalForcesAt | null {
  if (!result) return null
  const ef = result.memberEndForces[memberId]
  const L = memberLength(model, memberId)
  if (!ef || L === null || L < 1e-9) return null
  const clamped = Math.min(1, Math.max(0, xi))
  const x = clamped * L
  const { N, V, M } = memberInternalForces(ef, x, L)
  return { xi: clamped, x, N, V, M }
}

export interface NodeInspection {
  nodeId: NodeId
  x: number
  y: number
  support: string | null
  disp: NodeDisplacement | null
  reaction: { Rx: number; Ry: number; Mz: number } | null
}

export function inspectNode(
  model: StructureModel,
  result: AnalysisResult | null,
  nodeId: NodeId,
): NodeInspection | null {
  const n = model.nodes[nodeId]
  if (!n) return null
  return {
    nodeId,
    x: n.x,
    y: n.y,
    support: model.supports[nodeId]
      ? (SUPPORT_LABELS[model.supports[nodeId].type] ?? model.supports[nodeId].type)
      : null,
    disp: result?.nodeDisplacements[nodeId] ?? null,
    reaction: result?.reactions[nodeId] ?? null,
  }
}
