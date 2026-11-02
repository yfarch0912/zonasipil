/**
 * RC PREFERENCES — the code-level setup for reinforced concrete, step 1 of the
 * RC design tool (SAP2000 "Design Preferences" style). One column of labelled
 * fields; values apply to every concrete member in the model.
 *
 * Lives beside the RC section pane rather than in a shared criteria tool: the
 * settings here are meaningless without the material, and the material is the
 * tool you are already in.
 */

import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { FRAME_TYPES, type FrameType } from "@/engine/design/core/types"
import type { RcCriteria } from "@/engine/design/rc/criteria"
import { RC_CODE_LABELS, type RcCode } from "@/engine/design/rc/codes"
import { CriteriaInput } from "../shared/criteria-input"

/**
 * Framing-type labels per code: SNI 2847:2019 uses SRPMB/SRPMM/SRPMK, ACI 318-25
 * uses OMF/IMF/SMF (the engine `frameType` enum stays OMF|IMF|SMF internally).
 */
const FRAME_TYPE_LABELS_ACI: Record<FrameType, string> = {
  OMF: "Rangka Momen Biasa (OMF)",
  IMF: "Rangka Momen Menengah (IMF)",
  SMF: "Rangka Momen Khusus (SMF)",
}
const FRAME_TYPE_LABELS_SNI: Record<FrameType, string> = {
  OMF: "SRPMB (Biasa)",
  IMF: "SRPMM (Menengah)",
  SMF: "SRPMK (Khusus)",
}
function frameTypeLabels(code: RcCode): Record<FrameType, string> {
  return code === "SNI2847-19" ? FRAME_TYPE_LABELS_SNI : FRAME_TYPE_LABELS_ACI
}

/** Short framing-type label for the context strip — the long form does not fit. */
export function rcFrameShortLabel(criteria: RcCriteria): string {
  return criteria.code === "SNI2847-19"
    ? { OMF: "SRPMB", IMF: "SRPMM", SMF: "SRPMK" }[criteria.frameType]
    : criteria.frameType
}

interface RcPreferencesProps {
  criteria: RcCriteria
  onChange: (patch: Partial<RcCriteria>) => void
}

export function RcPreferencesPane({ criteria, onChange }: RcPreferencesProps) {
  return (
    <div className="space-y-3">
      {/* Design code */}
      <div className="space-y-1.5">
        <Label className="text-xs text-gray-600">Kode Desain</Label>
        <Select
          value={criteria.code}
          onValueChange={(v) => onChange({ code: v as RcCode })}
        >
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(RC_CODE_LABELS) as RcCode[]).map((c) => (
              <SelectItem key={c} value={c}>{RC_CODE_LABELS[c]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[10px] text-gray-500 leading-snug">
          {criteria.code === "ACI318-25"
            ? "ACI 318-25: batas terkendali-tarik εty+0.003 dan efek ukuran geser satu arah λs (elemen tanpa sengkang minimum). Berbeda dari SNI hanya untuk baja kuat tinggi / daerah dalam tanpa sengkang."
            : "SNI 2847:2019 (diadopsi dari ACI 318-14): batas terkendali-tarik tetap 0.005, tanpa efek ukuran geser (λs = 1)."}
        </p>
      </div>

      {/* Frame type */}
      <div className="space-y-1.5">
        <Label className="text-xs text-gray-600">Tipe Rangka</Label>
        <Select
          value={criteria.frameType}
          onValueChange={(v) => onChange({ frameType: v as FrameType })}
        >
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {FRAME_TYPES.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {frameTypeLabels(criteria.code)[f.id]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {criteria.frameType !== "OMF" && (
          <p className="text-[10px] text-gray-500 leading-snug">
            {criteria.frameType === "SMF"
              ? "SMF/SRPMK: geser dari Mpr (1.25fy), Vc = 0 di zona sendi, batas spasi sengkang. Kolom menambah pengekangan Ash (18.7.5) dan kolom-kuat-balok-lemah (18.7.3.2)."
              : "IMF/SRPMM: geser dari momen ujung nominal Mn ditambah gravitasi; kolom mendapat spasi sengkang lebih ringan sepanjang lo (18.4.3)."}
          </p>
        )}
      </div>

      {/* Reinforcement material */}
      <div className="space-y-1.5 pt-2 border-t border-gray-200">
        <Label className="text-xs font-semibold" style={{ color: "#1a2f5e" }}>Material Tulangan</Label>
        <CriteriaInput label="Leleh tulangan utama" symbol="fy" value={criteria.fy} unit="MPa" min={1} onCommit={(v) => onChange({ fy: v })} />
        <CriteriaInput label="Leleh sengkang" symbol="fyt" value={criteria.fyt} unit="MPa" min={1} onCommit={(v) => onChange({ fyt: v })} />
        <CriteriaInput label="Modulus elastisitas" symbol="Es" value={criteria.Es} unit="MPa" min={1} onCommit={(v) => onChange({ Es: v })} />
      </div>

      {/* Strength reduction factors */}
      <div className="space-y-1.5 pt-2 border-t border-gray-200">
        <Label className="text-xs font-semibold" style={{ color: "#1a2f5e" }}>Reduksi Kekuatan</Label>
        <CriteriaInput label="Lentur (terkendali-tarik)" symbol="φt" value={criteria.phiTension} unit="" min={0.01} max={1} onCommit={(v) => onChange({ phiTension: v })} />
        <CriteriaInput label="Geser" symbol="φv" value={criteria.phiShear} unit="" min={0.01} max={1} onCommit={(v) => onChange({ phiShear: v })} />
        <CriteriaInput label="Tekan-terkendali" symbol="φc" value={criteria.phiCompression} unit="" min={0.01} max={1} onCommit={(v) => onChange({ phiCompression: v })} />
      </div>

      {/* Other parameters */}
      <div className="space-y-1.5 pt-2 border-t border-gray-200">
        <Label className="text-xs font-semibold" style={{ color: "#1a2f5e" }}>Parameter</Label>
        <CriteriaInput label="Faktor beton ringan" symbol="λ" value={criteria.lambda} unit="" min={0.01} max={1} onCommit={(v) => onChange({ lambda: v })} />
        <CriteriaInput label="Kaki sengkang" symbol="n" value={criteria.stirrupLegs} unit="" min={1} integer onCommit={(v) => onChange({ stirrupLegs: v })} />
      </div>
    </div>
  )
}
