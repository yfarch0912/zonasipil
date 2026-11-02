import * as React from "react"
import {
  advanceProgress,
  prefersReducedMotion,
  ANIMATION_SPEEDS,
  REDUCED_MOTION_STEP,
} from "@/visualization/animation"
import type { PeakDisplacement } from "@/visualization/deformation"

/**
 * Deformation animation controls for the Analyze view.
 *
 * The animation interpolates between the undeformed geometry and
 * the solver's deformed geometry. The progress value is an
 * interpolation parameter, not physical time — this visualizes a
 * static analysis result and is labelled as such. Playback never
 * re-runs the solver and never touches the model: it only scales
 * the deformation the canvas draws (deformationScale x progress).
 *
 * Reduced motion: when the user prefers reduced motion, "Putar"
 * steps the progress in fixed increments per press instead of
 * running a continuous frame loop.
 */

export interface CaseComparisonRow {
  id: string
  name: string
  status: string
  peakMag: number | null
  sumRy: number | null
}

interface Props {
  resultOk: boolean
  viewLabel: string
  peak: PeakDisplacement | null
  progress: number
  onProgressChange: (t: number) => void
  scale: number
  onScaleChange: (v: number) => void
  cases: CaseComparisonRow[]
}

const btnCls =
  "border border-gray-300 rounded px-2 py-1 text-xs bg-white hover:bg-gray-100 cursor-pointer min-h-[24px] disabled:opacity-40 disabled:cursor-not-allowed"
const SCALE_PRESETS = [0.5, 1, 2, 5, 10, 20]

export function SimulationControls({
  resultOk,
  viewLabel,
  peak,
  progress,
  onProgressChange,
  scale,
  onScaleChange,
  cases,
}: Props) {
  const [playing, setPlaying] = React.useState(false)
  const [speed, setSpeed] = React.useState(1)
  const progressRef = React.useRef(progress)
  React.useEffect(() => {
    progressRef.current = progress
  }, [progress])

  const stopLoop = React.useCallback(() => setPlaying(false), [])

  React.useEffect(() => {
    if (!resultOk && playing) setPlaying(false)
  }, [resultOk, playing])

  // The frame loop lives entirely inside this effect: starting,
  // pausing, unmounting, or changing speed tears it down and (when
  // playing) starts exactly one new loop. No duplicate loops, no
  // leaked frames, and the solver never runs per frame — the loop
  // only advances the interpolation parameter.
  React.useEffect(() => {
    if (!playing) return
    let raf = 0
    let last: number | null = null
    function step(ts: number) {
      if (last === null) last = ts
      const dt = ts - last
      last = ts
      const { t, done } = advanceProgress(progressRef.current, dt, speed)
      onProgressChange(t)
      if (done) {
        setPlaying(false)
        return
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [playing, speed, onProgressChange])

  const handlePlay = () => {
    if (!resultOk) return
    if (playing) {
      stopLoop()
      return
    }
    if (prefersReducedMotion()) {
      onProgressChange(Math.min(1, progress + REDUCED_MOTION_STEP))
      return
    }
    if (progress >= 1) onProgressChange(0)
    setPlaying(true)
  }

  const handleReplay = () => {
    if (!resultOk) return
    stopLoop()
    onProgressChange(0)
    if (prefersReducedMotion()) return
    setPlaying(true)
  }

  const handleReset = () => {
    stopLoop()
    onProgressChange(1)
  }

  return (
    <div
      role="group"
      aria-label="Kontrol animasi deformasi"
      className="bg-white border-b border-gray-200 px-3 py-2 text-[13px] text-[#14213d]"
    >
      <div className="flex flex-wrap items-center gap-2">
        <strong className="text-xs uppercase tracking-wide text-gray-500">
          Animasi Deformasi
        </strong>
        <span className="text-xs text-gray-600">{viewLabel}</span>
        <button type="button" className={btnCls} onClick={handlePlay} disabled={!resultOk}>
          {playing ? "Jeda" : "Putar"}
        </button>
        <button type="button" className={btnCls} onClick={handleReplay} disabled={!resultOk}>
          Ulang
        </button>
        <button type="button" className={btnCls} onClick={handleReset} disabled={!resultOk}>
          Atur Ulang
        </button>
        <label className="text-xs flex items-center gap-1">
          Kemajuan
          <input
            type="range"
            min={0}
            max={1000}
            aria-label="Kemajuan animasi deformasi"
            value={Math.round(progress * 1000)}
            disabled={!resultOk}
            onChange={(e) => {
              stopLoop()
              onProgressChange(Number(e.target.value) / 1000)
            }}
            className="w-36"
          />
          <span className="tabular-nums">{Math.round(progress * 100)}%</span>
        </label>
        <label className="text-xs flex items-center gap-1">
          Kecepatan
          <select
            aria-label="Kecepatan animasi"
            className="border border-gray-300 rounded px-1 py-1 text-xs bg-white min-h-[24px]"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          >
            {ANIMATION_SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}×
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs flex items-center gap-1">
          Skala deformasi
          <select
            aria-label="Skala deformasi visualisasi"
            className="border border-gray-300 rounded px-1 py-1 text-xs bg-white min-h-[24px]"
            value={SCALE_PRESETS.includes(scale) ? scale : "custom"}
            onChange={(e) => {
              if (e.target.value !== "custom") onScaleChange(Number(e.target.value))
            }}
          >
            {SCALE_PRESETS.map((s) => (
              <option key={s} value={s}>
                {s}×
              </option>
            ))}
            {!SCALE_PRESETS.includes(scale) && (
              <option value="custom">{scale}× (panel Analisis)</option>
            )}
          </select>
        </label>
        {resultOk && peak ? (
          <span className="text-xs bg-amber-50 border border-amber-200 rounded px-2 py-1">
            SKALA DEFORMASI: {scale}× — HANYA VISUALISASI · perpindahan maks sebenarnya{" "}
            {peak.mag.toFixed(5)} m di simpul {peak.nodeId}
          </span>
        ) : (
          <span className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1">
            Tidak ada hasil analisis yang valid untuk dianimasikan.
          </span>
        )}
        <details className="text-xs">
          <summary className="cursor-pointer text-[#1d4ed8]">Perbandingan kasus beban</summary>
          <table className="mt-1 bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="text-left font-semibold px-1.5 py-1 border-b border-gray-300">Kasus</th>
                <th className="text-left font-semibold px-1.5 py-1 border-b border-gray-300">Status</th>
                <th className="text-left font-semibold px-1.5 py-1 border-b border-gray-300">Perpindahan maks (m)</th>
                <th className="text-left font-semibold px-1.5 py-1 border-b border-gray-300">ΣRy (kN)</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id}>
                  <td className="px-1.5 py-1 border-b border-gray-100">{c.name}</td>
                  <td className="px-1.5 py-1 border-b border-gray-100">{c.status}</td>
                  <td className="px-1.5 py-1 border-b border-gray-100">
                    {c.peakMag === null ? "—" : c.peakMag.toFixed(5)}
                  </td>
                  <td className="px-1.5 py-1 border-b border-gray-100">
                    {c.sumRy === null ? "—" : c.sumRy.toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>
      <p className="text-[11px] text-gray-500 mt-1">
        Animasi ini menginterpolasi geometri awal ke bentuk terdeformasi hasil analisis statis —
        bukan simulasi dinamis, riwayat waktu, atau respons gempa.
      </p>
    </div>
  )
}
