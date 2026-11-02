/**
 * Sprint 2 — secondary items: R-04 (import fingerprint) + R-08 (dangling
 * validation-file references).
 *
 * R-04: importProjectJSON used to TRUST a stored fingerprint when one
 * was present (projects.ts: `typeof p.fingerprint === 'string' ?
 * p.fingerprint : modelFingerprint(m)`), so a project file whose model
 * was edited after fingerprinting imported with the WRONG identity —
 * analyses and reports are tied to the fingerprint (§11/§13), so a stale
 * one silently mis-labels them. The fix recomputes unconditionally.
 *
 * R-08: source comments cited `validation/*.mts` scripts as if they
 * could be run from this repository; the directory does not exist here
 * (they are foundation-project scripts). Every such citation now states
 * that plainly. The guard below scans src/ for path-like validation
 * references and requires the NOT-shipped clarification on the same line.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import {
  importProjectJSON,
  exportProjectJSON,
  modelFingerprint,
  newProjectMeta,
  type StoredProject,
} from '@/struktura/projects'
import type { StructureModel } from '@/engine/model'

const MODEL: StructureModel = {
  nodes: { n1: { id: 'n1', x: 0, y: 0 }, n2: { id: 'n2', x: 4, y: 0 } },
  members: { m1: { id: 'm1', a: 'n1', b: 'n2', section: 's1' } },
  sections: { s1: { id: 's1', name: 'T', E: 200000, I33: 80e6, A: 5000, gamma: 0 } },
  supports: { n1: { nodeId: 'n1', type: 'fixed' } },
  loads: {},
}

describe('R-04 — import never trusts a stored fingerprint', () => {
  it('a wrong stored fingerprint is replaced by the recomputed one', () => {
    const stored: StoredProject = {
      meta: newProjectMeta('Uji'),
      model: MODEL,
      fingerprint: 'deadbeef-stale',
    }
    const imported = importProjectJSON(exportProjectJSON(stored))
    expect(imported.fingerprint).not.toBe('deadbeef-stale')
    expect(imported.fingerprint).toBe(modelFingerprint(MODEL))
  })

  it('editing the model inside the file changes the imported fingerprint accordingly', () => {
    const stored: StoredProject = {
      meta: newProjectMeta('Uji'),
      model: MODEL,
      fingerprint: modelFingerprint(MODEL),
    }
    const text = exportProjectJSON(stored)
    // Simulate a hand edit of the exported file: move a node, keep the
    // (now stale) fingerprint field untouched.
    const parsed = JSON.parse(text)
    parsed.model.nodes.n2.x = 9
    const imported = importProjectJSON(JSON.stringify(parsed))
    expect(imported.fingerprint).toBe(modelFingerprint(imported.model))
    expect(imported.fingerprint).not.toBe(modelFingerprint(MODEL))
  })

  it('a correct round-trip keeps its fingerprint (no behaviour change for honest files)', () => {
    const stored: StoredProject = {
      meta: newProjectMeta('Uji'),
      model: MODEL,
      fingerprint: modelFingerprint(MODEL),
    }
    expect(importProjectJSON(exportProjectJSON(stored)).fingerprint).toBe(modelFingerprint(MODEL))
  })
})

describe('R-08 — no dangling validation-file citations in src/', () => {
  const collect = (dir: string): string[] => {
    const out: string[] = []
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      if (statSync(p).isDirectory()) out.push(...collect(p))
      else if (/\.(ts|tsx)$/.test(name)) out.push(p)
    }
    return out
  }

  it('every validation/*.mts|mjs|py|json citation states it is NOT shipped here', () => {
    const offenders: string[] = []
    for (const file of collect('src')) {
      const lines = readFileSync(file, 'utf8').split('\n')
      lines.forEach((line, i) => {
        if (/validation\/[\w./-]+\.(mts|mjs|py|json)/.test(line) && !line.includes('NOT shipped')) {
          offenders.push(`${file}:${i + 1}: ${line.trim().slice(0, 100)}`)
        }
      })
    }
    expect(offenders).toEqual([])
  })

  it('the historical citations themselves are retained as provenance (not deleted)', () => {
    const seismic = readFileSync('src/engine/design/steel/seismic.ts', 'utf8')
    expect(seismic).toContain('validation/steel_seismic.mts')
    expect(seismic).toContain('NOT shipped in this repository')
  })
})
