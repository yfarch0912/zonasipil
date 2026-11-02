/**
 * STRUKTURA service-analysis report — directive §11.
 *
 * Generates a standalone, print-ready HTML document (browser "Save as PDF"
 * is the v1 PDF route — labelled as such in the document itself) built ONLY
 * from the stored model and a real solver result. Sections with no data are
 * printed as such; nothing is fabricated to fill space.
 *
 * The one-click report uses the service combination 1.0×(self-weight + every
 * modelled load case), superposed exactly by the analysis pipeline (see
 * struktura/service-result.ts). Factored per-combination results and member
 * design verdicts live in the editor's Analyze/Design tabs and are
 * referenced, not duplicated.
 *
 * Sprint 2 (P4 — report integrity): the document's title and scope banner
 * state unmistakably that this is an UNFACTORED SERVICE-LEVEL ANALYSIS
 * SUMMARY — not a design report and not evidence of code compliance.
 * Integrity warnings supplied by the service layer (incomplete
 * combination, numerical reliability classification) are printed in §10,
 * and the §11 conclusion is qualified whenever any are present: an
 * incomplete or numerically implausible result is never concluded as a
 * plain success.
 */
import type { StructureModel } from '@/engine/model'
import type { AnalysisResult } from '@/engine/solver'
import { modelFingerprint, modelStats, type ProjectMeta } from './projects'

export const SOLVER_VERSION = 'struktura-dsm-1.0 (Direct Stiffness, Euler-Bernoulli frame + condensed truss)'
export const APP_VERSION = 'ZonaSipil Structure 1.0.0 · engine STRUKTURA 1.0.0'

const esc = (s: unknown): string =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
const f = (n: number, dp = 3): string => (Number.isFinite(n) ? n.toFixed(dp) : '—')

export interface ReportIntegrity {
  /** Integrity warnings from the service layer (service-result.ts). */
  warnings?: string[]
}

export function generateReportHTML(
  meta: ProjectMeta | null,
  model: StructureModel,
  result: AnalysisResult,
  generatedAt = new Date(),
  integrity?: ReportIntegrity,
): string {
  const stats = modelStats(model)
  const fp = modelFingerprint(model)
  const name = meta?.name ?? 'Proyek Tanpa Judul'

  const sectionRows = Object.values(model.sections)
    .map(
      (s) =>
        `<tr><td>${esc(s.name)}</td><td>${esc(s.materialClass ?? '—')}</td><td>${f(s.E, 0)}</td>` +
        `<td>${s.A.toExponential(3)}</td><td>${s.I33.toExponential(3)}</td>` +
        `<td>${s.strength?.fc ?? s.strength?.fy ?? '—'}</td></tr>`,
    )
    .join('')
  const loadRows = Object.values(model.loads)
    .map((l) =>
      l.type === 'point'
        ? `<tr><td>${esc(l.id)}</td><td>Titik</td><td>simpul ${esc(l.nodeId)}</td><td>${esc(l.loadCaseId)}</td><td>Fx ${f(l.fx, 2)} kN, Fy ${f(l.fy, 2)} kN</td></tr>`
        : `<tr><td>${esc(l.id)}</td><td>Merata</td><td>elemen ${esc(l.memberId)}</td><td>${esc(l.loadCaseId)}</td><td>w ${f(l.wStart ?? l.wyStart ?? 0, 2)} → ${f(l.wEnd ?? l.wyEnd ?? 0, 2)} kN/m (${l.mode === 'global-axis' ? 'sumbu global' : 'sumbu lokal'})</td></tr>`,
    )
    .join('')
  const nodeRows = Object.values(model.nodes)
    .map((n) => {
      const d = result.nodeDisplacements[n.id]
      const sup = model.supports[n.id]
      const supLabel = sup?.type === 'pin' ? 'sendi' : sup?.type === 'roller' ? 'rol' : sup?.type === 'fixed' ? 'jepit' : '—'
      return (
        `<tr><td>${esc(n.id)}</td><td>${f(n.x, 3)}</td><td>${f(n.y, 3)}</td><td>${supLabel}</td>` +
        `<td>${d ? f(d.u * 1000, 3) : '—'}</td><td>${d ? f(d.v * 1000, 3) : '—'}</td><td>${d ? f(d.theta, 6) : '—'}</td></tr>`
      )
    })
    .join('')
  const reactionRows = Object.entries(result.reactions)
    .map(
      ([nodeId, r]) =>
        `<tr><td>${esc(nodeId)}</td><td>${f(r.Rx, 3)}</td><td>${f(r.Ry, 3)}</td><td>${f(r.Mz, 3)}</td></tr>`,
    )
    .join('')
  const memberRows = Object.values(model.members)
    .map((mem) => {
      const ef = result.memberEndForces[mem.id]
      if (!ef) return `<tr><td>${esc(mem.id)}</td><td colspan="6">belum dihitung</td></tr>`
      return (
        `<tr><td>${esc(mem.id)} (${esc(mem.a)}→${esc(mem.b)})</td><td>${esc(model.sections[mem.section]?.name ?? mem.section)}</td>` +
        `<td>${f(ef.N1, 3)}</td><td>${f(ef.V1, 3)}</td><td>${f(ef.M1, 3)}</td>` +
        `<td>${f(ef.N2, 3)}</td><td>${f(ef.V2, 3)}</td><td>${f(ef.M2, 3)}</td></tr>`
      )
    })
    .join('')
  const sumRx = Object.values(result.reactions).reduce((a, r) => a + r.Rx, 0)
  const sumRy = Object.values(result.reactions).reduce((a, r) => a + r.Ry, 0)

  // Sprint 2 (P4): integrity state of THIS document's result. The result's
  // own numerical diagnostics travel with it (solver / pipeline), and the
  // service layer's warnings are passed in — both must reach the printed
  // page, and both qualify the conclusion.
  const warnings = integrity?.warnings ?? []
  const numericalCls = result.numerical?.classification ?? 'VALID'
  const qualified = warnings.length > 0 || numericalCls !== 'VALID'
  const warningItems = warnings.map((w) => `<li>${esc(w)}</li>`).join('')
  const conclusion = qualified
    ? `<p><strong>Analisis selesai DENGAN PERINGATAN INTEGRITAS (lihat Bagian 10).</strong>
Hasil dalam dokumen ini TIDAK boleh dibaca sebagai hasil terverifikasi${warnings.some((w) => w.includes('TIDAK LENGKAP')) ? ' — sebagian kombinasi tidak lengkap' : ''}${numericalCls !== 'VALID' ? ` — klasifikasi keandalan numerik hasil adalah ${esc(numericalCls)}` : ''}.
Perubahan model apa pun membatalkan laporan ini (sidik jari tidak cocok).</p>`
    : `<p>Analisis selesai dengan sukses untuk model dengan sidik jari di atas. Perubahan model apa pun
membatalkan laporan ini (sidik jari tidak cocok).</p>`

  return `<!DOCTYPE html>
<html lang="id"><head><meta charset="utf-8">
<title>Laporan Hasil Analisis Layan ZonaSipil Structure — ${esc(name)}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; color: #14213d; margin: 40px; font-size: 13px; }
  h1 { font-size: 22px; margin-bottom: 2px; } h2 { font-size: 15px; border-bottom: 2px solid #1d4ed8; padding-bottom: 3px; margin-top: 26px; }
  table { border-collapse: collapse; width: 100%; margin: 8px 0; } th, td { border: 1px solid #b6c2d2; padding: 4px 6px; text-align: left; font-size: 12px; }
  th { background: #eef3fa; } .meta { color: #44546e; } .warn { background: #fff7e6; border: 1px solid #e3b341; padding: 8px 12px; }
  @media print { body { margin: 16px; } }
</style></head><body>
<h1>ZonaSipil Structure — Laporan Hasil Analisis Layan (Tak Terfaktor)</h1>
<p class="meta">${esc(name)} · Dibuat ${esc(generatedAt.toISOString())} · ${esc(APP_VERSION)}<br>
Solver: ${esc(SOLVER_VERSION)} · Sidik jari model: ${esc(fp)} · Versi model: ${meta?.modelVersion ?? '— (autosave)'}</p>
<div class="warn"><strong>RUANG LINGKUP DOKUMEN:</strong> Dokumen ini adalah ringkasan
<strong>ANALISIS LAYAN tak-terfaktor</strong> — kombinasi 1.0×(berat sendiri + setiap kasus beban termodel).
Dokumen ini <strong>BUKAN laporan desain</strong>, <strong>BUKAN</strong> hasil kombinasi beban terfaktor,
dan <strong>BUKAN bukti kepatuhan</strong> terhadap SNI atau standar mana pun. Verdict desain elemen
tidak termasuk di dalamnya; hasil kombinasi terfaktor dan pemeriksaan desain ada di tab Analisis/Desain editor.</div>

<h2>1. Informasi proyek</h2>
<table>
<tr><th>Nama</th><td>${esc(name)}</td><th>Lokasi</th><td>${esc(meta?.location ?? '')}</td></tr>
<tr><th>Tipe gedung</th><td>${esc(meta?.buildingType ?? '')}</td><th>Jumlah lantai</th><td>${esc(meta?.stories ?? '')}</td></tr>
<tr><th>Sistem struktur</th><td>${esc(meta?.structuralSystem ?? '')}</td><th>Sistem material</th><td>${esc(meta?.materialSystem ?? '')}</td></tr>
<tr><th>Standar</th><td colspan="3">${esc((meta?.standards ?? []).join(', '))}</td></tr>
<tr><th>Satuan</th><td colspan="3">${esc(meta?.units ?? 'kN, m, MPa')}</td></tr>
<tr><th>Deskripsi</th><td colspan="3">${esc(meta?.description ?? '')}</td></tr>
</table>

<h2>2. Ringkasan model</h2>
<p>Simpul: ${stats.nodes} · Elemen: ${stats.members} · Tumpuan: ${stats.supports} · Beban: ${stats.loads} · Penampang: ${stats.sections}</p>

<h2>3. Penampang &amp; material</h2>
<table><tr><th>Penampang</th><th>Kelas</th><th>E (MPa)</th><th>A (mm²)</th><th>I33 (mm⁴)</th><th>f′c / fy (MPa)</th></tr>${sectionRows}</table>

<h2>4. Beban (sesuai model, tanpa faktor)</h2>
<table><tr><th>ID</th><th>Tipe</th><th>Lokasi</th><th>Kasus</th><th>Nilai</th></tr>${loadRows || '<tr><td colspan="5">Tidak ada beban dalam model</td></tr>'}</table>
<p class="meta">Kombinasi beban: dibuat di editor dari preset kode yang dipilih
(SNI 1727:2020 Pasal 2.3.2 LRFD tersedia). Analisis laporan ini adalah kombinasi layan
1.0×(berat sendiri + setiap kasus beban termodel), tanpa faktor. Berat sendiri disintesis dari
berat satuan penampang γ × luas; penampang dengan γ ≤ 0 atau tidak ditentukan tidak menyumbang berat sendiri.</p>

<h2>5. Metodologi analisis</h2>
<p>Metode Kekakuan Langsung, elemen rangka 2D (3 DOF/simpul: u, v, θ) dengan lentur
Euler–Bernoulli dan deformasi aksial; elemen rangka batang melalui kondensasi statis rotasi ujung yang dilepas.
Beban merata masuk melalui gaya ujung-jepit yang konsisten. Sistem linear diselesaikan dengan eliminasi
Gauss berpivot parsial dan deteksi singularitas per DOF. Solver terverifikasi terhadap
benchmark analitis bentuk tertutup (docs/NUMERICAL_VALIDATION.md).</p>

<h2>6. Simpul, tumpuan &amp; perpindahan</h2>
<table><tr><th>Simpul</th><th>x (m)</th><th>y (m)</th><th>Tumpuan</th><th>u (mm)</th><th>v (mm)</th><th>θ (rad)</th></tr>${nodeRows}</table>

<h2>7. Reaksi tumpuan</h2>
<table><tr><th>Simpul</th><th>Rx (kN)</th><th>Ry (kN)</th><th>Mz (kN·m)</th></tr>${reactionRows}</table>
<p>ΣRx = ${f(sumRx, 6)} kN · ΣRy = ${f(sumRy, 6)} kN (harus mengimbangi total beban yang diterapkan).</p>

<h2>8. Gaya ujung elemen</h2>
<p class="meta">Sumbu lokal: N positif-tarik, M positif-melendut, V dalam konvensi gaya SAP yang didokumentasikan solver.</p>
<table><tr><th>Elemen</th><th>Penampang</th><th>N1 (kN)</th><th>V1 (kN)</th><th>M1 (kN·m)</th><th>N2 (kN)</th><th>V2 (kN)</th><th>M2 (kN·m)</th></tr>${memberRows}</table>

<h2>9. Pemeriksaan desain — TIDAK termasuk dalam dokumen ini</h2>
<p>Dokumen ini hanya memuat hasil <strong>analisis</strong> (perpindahan, reaksi, gaya ujung elemen)
pada kombinasi layan tak-terfaktor. <strong>Tidak ada verdict desain elemen di dalam dokumen ini</strong>:
kombinasi beban terfaktor dan pemeriksaan desain (subset beton SNI 2847:2019, baja SNI 1729:2020) dilakukan di
tab Desain editor, tempat setiap pemeriksaan membawa referensi klausul, input, nilai antara, dan
verdict terpadu (PASS / FAIL / INCOMPLETE / UNVERIFIED / UNSUPPORTED / NOT_EVALUATED).
Dua batasan yang berlaku di sana juga berlaku bagi pembaca dokumen ini:</p>
<ul>
<li>Pemeriksaan seismik baja (AISC 341) berstatus <strong>BELUM TERVERIFIKASI (UNVERIFIED)</strong> — konstanta
yang dipakai belum diverifikasi terhadap teks standar yang berwenang, sehingga hasil seismik yang "lulus"
tidak boleh dibaca sebagai PASS terverifikasi.</li>
<li>Pemeriksaan yang belum diimplementasikan ditandai TIDAK DIDUKUNG (UNSUPPORTED) di tab Desain dan di
docs/SNI_IMPLEMENTATION_MATRIX.md.</li>
</ul>
<p>Ringkasan ini tidak menggantikan keluaran tab Desain.</p>

<h2>10. Peringatan &amp; batasan</h2>
<div class="warn">
<ul>
${warningItems}<li>Hanya analisis statis linear 2D. Pemeriksaan 3D, P-Delta, modal/spektrum-respons, dan geoteknik TIDAK DIDUKUNG (UNSUPPORTED) di v1.</li>
<li>Hasil hanya sevalid model, material, dan beban yang dimasukkan. Tidak ada klaim sertifikasi teknik independen.</li>
<li>ZonaSipil Structure TIDAK mengklaim kepatuhan SNI penuh; subset yang diimplementasikan tercantum di docs/SNI_IMPLEMENTATION_MATRIX.md.</li>
<li>Rute PDF untuk v1: dokumen ini dicetak lewat browser (Save as PDF).</li>
</ul>
</div>

<h2>11. Kesimpulan &amp; persetujuan</h2>
${conclusion}
<table><tr><th>Dihitung oleh</th><td style="width:35%"></td><th>Diperiksa oleh</th><td style="width:35%"></td></tr>
<tr><th>Tanggal / tanda tangan</th><td></td><th>Tanggal / tanda tangan</th><td></td></tr></table>
</body></html>`
}

/** Open the report in a new window for printing / Save-as-PDF. */
export function openReport(
  meta: ProjectMeta | null,
  model: StructureModel,
  result: AnalysisResult,
  integrity?: ReportIntegrity,
): void {
  const html = generateReportHTML(meta, model, result, new Date(), integrity)
  const w = window.open('', '_blank')
  if (!w) throw new Error('Popup diblokir — izinkan popup untuk membuka laporan')
  w.document.open()
  w.document.write(html)
  w.document.close()
}
