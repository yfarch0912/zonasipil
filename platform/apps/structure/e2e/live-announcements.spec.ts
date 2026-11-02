import { test, expect } from '@playwright/test'

/**
 * Phase 7 — live announcements (Phase 6 finding F3). The live regions
 * must exist from first paint (dashboard), announce analysis outcomes
 * in Bahasa Indonesia, announce solver failure assertively, and
 * announce save completion — without announcing an empty model's
 * non-event failure.
 */

test('live regions exist on the dashboard before any interaction', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[aria-live="polite"]')).toHaveCount(1)
  await expect(page.locator('[aria-live="assertive"]')).toHaveCount(1)
  await expect(page.locator('[aria-live="polite"]')).toBeEmpty()
})

test('analysis completion is announced politely with its classification', async ({ page }) => {
  await page.goto('/')
  const card = page.locator('div').filter({ hasText: '01 · Balok Tumpuan Sederhana' }).last()
  await card.getByRole('button', { name: 'Muat contoh' }).click()
  await expect(page.getByText('SIMPUL: 3')).toBeVisible()
  await page.getByText('Analisis', { exact: true }).first().click()
  await expect(page.locator('[aria-live="polite"]')).toContainText('Analisis selesai')
  await expect(page.locator('[aria-live="polite"]')).toContainText('valid')
})

test('solver failure is announced assertively', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Nama proyek').fill('Uji Labil Live')
  await page.getByRole('button', { name: 'Buat & buka di editor' }).click()
  await expect(page.getByText('SIMPUL: 0')).toBeVisible()
  const canvas = page.locator('canvas').first()
  const box = (await canvas.boundingBox())!
  const y = box.y + box.height * 0.6
  await page.getByText('SIMPUL', { exact: true }).first().click()
  await page.mouse.click(box.x + box.width * 0.35, y)
  await page.mouse.click(box.x + box.width * 0.55, y)
  await page.getByText('ELEMEN', { exact: true }).first().click()
  await page.mouse.click(box.x + box.width * 0.35, y)
  await page.mouse.click(box.x + box.width * 0.55, y)
  await expect(page.getByText('ELEMEN: 1')).toBeVisible()
  // Solver results exist on the Analyze/Design tabs (caseResults is
  // gated to them); entering Analisis runs the solve and the failure
  // announcement fires.
  await page.getByText('Analisis', { exact: true }).first().click()
  await expect(page.locator('[aria-live="assertive"]')).toContainText('Analisis gagal')
})

test('save completion is announced politely', async ({ page }) => {
  await page.goto('/')
  const card = page.locator('div').filter({ hasText: '01 · Balok Tumpuan Sederhana' }).last()
  await card.getByRole('button', { name: 'Muat contoh' }).click()
  await expect(page.getByText('SIMPUL: 3')).toBeVisible()
  await page.getByRole('button', { name: 'Simpan proyek' }).click()
  await expect(page.locator('[aria-live="polite"]')).toContainText('Proyek berhasil disimpan')
})
