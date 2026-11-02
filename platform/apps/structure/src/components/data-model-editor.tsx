import * as React from "react"
import type {
  StructureModel, NodeId, MemberId, SectionId, SupportPick,
} from "@/engine/model"
import { deleteNode, deleteMember, newMemberId, newLoadId } from "@/engine/model"
import { addNode } from "@/engine/geometry"
import type { LoadCase, LoadCaseId, LoadCombination } from "@/engine/load-cases"
import { solveAllCases } from "@/engine/analysis-pipeline"
import type { SolverResult } from "@/engine/solver"

/**
 * Data Tabel — keyboard-accessible model editor (Phase 7 slice,
 * completed in Phase 8). A form/table front-end over the SAME
 * StructureModel state and engine operations the canvas uses, and the
 * SAME solver pipeline (solveAllCases). Phase 8 adds: distributed-load
 * create/edit/retarget/delete (both engine modes), load-case
 * enable/disable toggles, section core-property editing, and an
 * in-application delete-confirmation dialog listing cascade
 * dependents. Scope record: docs/PHASE-8-KEYBOARD-EDITOR-DESIGN.md.
 */

interface Props {
  model: StructureModel
  onModelChange: (next: StructureModel) => void
  loadCases: Record<LoadCaseId, LoadCase>
  onLoadCasesChange: (next: Record<LoadCaseId, LoadCase>) => void
  combinations: Record<string, LoadCombination>
}

const inputCls = "border border-gray-300 rounded px-1.5 py-1 text-xs w-full bg-white"
const btnCls = "border border-gray-300 rounded px-2 py-1 text-xs bg-white hover:bg-gray-100 cursor-pointer min-h-[24px]"
const primaryCls = "border border-[#1d4ed8] rounded px-2 py-1 text-xs bg-[#1d4ed8] text-white cursor-pointer min-h-[24px]"
const thCls = "text-left font-semibold px-1.5 py-1 border-b border-gray-300"
const tdCls = "px-1.5 py-1 border-b border-gray-100 align-middle"

function parseNum(text: string): number | null {
  const v = parseFloat(text.replace(",", "."))
  return Number.isFinite(v) ? v : null
}

/** Number field that commits on blur/Enter, so typing is never fought. */
function CommitNumber(props: {
  label: string
  value: number
  onCommit: (v: number) => void
}) {
  const [text, setText] = React.useState(String(props.value))
  React.useEffect(() => setText(String(props.value)), [props.value])
  const commit = () => {
    const v = parseNum(text)
    if (v !== null) props.onCommit(v)
    else setText(String(props.value))
  }
  return (
    <input
      aria-label={props.label}
      className={inputCls}
      type="text"
      inputMode="decimal"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur()
      }}
    />
  )
}

/** Text field that commits on blur/Enter. */
function CommitText(props: {
  label: string
  value: string
  onCommit: (v: string) => void
}) {
  const [text, setText] = React.useState(props.value)
  React.useEffect(() => setText(props.value), [props.value])
  const commit = () => {
    const v = text.trim()
    if (v) props.onCommit(v)
    else setText(props.value)
  }
  return (
    <input
      aria-label={props.label}
      className={inputCls}
      type="text"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur()
      }}
    />
  )
}

interface PendingDelete {
  kind: "node" | "member" | "load"
  id: string
  title: string
  dependents: string[]
  apply: () => void
}

export function DataModelEditor({ model, onModelChange, loadCases, onLoadCasesChange, combinations }: Props) {
  const [newX, setNewX] = React.useState("0")
  const [newY, setNewY] = React.useState("0")
  const [memberA, setMemberA] = React.useState<string>("")
  const [memberB, setMemberB] = React.useState<string>("")
  const [memberSection, setMemberSection] = React.useState<string>("")
  const [loadNode, setLoadNode] = React.useState<string>("")
  const [loadFy, setLoadFy] = React.useState("-10")
  const [distMember, setDistMember] = React.useState<string>("")
  const [distMode, setDistMode] = React.useState<"local-axis" | "global-axis">("local-axis")
  const [distWStart, setDistWStart] = React.useState("-10")
  const [distWEnd, setDistWEnd] = React.useState("-10")
  const [formError, setFormError] = React.useState<string | null>(null)
  const [sectionError, setSectionError] = React.useState<string | null>(null)
  const [results, setResults] = React.useState<Record<LoadCaseId, SolverResult> | null>(null)
  const [pendingDelete, setPendingDelete] = React.useState<PendingDelete | null>(null)
  const cancelBtnRef = React.useRef<HTMLButtonElement>(null)
  const titleRef = React.useRef<HTMLHeadingElement>(null)

  React.useEffect(() => {
    if (pendingDelete) cancelBtnRef.current?.focus()
  }, [pendingDelete])

  const closeDeleteDialog = () => {
    setPendingDelete(null)
    titleRef.current?.focus()
  }

  const nodes = Object.values(model.nodes)
  const members = Object.values(model.members)
  const sections = Object.values(model.sections)
  const pointLoads = Object.values(model.loads).filter((l) => l.type === "point")
  const distLoads = Object.values(model.loads).filter((l) => l.type === "distributed")
  const firstSection = sections[0]?.id ?? ""

  const setSupport = (nodeId: NodeId, pick: SupportPick) => {
    const supports = { ...model.supports }
    if (pick === "none") delete supports[nodeId]
    else supports[nodeId] = { nodeId, type: pick }
    onModelChange({ ...model, supports })
  }

  const handleAddNode = () => {
    const x = parseNum(newX)
    const y = parseNum(newY)
    if (x === null || y === null) {
      setFormError("Koordinat simpul baru harus berupa angka.")
      return
    }
    setFormError(null)
    onModelChange(addNode(model, { x, y }).model)
  }

  const handleAddMember = () => {
    const a = memberA || nodes[0]?.id
    const b = memberB || nodes[1]?.id
    const section = (memberSection || firstSection) as SectionId
    if (!a || !b || a === b || !section) {
      setFormError("Elemen baru membutuhkan dua simpul berbeda dan satu penampang.")
      return
    }
    setFormError(null)
    const id = newMemberId()
    onModelChange({
      ...model,
      members: { ...model.members, [id]: { id, a: a as NodeId, b: b as NodeId, section } },
    })
  }

  const handleAddLoad = () => {
    const nodeId = loadNode || nodes[0]?.id
    const fy = parseNum(loadFy)
    if (!nodeId) {
      setFormError("Beban titik membutuhkan simpul tujuan.")
      return
    }
    if (fy === null) {
      setFormError("Nilai Fy beban titik harus berupa angka (gunakan tanda minus untuk arah ke bawah).")
      return
    }
    setFormError(null)
    const id = newLoadId()
    onModelChange({
      ...model,
      loads: {
        ...model.loads,
        [id]: { id, type: "point", nodeId: nodeId as NodeId, loadCaseId: "dead" as LoadCaseId, fx: 0, fy },
      },
    })
  }

  const handleAddDistLoad = () => {
    const memberId = distMember || members[0]?.id
    if (!memberId) {
      setFormError("Beban merata membutuhkan elemen tujuan — buat elemen terlebih dahulu.")
      return
    }
    const ws = parseNum(distWStart)
    const we = parseNum(distWEnd)
    if (distMode === "local-axis") {
      if (ws === null || we === null) {
        setFormError("Nilai w awal dan w akhir beban merata harus berupa angka (kN/m, minus = ke bawah).")
        return
      }
      setFormError(null)
      const id = newLoadId()
      onModelChange({
        ...model,
        loads: {
          ...model.loads,
          [id]: {
            id, type: "distributed", memberId: memberId as MemberId,
            loadCaseId: "dead" as LoadCaseId, mode: "local-axis", wStart: ws, wEnd: we,
          },
        },
      })
    } else {
      if (ws === null || we === null) {
        setFormError("Nilai wy awal dan wy akhir beban merata global harus berupa angka (kN/m).")
        return
      }
      setFormError(null)
      const id = newLoadId()
      onModelChange({
        ...model,
        loads: {
          ...model.loads,
          [id]: {
            id, type: "distributed", memberId: memberId as MemberId,
            loadCaseId: "dead" as LoadCaseId, mode: "global-axis",
            wxStart: 0, wxEnd: 0, wyStart: ws, wyEnd: we,
          },
        },
      })
    }
  }

  const patchDistLoad = (id: string, patch: Record<string, unknown>) => {
    const current = model.loads[id]
    if (!current || current.type !== "distributed") return
    onModelChange({ ...model, loads: { ...model.loads, [id]: { ...current, ...patch } } })
  }

  const askDeleteNode = (nodeId: NodeId) => {
    const dependents: string[] = []
    for (const m of members) {
      if (m.a === nodeId || m.b === nodeId) dependents.push(`elemen ${m.id}`)
    }
    if (model.supports[nodeId]) dependents.push(`tumpuan pada simpul ini`)
    for (const l of pointLoads) {
      if (l.type === "point" && l.nodeId === nodeId) dependents.push(`beban titik ${l.id}`)
    }
    for (const l of distLoads) {
      if (l.type === "distributed" && dependents.some((d) => d === `elemen ${l.memberId}`)) {
        dependents.push(`beban merata ${l.id}`)
      }
    }
    setPendingDelete({
      kind: "node",
      id: nodeId,
      title: `Hapus simpul ${nodeId}?`,
      dependents,
      apply: () => onModelChange(deleteNode(model, nodeId)),
    })
  }

  const askDeleteMember = (memberId: MemberId) => {
    const dependents: string[] = []
    for (const l of distLoads) {
      if (l.type === "distributed" && l.memberId === memberId) dependents.push(`beban merata ${l.id}`)
    }
    setPendingDelete({
      kind: "member",
      id: memberId,
      title: `Hapus elemen ${memberId}?`,
      dependents,
      apply: () => onModelChange(deleteMember(model, memberId)),
    })
  }

  const askDeleteLoad = (loadId: string) => {
    setPendingDelete({
      kind: "load",
      id: loadId,
      title: `Hapus beban ${loadId}?`,
      dependents: [],
      apply: () => {
        const loads = { ...model.loads }
        delete loads[loadId]
        onModelChange({ ...model, loads })
      },
    })
  }

  const patchSection = (id: SectionId, patch: Record<string, number | string>) => {
    for (const key of ["E", "A", "I33"] as const) {
      if (key in patch && (typeof patch[key] !== "number" || (patch[key] as number) <= 0)) {
        setSectionError(`${key} penampang harus lebih besar dari nol.`)
        return
      }
    }
    setSectionError(null)
    onModelChange({
      ...model,
      sections: { ...model.sections, [id]: { ...model.sections[id], ...patch } },
    })
  }

  return (
    <div className="h-full overflow-y-auto bg-[#f4f6fa] p-4 text-[13px] text-[#14213d]">
      <h2 ref={titleRef} tabIndex={-1} className="text-base font-bold mb-1 outline-none">
        Data Tabel — Editor Model (dapat diakses keyboard)
      </h2>
      <p className="text-xs text-gray-600 mb-4 max-w-3xl">
        Alternatif papan ketik untuk kanvas: tabel ini menyunting model yang sama dan memakai
        solver yang sama. Penghapusan selalu meminta konfirmasi dan menyebutkan data yang ikut
        terhapus.
      </p>

      {formError && (
        <p role="alert" className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1 mb-3 max-w-3xl">
          {formError}
        </p>
      )}

      {/* ── Nodes ─────────────────────────────────────────────────── */}
      <h3 className="font-bold mt-4 mb-1">Simpul</h3>
      <table className="w-full max-w-3xl bg-white border border-gray-200">
        <thead>
          <tr>
            <th className={thCls}>ID</th>
            <th className={thCls}>X (m)</th>
            <th className={thCls}>Y (m)</th>
            <th className={thCls}>Tumpuan</th>
            <th className={thCls}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((n) => (
            <tr key={n.id}>
              <td className={tdCls}>{n.id}</td>
              <td className={tdCls}>
                <CommitNumber
                  label={`Koordinat X simpul ${n.id}`}
                  value={n.x}
                  onCommit={(v) =>
                    onModelChange({ ...model, nodes: { ...model.nodes, [n.id]: { ...n, x: v } } })
                  }
                />
              </td>
              <td className={tdCls}>
                <CommitNumber
                  label={`Koordinat Y simpul ${n.id}`}
                  value={n.y}
                  onCommit={(v) =>
                    onModelChange({ ...model, nodes: { ...model.nodes, [n.id]: { ...n, y: v } } })
                  }
                />
              </td>
              <td className={tdCls}>
                <select
                  aria-label={`Tumpuan simpul ${n.id}`}
                  className={inputCls}
                  value={model.supports[n.id]?.type ?? "none"}
                  onChange={(e) => setSupport(n.id, e.target.value as SupportPick)}
                >
                  <option value="none">Tanpa</option>
                  <option value="pin">Sendi</option>
                  <option value="roller">Rol</option>
                  <option value="fixed">Jepit</option>
                </select>
              </td>
              <td className={tdCls}>
                <button className={btnCls} aria-label={`Hapus simpul ${n.id}`} onClick={() => askDeleteNode(n.id)}>
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 items-end mt-2 max-w-3xl">
        <label className="text-xs">
          X simpul baru (m)
          <input aria-label="X simpul baru" className={inputCls} value={newX} onChange={(e) => setNewX(e.target.value)} />
        </label>
        <label className="text-xs">
          Y simpul baru (m)
          <input aria-label="Y simpul baru" className={inputCls} value={newY} onChange={(e) => setNewY(e.target.value)} />
        </label>
        <button className={primaryCls} onClick={handleAddNode}>
          Tambah Simpul
        </button>
      </div>

      {/* ── Members ───────────────────────────────────────────────── */}
      <h3 className="font-bold mt-6 mb-1">Elemen</h3>
      <table className="w-full max-w-3xl bg-white border border-gray-200">
        <thead>
          <tr>
            <th className={thCls}>ID</th>
            <th className={thCls}>Simpul A</th>
            <th className={thCls}>Simpul B</th>
            <th className={thCls}>Penampang</th>
            <th className={thCls}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id}>
              <td className={tdCls}>{m.id}</td>
              <td className={tdCls}>
                <select
                  aria-label={`Simpul A elemen ${m.id}`}
                  className={inputCls}
                  value={m.a}
                  onChange={(e) =>
                    onModelChange({ ...model, members: { ...model.members, [m.id]: { ...m, a: e.target.value as NodeId } } })
                  }
                >
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>{n.id}</option>
                  ))}
                </select>
              </td>
              <td className={tdCls}>
                <select
                  aria-label={`Simpul B elemen ${m.id}`}
                  className={inputCls}
                  value={m.b}
                  onChange={(e) =>
                    onModelChange({ ...model, members: { ...model.members, [m.id]: { ...m, b: e.target.value as NodeId } } })
                  }
                >
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>{n.id}</option>
                  ))}
                </select>
              </td>
              <td className={tdCls}>
                <select
                  aria-label={`Penampang elemen ${m.id}`}
                  className={inputCls}
                  value={m.section}
                  onChange={(e) =>
                    onModelChange({ ...model, members: { ...model.members, [m.id]: { ...m, section: e.target.value as SectionId } } })
                  }
                >
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </td>
              <td className={tdCls}>
                <button className={btnCls} aria-label={`Hapus elemen ${m.id}`} onClick={() => askDeleteMember(m.id as MemberId)}>
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 items-end mt-2 max-w-3xl">
        <label className="text-xs">
          Simpul A elemen baru
          <select aria-label="Simpul A elemen baru" className={inputCls} value={memberA} onChange={(e) => setMemberA(e.target.value)}>
            <option value="">(simpul pertama)</option>
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>{n.id}</option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          Simpul B elemen baru
          <select aria-label="Simpul B elemen baru" className={inputCls} value={memberB} onChange={(e) => setMemberB(e.target.value)}>
            <option value="">(simpul kedua)</option>
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>{n.id}</option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          Penampang elemen baru
          <select aria-label="Penampang elemen baru" className={inputCls} value={memberSection} onChange={(e) => setMemberSection(e.target.value)}>
            <option value="">(penampang pertama)</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        <button className={primaryCls} onClick={handleAddMember}>
          Tambah Elemen
        </button>
      </div>

      {/* ── Sections ──────────────────────────────────────────────── */}
      <h3 className="font-bold mt-6 mb-1">Penampang</h3>
      <p className="text-xs text-gray-600 mb-1 max-w-3xl">
        Properti inti yang dipakai solver. Untuk penampang parametrik, mengubah dimensi di editor
        material (tab Model) akan menghitung ulang A dan I33 — nilai terakhir yang berlaku.
      </p>
      {sectionError && (
        <p role="alert" className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1 mb-2 max-w-3xl">
          {sectionError}
        </p>
      )}
      <table className="w-full max-w-3xl bg-white border border-gray-200">
        <thead>
          <tr>
            <th className={thCls}>ID</th>
            <th className={thCls}>Nama</th>
            <th className={thCls}>E (MPa)</th>
            <th className={thCls}>A (mm²)</th>
            <th className={thCls}>I33 (mm⁴)</th>
          </tr>
        </thead>
        <tbody>
          {sections.map((s) => (
            <tr key={s.id}>
              <td className={tdCls}>{s.id}</td>
              <td className={tdCls}>
                <CommitText
                  label={`Nama penampang ${s.id}`}
                  value={s.name}
                  onCommit={(v) => patchSection(s.id, { name: v })}
                />
              </td>
              <td className={tdCls}>
                <CommitNumber label={`E penampang ${s.id}`} value={s.E} onCommit={(v) => patchSection(s.id, { E: v })} />
              </td>
              <td className={tdCls}>
                <CommitNumber label={`A penampang ${s.id}`} value={s.A} onCommit={(v) => patchSection(s.id, { A: v })} />
              </td>
              <td className={tdCls}>
                <CommitNumber label={`I33 penampang ${s.id}`} value={s.I33} onCommit={(v) => patchSection(s.id, { I33: v })} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Point loads ───────────────────────────────────────────── */}
      <h3 className="font-bold mt-6 mb-1">Beban Titik</h3>
      <table className="w-full max-w-3xl bg-white border border-gray-200">
        <thead>
          <tr>
            <th className={thCls}>ID</th>
            <th className={thCls}>Simpul</th>
            <th className={thCls}>Fy (kN)</th>
            <th className={thCls}>Kasus</th>
            <th className={thCls}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {pointLoads.map((l) =>
            l.type === "point" ? (
              <tr key={l.id}>
                <td className={tdCls}>{l.id}</td>
                <td className={tdCls}>
                  <select
                    aria-label={`Simpul beban ${l.id}`}
                    className={inputCls}
                    value={l.nodeId}
                    onChange={(e) =>
                      onModelChange({ ...model, loads: { ...model.loads, [l.id]: { ...l, nodeId: e.target.value as NodeId } } })
                    }
                  >
                    {nodes.map((n) => (
                      <option key={n.id} value={n.id}>{n.id}</option>
                    ))}
                  </select>
                </td>
                <td className={tdCls}>
                  <CommitNumber
                    label={`Fy beban ${l.id}`}
                    value={l.fy ?? 0}
                    onCommit={(v) =>
                      onModelChange({ ...model, loads: { ...model.loads, [l.id]: { ...l, fy: v } } })
                    }
                  />
                </td>
                <td className={tdCls}>{loadCases[l.loadCaseId]?.name ?? l.loadCaseId}</td>
                <td className={tdCls}>
                  <button className={btnCls} aria-label={`Hapus beban ${l.id}`} onClick={() => askDeleteLoad(l.id)}>
                    Hapus
                  </button>
                </td>
              </tr>
            ) : null,
          )}
        </tbody>
      </table>
      <div className="flex gap-2 items-end mt-2 max-w-3xl">
        <label className="text-xs">
          Simpul beban baru
          <select aria-label="Simpul beban baru" className={inputCls} value={loadNode} onChange={(e) => setLoadNode(e.target.value)}>
            <option value="">(simpul pertama)</option>
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>{n.id}</option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          Fy beban baru (kN, negatif = ke bawah)
          <input aria-label="Fy beban baru" className={inputCls} value={loadFy} onChange={(e) => setLoadFy(e.target.value)} />
        </label>
        <button className={primaryCls} onClick={handleAddLoad}>
          Tambah Beban Titik
        </button>
      </div>

      {/* ── Distributed loads ─────────────────────────────────────── */}
      <h3 className="font-bold mt-6 mb-1">Beban Merata</h3>
      <table className="w-full max-w-3xl bg-white border border-gray-200">
        <thead>
          <tr>
            <th className={thCls}>ID</th>
            <th className={thCls}>Elemen</th>
            <th className={thCls}>Mode</th>
            <th className={thCls}>w awal (kN/m)</th>
            <th className={thCls}>w akhir (kN/m)</th>
            <th className={thCls}>Kasus</th>
            <th className={thCls}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {distLoads.map((l) =>
            l.type === "distributed" ? (
              <tr key={l.id}>
                <td className={tdCls}>{l.id}</td>
                <td className={tdCls}>
                  <select
                    aria-label={`Elemen beban merata ${l.id}`}
                    className={inputCls}
                    value={l.memberId}
                    onChange={(e) => patchDistLoad(l.id, { memberId: e.target.value })}
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.id}</option>
                    ))}
                  </select>
                </td>
                <td className={tdCls}>
                  <select
                    aria-label={`Mode beban merata ${l.id}`}
                    className={inputCls}
                    value={l.mode ?? "local-axis"}
                    onChange={(e) => {
                      const mode = e.target.value as "local-axis" | "global-axis"
                      if (mode === "global-axis") {
                        patchDistLoad(l.id, {
                          mode, wxStart: l.wxStart ?? 0, wxEnd: l.wxEnd ?? 0,
                          wyStart: l.wyStart ?? l.wStart ?? 0, wyEnd: l.wyEnd ?? l.wEnd ?? 0,
                        })
                      } else {
                        patchDistLoad(l.id, {
                          mode, wStart: l.wStart ?? l.wyStart ?? 0, wEnd: l.wEnd ?? l.wyEnd ?? 0,
                        })
                      }
                    }}
                  >
                    <option value="local-axis">Sumbu lokal</option>
                    <option value="global-axis">Sumbu global</option>
                  </select>
                </td>
                <td className={tdCls}>
                  {(l.mode ?? "local-axis") === "local-axis" ? (
                    <CommitNumber
                      label={`w awal beban merata ${l.id}`}
                      value={l.wStart ?? 0}
                      onCommit={(v) => patchDistLoad(l.id, { wStart: v })}
                    />
                  ) : (
                    <CommitNumber
                      label={`wy awal beban merata ${l.id}`}
                      value={l.wyStart ?? 0}
                      onCommit={(v) => patchDistLoad(l.id, { wyStart: v })}
                    />
                  )}
                </td>
                <td className={tdCls}>
                  {(l.mode ?? "local-axis") === "local-axis" ? (
                    <CommitNumber
                      label={`w akhir beban merata ${l.id}`}
                      value={l.wEnd ?? 0}
                      onCommit={(v) => patchDistLoad(l.id, { wEnd: v })}
                    />
                  ) : (
                    <CommitNumber
                      label={`wy akhir beban merata ${l.id}`}
                      value={l.wyEnd ?? 0}
                      onCommit={(v) => patchDistLoad(l.id, { wyEnd: v })}
                    />
                  )}
                </td>
                <td className={tdCls}>{loadCases[l.loadCaseId]?.name ?? l.loadCaseId}</td>
                <td className={tdCls}>
                  <button className={btnCls} aria-label={`Hapus beban merata ${l.id}`} onClick={() => askDeleteLoad(l.id)}>
                    Hapus
                  </button>
                </td>
              </tr>
            ) : null,
          )}
        </tbody>
      </table>
      <p className="text-xs text-gray-600 mt-1 max-w-3xl">
        Mode sumbu global: tabel ini menyunting komponen wy; komponen wx diatur lewat kanvas
        (dicatat di laporan Phase 8). Tanda: minus = ke bawah untuk elemen horizontal.
      </p>
      <div className="flex gap-2 items-end mt-2 max-w-3xl">
        <label className="text-xs">
          Elemen beban merata baru
          <select aria-label="Elemen beban merata baru" className={inputCls} value={distMember} onChange={(e) => setDistMember(e.target.value)}>
            <option value="">(elemen pertama)</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.id}</option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          Mode beban merata baru
          <select aria-label="Mode beban merata baru" className={inputCls} value={distMode} onChange={(e) => setDistMode(e.target.value as "local-axis" | "global-axis")}>
            <option value="local-axis">Sumbu lokal</option>
            <option value="global-axis">Sumbu global</option>
          </select>
        </label>
        <label className="text-xs">
          w awal (kN/m)
          <input aria-label="w awal beban merata baru" className={inputCls} value={distWStart} onChange={(e) => setDistWStart(e.target.value)} />
        </label>
        <label className="text-xs">
          w akhir (kN/m)
          <input aria-label="w akhir beban merata baru" className={inputCls} value={distWEnd} onChange={(e) => setDistWEnd(e.target.value)} />
        </label>
        <button className={primaryCls} onClick={handleAddDistLoad}>
          Tambah Beban Merata
        </button>
      </div>

      {/* ── Load cases & combinations ─────────────────────────────── */}
      <h3 className="font-bold mt-6 mb-1">Kasus Beban</h3>
      <table className="w-full max-w-3xl bg-white border border-gray-200">
        <thead>
          <tr>
            <th className={thCls}>Kasus</th>
            <th className={thCls}>Jenis</th>
            <th className={thCls}>Aktif</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(loadCases).map((c) => (
            <tr key={c.id}>
              <td className={tdCls}>
                {c.name}
                {c.locked ? <span className="text-gray-500"> (terkunci)</span> : null}
              </td>
              <td className={tdCls}>{c.kind}</td>
              <td className={tdCls}>
                <input
                  type="checkbox"
                  aria-label={`Aktifkan kasus ${c.name}`}
                  checked={c.enabled}
                  onChange={(e) =>
                    onLoadCasesChange({ ...loadCases, [c.id]: { ...c, enabled: e.target.checked } })
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h4 className="font-semibold mt-4 mb-1">Kombinasi (hanya tampil)</h4>
      <ul className="text-xs max-w-3xl bg-white border border-gray-200 px-3 py-2 list-none">
        {Object.values(combinations).map((c) => (
          <li key={c.id} className="py-0.5">
            <strong>{c.name}</strong>:{" "}
            {c.terms
              .map((t) => `${t.factor}×${loadCases[t.caseId]?.name ?? t.caseId}`)
              .join(" + ")}
            {c.enabled ? "" : " (nonaktif)"}
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-600 mt-1 max-w-3xl">
        Pengubahan kombinasi masih lewat panel Kombinasi di tab Beban (dicatat NOT IMPLEMENTED
        untuk Data Tabel di laporan Phase 8).
      </p>

      {/* ── Analysis ──────────────────────────────────────────────── */}
      <h3 className="font-bold mt-6 mb-1">Analisis</h3>
      <button
        className={primaryCls}
        onClick={() => setResults(solveAllCases(model, loadCases))}
      >
        Jalankan Analisis
      </button>
      {results && (
        <div className="mt-3 max-w-3xl">
          {Object.entries(results).map(([caseId, r]) => (
            <div key={caseId} className="bg-white border border-gray-200 p-3 mb-2">
              <p className="font-semibold">
                Kasus {loadCases[caseId as LoadCaseId]?.name ?? caseId}:{" "}
                {r.ok ? `selesai — klasifikasi ${r.numerical.classification}` : `gagal — ${r.reason}`}
              </p>
              {r.ok && (
                <table className="w-full mt-2">
                  <thead>
                    <tr>
                      <th className={thCls}>Simpul</th>
                      <th className={thCls}>Rx (kN)</th>
                      <th className={thCls}>Ry (kN)</th>
                      <th className={thCls}>Mz (kN·m)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(r.reactions).map(([nodeId, rx]) => (
                      <tr key={nodeId}>
                        <td className={tdCls}>{nodeId}</td>
                        <td className={tdCls}>{rx.Rx.toFixed(3)}</td>
                        <td className={tdCls}>{rx.Ry.toFixed(3)}</td>
                        <td className={tdCls}>{rx.Mz.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Delete confirmation dialog ────────────────────────────── */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label={pendingDelete.title}
            aria-describedby="zs-delete-desc"
            className="bg-white rounded-xl shadow-2xl w-[440px] max-w-[calc(100vw-2rem)] p-5"
            onKeyDown={(e) => {
              if (e.key === "Escape") closeDeleteDialog()
            }}
          >
            <h3 className="text-sm font-semibold text-[#1a2f5e] mb-2">{pendingDelete.title}</h3>
            <div id="zs-delete-desc" className="text-xs leading-relaxed text-gray-700">
              {pendingDelete.dependents.length > 0 ? (
                <>
                  <p>Data berikut ikut terhapus karena terhubung:</p>
                  <ul className="list-disc ml-5 mt-1">
                    {pendingDelete.dependents.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p>Tidak ada data lain yang terhubung — hanya catatan ini yang terhapus.</p>
              )}
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button ref={cancelBtnRef} className={btnCls} onClick={closeDeleteDialog}>
                Batal
              </button>
              <button
                className="border border-red-700 rounded px-2 py-1 text-xs bg-red-700 text-white cursor-pointer min-h-[24px]"
                onClick={() => {
                  pendingDelete.apply()
                  closeDeleteDialog()
                }}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
