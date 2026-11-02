/**
 * Design issues panel (STRUKTURA Sprint 1, R-02).
 *
 * `designFromCases` has always collected run-level problems into
 * `DesignRunResult.issues` — failed load cases, skipped combinations,
 * capacity-design shear computed without Vg, member refusals and failures —
 * but until Sprint 1 NO UI component rendered them: the Design tab showed
 * ordinary D/C colours computed from whatever combinations survived.
 *
 * This panel is rendered over the Design canvas whenever the run carries
 * structural problems or notes. Structural problems (failed cases, skipped
 * or incomplete combinations, missing/partial gravity combo) are listed by
 * category with the affected case/combination/member ids; the run's full
 * issue list follows verbatim. Nothing here is collapsible or dismissible —
 * an engineer must not be able to mistake a degraded run for a clean one.
 */

import type { DesignRunResult } from "@/engine/design/core/types"

const REASON_LABEL: Record<string, string> = {
  missing: "kasus tidak ada",
  disabled: "kasus nonaktif",
  failed: "kasus gagal diselesaikan",
}

export function DesignIssuesPanel({ result }: { result: DesignRunResult | null }) {
  if (!result) return null
  const failed = result.failedCases ?? []
  const skipped = result.skippedCombos ?? []
  const incomplete = result.incompleteCombos ?? []
  const incompleteMembers = Object.values(result.members)
    .filter((m) => m.demandsIncomplete)
    .map((m) => m.memberId)
  const structuralCount =
    failed.length + skipped.length + incomplete.length +
    (result.gravityComboMissing ? 1 : 0) + (result.gravityComboIncomplete ? 1 : 0)
  if (structuralCount === 0 && result.issues.length === 0) return null

  return (
    <div
      data-testid="design-issues-panel"
      className="absolute top-2 left-1/2 -translate-x-1/2 z-20 w-[calc(100%-2rem)] max-w-[660px] rounded-lg border border-red-300 bg-red-50 px-3 py-2 shadow-[0_2px_12px_rgba(0,0,0,0.12)]"
    >
      <p className="text-[11px] font-semibold text-red-900">
        Masalah desain — {structuralCount > 0
          ? "run ini TIDAK LENGKAP: sebagian kebutuhan (demand) hilang atau parsial"
          : "run ini membawa catatan yang harus dibaca"}
      </p>

      {result.verdict && result.verdict.status !== "PASS" && (
        <p className="mt-1 text-[11px] leading-snug text-red-900" data-testid="design-run-verdict">
          Verdict run (taksonomi terpadu, Sprint 2): <strong>{result.verdict.status}</strong>
          {result.verdict.reasons[0] ? <> — {result.verdict.reasons[0]}</> : null}
        </p>
      )}

      {failed.length > 0 && (
        <div className="mt-1">
          <p className="text-[11px] font-medium text-red-900">Kasus beban gagal diselesaikan:</p>
          <ul className="list-disc pl-4">
            {failed.map((c) => (
              <li key={c.caseId} className="text-[11px] leading-snug text-red-900">
                "{c.name}" ({c.caseId}): {c.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {skipped.length > 0 && (
        <div className="mt-1">
          <p className="text-[11px] font-medium text-red-900">Kombinasi dilewati (tidak menghasilkan hasil):</p>
          <ul className="list-disc pl-4">
            {skipped.map((c) => (
              <li key={c.comboId} className="text-[11px] leading-snug text-red-900">
                "{c.name}" ({c.comboId})
              </li>
            ))}
          </ul>
        </div>
      )}

      {incomplete.length > 0 && (
        <div className="mt-1">
          <p className="text-[11px] font-medium text-red-900">Kombinasi tidak lengkap (hasil parsial):</p>
          <ul className="list-disc pl-4">
            {incomplete.map((c) => (
              <li key={c.comboId} className="text-[11px] leading-snug text-red-900">
                "{c.name}" ({c.comboId}): term dihilangkan —{" "}
                {c.droppedTerms.map((t) => (
                  <span key={`${t.caseId}-${t.factor}`}>
                    kasus "{t.caseId}" ({t.factor}×, {REASON_LABEL[t.reason] ?? t.reason}){" "}
                  </span>
                ))}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.gravityComboMissing && (
        <p className="mt-1 text-[11px] leading-snug text-red-900">
          Kombinasi gravitasi internal (1.2D + 1.0L) tidak tersedia — geser desain
          kapasitas (Ve) dihitung TANPA Vg.
        </p>
      )}
      {result.gravityComboIncomplete && (
        <p className="mt-1 text-[11px] leading-snug text-red-900">
          Kombinasi gravitasi internal (1.2D + 1.0L) tidak lengkap — Vg yang
          dipakai untuk Ve adalah nilai parsial.
        </p>
      )}

      {incompleteMembers.length > 0 && (
        <p className="mt-1 text-[11px] leading-snug text-red-900">
          Elemen dengan demand tidak lengkap: {incompleteMembers.join(", ")} —
          angka elemen ini tidak berasal dari kombinasi yang lengkap.
        </p>
      )}

      {result.issues.length > 0 && (
        <div className="mt-1.5 max-h-36 overflow-y-auto border-t border-red-200 pt-1.5">
          <p className="text-[10px] font-medium text-red-800">
            Semua catatan run ({result.issues.length}):
          </p>
          <ul className="list-disc pl-4">
            {result.issues.map((s, i) => (
              <li key={i} className="text-[11px] leading-snug text-red-900">{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
