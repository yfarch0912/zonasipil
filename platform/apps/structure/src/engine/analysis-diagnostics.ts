/**
 * Analysis diagnostics — pre-flight structural validity checks.
 *
 * Pure module (no React, no solver dependency). Runs cheaply on every model
 * change to drive the status-bar `Status` indicator and the warning dialog.
 *
 * Three categories of issues:
 *   1. Topological errors detected without solving (empty model, reaction
 *      count, disconnected substructures, γ=0 sections).
 *   2. Solver failures merged in from the solver path (see
 *      `mergeSolverFailures`): singular-DOF errors, plus — since Cycle 12
 *      (C10-F1) — every NON-singular named solver failure, carried verbatim
 *      as a `solver-failure` error so the reason reaches the UI.
 *   3. Warnings (γ=0) that do not block analysis but reduce its fidelity.
 *   4. Numerical reliability of SOLVED cases (see
 *      `mergeNumericalDiagnostics`, Sprint 2 / R-11): a case can solve
 *      with ok:true yet be ill-conditioned or physically implausible
 *      under the linear assumption — those results are merged here so
 *      they cannot present as ordinary verified output.
 *
 * The count formula `3m + r vs 3j` is used only to distinguish *determinate*
 * from *indeterminate* once the model has cleared the error checks. It is no
 * longer the sole stability signal — geometric mechanisms (collinear pins,
 * parallel rollers, etc.) are caught by pivot tracking in `gaussSolve`.
 */

import type { StructureModel, NodeId, SectionId } from "./model"
import {
  findOrphanedLoadIds,
  findSelfweightCaseLoadIds,
  type LoadCaseId,
} from "./load-cases"
import type {
  NumericalClassification,
  NumericalDiagnostics,
  NumericalFlag,
} from "./solver"

// Severity order for numerical classifications (Sprint 2, R-11) — mirrors
// `NUMERICAL_SEVERITY` in solver.ts. Duplicated as a local constant so
// this module keeps its "no runtime solver dependency" property (the
// import above is type-only); the two must be changed together.
const NUMERICAL_SEVERITY_LOCAL: Record<NumericalClassification, number> = {
  VALID: 0,
  ILL_CONDITIONED: 1,
  PHYSICALLY_IMPLAUSIBLE: 2,
  NUMERICALLY_UNRELIABLE: 3,
}

export type DiagnosticSeverity = "error" | "warning"

export type DiagnosticIssue =
  | { kind: "no-nodes";                severity: "error" }
  | { kind: "no-members";              severity: "error" }
  | { kind: "no-supports";             severity: "error" }
  | { kind: "insufficient-reactions";  severity: "error"; have: number }
  | { kind: "disconnected-component";  severity: "error" }
  | { kind: "singular-at-dof";         severity: "error"; nodeId: NodeId; direction: "u" | "v" | "θ" }
  | { kind: "solver-failure";          severity: "error"; reason: string }
  | { kind: "selfweight-zero-gamma";   severity: "warning"; sectionIds: SectionId[] }
  | { kind: "duplicate-members";       severity: "warning"; count: number }
  | { kind: "orphaned-loads";          severity: "warning"; loadIds: string[] }
  | { kind: "selfweight-case-loads";   severity: "warning"; loadIds: string[] }
  | { kind: "shear-fallback";          severity: "warning"; members: { memberId: string; sectionId: string }[] }
  | {
      // Sprint 2 (R-11): a case SOLVED but its numbers are not trustworthy
      // evidence — ill-conditioned system, implausible rotation under the
      // linear (small-angle) assumption, or an unreliable residual. Error
      // severity for PHYSICALLY_IMPLAUSIBLE / NUMERICALLY_UNRELIABLE (the
      // status is forced to "unstable": the presented RESULT must not be
      // read as a determinate structure's answer), warning otherwise
      // (ILL_CONDITIONED, or VALID with a large-rotation flag).
      kind: "numerical-reliability"
      severity: "error" | "warning"
      classification: NumericalClassification
      flags: NumericalFlag[]
      maxRotationNodeId: string
      maxRotation: number
      pivotRatio: number
      worstDofNodeId: string
      worstDofDirection: "u" | "v" | "θ"
    }

export type AnalysisStatus = "determinate" | "indeterminate" | "unstable"

export interface DiagnosticsReport {
  status: AnalysisStatus
  issues: DiagnosticIssue[]
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Build a diagnostics report from the model alone (no solver call).
 *
 * Singular-DOF errors are merged in separately at the App layer once the
 * solver has run — they require access to `caseResults` and the DOF→node
 * mapping. See `dofToLocation` below.
 *
 * When `loadCases` is supplied (App passes its live record), loads whose
 * loadCaseId names no existing case are reported as an "orphaned-loads"
 * warning: solveAllCases iterates cases, not loads, so such loads are
 * silently excluded from every displayed analysis. Loads tagged with the
 * locked "selfweight" case are likewise reported ("selfweight-case-loads",
 * Cycle 22): that case is solved from synthesized γ·A body forces only, so
 * a user load assigned to it is silently discarded by the solve. The
 * parameter stays optional so existing model-only call sites keep working.
 */
export function runDiagnostics(
  model: StructureModel,
  loadCases?: Record<LoadCaseId, unknown>,
): DiagnosticsReport {
  const issues: DiagnosticIssue[] = []

  const nodes    = Object.values(model.nodes)
  const members  = Object.values(model.members)
  const supports = Object.values(model.supports)

  // ── Empty-model checks ──
  if (nodes.length === 0)    issues.push({ kind: "no-nodes",    severity: "error" })
  if (members.length === 0)  issues.push({ kind: "no-members",  severity: "error" })
  if (supports.length === 0) issues.push({ kind: "no-supports", severity: "error" })

  // Reaction count (skip if no supports — already reported).
  const r = supports.reduce(
    (sum, s) => sum + (s.type === "fixed" ? 3 : s.type === "pin" ? 2 : 1),
    0,
  )
  if (supports.length > 0 && r < 3) {
    issues.push({ kind: "insufficient-reactions", severity: "error", have: r })
  }

  // ── Connectivity (skip when there's nothing meaningful to connect) ──
  if (nodes.length > 0 && members.length > 0) {
    const supportedNodeIds = new Set(supports.map((s) => s.nodeId))
    if (hasDisconnectedComponent(model, supportedNodeIds)) {
      issues.push({ kind: "disconnected-component", severity: "error" })
    }
  }

  // ── γ=0 warning (informational, doesn't block) ──
  const zeroGamma = findZeroGammaSections(model)
  if (zeroGamma.length > 0) {
    issues.push({ kind: "selfweight-zero-gamma", severity: "warning", sectionIds: zeroGamma })
  }

  // ── Duplicate-member detection (defensive, doesn't block) ──
  // Two or more members on the same node pair (order-independent) get their
  // stiffness added together inside the global K, which is almost never what
  // the user intended. Templates and the user-facing MEMBER tool both guard
  // against this, but file imports or future template regressions could
  // sneak duplicates in — surface them as a warning so the cause is visible.
  // Cost: O(m), microseconds even on large models.
  const pairCounts = new Map<string, number>()
  let duplicateCount = 0
  for (const mem of members) {
    const key = mem.a < mem.b ? `${mem.a}|${mem.b}` : `${mem.b}|${mem.a}`
    const prev = pairCounts.get(key) ?? 0
    pairCounts.set(key, prev + 1)
    if (prev === 1) duplicateCount++
  }
  if (duplicateCount > 0) {
    issues.push({ kind: "duplicate-members", severity: "warning", count: duplicateCount })
  }

  // ── Orphaned-load detection (STRUKTURA Cycle-8) ────────────────────────────
  // Only checked when the caller supplies the live case record. An orphan
  // reaches here via an imported/saved file (the editor now cascades case
  // deletes into loads, so it can no longer create one). Warning, not error:
  // the remaining cases still solve correctly — the orphan simply contributes
  // to nothing, and the user must know that before trusting the results.
  if (loadCases) {
    const orphanIds = findOrphanedLoadIds(model.loads, loadCases)
    if (orphanIds.length > 0) {
      issues.push({ kind: "orphaned-loads", severity: "warning", loadIds: orphanIds })
    }
  }

  // ── Selfweight-case load detection (STRUKTURA Cycle-22, C19-F1) ──────────
  // solveCase("selfweight") replaces the model's entire load record with
  // synthesized γ·A body forces, so a persisted user load tagged
  // "selfweight" (reachable only via imported / hand-edited files — the
  // editor locks the case out of the load tools) contributes nothing to
  // that case or to the one-click report, with ok:true and no trace. Name
  // the loads here so the drop is never silent. Warning, not error: every
  // other case still solves correctly. Only checked when the selfweight
  // case actually exists in the supplied record — if it does not, those
  // loads are orphans and the check above already names them.
  if (loadCases && "selfweight" in loadCases) {
    const swLoadIds = findSelfweightCaseLoadIds(model.loads)
    if (swLoadIds.length > 0) {
      issues.push({ kind: "selfweight-case-loads", severity: "warning", loadIds: swLoadIds })
    }
  }

  // ── Status classification ──
  const hasError = issues.some((i) => i.severity === "error")
  let status: AnalysisStatus
  if (hasError) {
    status = "unstable"
  } else {
    // Pick the determinacy formula based on structural type. The classical
    // truss formula `m + r vs 2j` only applies when every member is a truss
    // (joints physically have 2 DOFs, members carry only N). Otherwise — pure
    // frame or mixed — fall back to the frame formula `3m + r vs 3j`. The
    // mixed case is approximate (it counts a truss member as if it carried
    // 3 internal forces) but agrees with the frame formula at the
    // determinate/indeterminate boundary for all realistic structures in
    // this app. See the v1.0.6 design discussion for the full case analysis.
    const m = members.length
    const j = nodes.length
    const allTruss = m > 0 && members.every((mem) => mem.memberType === "truss")
    if (allTruss) {
      // Pure-truss textbook formula. m + r < 2j (mechanism) is left to the
      // solver/topology checks above — if we reach here, there's no error.
      status = m + r > 2 * j ? "indeterminate" : "determinate"
    } else {
      status = 3 * m + r > 3 * j ? "indeterminate" : "determinate"
    }
  }

  return { status, issues }
}

/**
 * Minimal structural view of a solver outcome — enough for the merge below
 * without importing the solver into this module. `SolverResult` from
 * solver.ts is assignable to this shape.
 */
export interface SolverOutcomeLike {
  ok: boolean
  reason?: string
  singularDof?: number
}

/**
 * Merge solver-side failures into a diagnostics report (Cycle 12, C10-F1).
 *
 * Two failure classes are surfaced:
 *   - Singular failures (carrying `singularDof`) become `singular-at-dof`
 *     errors naming the node and direction — the original behaviour.
 *   - Every OTHER failure becomes a `solver-failure` error carrying the
 *     solver's named `reason` VERBATIM. Before Cycle 12 these were silently
 *     dropped at this layer: the Analyze tools showed only "No results"
 *     while the STATUS pill kept claiming DETERMINATE/INDETERMINATE for a
 *     model that could not solve at all (zero-length members, dangling
 *     references, invalid section values, unknown enums — all named at
 *     solver level since Cycles 2/4/5/6).
 *
 * Duplicates are collapsed (the same failure typically repeats once per
 * load case). If any failure is merged, the status is forced to `unstable`
 * — a model that fails to solve must never present as determinate. The
 * report is returned unchanged (same object) when nothing merges.
 */
export function mergeSolverFailures(
  report: DiagnosticsReport,
  solverResults: ReadonlyArray<SolverOutcomeLike>,
  nodeIds: NodeId[],
): DiagnosticsReport {
  const extras: DiagnosticIssue[] = []
  const seen = new Set<string>()
  for (const res of solverResults) {
    if (res.ok) continue
    if (res.singularDof !== undefined) {
      const loc = dofToLocation(res.singularDof, nodeIds)
      const key = `singular:${loc.nodeId}:${loc.direction}`
      if (seen.has(key)) continue
      seen.add(key)
      extras.push({ kind: "singular-at-dof", severity: "error", ...loc })
    } else if (res.reason) {
      const key = `failure:${res.reason}`
      if (seen.has(key)) continue
      seen.add(key)
      extras.push({ kind: "solver-failure", severity: "error", reason: res.reason })
    }
  }
  if (extras.length === 0) return report
  return { status: "unstable", issues: [...report.issues, ...extras] }
}

/**
 * Minimal structural view of a solver outcome for the shear-fallback merge —
 * `AnalysisResult` from solver.ts is assignable to this shape.
 */
export interface ShearOutcomeLike {
  ok: boolean
  shearFallbackMembers?: readonly { memberId: string; sectionId: string }[]
}

/**
 * Merge Timoshenko-fallback metadata into a diagnostics report
 * (Sprint 1, R-07). When shear deformation was requested but a member's
 * section has no positive shear area Aκ2, the solver deliberately falls
 * back to the Euler–Bernoulli element for that member; before Sprint 1
 * nothing said so, and short/deep members could show smaller deflections
 * than the user asked the model to compute. The union across cases is
 * reported as ONE warning naming every affected member + section. The
 * report is returned unchanged (same object) when no fallback occurred;
 * the status is NOT changed — the analysis is valid, only its formulation
 * differs per member.
 */
export function mergeShearFallbacks(
  report: DiagnosticsReport,
  solverResults: ReadonlyArray<ShearOutcomeLike>,
): DiagnosticsReport {
  const byMember = new Map<string, { memberId: string; sectionId: string }>()
  for (const res of solverResults) {
    if (!res.ok || !res.shearFallbackMembers) continue
    for (const m of res.shearFallbackMembers) {
      if (!byMember.has(m.memberId)) byMember.set(m.memberId, { ...m })
    }
  }
  // Also fold in any fallback issue already on the report (repeat merges).
  for (const issue of report.issues) {
    if (issue.kind === "shear-fallback") {
      for (const m of issue.members) {
        if (!byMember.has(m.memberId)) byMember.set(m.memberId, { ...m })
      }
    }
  }
  if (byMember.size === 0) return report
  const members = [...byMember.values()].sort((a, b) => a.memberId.localeCompare(b.memberId))
  const rest = report.issues.filter((i) => i.kind !== "shear-fallback")
  return { ...report, issues: [...rest, { kind: "shear-fallback", severity: "warning", members }] }
}

/**
 * Minimal structural view of a solver outcome for the numerical merge —
 * `AnalysisResult` from solver.ts is assignable to this shape.
 */
export interface NumericalOutcomeLike {
  ok: boolean
  numerical?: NumericalDiagnostics
}

/**
 * Merge numerical conditioning/plausibility diagnostics into a report
 * (Sprint 2, R-11). Before this merge, a case could solve with ok:true
 * and a rotation of 2.8×10⁵ rad (benchmark B12) and the whole app —
 * status pill, dialogs, canvas — presented it as an ordinary result.
 *
 * The worst classification across the supplied results wins. Error
 * severity (PHYSICALLY_IMPLAUSIBLE / NUMERICALLY_UNRELIABLE) forces the
 * status to "unstable" — the same rule `mergeSolverFailures` applies to
 * outright failures: a result that cannot be trusted must never present
 * under a determinate/indeterminate label. ILL_CONDITIONED and the
 * VALID-with-large-rotation case are warnings and leave status alone.
 * The report is returned unchanged (same object) when every result is
 * VALID with no flags.
 */
export function mergeNumericalDiagnostics(
  report: DiagnosticsReport,
  solverResults: ReadonlyArray<NumericalOutcomeLike>,
): DiagnosticsReport {
  let worst: NumericalDiagnostics | undefined
  for (const res of solverResults) {
    if (!res.ok || !res.numerical) continue
    if (
      !worst ||
      NUMERICAL_SEVERITY_LOCAL[res.numerical.classification] >=
        NUMERICAL_SEVERITY_LOCAL[worst.classification]
    ) {
      worst = res.numerical
    }
  }
  if (!worst) return report
  const flagged = worst.flags.length > 0
  if (worst.classification === "VALID" && !flagged) return report

  const severity: "error" | "warning" =
    worst.classification === "PHYSICALLY_IMPLAUSIBLE" ||
    worst.classification === "NUMERICALLY_UNRELIABLE"
      ? "error"
      : "warning"
  const worstDof = worst.worstDofs[0]
  const issue: DiagnosticIssue = {
    kind: "numerical-reliability",
    severity,
    classification: worst.classification,
    flags: worst.flags as NumericalFlag[],
    maxRotationNodeId: worst.maxAbsRotation.nodeId,
    maxRotation: worst.maxAbsRotation.value,
    pivotRatio: worst.equilibratedPivotRatio,
    worstDofNodeId: worstDof?.nodeId ?? "",
    worstDofDirection: worstDof?.direction ?? "θ",
  }
  const rest = report.issues.filter((i) => i.kind !== "numerical-reliability")
  return {
    status: severity === "error" ? "unstable" : report.status,
    issues: [...rest, issue],
  }
}

/**
 * Translate a global DOF index (0..3j-1) into (nodeId, direction).
 * DOFs are laid out as [u, v, θ] per node in nodeIds order — this must match
 * the ordering used inside `analyze()` in solver.ts.
 */
export function dofToLocation(
  dofIndex: number,
  nodeIds: NodeId[],
): { nodeId: NodeId; direction: "u" | "v" | "θ" } {
  const nodeIdx = Math.floor(dofIndex / 3)
  const dirIdx  = dofIndex % 3
  return {
    nodeId: nodeIds[nodeIdx] ?? "",
    direction: dirIdx === 0 ? "u" : dirIdx === 1 ? "v" : "θ",
  }
}

/**
 * Sections that are referenced by at least one member AND have no positive
 * unit weight. These will contribute zero self-weight body force in the
 * selfweight case slice (see analysis-pipeline.ts::solveCase("selfweight")).
 */
export function findZeroGammaSections(model: StructureModel): SectionId[] {
  const referenced = new Set<SectionId>()
  for (const m of Object.values(model.members)) referenced.add(m.section)
  const out: SectionId[] = []
  for (const sid of referenced) {
    const sec = model.sections[sid]
    if (!sec) continue
    if ((sec.gamma ?? 0) <= 0) out.push(sid)
  }
  return out
}

// ── Internals ────────────────────────────────────────────────────────────────

/**
 * Union-find over members. Every connected component must touch a supported
 * node. Returns true if any component is fully unsupported (a floating
 * substructure). Cost: O((j + m) · α(j)) — microseconds even on large models.
 *
 * Isolated nodes (no member touches them) only count as "disconnected" if
 * they are also unsupported. A supported isolated node is structurally
 * useless but not a mechanism by this definition — solver will simply ignore
 * it. The intent of this check is to catch *floating subassemblies*, the
 * common user mistake of deleting a member and leaving an island.
 */
function hasDisconnectedComponent(
  model: StructureModel,
  supportedNodeIds: Set<NodeId>,
): boolean {
  const nodeIds = Object.keys(model.nodes)
  const parent: Record<NodeId, NodeId> = {}
  for (const id of nodeIds) parent[id] = id

  const find = (x: NodeId): NodeId => {
    let root = x
    while (parent[root] !== root) root = parent[root]
    // path compression
    let cur = x
    while (parent[cur] !== root) {
      const next = parent[cur]
      parent[cur] = root
      cur = next
    }
    return root
  }
  const union = (a: NodeId, b: NodeId) => {
    const ra = find(a), rb = find(b)
    if (ra !== rb) parent[ra] = rb
  }

  for (const m of Object.values(model.members)) {
    if (parent[m.a] !== undefined && parent[m.b] !== undefined) {
      union(m.a, m.b)
    }
  }

  // Bucket nodes by root; report unsupported components.
  const rootHasSupport = new Map<NodeId, boolean>()
  for (const id of nodeIds) {
    const root = find(id)
    if (!rootHasSupport.has(root)) rootHasSupport.set(root, false)
    if (supportedNodeIds.has(id)) rootHasSupport.set(root, true)
  }

  for (const supported of rootHasSupport.values()) {
    if (!supported) return true
  }
  return false
}
