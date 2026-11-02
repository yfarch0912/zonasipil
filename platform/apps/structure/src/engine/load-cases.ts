export type LoadCaseId = string
export type LoadComboId = string

export type LoadCaseKind = "Dead" | "Live" | "Roof Live" | "Wind" | "Seismic" | "Rain" | "Snow"

export const LOAD_CASE_KINDS: LoadCaseKind[] = [
  "Dead",
  "Live",
  "Roof Live",
  "Wind",
  "Seismic",
  "Rain",
  "Snow",
]

export type CodePreset =
  | "ASCE7-22"
  | "AS-NZS1170-2002"
  | "BSL-AIJ-ASD"
  | "EN1990-2002"
  | "GB50068-2018"
  | "SNI 1726:2019"
  | "SNI 1727:2020"

export const CODE_PRESETS: { id: CodePreset; label: string }[] = [
  { id: "SNI 1727:2020", label: "SNI 1727:2020 Pasal 2.3.2 LRFD (Indonesia)" },
  { id: "SNI 1726:2019", label: "SNI 1726:2019 (Indonesia)" },
  { id: "ASCE7-22", label: "ASCE 7-22 LRFD (USA)" },
  { id: "AS-NZS1170-2002", label: "AS/NZS 1170.0:2002 (Australia/NZ)" },
  { id: "BSL-AIJ-ASD", label: "BSL/AIJ ASD (Japan)" },
  { id: "EN1990-2002", label: "EN 1990:2002+A1 (Europe)" },
  { id: "GB50068-2018", label: "GB 50068-2018 (China)" },
]

export interface LoadCase {
  id: LoadCaseId
  name: string
  kind: LoadCaseKind
  /**
   * Whether this case contributes to analysis.
   *  - For regular cases: false = case is muted (its loads are skipped by the solver
   *    and the case is hidden from the analyze-view dropdown).
   *  - For the locked Selfweight case (v1.0.4+): false = no body force is added
   *    (default); true = solveCase("selfweight") synthesizes γ·A loads per member.
   */
  enabled: boolean
  locked?: boolean
}

export interface LoadComboTerm {
  factor: number
  caseId: LoadCaseId
}

export interface LoadCombination {
  id: LoadComboId
  name: string
  terms: LoadComboTerm[]
  source: "preset" | "custom"
  presetCode?: CodePreset
  enabled: boolean
}

export function DEFAULT_LOAD_CASES(): Record<LoadCaseId, LoadCase> {
  return {
    selfweight: {
      id: "selfweight",
      name: "Berat Sendiri",
      kind: "Dead",
      locked: true,
      enabled: true,
    },
    // Default placement target — acts as SIDL when Selfweight is off.
    dead: {
      id: "dead",
      name: "Beban Mati",
      kind: "Dead",
      enabled: true,
    },
  }
}

// Default combination present on a fresh document: 1.0·Selfweight + 1.0·Dead.
// Explicit Selfweight term (rather than relying on kind-matching) so the
// expression reads as the user expects in the combination list.
export function DEFAULT_COMBINATIONS(): Record<LoadComboId, LoadCombination> {
  const id = "cmb-default"
  return {
    [id]: {
      id,
      name: "1.0·BS + 1.0·D",
      terms: [
        { factor: 1, caseId: "selfweight" },
        { factor: 1, caseId: "dead" },
      ],
      source: "custom",
      enabled: true,
    },
  }
}

let loadCaseSeq = 0
let loadComboSeq = 0

export function newLoadCaseId(): LoadCaseId {
  loadCaseSeq += 1
  return `lc${loadCaseSeq}`
}

export function newLoadComboId(): LoadComboId {
  loadComboSeq += 1
  return `cmb${loadComboSeq}`
}

const KIND_SHORT: Record<LoadCaseKind, string> = {
  Dead: "D",
  Live: "L",
  "Roof Live": "Lr",
  Wind: "W",
  Seismic: "E",
  Rain: "R",
  Snow: "S",
}

export function caseShortLabel(kind: LoadCaseKind): string {
  return KIND_SHORT[kind]
}

/** Indonesian display label for a load-case kind (internal kind values unchanged). */
const KIND_DISPLAY: Record<LoadCaseKind, string> = {
  Dead: "Beban Mati",
  Live: "Beban Hidup",
  "Roof Live": "Beban Hidup Atap",
  Wind: "Angin",
  Seismic: "Gempa",
  Rain: "Hujan",
  Snow: "Salju",
}

export function kindDisplayLabel(kind: LoadCaseKind): string {
  return KIND_DISPLAY[kind]
}

// Conventional engineering priority — used by the canvas coincidence renderer
// to pick which load's arrow geometry is drawn when multiple cases share the
// same node/member (e.g., Dead + Live point loads on one node → Dead wins the
// arrow direction, label reads `[D, L]`). Lower index = higher priority.
const KIND_PRIORITY: LoadCaseKind[] = [
  "Dead",
  "Live",
  "Roof Live",
  "Wind",
  "Seismic",
  "Snow",
  "Rain",
]

export function kindPriorityIndex(kind: LoadCaseKind): number {
  const i = KIND_PRIORITY.indexOf(kind)
  return i < 0 ? KIND_PRIORITY.length : i
}

export function compareKindPriority(a: LoadCaseKind, b: LoadCaseKind): number {
  return kindPriorityIndex(a) - kindPriorityIndex(b)
}

function formatFactor(n: number): string {
  if (Number.isInteger(n)) return n.toFixed(1)
  return Number(n.toFixed(3)).toString()
}

// Short label used inside combo expressions: "BS" for Berat Sendiri, otherwise the
// kind abbreviation (D, L, Lr, W, E, R). Keeps expressions compact and aligned
// with the abbreviation pill shown in the Load Case tool.
function caseExpressionLabel(c: LoadCase): string {
  if (c.id === "selfweight") return "BS"
  return caseShortLabel(c.kind)
}

// Render terms as "1.2·D + 1.6·L − 1.0·W".
export function formatComboExpression(
  combo: LoadCombination,
  cases: Record<LoadCaseId, LoadCase>
): string {
  if (combo.terms.length === 0) return "(kosong)"
  const parts: string[] = []
  combo.terms.forEach((term, i) => {
    const c = cases[term.caseId]
    const label = c ? caseExpressionLabel(c) : term.caseId
    const abs = Math.abs(term.factor)
    if (i === 0) {
      const sign = term.factor < 0 ? "−" : ""
      parts.push(`${sign}${formatFactor(abs)}·${label}`)
    } else {
      const sign = term.factor < 0 ? "−" : "+"
      parts.push(`${sign} ${formatFactor(abs)}·${label}`)
    }
  })
  return parts.join(" ")
}

// ── Orphaned loads (STRUKTURA Cycle-8 hardening) ─────────────────────────────
// A load is orphaned when its loadCaseId names no case in the loadCases
// record. solveAllCases iterates cases, not loads, so an orphaned load is
// silently excluded from every analysis the UI can display — yet it stays
// in model.loads, inflates the "All Loads" count, and is still solvable if
// addressed by its deleted id directly. Before Cycle 8 the editor itself
// created orphans: handleDeleteLoadCase trimmed combinations but never
// touched loads, so deleting a case stranded its loads with no warning.
// These helpers are deliberately structural (not tied to StructureModel /
// Load) so load-cases.ts stays free of a model.ts import cycle — model.ts
// already imports LoadCaseId from here.
export function findOrphanedLoadIds(
  loads: Record<string, { loadCaseId: LoadCaseId }>,
  loadCases: Record<LoadCaseId, unknown>,
): string[] {
  const out: string[] = []
  for (const [id, load] of Object.entries(loads)) {
    if (!(load.loadCaseId in loadCases)) out.push(id)
  }
  return out
}

// ── Selfweight-case loads (STRUKTURA Cycle-22 hardening, C19-F1) ────────────
// The "selfweight" case is synthesized, not user-loaded: solveCase("selfweight")
// REPLACES the model's whole load record with γ·A body forces derived from the
// sections (see analysis-pipeline.ts). Any persisted user load tagged
// loadCaseId: "selfweight" is therefore silently discarded by that solve —
// it contributes nothing to the case result or to the one-click report, with
// ok:true and (before Cycle 22) no diagnostic naming it. The editor cannot
// create such a load (the case is locked:true and the load tools exclude
// locked cases), but imported / hand-edited project files can carry one.
// Dropping is by solver design — the selfweight case is DEFINED as body
// force only — so the fix is to NAME the affected loads in diagnostics
// (runDiagnostics), never to fold them into the synthesized slice.
export function findSelfweightCaseLoadIds(
  loads: Record<string, { loadCaseId: LoadCaseId }>,
): string[] {
  const out: string[] = []
  for (const [id, load] of Object.entries(loads)) {
    if (load.loadCaseId === "selfweight") out.push(id)
  }
  return out
}

/** Drop every load assigned to `caseId` (case-delete cascade). Pure: returns a new record. */
export function removeLoadsOfCase<T extends { loadCaseId: LoadCaseId }>(
  loads: Record<string, T>,
  caseId: LoadCaseId,
): Record<string, T> {
  const out: Record<string, T> = {}
  for (const [id, load] of Object.entries(loads)) {
    if (load.loadCaseId !== caseId) out[id] = load
  }
  return out
}

