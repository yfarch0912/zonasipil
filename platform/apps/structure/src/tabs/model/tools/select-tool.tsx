import * as React from "react"
import type { Section, SectionId, MultiSelection } from "@/engine/model"
import {
  SectionSelect,
  ApplyButton,
  SelectionChip,
} from "@/components/flyout-shared"

export function ModifyComponentToolContent({
  selection,
  sectionId,
  sections,
  onSectionChange,
  onModify,
}: {
  selection: MultiSelection
  sectionId: SectionId
  sections?: Record<string, Section>
  onSectionChange?: (id: SectionId) => void
  onModify?: () => void
}) {
  const hasMembers = selection.memberIds.length > 0

  const [sectionApplied, setSectionApplied] = React.useState(false)

  const memberKey = selection.memberIds.join(",")
  React.useEffect(() => { setSectionApplied(false) }, [sectionId, memberKey])

  const canApplySection = hasMembers && !sectionApplied

  const memberCount = selection.memberIds.length

  return (
    <div className="space-y-3">
      {memberCount > 0 && (
        <SelectionChip>
          {memberCount} elemen dipilih
        </SelectionChip>
      )}

      {hasMembers && (
        <div className="space-y-2">
          <SectionSelect value={sectionId} sections={sections} onChange={onSectionChange} label="Ubah penampang" />
          <ApplyButton
            disabled={!canApplySection}
            onClick={() => {
              if (!canApplySection) return
              onModify?.()
              setSectionApplied(true)
            }}
          >
            Terapkan
          </ApplyButton>
        </div>
      )}

      {!hasMembers && (
        <p className="text-xs text-gray-500">Pilih elemen yang akan diubah</p>
      )}
    </div>
  )
}
