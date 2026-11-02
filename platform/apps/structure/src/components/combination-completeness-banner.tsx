/**
 * Combination completeness banner (STRUKTURA Sprint 1, R-03).
 *
 * Shown over the Analyze canvas whenever the displayed combination — or any
 * combination feeding the displayed envelope — dropped at least one term
 * (missing / disabled / failed case). Before Sprint 1 `combineResults`
 * silently superposed the surviving terms and the partial numbers were
 * indistinguishable from the full combination; this banner names the
 * combination, the omitted cases and why each was omitted, so a partial
 * result can never masquerade as a complete one.
 */

import type { CombinationCompleteness, DroppedComboTermReason } from "@/engine/analysis-pipeline"

const REASON_LABEL: Record<DroppedComboTermReason, string> = {
  missing: "kasus tidak ada",
  disabled: "kasus nonaktif",
  failed: "kasus gagal diselesaikan",
}

export interface CombinationAuditItem {
  name: string
  audit: CombinationCompleteness
}

export function CombinationCompletenessBanner({ items }: { items: CombinationAuditItem[] }) {
  const incomplete = items.filter((i) => !i.audit.complete)
  if (incomplete.length === 0) return null
  return (
    <div
      data-testid="combination-incomplete-banner"
      className="absolute top-2 left-1/2 -translate-x-1/2 z-20 w-[calc(100%-2rem)] max-w-[640px] rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 shadow-[0_2px_12px_rgba(0,0,0,0.10)]"
    >
      <p className="text-[11px] font-semibold text-amber-900">
        Kombinasi tidak lengkap — hasil yang ditampilkan PARSIAL, bukan kombinasi penuh
      </p>
      <ul className="mt-1 space-y-0.5">
        {incomplete.map(({ name, audit }) => (
          <li key={audit.comboId} className="text-[11px] leading-snug text-amber-900">
            <span className="font-medium">{name}</span>: term dihilangkan —{" "}
            {audit.droppedTerms.map((t) => (
              <span key={`${t.caseId}-${t.factor}`}>
                kasus "{t.caseId}" ({t.factor}×, {REASON_LABEL[t.reason]}
                {t.failureReason ? `: ${t.failureReason}` : ""}){" "}
              </span>
            ))}
          </li>
        ))}
      </ul>
    </div>
  )
}
