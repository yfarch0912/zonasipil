import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NumericInput } from "@/components/ui/numeric-input"
import { ToggleButton } from "@/components/flyout-shared"
import { CaseSelectorRow } from "./case-selector-row"
import type { LoadCase, LoadCaseId } from "@/engine/load-cases"

export function PointLoadToolContent({
  inputMode,
  onInputModeChange,
  axis,
  magnitude,
  onAxisChange,
  onMagnitudeChange,
  angle,
  onAngleChange,
  loadCases,
  activeLoadCaseId,
  onActiveLoadCaseChange,
}: {
  inputMode: "principal" | "angular"
  onInputModeChange?: (mode: "principal" | "angular") => void
  axis: "x" | "y"
  magnitude: number
  onAxisChange?: (a: "x" | "y") => void
  onMagnitudeChange?: (v: number) => void
  angle: number
  onAngleChange?: (angle: number) => void
  loadCases?: Record<LoadCaseId, LoadCase>
  activeLoadCaseId?: LoadCaseId
  onActiveLoadCaseChange?: (id: LoadCaseId) => void
}) {
  return (
    <div className="space-y-3">
      {loadCases && activeLoadCaseId && onActiveLoadCaseChange && (
        <CaseSelectorRow
          label="Kasus Beban"
          loadCases={loadCases}
          value={activeLoadCaseId}
          onChange={onActiveLoadCaseChange}
          excludeLocked
        />
      )}
      <div className="space-y-1.5">
        <Label className="text-xs text-gray-600">Mode Input</Label>
        <div className="flex gap-1">
          <ToggleButton
            active={inputMode === "principal"}
            onClick={() => onInputModeChange?.("principal")}
            className="h-7 text-[11px]"
          >
            Utama
          </ToggleButton>
          <ToggleButton
            active={inputMode === "angular"}
            onClick={() => onInputModeChange?.("angular")}
            className="h-7 text-[11px]"
          >
            Sudut
          </ToggleButton>
        </div>
      </div>

      {inputMode === "principal" ? (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Sumbu global</Label>
            <div className="flex gap-1">
              <ToggleButton
                active={axis === "x"}
                onClick={() => onAxisChange?.("x")}
                className="h-7 text-[11px]"
              >
                Sumbu X
              </ToggleButton>
              <ToggleButton
                active={axis === "y"}
                onClick={() => onAxisChange?.("y")}
                className="h-7 text-[11px]"
              >
                Sumbu Y
              </ToggleButton>
            </div>
            <p className="text-[10px] text-gray-500 leading-snug">
              {axis === "x" ? "+ ke kanan, − ke kiri" : "+ ke atas, − ke bawah"}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Besar</Label>
            <div className="flex gap-2">
              <NumericInput
                value={magnitude}
                onChange={(v) => onMagnitudeChange?.(v)}
                className="h-8 text-xs font-mono flex-1"
              />
              <span className="text-xs text-gray-500 self-center whitespace-nowrap">kN</span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Sudut arah</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min={0}
                max={360}
                step={1}
                value={angle}
                onChange={(e) => {
                  const v = parseFloat(e.target.value)
                  if (!isNaN(v)) onAngleChange?.(((Math.round(v) % 360) + 360) % 360)
                }}
                className="h-7 text-xs font-mono flex-1"
              />
              <span className="text-xs text-gray-500 self-center">°</span>
            </div>
            <p className="text-[10px] text-gray-500 leading-snug">
              {angle === 0 ? "→ ke kanan" : angle === 90 ? "↓ ke bawah" : angle === 180 ? "← ke kiri" : angle === 270 ? "↑ ke atas" : "diagonal"}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600">Besar</Label>
            <div className="flex gap-2">
              <NumericInput
                value={magnitude}
                onChange={(v) => onMagnitudeChange?.(v)}
                className="h-8 text-xs font-mono flex-1"
              />
              <span className="text-xs text-gray-500 self-center whitespace-nowrap">kN</span>
            </div>
          </div>
        </>
      )}

      <p className="text-xs text-gray-500 leading-relaxed">Klik simpul untuk menempatkan</p>
    </div>
  )
}
