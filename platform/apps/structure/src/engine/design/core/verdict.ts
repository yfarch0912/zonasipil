/**
 * Unified verdict taxonomy — the logic (Sprint 2, P2 / R-06).
 *
 * The status definitions live in types.ts next to `Verdict`; this module
 * derives verdicts from existing results WITHOUT changing any of them:
 * check-level fields (D/C ratios, pass booleans, completeness flags,
 * verification markers) remain the primary record, and a verdict is a
 * lossless rollup — every contributing reason is preserved in
 * `Verdict.reasons`, so nothing the strategies computed is erased.
 *
 * Precedence (worst wins):
 *   FAIL > INCOMPLETE > UNSUPPORTED > UNVERIFIED > NOT_EVALUATED > PASS
 *
 * Rationale: FAIL is a definitive negative finding on the demands as
 * computed and is the most decision-relevant; it is also the SAFE
 * direction — a member whose demands are partial AND whose partial
 * demands already fail is reported FAIL (never PASS), with the
 * incompleteness preserved in the reasons. INCOMPLETE outranks the
 * remaining non-PASS states because it voids the determination itself.
 * UNSUPPORTED outranks UNVERIFIED (nothing was computed at all vs
 * computed on unverified provisions), and UNVERIFIED outranks
 * NOT_EVALUATED for the same reason.
 */

import type {
  DesignRunResult,
  JointCheckResult,
  MemberDesignResult,
  Verdict,
  VerdictStatus,
} from "./types"
import type { NumericalClassification } from "@/engine/solver"

export const VERDICT_SEVERITY: Record<VerdictStatus, number> = {
  PASS: 0,
  NOT_EVALUATED: 1,
  UNVERIFIED: 2,
  UNSUPPORTED: 3,
  INCOMPLETE: 4,
  FAIL: 5,
}

export function verdict(status: VerdictStatus, ...reasons: string[]): Verdict {
  return { status, reasons }
}

/** Worst status wins; reasons are concatenated in input order. An empty
 *  input is NOT_EVALUATED (nothing was checked — never a default PASS). */
export function combineVerdicts(verdicts: readonly Verdict[]): Verdict {
  if (verdicts.length === 0) {
    return verdict("NOT_EVALUATED", "Tidak ada pemeriksaan yang digabungkan.")
  }
  let worst: VerdictStatus = "PASS"
  const reasons: string[] = []
  for (const v of verdicts) {
    if (VERDICT_SEVERITY[v.status] > VERDICT_SEVERITY[worst]) worst = v.status
    reasons.push(...v.reasons)
  }
  return { status: worst, reasons }
}

/** True only for a fully verified pass. UNVERIFIED is not a pass. */
export function isVerifiedPass(v: Verdict): boolean {
  return v.status === "PASS"
}

// ── Analysis-level verdicts ──────────────────────────────────────────────────

/**
 * Map the solver's numerical classification (Sprint 2, P1) onto the
 * taxonomy. `SINGULAR` covers a failed solve (no result exists at all).
 * ILL_CONDITIONED maps to UNVERIFIED: numbers were produced, but they may
 * not be counted as verified evidence. PHYSICALLY_IMPLAUSIBLE and
 * NUMERICALLY_UNRELIABLE map to FAIL — not because the structure failed a
 * code check, but because the RESULT is not usable engineering evidence;
 * the reason says exactly that, so the two meanings never blur.
 */
export function analysisVerdict(
  classification: NumericalClassification | "SINGULAR",
): Verdict {
  switch (classification) {
    case "VALID":
      return verdict("PASS", "Analisis valid: kondisioning dan plausibilitas lulus diagnostik numerik (Sprint 2, P1).")
    case "ILL_CONDITIONED":
      return verdict("UNVERIFIED", "Sistem ILL_CONDITIONED — hasil dihitung tetapi tidak boleh dihitung sebagai terverifikasi.")
    case "PHYSICALLY_IMPLAUSIBLE":
      return verdict("FAIL", "Hasil PHYSICALLY_IMPLAUSIBLE di bawah asumsi linear sudut-kecil — bukan bukti teknik yang dapat dipakai.")
    case "NUMERICALLY_UNRELIABLE":
      return verdict("FAIL", "Hasil NUMERICALLY_UNRELIABLE — sistem hampir singular atau residu terlalu besar; angka tidak dapat dipercaya.")
    case "SINGULAR":
      return verdict("FAIL", "Analisis gagal: matriks kekakuan singular (mekanisme) — tidak ada hasil.")
  }
}

// ── Seismic verdicts ─────────────────────────────────────────────────────────

/**
 * AISC 341 seismic checks (Sprint 1, R-01 containment): the constants are
 * unverified transcriptions, so a passing check is UNVERIFIED — never a
 * verified PASS. A failing check is FAIL: even on the unverified basis
 * the section does not satisfy the limits, and reporting FAIL is the
 * conservative direction; the reason records the unverified basis too.
 */
export function seismicVerdict(pass: boolean): Verdict {
  return pass
    ? verdict("UNVERIFIED", "Pemeriksaan seismik baja lulus pada konstanta AISC 341 yang BELUM TERVERIFIKASI (R-01) — tidak dihitung sebagai PASS terverifikasi.")
    : verdict("FAIL", "Pemeriksaan seismik baja gagal pada batas AISC 341 (konstanta belum terverifikasi, R-01).")
}

/** Joint (SCWB) verdict: RC joints use verified provisions; steel E3.4a
 *  joints carry the R-01 unverified basis via `JointCheckResult.verification`. */
export function jointVerdict(j: JointCheckResult): Verdict {
  if (j.verification === "unverified") return seismicVerdict(j.pass)
  return j.pass
    ? verdict("PASS", `SCWB simpul ${j.nodeId}: rasio ${j.ratio.toFixed(3)} ≥ 1.`)
    : verdict("FAIL", `SCWB simpul ${j.nodeId}: rasio ${j.ratio.toFixed(3)} < 1.`)
}

// ── Member verdicts ──────────────────────────────────────────────────────────

/** Failure channels of one DESIGNED member, read from its own result
 *  fields (the strategies' D/C and pass values are the primary record). */
function designedMemberParts(r: MemberDesignResult): Verdict[] {
  const parts: Verdict[] = []
  const fail = (reason: string) => parts.push(verdict("FAIL", reason))

  if (r.zones) {
    for (const [zid, z] of Object.entries(r.zones)) {
      if (!z.flexure.adequate || z.flexure.dc > 1) {
        fail(`Lentur zona ${zid}: D/C ${Number.isFinite(z.flexure.dc) ? z.flexure.dc.toFixed(2) : "∞"} — tidak memadai.`)
      }
      if (!z.shear.pass) fail(`Geser zona ${zid}: tidak lulus (Vdesign melampaui kapasitas atau batas penampang).`)
    }
  }
  for (const c of r.dimensionChecks ?? []) {
    if (c.status === "fail") fail(`Batas dimensi (${c.clause}): ${c.text}`)
  }
  const col = r.column
  if (col) {
    if (col.worstDC > 1) fail(`Interaksi kolom: D/C ${col.worstDC.toFixed(2)} > 1.`)
    if (!col.adequate) fail("Kolom: susunan tulangan tidak memadai / di luar batas rasio.")
    if (col.shear && !col.shear.pass) fail("Geser kolom (Ve): tidak lulus.")
    if (col.confinement?.some((c) => c.status === "fail")) fail("Pengekangan kolom: ada pemeriksaan detailing yang gagal.")
    if (col.scwbPass === false) fail("Kolom ini membingkai simpul yang gagal SCWB.")
  }
  const st = r.steel
  if (st) {
    if (!st.pass) fail(`Baja: rasio gabungan ${st.ratio.toFixed(2)} / geser ${st.shearRatio.toFixed(2)} — salah satu melampaui 1 (${st.equation}).`)
    if (st.seismic) {
      // The seismic channel's own verdict: FAIL when ductility fails,
      // UNVERIFIED when it passes (R-01) — combined below either way.
      parts.push(seismicVerdict(st.seismic.ductilityPass))
    }
  }
  return parts
}

/**
 * The unified verdict of one member. Mapping of the pre-taxonomy states:
 *   designed        → rollup of its check channels (above)
 *   axial-exceeded  → FAIL (the section's axial ceiling is exceeded —
 *                     an evaluated failure, not a missing check)
 *   not-implemented → UNSUPPORTED (check exists in scope, not implemented)
 *   not-designable  → UNSUPPORTED (section outside the design scope)
 *   no-result       → NOT_EVALUATED (no analysis result reached the member)
 * `demandsIncomplete` contributes INCOMPLETE on top of any of the above
 * (except the no-result / unsupported states, where there are no demands
 * to be incomplete about).
 */
export function memberVerdict(r: MemberDesignResult): Verdict {
  switch (r.status) {
    case "not-implemented":
      return verdict("UNSUPPORTED", r.note ?? `Elemen ${r.memberId}: pemeriksaan desain belum diimplementasikan.`)
    case "not-designable":
      return verdict("UNSUPPORTED", r.note ?? `Elemen ${r.memberId}: penampang di luar cakupan desain yang didukung.`)
    case "no-result":
      return verdict("NOT_EVALUATED", `Elemen ${r.memberId}: tidak ada hasil analisis — desain tidak dievaluasi.`)
    case "axial-exceeded": {
      const parts = [verdict("FAIL", `Elemen ${r.memberId}: gaya aksial melampaui batas maksimum penampang.`)]
      if (r.demandsIncomplete) parts.push(incompletePart(r))
      return combineVerdicts(parts)
    }
    case "designed": {
      const parts = designedMemberParts(r)
      if (r.demandsIncomplete) parts.push(incompletePart(r))
      if (parts.length === 0) {
        return verdict("PASS", `Elemen ${r.memberId}: semua pemeriksaan yang berlaku lulus pada demand lengkap dengan ketentuan terverifikasi.`)
      }
      return combineVerdicts(parts)
    }
  }
}

function incompletePart(r: MemberDesignResult): Verdict {
  return verdict(
    "INCOMPLETE",
    `Elemen ${r.memberId}: demand berasal dari kombinasi PARSIAL (term dihilangkan, R-03) — angka tidak boleh dibaca sebagai kombinasi penuh.`,
  )
}

// ── Whole-run verdict ────────────────────────────────────────────────────────

/**
 * The unified verdict of a design run. Combines EVERY member verdict and
 * joint verdict with the run-level completeness state:
 *   - a run that produced no result at all (!ok) is INCOMPLETE;
 *   - failed cases / skipped combinations / a missing or partial gravity
 *     combo each contribute INCOMPLETE;
 *   - PASS is issued only when the combination of all of the above is
 *     PASS — i.e. every member PASS, every joint PASS, and no run-level
 *     incompleteness. It is never inferred from a subset of members.
 */
export function designRunVerdict(run: DesignRunResult): Verdict {
  if (!run.ok) {
    return verdict(
      "INCOMPLETE",
      run.issues[0] ?? "Run desain tidak menghasilkan hasil.",
      "Run desain tidak selesai — tidak ada verdict desain yang dapat diterbitkan.",
    )
  }
  const parts: Verdict[] = []
  for (const m of Object.values(run.members)) parts.push(m.verdict ?? memberVerdict(m))
  for (const j of run.joints ?? []) parts.push(jointVerdict(j))
  if ((run.failedCases?.length ?? 0) > 0) {
    parts.push(verdict("INCOMPLETE", `${run.failedCases!.length} kasus beban gagal diselesaikan — kombinasi yang memakainya dilewati atau parsial.`))
  }
  if ((run.skippedCombos?.length ?? 0) > 0) {
    parts.push(verdict("INCOMPLETE", `${run.skippedCombos!.length} kombinasi dilewati (tidak menghasilkan hasil).`))
  }
  if ((run.incompleteCombos?.length ?? 0) > 0) {
    parts.push(verdict("INCOMPLETE", `${run.incompleteCombos!.length} kombinasi PARSIAL dipakai dalam run ini.`))
  }
  if (run.gravityComboMissing) {
    parts.push(verdict("INCOMPLETE", "Kombinasi gravitasi (1.2D + 1.0L) tidak tersedia — Ve dihitung tanpa Vg."))
  }
  if (run.gravityComboIncomplete) {
    parts.push(verdict("INCOMPLETE", "Kombinasi gravitasi (1.2D + 1.0L) PARSIAL — Vg parsial."))
  }
  if (parts.length === 0) {
    return verdict("NOT_EVALUATED", "Run tidak memiliki elemen atau pemeriksaan apa pun.")
  }
  const combined = combineVerdicts(parts)
  if (combined.status === "PASS") {
    return verdict("PASS", "Semua elemen dan simpul lulus pada demand lengkap dengan ketentuan terverifikasi; tidak ada kasus/kombinasi yang gagal, dilewati, atau parsial.")
  }
  return combined
}
