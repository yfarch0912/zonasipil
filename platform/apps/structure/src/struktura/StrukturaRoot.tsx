/**
 * STRUKTURA root — Dashboard ⇄ Editor.
 *
 * Deliberately plain and light (user requirement): no animation, no decorative
 * assets, no extra libraries. The heavy editor is lazy-loaded so the dashboard
 * first paint stays small on GitHub Pages.
 */
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { LiveAnnouncer } from '@/shared/live-announcer'
import { announceStatus } from '@/shared/announce'
import { useIsMobile } from '@/hooks/use-mobile'
import type { StructureModel } from '@/engine/model'
import { createEmptyModel, isStructureModel } from '@/engine/model'
import { serviceResult } from './service-result'
import {
  ACTIVE_PROJECT_KEY, AUTOSAVE_KEY, PENDING_KEY,
  deleteProject, exportProjectJSON, getProject, importProjectJSON,
  listProjects, modelStats, newProjectMeta, saveProject,
  type ProjectMeta,
} from './projects'
import { SAMPLES } from './samples'
import { openReport } from './report'

const EditorApp = lazy(() => import('@/App'))

const barBtn: React.CSSProperties = {
  border: '1px solid #c3cedd', background: '#fff', color: '#14213d',
  padding: '5px 12px', borderRadius: 4, fontSize: 13, cursor: 'pointer',
}
const primaryBtn: React.CSSProperties = {
  ...barBtn, background: '#1d4ed8', borderColor: '#1d4ed8', color: '#fff', fontWeight: 600,
}
const input: React.CSSProperties = {
  border: '1px solid #c3cedd', borderRadius: 4, padding: '6px 8px', fontSize: 13, width: '100%',
}

export default function StrukturaRoot() {
  const isMobile = useIsMobile()
  const [view, setView] = useState<'dashboard' | 'editor'>('dashboard')
  const [refresh, setRefresh] = useState(0)
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [activeMeta, setActiveMeta] = useState<ProjectMeta | null>(() => {
    try {
      const raw = localStorage.getItem(ACTIVE_PROJECT_KEY)
      return raw ? (JSON.parse(raw) as ProjectMeta) : null
    } catch { return null }
  })
  const fileRef = useRef<HTMLInputElement>(null)

  const projects = useMemo(() => {
    void refresh
    return listProjects().filter(
      (p) => p.meta.name.toLowerCase().includes(query.toLowerCase()),
    )
  }, [refresh, query])

  const openInEditor = (model: StructureModel, meta: ProjectMeta | null) => {
    localStorage.setItem(PENDING_KEY, JSON.stringify(model))
    if (meta) {
      localStorage.setItem(ACTIVE_PROJECT_KEY, JSON.stringify(meta))
      setActiveMeta(meta)
    } else {
      // Sample / ad-hoc model: clear any stale active project so a later
      // "Save project" can never overwrite an unrelated stored project.
      localStorage.removeItem(ACTIVE_PROJECT_KEY)
      setActiveMeta(null)
    }
    setView('editor')
  }

  const handleNewProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const meta = newProjectMeta(String(fd.get('name') || 'Proyek Tanpa Judul'))
    meta.location = String(fd.get('location') || '')
    meta.buildingType = String(fd.get('buildingType') || 'Gedung')
    meta.stories = Number(fd.get('stories') || 1)
    meta.structuralSystem = String(fd.get('structuralSystem') || 'Rangka momen')
    meta.materialSystem = String(fd.get('materialSystem') || 'Beton bertulang')
    meta.description = String(fd.get('description') || '')
    const stored = saveProject(meta, createEmptyModel())
    setRefresh((r) => r + 1)
    openInEditor(stored.model, stored.meta)
  }

  const handleSaveToProject = () => {
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY)
      if (!raw) { setError('Belum ada model tersimpan otomatis — buka editor dulu.'); return }
      const model = JSON.parse(raw) as StructureModel
      if (!isStructureModel(model)) { setError('Model tersimpan otomatis tidak valid.'); return }
      const meta = activeMeta ?? newProjectMeta('Proyek Tanpa Judul')
      const stored = saveProject(meta, model)
      localStorage.setItem(ACTIVE_PROJECT_KEY, JSON.stringify(stored.meta))
      setActiveMeta(stored.meta)
      setRefresh((r) => r + 1)
      setError(null)
      announceStatus('Proyek berhasil disimpan.', 'polite')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    }
  }

  // Phase 7 (F3): surface root-level errors (save/report/import) to
  // screen readers through the assertive live region.
  useEffect(() => {
    if (error) announceStatus(`Terjadi kesalahan: ${error}`, 'assertive')
  }, [error])

  const handleReport = () => {
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY)
      if (!raw) { setError('Belum ada model tersimpan otomatis — buka editor dulu.'); return }
      const model = JSON.parse(raw) as StructureModel
      if (!isStructureModel(model)) { setError('Model tersimpan otomatis tidak valid.'); return }
      const svc = serviceResult(model)
      if (!svc.ok) { setError(`Analisis gagal — laporan tidak dibuat: ${svc.reason}`); return }
      openReport(activeMeta, model, svc.result, { warnings: svc.warnings })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat laporan')
    }
  }

  const handleImport = async (file: File) => {
    try {
      const p = importProjectJSON(await file.text())
      const stored = saveProject(p.meta, p.model)
      setRefresh((r) => r + 1)
      setError(null)
      openInEditor(stored.model, stored.meta)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengimpor')
    }
  }

  if (view === 'editor') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <LiveAnnouncer />
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
          background: '#0f2a52', color: '#fff', flexShrink: 0,
        }}>
          <button style={{ ...barBtn, background: 'transparent', color: '#fff', borderColor: '#5b7ba6' }}
            onClick={() => { setView('dashboard'); setRefresh((r) => r + 1) }}>
            ← Dasbor
          </button>
          <strong style={{ letterSpacing: '0.06em', fontSize: 13 }}>ZonaSipil Structure</strong>
          <span style={{ fontSize: 13, opacity: 0.85 }}>
            {activeMeta ? `${activeMeta.name} · v${activeMeta.modelVersion}` : 'Model belum tersimpan (autosave aktif)'}
          </span>
          <span style={{ flex: 1 }} />
          {error && <span style={{ fontSize: 12, color: '#ffb4b4' }}>{error}</span>}
          <button style={barBtn} onClick={handleSaveToProject}>Simpan proyek</button>
          <button style={barBtn} onClick={handleReport}>Laporan (PDF)</button>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <Suspense fallback={<div style={{ padding: 24, fontSize: 13 }}>Memuat editor…</div>}>
            <EditorApp />
          </Suspense>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6fa', color: '#14213d', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <LiveAnnouncer />
      <header style={{ background: '#0f2a52', color: '#fff', padding: '14px 24px', display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span style={{ fontWeight: 800, letterSpacing: '0.04em', fontSize: 18 }}>ZonaSipil Structure</span>
        <span style={{ fontSize: 13, opacity: 0.85 }}>Analisis &amp; Desain Struktur — Direct Stiffness 2D · subset SNI 2847:2019 / SNI 1729:2020</span>
      </header>

      <main style={{ maxWidth: 1080, margin: '0 auto', padding: 24, display: 'grid', gap: 24 }}>
        {error && (
          <div style={{ background: '#fdecec', border: '1px solid #e5a3a3', padding: '8px 12px', borderRadius: 4, fontSize: 13 }}>
            {error}
          </div>
        )}

        <section style={{ background: '#fff', border: '1px solid #d7dee9', borderRadius: 6, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: 15, margin: 0 }}>Proyek</h2>
            <span style={{ flex: 1 }} />
            <input aria-label="Cari proyek" placeholder="Cari proyek…" value={query} onChange={(e) => setQuery(e.target.value)}
              style={{ ...input, width: isMobile ? '100%' : 220 }} />
            <button style={barBtn} onClick={() => fileRef.current?.click()}>Impor JSON</button>
            <input ref={fileRef} aria-label="Pilih berkas JSON untuk diimpor" type="file" accept=".json,application/json" style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleImport(f); e.target.value = '' }} />
            <button style={primaryBtn} onClick={() => openInEditor(
              (() => { try { const raw = localStorage.getItem(AUTOSAVE_KEY); const m = raw ? JSON.parse(raw) as StructureModel : null; return m && isStructureModel(m) ? m : createEmptyModel() } catch { return createEmptyModel() } })(),
              activeMeta,
            )}>Buka editor (model saat ini)</button>
          </div>
          {projects.length === 0 ? (
            <p style={{ fontSize: 13, color: '#5a6b84', margin: 0 }}>
              Belum ada proyek tersimpan. Buat proyek di bawah, atau buka contoh — proyek disimpan di browser ini (localStorage).
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#44546e' }}>
                  <th style={{ padding: '4px 6px' }}>Nama</th><th>Lokasi</th><th>Sistem</th>
                  <th>Model</th><th>Versi</th><th>Diperbarui</th><th></th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => {
                  const s = modelStats(p.model)
                  return (
                    <tr key={p.meta.id} style={{ borderTop: '1px solid #e3e9f2' }}>
                      <td style={{ padding: '6px' }}><strong>{p.meta.name}</strong></td>
                      <td>{p.meta.location || '—'}</td>
                      <td>{p.meta.structuralSystem}</td>
                      <td>{s.nodes} simpul · {s.members} elemen · {s.loads} beban</td>
                      <td>v{p.meta.modelVersion}</td>
                      <td>{new Date(p.meta.updatedAt).toLocaleString()}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button style={barBtn} onClick={() => openInEditor(p.model, p.meta)}>Buka</button>{' '}
                        <button style={barBtn} onClick={() => {
                          const blob = new Blob([exportProjectJSON(p)], { type: 'application/json' })
                          const a = document.createElement('a')
                          a.href = URL.createObjectURL(blob)
                          a.download = `${p.meta.name.replace(/\s+/g, '-').toLowerCase()}.struktura.json`
                          a.click(); URL.revokeObjectURL(a.href)
                        }}>Ekspor</button>{' '}
                        <button style={barBtn} onClick={() => {
                          const fresh = getProject(p.meta.id)
                          if (fresh && window.confirm(`Hapus proyek "${fresh.meta.name}"?`)) {
                            deleteProject(p.meta.id); setRefresh((r) => r + 1)
                          }
                        }}>Hapus</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </section>

        <section style={{ background: '#fff', border: '1px solid #d7dee9', borderRadius: 6, padding: 16 }}>
          <h2 style={{ fontSize: 15, marginTop: 0 }}>Proyek baru</h2>
          <form onSubmit={handleNewProject} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 10 }}>
            <label style={{ fontSize: 12 }}>Nama proyek<input name="name" required style={input} placeholder="cth. Rumah Tinggal 2 Lantai" /></label>
            <label style={{ fontSize: 12 }}>Lokasi<input name="location" style={input} placeholder="Kota" /></label>
            <label style={{ fontSize: 12 }}>Tipe gedung<input name="buildingType" style={input} defaultValue="Gedung" /></label>
            <label style={{ fontSize: 12 }}>Jumlah lantai<input name="stories" type="number" min={1} defaultValue={1} style={input} /></label>
            <label style={{ fontSize: 12 }}>Sistem struktur<input name="structuralSystem" style={input} defaultValue="Rangka momen" /></label>
            <label style={{ fontSize: 12 }}>Sistem material<input name="materialSystem" style={input} defaultValue="Beton bertulang" /></label>
            <label style={{ fontSize: 12, gridColumn: '1 / -1' }}>Deskripsi<input name="description" style={input} /></label>
            <div><button type="submit" style={primaryBtn}>Buat &amp; buka di editor</button></div>
          </form>
          <p style={{ fontSize: 12, color: '#5a6b84' }}>
            Standar yang dicatat pada setiap proyek: SNI 1727:2020 · SNI 1726:2019 · SNI 2847:2019 · SNI 1729:2020 (hanya subset yang diimplementasikan — lihat matriks SNI di dokumen repositori).
          </p>
        </section>

        <section style={{ background: '#fff', border: '1px solid #d7dee9', borderRadius: 6, padding: 16 }}>
          <h2 style={{ fontSize: 15, marginTop: 0 }}>Proyek contoh (edukasi, terverifikasi)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', gap: 10 }}>
            {SAMPLES.map((s) => (
              <div key={s.id} style={{ border: '1px solid #e3e9f2', borderRadius: 4, padding: 10 }}>
                <strong style={{ fontSize: 13 }}>{s.title}</strong>
                <p style={{ fontSize: 12, color: '#44546e', margin: '4px 0' }}>{s.description}</p>
                <p style={{ fontSize: 12, color: '#44546e', margin: '4px 0' }}><em>Harapan:</em> {s.expected}</p>
                <button style={barBtn} onClick={() => openInEditor(s.build(), null)}>Muat contoh</button>
              </div>
            ))}
          </div>
        </section>

        <footer style={{ fontSize: 12, color: '#5a6b84' }}>
          Hasil analisis dihitung di browser Anda oleh solver Direct Stiffness bawaan dan diverifikasi terhadap
          benchmark analitis. Alat edukasi — bukan pengganti peninjauan insinyur berlisensi. ZonaSipil Structure — aplikasi teknik struktur ZonaSipil (berbasis engine STRUKTURA 1.0.0).
          Lisensi dan atribusi pihak ketiga: lihat NOTICE di repositori.
        </footer>
      </main>
    </div>
  )
}
