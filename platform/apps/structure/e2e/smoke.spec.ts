import { test, expect } from '@playwright/test'

/**
 * E2E smoke — the critical user workflow, against the real production
 * build served locally (see config/playwright.config.ts):
 *
 *   dashboard → open sample 01 (simply supported beam) → editor →
 *   Analisis tab → solver runs live → support reactions rendered.
 *
 * The expected reactions are statics, not fixture text: sample 01 is a
 * 5 m simply supported beam with a 10 kN point load 2 m from the left
 * support, so Ry(left) = 10·3/5 = 6 kN and Ry(right) = 10·2/5 = 4 kN.
 * The values asserted below come out of the live solver run in the
 * browser (the reaction panel reads `analysisResult.reactions`).
 *
 * Phase 4 update: sample 01's hand-written section constant previously
 * stored I33 1000× too small, so the run classified
 * PHYSICALLY_IMPLAUSIBLE and the app showed its warning dialog
 * (asserted by the Phase 2/3 version of this test — see
 * docs/E2E-SMOKE-REPORT.md history). After the Phase 4 correction
 * (docs/PHASE-4-SECTION-CORRECTION-REPORT.md) the same workflow
 * classifies VALID: this test now asserts that NO implausibility
 * warning appears AND that the solver's reactions are still rendered —
 * it verifies the diagnostics system by its absence where it should be
 * absent, and the results where they should be present. It does not
 * bypass or disable any diagnostic.
 */
test('dashboard → sample 01 → analyze → reactions 6 kN / 4 kN, no implausibility warning', async ({ page }) => {
  const pageErrors: string[] = []
  const failedRequests: string[] = []
  const badResponses: string[] = []
  page.on('pageerror', (e) => pageErrors.push(e.message))
  page.on('requestfailed', (r) => failedRequests.push(r.url()))
  page.on('response', (r) => { if (r.status() >= 400) badResponses.push(`${r.status()} ${r.url()}`) })

  // 1–2. Dashboard renders with the sample catalogue.
  await page.goto('/')
  await expect(page).toHaveTitle(/ZonaSipil Structure/)
  await expect(page.getByText('Proyek contoh (edukasi, terverifikasi)')).toBeVisible()
  await expect(page.getByText('01 · Balok Tumpuan Sederhana')).toBeVisible()

  // 3. Open sample 01 in the editor.
  const card = page.locator('div').filter({ hasText: '01 · Balok Tumpuan Sederhana' }).last()
  await card.getByRole('button', { name: 'Muat contoh' }).click()
  await expect(page.getByRole('button', { name: 'Simpan proyek' })).toBeVisible()
  await expect(page.getByText('SIMPUL: 3')).toBeVisible()
  await expect(page.getByText('ELEMEN: 2')).toBeVisible()

  // 4. Analysis runs on the Analisis tab. With the corrected section
  // the diagnostics classify VALID: no PHYSICALLY_IMPLAUSIBLE warning
  // dialog, no "not physically plausible" banner anywhere.
  await page.getByText('Analisis', { exact: true }).first().click()
  await expect(page.getByText('REAKSI', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Hasil analisis TIDAK MASUK AKAL SECARA FISIK')).toHaveCount(0)
  await expect(page.getByText('PHYSICALLY_IMPLAUSIBLE')).toHaveCount(0)

  // 5. Reactions are rendered from the live analysis result.
  await page.getByRole('button', { name: 'Nonaktif' }).click() // Ringkasan toggle on
  await expect(page.getByText('+6 kN', { exact: true })).toBeVisible()
  await expect(page.getByText('+4 kN', { exact: true })).toBeVisible()

  // 6. Error hygiene: no page errors, no failed requests, no HTTP
  // errors. Phase 6 update: fonts are self-hosted (see
  // docs/PHASE-6-FONT-SELF-HOSTING.md), so the former Google Fonts
  // exception is removed — the assertion is now stricter, not weaker:
  // zero failed requests of any kind.
  expect(pageErrors).toEqual([])
  expect(badResponses).toEqual([])
  expect(failedRequests).toEqual([])
})
