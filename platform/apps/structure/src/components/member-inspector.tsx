import type { StructureModel, MemberId, NodeId } from "@/engine/model"
import type { AnalysisResult } from "@/engine/solver"
import {
  inspectMember,
  inspectNode,
  internalForcesAt,
} from "@/visualization/inspector"

/**
 * Member/node result inspector for the Analyze view.
 *
 * Presentation only: every value comes from the solver result the
 * canvas is already drawing (end forces, nodal displacements,
 * reactions) and from the engine's memberInternalForces recovery —
 * the same source as the N/V/M diagrams. When a result is missing,
 * the panel says so instead of inventing a number.
 */

interface Props {
  model: StructureModel
  result: AnalysisResult | null
  memberId: MemberId | null
  nodeId: NodeId | null
  xi: number
  onXiChange: (xi: number) => void
}

const thCls = "text-left font-semibold px-1.5 py-1 border-b border-gray-300"
const tdCls = "px-1.5 py-1 border-b border-gray-100 tabular-nums"
const fmt = (v: number, digits = 3) => v.toFixed(digits)

export function MemberInspector({ model, result, memberId, nodeId, xi, onXiChange }: Props) {
  if (memberId) {
    const insp = inspectMember(model, result, memberId)
    if (!insp) return null
    const at = internalForcesAt(model, result, memberId, xi)
    return (
      <section
        aria-label={`Inspektor elemen ${memberId}`}
        className="bg-white border-b border-gray-200 px-3 py-2 text-[13px] text-[#14213d]"
      >
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">
              Inspektor Elemen {insp.memberId}
            </h3>
            <table className="mt-1">
              <tbody>
                <tr>
                  <td className={tdCls}>Simpul awal / akhir</td>
                  <td className={tdCls}>
                    {insp.a} → {insp.b}
                  </td>
                </tr>
                <tr>
                  <td className={tdCls}>Panjang</td>
                  <td className={tdCls}>{fmt(insp.length)} m</td>
                </tr>
                <tr>
                  <td className={tdCls}>Penampang</td>
                  <td className={tdCls}>{insp.sectionName}</td>
                </tr>
                <tr>
                  <td className={tdCls}>Material</td>
                  <td className={tdCls}>{insp.materialLabel}</td>
                </tr>
                <tr>
                  <td className={tdCls}>Tumpuan terkait</td>
                  <td className={tdCls}>
                    {insp.supportA ?? "—"} / {insp.supportB ?? "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500">Gaya ujung elemen</h4>
            {insp.endForces ? (
              <table className="mt-1">
                <thead>
                  <tr>
                    <th className={thCls}>Ujung</th>
                    <th className={thCls}>N (kN)</th>
                    <th className={thCls}>V (kN)</th>
                    <th className={thCls}>M (kN·m)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={tdCls}>{insp.a}</td>
                    <td className={tdCls}>{fmt(insp.endForces.N1)}</td>
                    <td className={tdCls}>{fmt(insp.endForces.V1)}</td>
                    <td className={tdCls}>{fmt(insp.endForces.M1)}</td>
                  </tr>
                  <tr>
                    <td className={tdCls}>{insp.b}</td>
                    <td className={tdCls}>{fmt(insp.endForces.N2)}</td>
                    <td className={tdCls}>{fmt(insp.endForces.V2)}</td>
                    <td className={tdCls}>{fmt(insp.endForces.M2)}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Hasil analisis tidak tersedia untuk elemen ini.
              </p>
            )}
            {insp.dispA && insp.dispB && (
              <p className="text-xs text-gray-600 mt-1">
                Perpindahan ujung — {insp.a}: u {insp.dispA.u.toExponential(2)} m, v{" "}
                {insp.dispA.v.toExponential(2)} m, θ {insp.dispA.theta.toExponential(2)} rad ·{" "}
                {insp.b}: u {insp.dispB.u.toExponential(2)} m, v {insp.dispB.v.toExponential(2)} m,
                θ {insp.dispB.theta.toExponential(2)} rad
              </p>
            )}
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500">Inspeksi sepanjang elemen</h4>
            <label className="text-xs flex items-center gap-2 mt-1">
              Posisi x/L
              <input
                type="range"
                min={0}
                max={1000}
                aria-label="Posisi inspeksi sepanjang elemen"
                value={Math.round(xi * 1000)}
                onChange={(e) => onXiChange(Number(e.target.value) / 1000)}
                className="w-36"
              />
              <span className="tabular-nums">{xi.toFixed(2)}</span>
            </label>
            {at ? (
              <table className="mt-1">
                <tbody>
                  <tr>
                    <td className={tdCls}>x</td>
                    <td className={tdCls}>{fmt(at.x)} m</td>
                  </tr>
                  <tr>
                    <td className={tdCls}>N(x)</td>
                    <td className={tdCls}>{fmt(at.N)} kN</td>
                  </tr>
                  <tr>
                    <td className={tdCls}>V(x)</td>
                    <td className={tdCls}>{fmt(at.V)} kN</td>
                  </tr>
                  <tr>
                    <td className={tdCls}>M(x)</td>
                    <td className={tdCls}>{fmt(at.M)} kN·m</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-gray-500 mt-1">Nilai N/V/M tidak tersedia.</p>
            )}
          </div>
        </div>
        <p className="text-[11px] text-gray-500 mt-1">
          Konvensi tanda sama dengan diagram: N positif = tarik, V konvensi SAP2000, M positif =
          sagging (melendut). Marker kuning pada kanvas menandai posisi x/L yang diinspeksi.
        </p>
      </section>
    )
  }

  if (nodeId) {
    const insp = inspectNode(model, result, nodeId)
    if (!insp) return null
    return (
      <section
        aria-label={`Inspektor simpul ${nodeId}`}
        className="bg-white border-b border-gray-200 px-3 py-2 text-[13px] text-[#14213d]"
      >
        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">
          Inspektor Simpul {insp.nodeId}
        </h3>
        <table className="mt-1">
          <tbody>
            <tr>
              <td className={tdCls}>Koordinat</td>
              <td className={tdCls}>
                ({fmt(insp.x)}, {fmt(insp.y)}) m
              </td>
            </tr>
            <tr>
              <td className={tdCls}>Tumpuan</td>
              <td className={tdCls}>{insp.support ?? "—"}</td>
            </tr>
            {insp.disp ? (
              <tr>
                <td className={tdCls}>Perpindahan</td>
                <td className={tdCls}>
                  u {insp.disp.u.toExponential(2)} m · v {insp.disp.v.toExponential(2)} m · θ{" "}
                  {insp.disp.theta.toExponential(2)} rad
                </td>
              </tr>
            ) : (
              <tr>
                <td className={tdCls}>Perpindahan</td>
                <td className={tdCls}>tidak tersedia</td>
              </tr>
            )}
            {insp.reaction && (
              <tr>
                <td className={tdCls}>Reaksi</td>
                <td className={tdCls}>
                  Rx {fmt(insp.reaction.Rx)} kN · Ry {fmt(insp.reaction.Ry)} kN · Mz{" "}
                  {fmt(insp.reaction.Mz)} kN·m
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    )
  }

  return null
}
