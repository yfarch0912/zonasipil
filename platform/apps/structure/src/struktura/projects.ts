/**
 * STRUKTURA project management — directive §6.2 / §13.
 *
 * v1 persistence is browser localStorage (no backend — PostgreSQL is on the
 * roadmap, see docs/ROADMAP.md). Projects are versioned JSON: every save bumps
 * `modelVersion`, and analysis results are tied to the model fingerprint so
 * stale results can be detected (§13: changing a model invalidates results).
 */
import type { StructureModel } from '@/engine/model'

export interface ProjectMeta {
  id: string
  name: string
  location: string
  description: string
  buildingType: string
  stories: number
  structuralSystem: string
  materialSystem: string
  /** Applicable design standards, e.g. ["SNI 1727:2020", "SNI 2847:2019"] */
  standards: string[]
  units: string
  createdAt: string
  updatedAt: string
  modelVersion: number
}

export interface StoredProject {
  meta: ProjectMeta
  model: StructureModel
  /** Fingerprint of the model at last save (see modelFingerprint). */
  fingerprint: string
}

const STORE_KEY = 'struktura:projects:v1'
export const AUTOSAVE_KEY = 'struktura:autosave:v1'
export const PENDING_KEY = 'struktura:pending-model:v1'
export const ACTIVE_PROJECT_KEY = 'struktura:active-project:v1'

/**
 * Deterministic JSON stringify (sorted keys) for fingerprinting.
 * Mirrors JSON semantics — `undefined`-valued object keys are dropped — so a
 * model fingerprints identically before and after a JSON round-trip (storage,
 * export/import). Without this, the same stored model would hash differently
 * in memory vs after reload, defeating stale-result detection (§13).
 */
export function stableStringify(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v) ?? 'null'
  if (Array.isArray(v)) return '[' + v.map(stableStringify).join(',') + ']'
  const o = v as Record<string, unknown>
  return (
    '{' +
    Object.keys(o)
      .filter((k) => o[k] !== undefined)
      .sort()
      .map((k) => JSON.stringify(k) + ':' + stableStringify(o[k]))
      .join(',') +
    '}'
  )
}

/** FNV-1a 32-bit hash of the model — the "input fingerprint" of §11/§13. */
export function modelFingerprint(model: StructureModel): string {
  const s = stableStringify(model)
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return 'fnv1a-' + (h >>> 0).toString(16).padStart(8, '0')
}

export function modelStats(model: StructureModel): {
  nodes: number; members: number; supports: number; loads: number; sections: number
} {
  return {
    nodes: Object.keys(model.nodes).length,
    members: Object.keys(model.members).length,
    supports: Object.keys(model.supports).length,
    loads: Object.keys(model.loads).length,
    sections: Object.keys(model.sections).length,
  }
}

function readStore(): Record<string, StoredProject> {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, StoredProject>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeStore(store: Record<string, StoredProject>): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(store))
}

export function listProjects(): StoredProject[] {
  return Object.values(readStore()).sort((a, b) =>
    b.meta.updatedAt.localeCompare(a.meta.updatedAt),
  )
}

export function getProject(id: string): StoredProject | undefined {
  return readStore()[id]
}

export function newProjectMeta(name: string): ProjectMeta {
  const now = new Date().toISOString()
  return {
    id: 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36),
    name: name || 'Proyek Tanpa Judul',
    location: '',
    description: '',
    buildingType: 'Gedung',
    stories: 1,
    structuralSystem: 'Rangka momen',
    materialSystem: 'Beton bertulang',
    standards: ['SNI 1727:2020', 'SNI 1726:2019', 'SNI 2847:2019', 'SNI 1729:2020'],
    units: 'kN, m, MPa',
    createdAt: now,
    updatedAt: now,
    modelVersion: 1,
  }
}

/** Insert or update a project; bumps modelVersion on update. Returns stored copy. */
export function saveProject(meta: ProjectMeta, model: StructureModel): StoredProject {
  const store = readStore()
  const existing = store[meta.id]
  const stored: StoredProject = {
    meta: {
      ...meta,
      updatedAt: new Date().toISOString(),
      modelVersion: existing ? existing.meta.modelVersion + 1 : meta.modelVersion,
    },
    model,
    fingerprint: modelFingerprint(model),
  }
  store[meta.id] = stored
  writeStore(store)
  return stored
}

export function deleteProject(id: string): void {
  const store = readStore()
  delete store[id]
  writeStore(store)
}

/** Serialize a project for JSON export (schema-tagged, §13 import/export). */
export function exportProjectJSON(p: StoredProject): string {
  return JSON.stringify(
    { schema: 'struktura-project', schemaVersion: 1, exportedAt: new Date().toISOString(), ...p },
    null,
    2,
  )
}

/** Parse + validate an exported project file. Throws with a clear message. */
export function importProjectJSON(text: string): StoredProject {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Berkas bukan JSON yang valid')
  }
  const p = parsed as Partial<StoredProject> & { schema?: string }
  if (!p || typeof p !== 'object') throw new Error('Bukan berkas proyek STRUKTURA')
  // Accept a bare structural model JSON (the editor's own Save format) too:
  // wrap it in fresh project metadata instead of rejecting it.
  if (!p.meta && !p.model) {
    const candidate = parsed as StructureModel
    if (candidate.nodes && candidate.members && candidate.sections) {
      const meta = newProjectMeta('Model Impor')
      return { meta, model: candidate, fingerprint: modelFingerprint(candidate) }
    }
    throw new Error('Bukan berkas proyek STRUKTURA (meta/model tidak ada)')
  }
  if (!p.meta || !p.model) {
    throw new Error('Bukan berkas proyek STRUKTURA (meta/model tidak ada)')
  }
  const m = p.model as StructureModel
  if (!m.nodes || !m.members || !m.sections || !m.supports || !m.loads) {
    throw new Error('Model proyek tidak lengkap (simpul/elemen/penampang/tumpuan/beban wajib ada)')
  }
  return {
    meta: p.meta as ProjectMeta,
    model: m,
    // Sprint 2 (R-04, secondary): the fingerprint is ALWAYS recomputed
    // from the imported model — a stored fingerprint is never trusted.
    // Before this fix, a project file whose model was edited after its
    // fingerprint was written (hand-edited JSON, a stale export) imported
    // with the stale fingerprint attached, so analyses/reports could be
    // tied to the wrong model identity. The UI flow masked this because
    // saveProject recomputes on save; the API now guarantees it too.
    fingerprint: modelFingerprint(m),
  }
}
