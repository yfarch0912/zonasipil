import type { MultiSelection } from "@/engine/model"
import { Trash2 } from "lucide-react"
import { SelectionChip, DeleteButton } from "@/components/flyout-shared"

export function DeleteComponentToolContent({
  selection,
  onDelete,
}: {
  selection: MultiSelection
  onDelete?: () => void
}) {
  const hasSelection =
    selection.nodeIds.length > 0 ||
    selection.memberIds.length > 0 ||
    selection.supportNodeIds.length > 0

  const parts: string[] = []
  if (selection.nodeIds.length > 0)
    parts.push(`${selection.nodeIds.length} simpul`)
  if (selection.memberIds.length > 0)
    parts.push(`${selection.memberIds.length} elemen`)
  if (selection.supportNodeIds.length > 0)
    parts.push(`${selection.supportNodeIds.length} tumpuan`)
  const label = parts.length > 0 ? parts.join(", ") : "Tidak ada komponen dipilih"

  return (
    <div className="space-y-3">
      <SelectionChip>{label}</SelectionChip>

      <DeleteButton onClick={onDelete} disabled={!hasSelection}>
        <Trash2 size={14} />
        <span>Hapus</span>
      </DeleteButton>
    </div>
  )
}
