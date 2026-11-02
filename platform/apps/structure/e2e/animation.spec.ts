import { test, expect, type Page } from '@playwright/test'

/**
 * Structural animation & load simulation — validation.
 * Covers prompt Tests A/B (solver-true labels on the sample beam),
 * E (case comparison), F (unstable model shows no animation), and
 * H (playback lifecycle + reduced motion), plus the invariant that
 * animation never modifies the model (autosave byte-identical).
 */

const AUTOSAVE_KEY = 'struktura:autosave:v1'

async function openSample01Analyze(page: Page) {
  await page.goto('/')
  const card = page.locator('div').filter({ hasText: '01 · Balok Tumpuan Sederhana' }).last()
  await card.getByRole('button', { name: 'Muat contoh' }).click()
  await expect(page.getByText('SIMPUL: 3')).toBeVisible()
  await page.getByRole('button', { name: 'Analisis' }).click()
  await expect(page.getByText('Animasi Deformasi')).toBeVisible()
}

async function sliderValue(page: Page): Promise<number> {
  return Number(await page.getByLabel('Kemajuan animasi deformasi').inputValue())
}

test('A/B: honest scale label with the solver peak; lifecycle play/pause/replay/reset; model untouched', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (e) => pageErrors.push(e.message))
  await openSample01Analyze(page)

  // Sample 01 peak nodal displacement (verified Phase 4): 3.2681e-4 m.
  await expect(
    page.getByText(/SKALA DEFORMASI: 1× — HANYA VISUALISASI · perpindahan maks sebenarnya 0\.00033 m di simpul/),
  ).toBeVisible()

  const autosaveBefore = await page.evaluate((k) => localStorage.getItem(k), AUTOSAVE_KEY)

  // Scrub to 0% with the keyboard.
  const slider = page.getByLabel('Kemajuan animasi deformasi')
  await slider.focus()
  await page.keyboard.press('Home')
  await expect(page.getByText('0%', { exact: true })).toBeVisible()

  // Play advances the interpolation; pause freezes it. (Buttons are
  // scoped to the simulation group — the app also has an "Ulang"
  // redo-style button elsewhere.)
  const simBar = page.getByRole('group', { name: 'Kontrol animasi deformasi' })
  await simBar.getByRole('button', { name: 'Putar' }).click()
  await expect
    .poll(() => sliderValue(page), { timeout: 5000 })
    .toBeGreaterThan(30)
  await simBar.getByRole('button', { name: 'Jeda' }).click()
  const frozen = await sliderValue(page)
  await page.waitForTimeout(450)
  expect(await sliderValue(page)).toBe(frozen)

  // Replay restarts from a small value and advances again.
  await simBar.getByRole('button', { name: 'Ulang', exact: true }).click()
  await page.waitForTimeout(120)
  const early = await sliderValue(page)
  await expect.poll(() => sliderValue(page), { timeout: 5000 }).toBeGreaterThan(early)

  // Reset returns to the full deformed shape.
  await simBar.getByRole('button', { name: 'Atur Ulang' }).click()
  await expect(page.getByText('100%', { exact: true })).toBeVisible()

  // Scale preset updates the honest label.
  await page.getByLabel('Skala deformasi visualisasi').selectOption('5')
  await expect(page.getByText(/SKALA DEFORMASI: 5× — HANYA VISUALISASI/)).toBeVisible()

  // Animation never modifies the engineering model.
  const autosaveAfter = await page.evaluate((k) => localStorage.getItem(k), AUTOSAVE_KEY)
  expect(autosaveAfter).toBe(autosaveBefore)
  expect(pageErrors).toEqual([])
})

test('E: case comparison lists solver values per case', async ({ page }) => {
  await openSample01Analyze(page)
  await page.getByText('Perbandingan kasus beban').click()
  const table = page.locator('table').filter({ hasText: 'ΣRy (kN)' })
  await expect(table.getByText('Beban Mati')).toBeVisible()
  // Sample 01 reactions sum to the applied 10 kN.
  await expect(table.getByText('10.000')).toBeVisible()
})

test('F: unstable model gets no animation and no fabricated result', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Nama proyek').fill('Uji Animasi Tak Stabil')
  await page.getByRole('button', { name: 'Buat & buka di editor' }).click()
  await expect(page.getByText('SIMPUL: 0')).toBeVisible()
  await page.getByRole('button', { name: 'Analisis' }).click()
  await expect(page.getByText('Tidak ada hasil analisis yang valid untuk dianimasikan.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Putar' })).toBeDisabled()
})

test.describe('H: reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('Putar steps in fixed increments instead of running a loop', async ({ page }) => {
    await openSample01Analyze(page)
    const slider = page.getByLabel('Kemajuan animasi deformasi')
    await slider.focus()
    await page.keyboard.press('Home')
    await expect(page.getByText('0%', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Putar' }).click()
    await expect(page.getByText('10%', { exact: true })).toBeVisible()
    await page.waitForTimeout(450)
    // No continuous advance under reduced motion.
    await expect(page.getByText('10%', { exact: true })).toBeVisible()
  })
})
