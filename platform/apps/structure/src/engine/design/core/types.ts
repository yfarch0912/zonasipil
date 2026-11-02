/**
 * Shared, material-agnostic design types (RC + Steel).
 *
 * Pure domain module: no React imports. Design state (criteria + per-section
 * inputs) lives in App state like loadCases/combinations — it is NOT part of
 * StructureModel and is not persisted by Save/Load (v1.1 limitation).
 *
 * Material-specific types live beside their strategy:
 *   - RC:    `../rc/criteria.ts`, `../rc/types.ts`
 *   - Steel: `../steel/criteria.ts`, `../steel/types.ts`
 * The criteria wrapper + per-section input union live in `./criteria.ts` and
 * `./section-input.ts`.
 */

import type { MemberId } from "@/engine/model"
import type { LoadCaseId, LoadComboId } from "@/engine/load-cases"
import type { ArrangementCheck } from "../rc/shared/types"
import type { SteelMemberRole } from "../steel/member-role"
import type { SeismicChecks } from "../steel/seismic"

// ── Material family ───────────────────────────────────────────────────────────

export type DesignMaterial = "rc" | "steel"

export const DESIGN_MATERIALS: { id: DesignMaterial; label: string }[] = [
  { id: "rc", label: "Beton Bertulang" },
  { id: "steel", label: "Baja" },
]

// ── Frame (seismic detailing) type — shared by both materials ─────────────────

export type FrameType = "OMF" | "IMF" | "SMF"

export const FRAME_TYPES: { id: FrameType; label: string }[] = [
  { id: "OMF", label: "Rangka Momen Biasa (OMF)" },
  { id: "IMF", label: "Rangka Momen Menengah (IMF)" },
  { id: "SMF", label: "Rangka Momen Khusus (SMF)" },
]

// ── Element type (beam vs column) ────────────────────────────────────────────

/** How a member's section is designed. `auto` resolves per member: vertical →
 *  column, horizontal → beam, promoted to column when the axial gate is met. */
export type ElementType = "auto" | "beam" | "column"

export const ELEMENT_TYPES: { id: ElementType; label: string }[] = [
  { id: "auto", label: "Otomatis (menurut orientasi)" },
  { id: "beam", label: "Balok" },
  { id: "column", label: "Kolom" },
]

export type DesignMode = "required" | "checked"

// ── Zones ─────────────────────────────────────────────────────────────────────

export type ZoneId = "end-i" | "midspan" | "end-j"
export const ZONE_IDS: ZoneId[] = ["end-i", "midspan", "end-j"]

// ── Results (RC payload today; steel payload added in a later pass) ───────────

export interface ZoneFlexureResult {
  /** Design moments after frame-type minimums. MuPos = sagging, MuNeg ≤ 0 = hogging. kN·m */
  MuPos: number
  MuNeg: number
  // "As required" mode outputs (mm², incl. As,min floor):
  AsReqBottom?: number
  AsReqTop?: number
  AsPrimeReq?: number
  // "As checked" mode outputs:
  phiMnPos?: number // kN·m, bottom bars in tension
  phiMnNeg?: number // kN·m, top bars in tension
  dcPos?: number
  dcNeg?: number
  /** Reinforcement ratio As/(b·d) per face (fraction, not %). Required mode = required
   *  steel; checked mode = provided steel. Top uses dNeg, bottom uses dPos. */
  rhoTop?: number
  rhoBottom?: number
  /** Governing D/C for colouring. Required mode: 0 when adequate, Infinity when not. */
  dc: number
  /** Required mode: section can physically carry Mu (incl. doubly-reinforced path). */
  adequate: boolean
}

export interface ZoneShearResult {
  /** Envelope |V| in zone, kN */
  Vu: number
  /** Capacity-design shear (IMF: Mn-based; SMF: Mpr-based), kN */
  Ve?: number
  /** max(Vu, Ve) — the demand actually designed for, kN */
  Vdesign: number
  phiVc: number // kN
  phiVmax: number // kN — φ(Vc + 0.66√f'c·bw·d) cross-section limit
  // "As required" mode:
  AvSReq?: number // mm²/m, incl. Av,min floor
  suggested?: { size: string; legs: number; spacing: number }
  // "As checked" mode:
  phiVn?: number // kN
  dc?: number
  /** Overall pass (checked: Vdesign ≤ φVn; both modes: false when cross-section fails). */
  pass: boolean
  crossSectionOk: boolean
  /** Stirrup spacing check (checked mode): SMF end zones use min(d/4, 6db, 150),
   *  elsewhere the general min(d/2, 600) cap where stirrups are required. */
  spacingCheck?: { sMax: number; pass: boolean }
}

// ── Unified verdict taxonomy (Sprint 2, P2 / R-06) ───────────────────────────
//
// One status language across analysis, member design, seismic checks and
// reports. The semantics live HERE (data), never in colours: UI surfaces
// map statuses to presentation, but a status means the same thing
// everywhere it appears.
//
//   PASS          evaluated and passed, using verified applicable checks
//   FAIL          evaluated and failed
//   INCOMPLETE    a required input, load case or combination is missing
//                 or failed, so the numbers rest on partial demands
//   UNVERIFIED    the calculation depends on provisions/coefficients that
//                 are NOT verified against an authoritative text (e.g.
//                 the AISC 341 constants of Sprint 1 / R-01)
//   UNSUPPORTED   a required check is outside the implemented scope
//   NOT_EVALUATED the check has not been performed (no result, not run)
//
// Precedence when several apply (worst wins — see verdict.ts):
//   FAIL > INCOMPLETE > UNSUPPORTED > UNVERIFIED > NOT_EVALUATED > PASS
// The invariants this buys: a missing check can never default to PASS;
// UNVERIFIED never counts toward a verified PASS; a member cannot be
// PASS while a governing check is INCOMPLETE or UNVERIFIED; a whole-run
// PASS is never inferred from a subset of members.

export type VerdictStatus =
  | "PASS"
  | "FAIL"
  | "INCOMPLETE"
  | "UNVERIFIED"
  | "UNSUPPORTED"
  | "NOT_EVALUATED"

export interface Verdict {
  status: VerdictStatus
  /** Human-readable provenance: WHY this status, naming the check/case/
   *  combination responsible. Never empty for a non-PASS verdict. */
  reasons: string[]
}

export type MemberDesignStatus =
  | "designed"
  | "not-designable"
  | "not-implemented"
  | "axial-exceeded"
  | "no-result"

export interface ColumnShearResult {
  /** Envelope factored shear |Vu|, kN. */
  Vu: number
  /** Capacity-design shear (IMF: Mn-based; SMF: Mpr-based), kN. */
  Ve?: number
  /** max(Vu, Ve) — the demand actually designed for, kN. */
  Vdesign: number
  phiVc: number // kN
  phiVmax: number // kN — cross-section ceiling
  /** SMF: concrete shear set to 0 in the confinement zone (Pu < Ag·f'c/20, 18.7.6.2.1). */
  vcZeroed: boolean
  // "As required" mode:
  AvSReq?: number // mm²/m, incl. min-tie floor
  suggested?: { size: string; legs: number; spacing: number }
  // "As checked" mode:
  phiVn?: number // kN
  dc?: number
  /** Governing hoop/tie spacing cap (mm) + pass for the provided tie. */
  spacingMax?: number
  spacingPass?: boolean
  /** Overall pass (cross-section + capacity + spacing). */
  pass: boolean
  crossSectionOk: boolean
}

export interface ColumnDesignResult {
  /** Provided (checked) or representative (required) longitudinal ratio ρg. */
  rhoG: number
  /** Provided steel (checked) or required steel (required), mm². */
  Ast: number
  /** "As required": ρg needed to satisfy the worst demand; undefined in checked mode. */
  rhoGRequired?: number
  /** Worst radial interaction D/C across combos × candidate stations. */
  worstDC: number
  governing?: { combo: LoadComboId; Pu: number; Mu: number }
  /** All checked combo (P,M) candidate pairs — drives the report's demand markers. */
  pmPairs?: { P: number; M: number; combo: LoadComboId }[]
  /** Checked: arrangement is buildable + ρg within limits. */
  adequate: boolean
  /** Capacity-design shear (IMF/SMF) + tie check. */
  shear?: ColumnShearResult
  /** Transverse confinement (SMF Ash / IMF ties / OMF ties) detailing verdicts. */
  confinement?: ArrangementCheck[]
  /** Slenderness: governing non-sway magnifier δns and klu/r (in-plane). */
  deltaNs?: number
  slenderness?: number
  /** SMF strong-column-weak-beam: false when a joint this column frames into fails. */
  scwbPass?: boolean
  /** Column nominal flexural strength at the design axial (kN·m) — feeds SCWB ΣMnc. */
  Mn?: number
}

/** Steel member check result (AISC 360-16). One station governs each channel. */
export interface SteelDesignResult {
  /** Section classification: "Compact" | "NonCompact" | "Slender". */
  sectionClass: string
  /** Classification for axial only (Table B4.1a) — can differ from flexure. */
  axialClass: string
  /** Governing combined-force ratio and which AISC equation produced it. */
  ratio: number
  equation: string
  governing?: { combo: LoadComboId; x: number; Pr: number; Mr: number }
  /** Available strengths, kN / kN·m (φ already applied). */
  PcComp: number
  PcTens: number
  Mc33: number
  Vc: number
  /** Nominal values before φ, for the report deck. */
  Pn: number
  Mn: number
  Mp: number
  Vn: number
  /** LTB parameters in METRES (undefined for shapes with no LTB limit state). */
  Lp?: number
  Lr?: number
  Lb?: number
  Cb?: number
  /** Which flexural limit state governed. */
  flexureLimit: string
  /** Compression diagnostics. */
  Fe?: number
  Fcr?: number
  Ae?: number
  slenderness?: number
  slendernessAxis?: "33" | "22"
  /** Shear channel. */
  Vr: number
  shearRatio: number
  /** Peak demands driving the governing ratio. */
  PrMax: number
  MrMax: number
  /** Overall pass (interaction AND shear within the D/C limit). */
  pass: boolean
  /** Non-fatal advisories, e.g. KL/r > 200. */
  warnings: string[]

  // ── AISC E4 (torsional / flexural-torsional buckling) ──────────────────────
  /** Pure torsional buckling stress Fez, MPa. Undefined for closed sections. */
  Fez?: number
  /** Which compression limit state set Fe. */
  bucklingMode?: "flexural" | "flexural-torsional"

  // ── Single angle (AISC F10 / H2) ───────────────────────────────────────────
  /** φMn about the MAJOR and MINOR principal axes, kN·m. */
  McW?: number
  McZ?: number
  /** Principal-axis rotation from geometric axis 3, radians. */
  alphaPrincipal?: number
  /** Monosymmetry property βw, mm (exactly 0 for an equal-leg angle). */
  betaW?: number
  /**
   * The governing station's geometric M33 resolved onto the principal axes,
   * kN·m — `Mw = M33·cos α`, `Mz = −M33·sin α`. Reported so the UI can show WHY
   * a bending angle carries a high D/C: `Iz ≈ Iw/4`, so the minor-principal
   * term usually dominates. See DESIGN_STEEL.md §S3.1.
   */
  MrW?: number
  MrZ?: number

  // ── Tee (AISC F9) ──────────────────────────────────────────────────────────
  /** The governing station had the stem in compression (hogging). */
  stemInCompression?: boolean
  /**
   * Both sign branches of a tee's capacity, kN·m (φ applied). A tee is the only
   * shape whose strength depends on the sign of the moment, and showing one
   * number hides that — `MnPos` is stem-in-tension (sagging), `MnNeg` is
   * stem-in-compression (hogging).
   */
  McPos?: number
  McNeg?: number

  // ── Interaction-surface inputs (report decks) ───────────────────────────────
  /**
   * Every (Pr, Mr) pair actually checked, across combinations × stations. The
   * interaction envelope is only meaningful with the demands that produced it,
   * and P and M must be the ones acting TOGETHER — the same reason the strategy
   * never envelopes them independently.
   */
  pmPairs?: { P: number; M: number; combo: LoadComboId }[]
  /**
   * Geometric role, inferred from the member's orientation alone. Reported for
   * the schedule and to pick a report deck — it does NOT change the check. See
   * `steel/member-role.ts`.
   */
  role?: SteelMemberRole
  /**
   * AISC 341 detailing checks. **Absent for OMF/RMB**, where no seismic
   * requirement applies and the member is governed by AISC 360 alone.
   */
  seismic?: SeismicChecks
}

export interface MemberDesignResult {
  memberId: MemberId
  status: MemberDesignStatus
  /** Design material family (set when designed). */
  material?: DesignMaterial
  /**
   * Member kind (set when designed). RC emits only `beam` / `column` — its two
   * genuinely different formulations. Steel additionally emits `brace`, which is
   * purely a label: see `steel/member-role.ts`.
   */
  kind?: SteelMemberRole
  /**
   * Why a member was refused, for `not-designable` / `not-implemented`. Surfaced
   * as a run issue so a refusal is never silent — a member that simply vanishes
   * from the results reads as a bug to the user.
   */
  note?: string
  mode?: DesignMode
  /** Governing axial compression, kN (positive = compression). */
  Pu?: number
  zones?: Record<ZoneId, { flexure: ZoneFlexureResult; shear: ZoneShearResult }>
  /** SMF beam dimensional-limit checks (18.6.2.1); [] for OMF/IMF. */
  dimensionChecks?: ArrangementCheck[]
  /** Column interaction result (when kind === "column"). */
  column?: ColumnDesignResult
  /** Steel member result (when material === "steel"). */
  steel?: SteelDesignResult
  /** Worst flexural D/C across zones (beam) or interaction D/C (column) — drives
   *  member colour via designColorForDC. */
  worstFlexureDC?: number
  /** All zones pass shear (incl. cross-section limit + SMF spacing). */
  worstShearPass?: boolean
  /** Beam nominal flexural strength at the joint (kN·m) — feeds SCWB ΣMnb. */
  beamMn?: number
  governing?: Partial<Record<ZoneId, { M: LoadComboId; V: LoadComboId }>>
  /**
   * True when this member's demand envelope includes a combination whose
   * result is PARTIAL (a term was dropped — Sprint 1, R-03), or its RC
   * capacity shear used a partial gravity combo. The member's numbers must
   * not be read as coming from complete combinations.
   */
  demandsIncomplete?: boolean
  /**
   * Unified verdict for this member (Sprint 2, P2). Derived from the
   * member's own check channels + `demandsIncomplete` by
   * `memberVerdict` in verdict.ts; attached by the design run. A member
   * is PASS only when every governing channel passed on complete demands
   * with verified provisions.
   */
  verdict?: Verdict
}

/** SMF/SRPMK strong-column-weak-beam verdict at one joint (18.7.3.2). */
/**
 * Strong-column-weak-beam at one joint. Shared by both materials; the ratio's
 * DEFINITION differs, so `material` says which rule produced it:
 *
 *   rc     ACI 18.7.3.2   ratio = ΣMnc / (1.2·ΣMnb),  pass at ≥ 1  (6/5 rule)
 *   steel  AISC E3.4a     ratio = ΣM*pc / ΣM*pb,      pass at > 1
 */
export interface JointCheckResult {
  nodeId: string
  /** RC: Σ column Mn. Steel: ΣM*pc. kN·m. */
  sumMnc: number
  /** RC: Σ beam Mn. Steel: ΣM*pb. kN·m. */
  sumMnb: number
  /** The code ratio — see the table above. Unity is the threshold either way. */
  ratio: number
  pass: boolean
  /** Column member ids framing into this joint. */
  columnIds: string[]
  /** Which rule produced `ratio`. Absent ⇒ RC, for back-compat. */
  material?: DesignMaterial
  /**
   * "unverified" for steel E3.4a joints (Sprint 1, R-01): ΣM*pb depends on
   * the program-convention Ry, so a passing steel SCWB ratio must not be
   * presented as a verified PASS. Absent ⇒ not marked unverified.
   */
  verification?: "unverified"
}

export interface DesignRunResult {
  ok: boolean
  issues: string[]
  members: Record<MemberId, MemberDesignResult>
  /** SMF strong-column-weak-beam joint checks (empty for OMF/IMF). */
  joints?: JointCheckResult[]
  /**
   * Enabled cases that FAILED to solve in this run, with the solver's named
   * reason (Sprint 1, R-02). Their combinations are skipped or partial —
   * see `skippedCombos` / `incompleteCombos`. Rendered by the Design tab's
   * issues panel; before Sprint 1 these existed only as `issues` strings
   * no UI consumed.
   */
  failedCases?: { caseId: LoadCaseId; name: string; reason: string }[]
  /** Enabled combinations that produced NO result at all (every term dropped). */
  skippedCombos?: { comboId: LoadComboId; name: string }[]
  /**
   * Combinations that produced a PARTIAL result: at least one term was
   * dropped (missing/disabled/failed case), so their numbers are not the
   * full combination (Sprint 1, R-03). Members designed from them carry
   * `demandsIncomplete`.
   */
  incompleteCombos?: {
    comboId: LoadComboId
    name: string
    droppedTerms: import("@/engine/analysis-pipeline").DroppedComboTerm[]
  }[]
  /** True when the internal gravity combo (1.2D + 1.0L) could not be built
   *  at all — RC capacity-design shear Ve is then computed without Vg. */
  gravityComboMissing?: boolean
  /** True when the gravity combo exists but is partial (terms dropped). */
  gravityComboIncomplete?: boolean
  /**
   * Unified verdict for the whole run (Sprint 2, P2): the combination —
   * under the documented precedence — of every member verdict, every
   * joint verdict, and the run-level completeness state. PASS requires
   * EVERY designed member to be PASS with no failed/skipped/incomplete
   * combination and no missing gravity combo; it is never inferred from
   * a subset of members.
   */
  verdict?: Verdict
}

// ── Canvas report selection (SAP2000/ETABS-style overlay dropdown) ────────────

/**
 * Which per-member quantity the Design-tab canvas overlays. Reports are mode-
 * scoped: `req-*` render only on members whose section is in "required" mode,
 * `chk-*` only on "checked" mode. Mode-mismatched members render nothing for the
 * selected report (member colour still reflects flexural D/C). `default` keeps
 * the original worst-zone F/V summary labels and renders for every mode.
 */
export type DesignReport =
  | "default"
  | "req-long" // As required, top/bottom per zone (mm²)
  | "req-rho" // ρ required, top/bottom per zone (%)
  | "req-shear" // Av/s required per zone (mm²/m)
  | "chk-long-dc" // longitudinal D/C, top/bottom per zone
  | "chk-rho" // ρ provided, top/bottom per zone (%)
  | "chk-shear-dc" // shear D/C per zone
  | "col-dc" // column interaction D/C (per member)
  | "col-shear" // column capacity-design shear D/C (or Ve / suggested hoop)
  | "col-confine" // column transverse confinement pass/fail (Ash / ties)
  | "col-slender" // column non-sway slenderness δns + klu/r
  | "col-scwb" // strong-column-weak-beam ratio at joints (node badges)
  // Steel (AISC 360-16). Scoped to steel members exactly as req-*/chk-* are
  // scoped by RC mode: an RC member renders nothing under a stl-* report.
  | "stl-dc" // combined-force D/C + governing AISC equation
  | "stl-shear-dc" // shear D/C (Chapter G)
  | "stl-capacity" // available strengths φPn / φMn / φVn
  | "stl-limit" // governing flexural limit state + section classification
  | "stl-slender" // KL/r and which buckling mode set Fe (E3 vs E4)
  | "stl-ductility" // AISC 341 Table D1.1 ductility (blank for OMF/RMB)
  | "stl-scwb" // AISC 341 E3.4a moment ratio at joints (node badges, SMF only)

export const DESIGN_REPORTS: {
  group: "Umum" | "Sesuai Kebutuhan" | "Sesuai Gambar" | "Kolom" | "Baja"
  items: { id: DesignReport; label: string }[]
}[] = [
  { group: "Umum", items: [{ id: "default", label: "Ringkasan desain (D/C)" }] },
  {
    group: "Sesuai Kebutuhan",
    items: [
      { id: "req-long", label: "As longitudinal (atas/bawah)" },
      { id: "req-rho", label: "Rasio tulangan ρ" },
      { id: "req-shear", label: "Geser Av/s" },
    ],
  },
  {
    group: "Sesuai Gambar",
    items: [
      { id: "chk-long-dc", label: "D/C longitudinal (atas/bawah)" },
      { id: "chk-rho", label: "Rasio tulangan ρ" },
      { id: "chk-shear-dc", label: "D/C geser" },
    ],
  },
  {
    group: "Kolom",
    items: [
      { id: "col-dc", label: "D/C interaksi" },
      { id: "col-shear", label: "D/C geser (Ve)" },
      { id: "col-confine", label: "Pengekangan (Ash / sengkang)" },
      { id: "col-slender", label: "Kelangsingan δns" },
      { id: "col-scwb", label: "Kolom-kuat-balok-lemah" },
    ],
  },
  {
    group: "Baja",
    items: [
      { id: "stl-dc", label: "D/C gabungan + persamaan" },
      { id: "stl-shear-dc", label: "D/C geser" },
      { id: "stl-capacity", label: "Kapasitas φPn / φMn / φVn" },
      { id: "stl-limit", label: "Keadaan batas + klasifikasi" },
      { id: "stl-slender", label: "Kelangsingan KL/r + mode" },
      { id: "stl-ductility", label: "Daktilitas gempa (AISC 341)" },
      { id: "stl-scwb", label: "Kolom-kuat-balok-lemah (E3.4a)" },
    ],
  },
]
