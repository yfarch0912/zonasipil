/**
 * Service-level analysis result used by the one-click report.
 *
 * Combines — at factor 1.0, by exact linear superposition — the self-weight
 * case (synthesized from section γ·A by the analysis pipeline) and every load
 * case actually present in the model. This is deliberately NOT a factored
 * design combination; factored combos live in the editor's Load tab.
 *
 * Sprint 2 (P3/P4): the result also carries the combination's completeness
 * audit and a list of integrity warnings (dropped terms, numerical
 * reliability classification). The one-click report prints them verbatim —
 * a service result that is partial or numerically implausible must never
 * be presented as a clean verified result.
 */
import type { StructureModel } from '@/engine/model'
import {
  solveAllCases,
  combineResults,
  type CombinationAnalysisResult,
  type CombinationCompleteness,
} from '@/engine/analysis-pipeline'
import type { LoadCase, LoadCombination } from '@/engine/load-cases'

export type ServiceResult =
  | {
      ok: true
      result: CombinationAnalysisResult
      label: string
      completeness: CombinationCompleteness
      /** Integrity warnings the report must display (empty when clean). */
      warnings: string[]
    }
  | { ok: false; reason: string }

export function serviceResult(model: StructureModel): ServiceResult {
  const caseIds = new Set<string>(['selfweight'])
  for (const l of Object.values(model.loads)) caseIds.add(l.loadCaseId)

  const cases: Record<string, LoadCase> = {}
  for (const id of caseIds) {
    cases[id] = {
      id,
      name: id === 'selfweight' ? 'Berat Sendiri' : id,
      kind: id === 'selfweight' || id === 'dead' ? 'Dead' : id === 'live' ? 'Live' : 'Dead',
      enabled: true,
    }
  }

  const perCase = solveAllCases(model, cases)
  for (const [id, r] of Object.entries(perCase)) {
    if (!r.ok) return { ok: false, reason: `Kasus "${id}" gagal: ${r.reason}` }
  }

  const combo: LoadCombination = {
    id: 'struktura-service',
    name: '1.0×(BS + semua kasus termodel)',
    terms: [...caseIds].map((caseId) => ({ factor: 1, caseId })),
    source: 'custom',
    enabled: true,
  }
  const combined = combineResults(perCase, combo, cases)
  if (!combined) {
    return { ok: false, reason: 'Kombinasi tidak menghasilkan hasil (tidak ada kasus yang dapat diselesaikan)' }
  }

  // Integrity warnings (Sprint 2, P3/P4). Structurally, the service
  // combination is built from exactly the cases solved above, so a
  // dropped term should be impossible — the audit is still surfaced
  // defensively: if that invariant ever breaks, the report must say so
  // instead of presenting a partial superposition as the full result.
  const warnings: string[] = []
  if (!combined.combination.complete) {
    const dropped = combined.combination.droppedTerms
      .map((t) => `"${t.caseId}" (${t.factor}×, ${t.reason}${t.failureReason ? `: ${t.failureReason}` : ''})`)
      .join(', ')
    warnings.push(
      `Kombinasi layan TIDAK LENGKAP — term ${dropped} dihilangkan; angka dalam laporan ini PARSIAL dan tidak boleh dibaca sebagai hasil penuh.`,
    )
  }
  const cls = combined.numerical.classification
  if (cls !== 'VALID') {
    warnings.push(
      `Keandalan numerik hasil: ${cls} — hasil ini TIDAK boleh dibaca sebagai hasil terverifikasi. ` +
      (cls === 'PHYSICALLY_IMPLAUSIBLE'
        ? `Rotasi terbesar ${combined.numerical.maxAbsRotation.value.toExponential(2)} rad (simpul ${combined.numerical.maxAbsRotation.nodeId}) melampaui batas asumsi linear sudut-kecil 0,1 rad.`
        : `Rasio pivot terekualisasi ${combined.numerical.equilibratedPivotRatio.toExponential(2)}; residu relatif ${combined.numerical.relativeResidual.toExponential(2)}.`),
    )
  } else if (combined.numerical.flags.includes('large-rotation')) {
    warnings.push(
      `Rotasi hasil besar (${combined.numerical.maxAbsRotation.value.toExponential(2)} rad di simpul ${combined.numerical.maxAbsRotation.nodeId}) — asumsi linear sudut-kecil mulai tertekan.`,
    )
  }

  return { ok: true, result: combined, label: combo.name, completeness: combined.combination, warnings }
}
