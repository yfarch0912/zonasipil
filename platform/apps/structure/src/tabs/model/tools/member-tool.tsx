import type { Section, SectionId, MemberType } from "@/engine/model"
import { Label } from "@/components/ui/label"
import { SectionSelect, ToggleButton } from "@/components/flyout-shared"

export function MemberToolContent({
  activeSection,
  sections,
  onSectionChange,
  activeMemberType,
  onMemberTypeChange,
}: {
  activeSection: SectionId
  sections?: Record<string, Section>
  onSectionChange?: (id: SectionId) => void
  activeMemberType: MemberType
  onMemberTypeChange?: (t: MemberType) => void
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs text-gray-600">Tipe Elemen</Label>
        <div className="flex gap-1">
          <ToggleButton
            active={activeMemberType === "frame"}
            onClick={() => onMemberTypeChange?.("frame")}
            className="h-7 text-[11px]"
          >
            Rangka
          </ToggleButton>
          <ToggleButton
            active={activeMemberType === "truss"}
            onClick={() => onMemberTypeChange?.("truss")}
            className="h-7 text-[11px]"
          >
            Rangka Batang
          </ToggleButton>
        </div>
        <p className="text-[10px] text-gray-400 leading-snug">
          {activeMemberType === "frame"
            ? "Balok-kolom penuh: aksial + geser + momen"
            : "Rangka dengan lepas momen di kedua ujung. Hanya menyalurkan aksial di simpul; memikul beban transversal secara lokal (berat sendiri menghasilkan lentur tumpuan sederhana)."}
        </p>
      </div>

      <SectionSelect value={activeSection} sections={sections} onChange={onSectionChange} />
      <p className="text-xs text-gray-500 leading-relaxed">
        Klik dua titik pada kanvas untuk menggambar elemen
      </p>
    </div>
  )
}
