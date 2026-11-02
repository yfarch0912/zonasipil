import type { StructureModel } from "@/engine/model"
import { Trash2 } from "lucide-react"
import { SelectionChip, DeleteButton } from "@/components/flyout-shared"
import { CaseSelectorRow } from "./case-selector-row"
import type { LoadCase, LoadCaseId } from "@/engine/load-cases"

export function DeleteLoadToolContent({
  selectedLoadIds,
  model,
  onDelete,
  loadCases,
  activeLoadCaseId,
  onActiveLoadCaseChange,
}: {
  selectedLoadIds: string[]
  model?: StructureModel | null
  onDelete?: () => void
  loadCases?: Record<LoadCaseId, LoadCase>
  activeLoadCaseId?: LoadCaseId
  onActiveLoadCaseChange?: (id: LoadCaseId) => void
}) {
  const caseSelector =
    loadCases && activeLoadCaseId && onActiveLoadCaseChange ? (
      <CaseSelectorRow
        label="Filter menurut Kasus Beban"
        loadCases={loadCases}
        value={activeLoadCaseId}
        onChange={onActiveLoadCaseChange}
      />
    ) : null

  if (selectedLoadIds.length === 0) {
    return (
      <div className="space-y-3">
        {caseSelector}
        <p className="text-xs text-gray-500 leading-relaxed">
          Klik beban atau seret kotak pada kanvas untuk memilih beban
        </p>
      </div>
    )
  }

  const pointCount = selectedLoadIds.filter(id => model?.loads[id]?.type === "point").length
  const distCount  = selectedLoadIds.filter(id => model?.loads[id]?.type === "distributed").length
  const parts: string[] = []
  if (pointCount > 0) parts.push(`${pointCount} beban titik`)
  if (distCount  > 0) parts.push(`${distCount} beban merata`)

  return (
    <div className="space-y-3">
      {caseSelector}
      <SelectionChip>{parts.join(", ")} dipilih</SelectionChip>

      <DeleteButton onClick={onDelete}>
        <Trash2 size={14} />
        <span>Hapus {selectedLoadIds.length > 1 ? `${selectedLoadIds.length} Beban` : "Beban"}</span>
      </DeleteButton>
    </div>
  )
}
