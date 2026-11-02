/**
 * Platform integration contract tests (ZonaSipil Phase 1 fixtures/metadata).
 * The metadata module must stay in sync with zonasipil.app.json, and the
 * development licence fixtures must cover the four contract states.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { APP_METADATA } from '@/platform/metadata'

const root = path.resolve(__dirname, '../..')
const readJson = (rel: string) => JSON.parse(readFileSync(path.join(root, rel), 'utf8'))

describe('platform metadata (contract §1)', () => {
  it('matches zonasipil.app.json exactly', () => {
    expect(readJson('zonasipil.app.json')).toEqual(APP_METADATA)
  })
  it('identifies this product', () => {
    expect(APP_METADATA.appId).toBe('structure')
    expect(APP_METADATA.productCode).toBe('ZS-STRUCTURE')
  })
})

describe('licence fixtures (contract §6)', () => {
  const cases = [
    ['demo', true],
    ['full', true],
    ['expired', false],
    ['none', false],
  ] as const
  for (const [name, entitled] of cases) {
    it(`${name}.json: entitled=${entitled} for this app`, () => {
      const fx = readJson(`fixtures/licenses/${name}.json`)
      expect(fx.appId).toBe('structure')
      expect(fx.entitled).toBe(entitled)
    })
  }
  it('full.json unlocks only declared supportedFeatures', () => {
    const fx = readJson('fixtures/licenses/full.json')
    expect(fx.features).toEqual(APP_METADATA.supportedFeatures)
  })
})
