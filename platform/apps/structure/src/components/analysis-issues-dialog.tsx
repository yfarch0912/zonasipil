/**
 * Analysis Issues Dialog (v1.0.6).
 *
 * Surfaces structural-validity issues to the user when the analysis cannot
 * produce results. Auto-opens once per Analyze-tab entry when there is at
 * least one error-severity issue; manually re-openable by clicking the
 * status-bar STATUS label. Closed via the × button, backdrop click, or ESC.
 *
 * Follows the project's custom modal pattern (matches examples-modal.tsx and
 * the template modals) — does not use the shadcn Dialog primitive because
 * the rest of the codebase doesn't either.
 */

import { useEffect, useRef } from "react"
import { X } from "lucide-react"
import type {
  DiagnosticIssue,
  DiagnosticsReport,
} from "@/engine/analysis-diagnostics"

interface AnalysisIssuesDialogProps {
  open: boolean
  onClose: () => void
  report: DiagnosticsReport
}

function messageFor(issue: DiagnosticIssue): string {
  switch (issue.kind) {
    case "no-nodes":
      return "Model tidak memiliki simpul."
    case "no-members":
      return "Model tidak memiliki elemen."
    case "no-supports":
      return "Model tidak memiliki tumpuan."
    case "insufficient-reactions":
      return `Model memiliki ${issue.have} komponen reaksi tetapi membutuhkan minimal 3 untuk kesetimbangan statis.`
    case "disconnected-component":
      return "Ada simpul yang tidak terhubung ke tumpuan mana pun."
    case "singular-at-dof": {
      // The failing degree of freedom is already known — `dofToLocation` maps
      // the solver's singular pivot back to a node and a direction in App.tsx.
      // Naming it turns a generic warning into a pointer at the exact joint,
      // which is the difference between "something is wrong" and "go here".
      const dir =
        issue.direction === "u" ? "arah horizontal"
        : issue.direction === "v" ? "arah vertikal"
        : "arah rotasi"
      return `Ketidakstabilan terdeteksi di simpul ${issue.nodeId}, ${dir}. Tidak ada yang menahan arah tersebut — kemungkinan ada kendala yang hilang atau mekanisme geometris.`
    }
    case "selfweight-zero-gamma":
      return "Peringatan: Beberapa penampang memiliki Berat Satuan (γ) = 0 sehingga tidak menghasilkan kontribusi berat sendiri."
    case "duplicate-members":
      return "Dua elemen atau lebih berbagi titik ujung yang sama. Solver menjumlahkan kekakuannya, yang biasanya merupakan kesalahan templat atau impor."
    case "solver-failure":
      // The solver's named reason, verbatim (Cycle 12, C10-F1) — do not
      // paraphrase it away; it names the exact member/node/section at fault.
      return `Analisis gagal: ${issue.reason}.`
    case "orphaned-loads":
      return `${issue.loadIds.length} beban (${issue.loadIds.join(", ")}) termasuk dalam kasus beban yang sudah dihapus atau tidak ada dan dikecualikan dari semua analisis. Hapus beban tersebut sebelum mempercayai hasilnya.`
    case "shear-fallback":
      // Sprint 1 (R-07): shear deformation was requested but these members'
      // sections have no positive shear area, so they were solved with the
      // Euler–Bernoulli element. Name members + sections and the remedy.
      return `Deformasi geser (Timoshenko) diminta, tetapi ${issue.members.length} elemen (${issue.members.map((m) => `${m.memberId} (penampang ${m.sectionId})`).join(", ")}) dihitung dengan elemen Euler–Bernoulli karena penampangnya tidak memiliki luas geser Aκ2 positif — formulasi deformasi geser TIDAK dipakai untuk elemen tersebut. Isi Aκ2 pada penampang bila deformasi geser memang diperlukan.`
    case "selfweight-case-loads":
      // Cycle 22 (C19-F1): the Selfweight case is solved from synthesized
      // γ·A body forces only, so user loads assigned to it are discarded by
      // the solve. Name them so the drop is visible, and tell the user the
      // remedy (reassign) — the loads themselves are never touched.
      return `${issue.loadIds.length} beban (${issue.loadIds.join(", ")}) ditetapkan ke kasus Berat Sendiri, yang diselesaikan hanya dari gaya badan sintetis (γ·A) — beban tersebut dikecualikan dari semua analisis dan dari laporan. Tetapkan ulang ke kasus beban lain (cth. Beban Mati) sebelum mempercayai hasilnya.`
    case "numerical-reliability": {
      // Sprint 2 (R-11): the case solved, but its numbers are classified
      // as untrustworthy evidence. Name the classification, the measured
      // evidence, and where it lives — never let it read as a PASS.
      const theta = Math.abs(issue.maxRotation).toExponential(2)
      if (issue.classification === "PHYSICALLY_IMPLAUSIBLE") {
        return `Hasil analisis TIDAK MASUK AKAL SECARA FISIK (PHYSICALLY_IMPLAUSIBLE): rotasi terbesar ${theta} rad di simpul ${issue.maxRotationNodeId} jauh melampaui batas asumsi linear sudut-kecil (0,1 rad). Struktur mungkin memang terselesaikan secara matematis, tetapi perpindahannya bukan bukti teknik yang dapat dipakai — periksa elemen yang sangat fleksibel atau tumpuan yang kurang. Hasil TIDAK boleh dibaca sebagai terverifikasi.`
      }
      if (issue.classification === "NUMERICALLY_UNRELIABLE") {
        return `Hasil analisis TIDAK ANDAL SECARA NUMERIK (NUMERICALLY_UNRELIABLE): rasio pivot terekualisasi ${issue.pivotRatio.toExponential(2)} (DOF terlemah: simpul ${issue.worstDofNodeId}, arah ${issue.worstDofDirection}) — sistem hampir singular sehingga angka hasil tidak dapat dipercaya. Periksa mekanisme atau elemen yang hampir tidak berkekakuan.`
      }
      if (issue.classification === "ILL_CONDITIONED") {
        return `Peringatan: sistem hampir singular (ILL_CONDITIONED, rasio pivot terekualisasi ${issue.pivotRatio.toExponential(2)}, DOF terlemah simpul ${issue.worstDofNodeId} arah ${issue.worstDofDirection}). Hasil harus dibaca dengan hati-hati dan TIDAK dihitung sebagai lulus terverifikasi.`
      }
      return `Peringatan: rotasi hasil analisis besar (${theta} rad di simpul ${issue.maxRotationNodeId}) — asumsi linear sudut-kecil mulai tertekan. Periksa apakah perpindahan sebesar ini memang dimaksudkan.`
    }
  }
}

export function AnalysisIssuesDialog({ open, onClose, report }: AnalysisIssuesDialogProps) {
  // ESC closes, matching other modals.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  // Phase 7 (finding F5): the dialog previously had no dialog semantics
  // and never received focus, so keyboard/screen-reader users were not
  // taken to it. It now exposes role="dialog" aria-modal and moves
  // focus to itself on open.
  const dialogRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (open) dialogRef.current?.focus()
  }, [open ])

  if (!open) return null

  // Drop issues that already have dedicated inline surfaces elsewhere in the
  // app — listing them here too is just visual noise. The γ=0 self-weight
  // warning is shown in both the Load Case and Load Combination flyout tools
  // and doesn't need to repeat in this dialog.
  //
  // Then sort errors before warnings and de-duplicate by message text so
  // repeated singular-DOF entries across cases don't spam the list.
  const sorted = [...report.issues]
    .filter((i) => i.kind !== "selfweight-zero-gamma")
    .sort((a, b) => {
      if (a.severity === b.severity) return 0
      return a.severity === "error" ? -1 : 1
    })
  const seen = new Set<string>()
  const issues = sorted.filter((i) => {
    const msg = messageFor(i)
    if (seen.has(msg)) return false
    seen.add(msg)
    return true
  })

  if (issues.length === 0) {
    // Nothing to show — should not normally render, but guard defensively.
    return null
  }

  const hasError = issues.some((i) => i.severity === "error")
  const title = "Peringatan"

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Peringatan analisis"
        tabIndex={-1}
        className="bg-white rounded-xl shadow-2xl w-[480px] max-w-[calc(100vw-2rem)] max-h-[85dvh] overflow-y-auto outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-[#1a2f5e]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Issue list */}
        <div className="px-5 py-4 space-y-2">
          {issues.map((issue, idx) => (
            <div
              key={`${issue.kind}-${idx}`}
              className="flex items-start gap-2.5 text-xs leading-snug"
            >
              <span
                className={
                  "mt-1 w-2 h-2 rounded-full flex-none " +
                  (issue.severity === "error" ? "bg-[#dc2626]" : "bg-[#d97706]")
                }
              />
              <span
                className={
                  issue.severity === "error"
                    ? "text-[#1e293b]"
                    : "text-amber-900"
                }
              >
                {messageFor(issue)}
              </span>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="px-5 py-3 border-t border-gray-100 text-[10px] text-gray-400">
          {hasError
            ? "Selesaikan masalah di atas agar analisis dapat menghasilkan hasil."
            : "Peringatan tidak menghalangi analisis tetapi dapat memengaruhi ketelitian hasil."}
        </div>
      </div>
    </div>
  )
}
