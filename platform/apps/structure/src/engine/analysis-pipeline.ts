/**
 * Case- and combo-aware analysis orchestration.
 *
 * The solver (`./solver.ts`) is theory: it takes a StructureModel and produces one
 * AnalysisResult. This file is orchestration: it slices loads by case, calls the
 * solver once per enabled case, then linearly combines the results into combinations
 * and envelopes. Linear superposition is exact for the small-deformation linear-
 * elastic system this app models, so combinations and envelopes never re-solve.
 *
 * Selfweight (v1.0.4+): `solveCase("selfweight")` synthesizes a global-Y body force
 * per member from `Section.gamma · Section.A`. Synthetic loads are scoped to the
 * case slice and never persisted in `model.loads`.
 */

import {
  analyze,
  worseNumericalClassification,
  type AnalysisResult,
  type AnalyzeOptions,
  type NumericalDiagnostics,
  type ShearFallbackMember,
  type SolverResult,
} from "./solver"
import type { StructureModel } from "./model"
import type {
  LoadCase,
  LoadCaseId,
  LoadCombination,
  LoadComboId,
} from "./load-cases"
/** Which result set the Analyze view shows. Defined here (engine) so the
 * engine never imports from UI modules; UI components import it from here. */
export type AnalyzeViewMode = "case" | "combination" | "envelope"

export type { AnalysisResult } from "./solver"

export interface EnvelopeAnalysisResult extends AnalysisResult {
  /**
   * Per-scalar governing combinations. Populated by `envelopeResults`. Optional so
   * consumers that don't need governance info can ignore it.
   */
  governingCombos?: {
    reactions: Record<string, { Rx: LoadComboId; Ry: LoadComboId; Mz: LoadComboId }>
    nodeDisplacements: Record<string, { u: LoadComboId; v: LoadComboId; theta: LoadComboId }>
    memberEndForces: Record<string, {
      N1: LoadComboId; V1: LoadComboId; M1: LoadComboId
      N2: LoadComboId; V2: LoadComboId; M2: LoadComboId
      q1: LoadComboId; q2: LoadComboId
      qx1: LoadComboId; qx2: LoadComboId
    }>
  }
  /**
   * Included combinations whose own result was PARTIAL (a term was
   * dropped — Sprint 2, P3). Before Sprint 2 `envelopeResults` silently
   * discarded the per-combination completeness metadata: the envelope
   * object itself now names every partial source so ANY consumer — not
   * just the Analyze banner, which re-audits combinations separately —
   * can see that some governing scalars may come from partial results.
   */
  incompleteSourceCombos?: LoadComboId[]
}

/**
 * The numerically WORST of a set of diagnostics (Sprint 2, R-11/P3):
 * combined and enveloped results inherit the worst contributing case's
 * classification, so a physically implausible or ill-conditioned case
 * cannot be laundered into a clean-looking combination.
 */
export function worstNumericalOf(
  all: readonly NumericalDiagnostics[],
): NumericalDiagnostics | undefined {
  let worst: NumericalDiagnostics | undefined
  for (const n of all) {
    if (!worst || worseNumericalClassification(n.classification, worst.classification) === n.classification) {
      worst = n
    }
  }
  return worst
}

/** Union of shear-fallback member lists across results (Sprint 2, P3 —
 *  combination/envelope results previously dropped this metadata). */
export function unionShearFallbacks(
  results: readonly AnalysisResult[],
): ShearFallbackMember[] | undefined {
  const byMember = new Map<string, ShearFallbackMember>()
  for (const r of results) {
    for (const m of r.shearFallbackMembers ?? []) {
      if (!byMember.has(m.memberId)) byMember.set(m.memberId, m)
    }
  }
  return byMember.size > 0 ? [...byMember.values()] : undefined
}

// ── Per-case solve ───────────────────────────────────────────────────────────

/**
 * Solve a single load case. Builds a shallow copy of the model with only this
 * case's loads, then delegates to `analyze()`.
 *
 * Returns the full `SolverResult` — including the `reason` string and
 * `singularDof` on failure — so the diagnostics layer can surface specific
 * messages to the user. Previous behaviour collapsed failures to `null` which
 * threw away the failure cause.
 */
export function solveCase(
  model: StructureModel,
  caseId: LoadCaseId,
  opts?: AnalyzeOptions,
): SolverResult {
  if (caseId === "selfweight") {
    // Synthesize a global-Y distributed load on every member from its section's
    // unit weight γ (kN/m³) and cross-sectional area A (mm²). Gravity acts in −Y.
    // Members whose section has γ ≤ 0 (or undefined) contribute nothing — common
    // for manual sections where the user hasn't entered a unit weight.
    //
    // The synthetic loads are scoped to this slice and never persisted in the
    // user-visible model. After v1.0.4 trusses are condensed-frame elements, so
    // the global-axis distributed-load path handles them uniformly with frames.
    const selfweightLoads: StructureModel["loads"] = {}
    for (const m of Object.values(model.members)) {
      const sec = model.sections[m.section]
      if (!sec) continue
      const gamma = sec.gamma ?? 0
      if (gamma <= 0) continue
      const w = gamma * sec.A * 1e-6  // kN/m
      const id = `sw_${m.id}`
      selfweightLoads[id] = {
        id, type: "distributed", memberId: m.id,
        loadCaseId: "selfweight",
        mode: "global-axis",
        wxStart: 0, wxEnd: 0,
        wyStart: -w, wyEnd: -w,
      }
    }
    const slice: StructureModel = { ...model, loads: selfweightLoads }
    return analyze(slice, opts)
  }

  const filteredLoads: StructureModel["loads"] = {}
  for (const [id, load] of Object.entries(model.loads)) {
    if (load.loadCaseId === caseId) filteredLoads[id] = load
  }

  const slice: StructureModel = { ...model, loads: filteredLoads }
  return analyze(slice, opts)
}

/**
 * Solve every enabled case. Disabled cases are omitted from the result map.
 * Failed cases retain their `{ ok: false, reason, singularDof? }` envelope so
 * the diagnostics layer can report which case failed and why.
 */
export function solveAllCases(
  model: StructureModel,
  loadCases: Record<LoadCaseId, LoadCase>,
  opts?: AnalyzeOptions,
): Record<LoadCaseId, SolverResult> {
  const results: Record<LoadCaseId, SolverResult> = {}
  for (const [id, c] of Object.entries(loadCases)) {
    if (!c.enabled) continue
    results[id] = solveCase(model, id, opts)
  }
  return results
}

// ── Combination ──────────────────────────────────────────────────────────────

/**
 * Why a combination term contributed nothing (STRUKTURA Sprint 1, R-03 —
 * formerly C15-F1: the drop was silent and the partial result carried no
 * marker). The reason is decided from the evidence available:
 *   - "failed":   the case was solved and the solver returned a named failure.
 *   - "disabled": the case exists in the supplied case record but is muted
 *                 (`enabled === false`), so `solveAllCases` never solved it.
 *   - "missing":  anything else — the case id is unknown to both maps (a
 *                 hand-edited/imported combination, or no case record was
 *                 supplied to distinguish disabled from missing).
 */
export type DroppedComboTermReason = "missing" | "disabled" | "failed"

export interface DroppedComboTerm {
  caseId: LoadCaseId
  /** The factor the term WOULD have contributed with. */
  factor: number
  reason: DroppedComboTermReason
  /** The solver's named failure reason, verbatim — only for "failed". */
  failureReason?: string
}

/**
 * Completeness audit of one combination against a set of case results.
 * `complete === true` means every term contributed; anything else means the
 * combination's numbers are a PARTIAL superposition and must never be
 * presented — or consumed by design — as the full combination.
 */
export interface CombinationCompleteness {
  comboId: LoadComboId
  complete: boolean
  droppedTerms: DroppedComboTerm[]
}

/** A combination result: the superposed values PLUS their completeness audit. */
export interface CombinationAnalysisResult extends AnalysisResult {
  combination: CombinationCompleteness
}

/**
 * Audit a combination's terms against case results WITHOUT combining. Works
 * even when `combineResults` would return null (every term dropped), so
 * callers can always explain WHY a combination has no — or only partial —
 * results. Pass the live case record to distinguish "disabled" from
 * "missing"; without it, unsolved cases are reported as "missing".
 */
export function auditCombination(
  caseResults: Record<LoadCaseId, SolverResult>,
  combo: LoadCombination,
  loadCases?: Record<LoadCaseId, LoadCase>,
): CombinationCompleteness {
  const droppedTerms: DroppedComboTerm[] = []
  for (const term of combo.terms) {
    const r = caseResults[term.caseId]
    if (r && r.ok) continue
    if (r && !r.ok) {
      droppedTerms.push({
        caseId: term.caseId, factor: term.factor,
        reason: "failed", failureReason: r.reason,
      })
    } else if (
      loadCases && term.caseId in loadCases && loadCases[term.caseId].enabled === false
    ) {
      droppedTerms.push({ caseId: term.caseId, factor: term.factor, reason: "disabled" })
    } else {
      droppedTerms.push({ caseId: term.caseId, factor: term.factor, reason: "missing" })
    }
  }
  return { comboId: combo.id, complete: droppedTerms.length === 0, droppedTerms }
}

/**
 * Linearly combine case results per a combination's terms.
 *
 * AnalysisResult fields (displacements, reactions, member end-forces) all
 * superpose linearly in linear-elastic small-deformation analysis, so this is
 * exact, not approximate. The superposition of the CONTRIBUTING terms is
 * unchanged from the original implementation.
 *
 * Returns `null` only if the combination has no terms, or every referenced
 * case is missing/disabled/failed. When SOME terms drop, the partial result
 * is still returned (the valid terms' contribution is real information) but
 * it carries a `combination` completeness audit naming every dropped term —
 * since Sprint 1 (R-03) a partial result can no longer masquerade as the
 * complete combination: the Analyze banner and the design run both read the
 * audit, and design marks every member demand built on it as incomplete.
 */
export function combineResults(
  caseResults: Record<LoadCaseId, SolverResult>,
  combo: LoadCombination,
  loadCases?: Record<LoadCaseId, LoadCase>,
): CombinationAnalysisResult | null {
  if (combo.terms.length === 0) return null

  // Topology comes from the first *successful* case result. Failed cases (ok:
  // false) are skipped here; if all referenced cases failed, the combo result
  // is null and the UI handles it like any other missing result.
  const first = combo.terms
    .map((t) => caseResults[t.caseId])
    .find((r): r is AnalysisResult => r != null && r.ok === true)
  if (!first) return null

  const out: CombinationAnalysisResult = {
    ok: true,
    nodeDisplacements: {},
    memberEndForces: {},
    reactions: {},
    combination: auditCombination(caseResults, combo, loadCases),
    // Sprint 2 (P3): the combined result inherits the worst contributing
    // case's numerical diagnostics and the union of shear fallbacks —
    // previously both were dropped at this seam.
    numerical: first.numerical,
  }
  for (const id of Object.keys(first.nodeDisplacements)) {
    out.nodeDisplacements[id] = { u: 0, v: 0, theta: 0 }
  }
  for (const id of Object.keys(first.memberEndForces)) {
    out.memberEndForces[id] = {
      N1: 0, V1: 0, M1: 0,
      N2: 0, V2: 0, M2: 0,
      q1: 0, q2: 0,
      qx1: 0, qx2: 0,
    }
  }
  for (const id of Object.keys(first.reactions)) {
    out.reactions[id] = { Rx: 0, Ry: 0, Mz: 0 }
  }

  const contributing: AnalysisResult[] = []
  for (const term of combo.terms) {
    const r = caseResults[term.caseId]
    if (!r || !r.ok) continue
    contributing.push(r)
    const k = term.factor

    for (const id of Object.keys(out.nodeDisplacements)) {
      const d = r.nodeDisplacements[id]
      if (!d) continue
      out.nodeDisplacements[id].u     += k * d.u
      out.nodeDisplacements[id].v     += k * d.v
      out.nodeDisplacements[id].theta += k * d.theta
    }
    for (const id of Object.keys(out.memberEndForces)) {
      const f = r.memberEndForces[id]
      if (!f) continue
      out.memberEndForces[id].N1 += k * f.N1
      out.memberEndForces[id].V1 += k * f.V1
      out.memberEndForces[id].M1 += k * f.M1
      out.memberEndForces[id].N2 += k * f.N2
      out.memberEndForces[id].V2 += k * f.V2
      out.memberEndForces[id].M2 += k * f.M2
      out.memberEndForces[id].q1 += k * f.q1
      out.memberEndForces[id].q2 += k * f.q2
      out.memberEndForces[id].qx1 += k * f.qx1
      out.memberEndForces[id].qx2 += k * f.qx2
    }
    for (const id of Object.keys(out.reactions)) {
      const re = r.reactions[id]
      if (!re) continue
      out.reactions[id].Rx += k * re.Rx
      out.reactions[id].Ry += k * re.Ry
      out.reactions[id].Mz += k * re.Mz
    }
  }

  // Sprint 2 (P3): fold the propagated metadata over the contributing
  // terms only (dropped terms contributed no numbers, hence no fallback
  // or conditioning either).
  const worst = worstNumericalOf(contributing.map((r) => r.numerical))
  if (worst) out.numerical = worst
  const fallbacks = unionShearFallbacks(contributing)
  if (fallbacks) out.shearFallbackMembers = fallbacks

  return out
}

// ── Envelope ─────────────────────────────────────────────────────────────────

/**
 * Per-scalar max/min absolute-extreme across the included combinations.
 *
 * The envelope is built scalar-by-scalar: at each location (e.g., M1 of member 3,
 * Ry of support n2), the value with the largest magnitude across selected combos
 * wins. The governing combo for each scalar is recorded in `governingCombos`.
 *
 * This is the most useful single-value envelope for design ("worst case at this
 * point"). For diagrams, this means each end-force is independently the worst
 * across combos — that may come from different combos at different members, which
 * is exactly what design envelopes show.
 */
export function envelopeResults(
  comboResults: Record<LoadComboId, AnalysisResult | null>,
  envelopeComboIds: LoadComboId[],
  combinations?: Record<LoadComboId, LoadCombination>,
): EnvelopeAnalysisResult | null {
  // Skip combos the user has disabled via the row checkbox. Without this guard
  // a "disabled" combo silently governed the envelope, contradicting the UI.
  const included = envelopeComboIds
    .filter((id) => (combinations ? combinations[id]?.enabled !== false : true))
    .map((id) => [id, comboResults[id]] as const)
    .filter((p): p is readonly [LoadComboId, AnalysisResult] => p[1] != null)

  if (included.length === 0) return null

  const [firstId, first] = included[0]
  // Sprint 2 (P3): propagate integrity metadata across the envelope seam —
  // worst numerical diagnostics of the included combos, the union of
  // their shear fallbacks, and the ids of included combos whose own
  // result was partial.
  const incompleteSourceCombos = included
    .filter(([, r]) => {
      const c = (r as CombinationAnalysisResult).combination
      return c != null && c.complete === false
    })
    .map(([id]) => id)
  const worstEnv = worstNumericalOf(included.map(([, r]) => r.numerical))
  const envFallbacks = unionShearFallbacks(included.map(([, r]) => r))
  const out: EnvelopeAnalysisResult = {
    ok: true,
    nodeDisplacements: {},
    memberEndForces: {},
    reactions: {},
    numerical: worstEnv ?? first.numerical,
    ...(envFallbacks ? { shearFallbackMembers: envFallbacks } : {}),
    ...(incompleteSourceCombos.length > 0 ? { incompleteSourceCombos } : {}),
    governingCombos: {
      nodeDisplacements: {},
      memberEndForces: {},
      reactions: {},
    },
  }

  // Seed with the first included combo's values.
  for (const [id, d] of Object.entries(first.nodeDisplacements)) {
    out.nodeDisplacements[id] = { ...d }
    out.governingCombos!.nodeDisplacements[id] = { u: firstId, v: firstId, theta: firstId }
  }
  for (const [id, f] of Object.entries(first.memberEndForces)) {
    out.memberEndForces[id] = { ...f }
    out.governingCombos!.memberEndForces[id] = {
      N1: firstId, V1: firstId, M1: firstId,
      N2: firstId, V2: firstId, M2: firstId,
      q1: firstId, q2: firstId,
      qx1: firstId, qx2: firstId,
    }
  }
  for (const [id, re] of Object.entries(first.reactions)) {
    out.reactions[id] = { ...re }
    out.governingCombos!.reactions[id] = { Rx: firstId, Ry: firstId, Mz: firstId }
  }

  // For each remaining combo, replace any scalar whose magnitude is larger.
  const better = (
    target: Record<string, number>,
    governing: Record<string, LoadComboId>,
    candidate: Record<string, number>,
    candidateId: LoadComboId,
  ) => {
    for (const k of Object.keys(target)) {
      if (Math.abs(candidate[k]) > Math.abs(target[k])) {
        target[k] = candidate[k]
        governing[k] = candidateId
      }
    }
  }

  for (let i = 1; i < included.length; i++) {
    const [cid, r] = included[i]
    for (const id of Object.keys(out.nodeDisplacements)) {
      const c = r.nodeDisplacements[id]
      if (!c) continue
      better(
        out.nodeDisplacements[id] as unknown as Record<string, number>,
        out.governingCombos!.nodeDisplacements[id] as unknown as Record<string, LoadComboId>,
        c as unknown as Record<string, number>,
        cid,
      )
    }
    for (const id of Object.keys(out.memberEndForces)) {
      const c = r.memberEndForces[id]
      if (!c) continue
      better(
        out.memberEndForces[id] as unknown as Record<string, number>,
        out.governingCombos!.memberEndForces[id] as unknown as Record<string, LoadComboId>,
        c as unknown as Record<string, number>,
        cid,
      )
    }
    for (const id of Object.keys(out.reactions)) {
      const c = r.reactions[id]
      if (!c) continue
      better(
        out.reactions[id] as unknown as Record<string, number>,
        out.governingCombos!.reactions[id] as unknown as Record<string, LoadComboId>,
        c as unknown as Record<string, number>,
        cid,
      )
    }
  }

  return out
}

// ── Displayed-result selection ───────────────────────────────────────────────

/**
 * Pick which AnalysisResult the analyze view should render based on mode +
 * selections. Returns `null` if the requested selection has no result available
 * (e.g., envelope mode with no combos selected).
 */
export function pickDisplayedResult(
  mode: AnalyzeViewMode,
  caseResults: Record<LoadCaseId, SolverResult>,
  comboResults: Record<LoadComboId, AnalysisResult | null>,
  envelopeResult: AnalysisResult | null,
  selectedCaseId: LoadCaseId,
  selectedCombinationId: LoadComboId | null,
): AnalysisResult | null {
  switch (mode) {
    case "case": {
      const r = caseResults[selectedCaseId]
      return r && r.ok ? r : null
    }
    case "combination":
      return selectedCombinationId ? comboResults[selectedCombinationId] ?? null : null
    case "envelope":
      return envelopeResult
  }
}
