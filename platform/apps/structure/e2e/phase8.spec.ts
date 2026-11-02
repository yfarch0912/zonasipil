import { test, expect, devices, type Page, type Locator } from '@playwright/test'

/**
 * Phase 8 — mobile accessibility fixes + Data Tabel completion.
 * Covers: B1 status-pill target size, B2 advisory modal semantics,
 * C1 distributed-load lifecycle with solver verification, C2 load-case
 * toggles, C3 section property editing + validation, C4 in-app delete
 * confirmation (cancel / Escape / confirm), and the save-failure
 * announcement.
 */

const AUTOSAVE_KEY = 'struktura:autosave:v1'

async function typeInto(locator: Locator, page: Page, value: string) {
  await locator.focus()
  await page.keyboard.press('Control+A')
  await page.keyboard.type(value)
}

async function openDataProject(page: Page, name: string) {
  await page.goto('/')
  await page.getByLabel('Nama proyek').fill(name)
  await page.getByRole('button', { name: 'Buat & buka di editor' }).click()
  await expect(page.getByText('SIMPUL: 0')).toBeVisible()
  await page.getByRole('button', { name: 'Data Tabel' }).click()
  await expect(page.getByRole('heading', { name: /Data Tabel/ })).toBeVisible()
}

/** Adds nodes (0,0) and (5,0), pin/roller supports, one member. */
async function buildBareBeam(page: Page) {
  const xIn = page.getByLabel('X simpul baru')
  const yIn = page.getByLabel('Y simpul baru')
  const addNodeBtn = page.getByRole('button', { name: 'Tambah Simpul' })
  for (const [i, x] of ['0', '5'].entries()) {
    await typeInto(xIn, page, x)
    await typeInto(yIn, page, '0')
    await addNodeBtn.click()
    await expect(page.getByText(`SIMPUL: ${i + 1}`)).toBeVisible()
  }
  const model = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), AUTOSAVE_KEY)
  const [n1, n3] = Object.keys(model.nodes) as string[]
  await page.getByLabel(`Tumpuan simpul ${n1}`).selectOption('pin')
  await page.getByLabel(`Tumpuan simpul ${n3}`).selectOption('roller')
  await page.getByRole('button', { name: 'Tambah Elemen' }).click()
  await expect(page.getByText('ELEMEN: 1')).toBeVisible()
  return { n1, n3 }
}

test('B1: status pill target is at least 24x24', async ({ page }) => {
  await page.goto('/')
  const card = page.locator('div').filter({ hasText: '01 · Balok Tumpuan Sederhana' }).last()
  await card.getByRole('button', { name: 'Muat contoh' }).click()
  await expect(page.getByText('SIMPUL: 3')).toBeVisible()
  const pill = page.getByRole('button', { name: /TERTENTU|STABIL|TIDAK/ }).first()
  const box = await pill.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.height).toBeGreaterThanOrEqual(24)
  expect(box!.width).toBeGreaterThanOrEqual(24)
})

test.describe('B2: landscape advisory modal (mobile UA)', () => {
  const pixel7 = { ...devices['Pixel 7'] } as Record<string, unknown>
  delete pixel7.defaultBrowserType
  test.use(pixel7)

  test('dialog semantics, focus in on open, Escape dismisses', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('div').filter({ hasText: '01 · Balok Tumpuan Sederhana' }).last()
    const loadBtn = card.getByRole('button', { name: 'Muat contoh' })
    await loadBtn.scrollIntoViewIfNeeded()
    await loadBtn.tap()
    const dialog = page.getByRole('dialog', { name: 'Saran tampilan layar' })
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    const focusInside = await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"]')
      return !!d && (d === document.activeElement || d.contains(document.activeElement))
    })
    expect(focusInside).toBe(true)
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    // Editor is usable afterwards.
    await expect(page.getByText('SIMPUL: 3')).toBeVisible()
  })
})

test.describe('B3: narrow-viewport navigation retest', () => {
  const pixel7 = { ...devices['Pixel 7'] } as Record<string, unknown>
  delete pixel7.defaultBrowserType
  test.use(pixel7)

  test('320px: dashboard has no overflow; Data Tabel tab reachable by touch in the editor', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 })
    await page.goto('/')
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)
    const card = page.locator('div').filter({ hasText: '01 · Balok Tumpuan Sederhana' }).last()
    const loadBtn = card.getByRole('button', { name: 'Muat contoh' })
    await loadBtn.scrollIntoViewIfNeeded()
    await loadBtn.tap()
    await expect(page.getByText('SIMPUL: 3')).toBeVisible()
    const continueBtn = page.getByRole('button', { name: 'Tetap Lanjutkan' })
    if (await continueBtn.isVisible().catch(() => false)) await continueBtn.tap()
    const tab = page.getByRole('button', { name: 'Data Tabel' })
    await tab.scrollIntoViewIfNeeded()
    await tab.tap()
    await expect(page.getByRole('heading', { name: /Data Tabel/ })).toBeVisible()
  })
})

test('C1: distributed load via Data Tabel solves to UDL statics and persists across views', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (e) => pageErrors.push(e.message))
  await openDataProject(page, 'Uji Beban Merata')
  await buildBareBeam(page)

  // Invalid magnitude is rejected with an explicit message, not coerced.
  await typeInto(page.getByLabel('w awal beban merata baru'), page, 'abc')
  await page.getByRole('button', { name: 'Tambah Beban Merata' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'harus berupa angka' })).toBeVisible()
  let model = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), AUTOSAVE_KEY)
  expect(Object.keys(model.loads)).toHaveLength(0)

  // Uniform -10 kN/m over the 5 m member.
  await typeInto(page.getByLabel('w awal beban merata baru'), page, '-10')
  await typeInto(page.getByLabel('w akhir beban merata baru'), page, '-10')
  await page.getByRole('button', { name: 'Tambah Beban Merata' }).click()
  model = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), AUTOSAVE_KEY)
  const loads = Object.values(model.loads) as { type: string; wStart: number; wEnd: number }[]
  expect(loads).toHaveLength(1)
  expect(loads[0]).toMatchObject({ type: 'distributed', wStart: -10, wEnd: -10 })

  // Solver: SS beam, UDL 10 kN/m x 5 m -> reactions 25 kN each end.
  await page.getByRole('button', { name: 'Jalankan Analisis' }).click()
  await expect(page.getByText(/Kasus Beban Mati/)).toBeVisible()
  const text = await page.locator('body').innerText()
  expect(text.split('25.000').length - 1).toBeGreaterThanOrEqual(2)

  // Table -> canvas -> table consistency: the row survives view switches.
  await page.getByRole('button', { name: 'Model', exact: true }).click()
  await page.waitForTimeout(400)
  await page.getByRole('button', { name: 'Data Tabel' }).click()
  // .first() is the table row's field (the create form's "…baru" field
  // shares the label prefix and appears later in the DOM).
  await expect(page.getByLabel(/w awal beban merata/).first()).toHaveValue('-10')
  expect(pageErrors).toEqual([])
})

test('C2: disabling the Beban Mati case removes it from the analysis', async ({ page }) => {
  await openDataProject(page, 'Uji Kasus Beban')
  await buildBareBeam(page)
  await typeInto(page.getByLabel('w awal beban merata baru'), page, '-10')
  await typeInto(page.getByLabel('w akhir beban merata baru'), page, '-10')
  await page.getByRole('button', { name: 'Tambah Beban Merata' }).click()
  await page.getByRole('button', { name: 'Jalankan Analisis' }).click()
  await expect(page.getByText(/Kasus Beban Mati/)).toBeVisible()

  await page.getByLabel('Aktifkan kasus Beban Mati').uncheck()
  await page.getByRole('button', { name: 'Jalankan Analisis' }).click()
  await page.waitForTimeout(300)
  const text = await page.locator('body').innerText()
  expect(text).not.toContain('Kasus Beban Mati:')
})

test('C3+C4: section edit validates; delete dialog cancels, escapes, confirms with dependents', async ({ page }) => {
  await openDataProject(page, 'Uji Penampang Hapus')
  const { n1 } = await buildBareBeam(page)
  const model0 = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), AUTOSAVE_KEY)
  const sectionId = (Object.values(model0.members)[0] as { section: string }).section

  // Section E edit persists; zero is rejected with a message.
  const eField = page.getByLabel(`E penampang ${sectionId}`)
  await typeInto(eField, page, '30000')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(300)
  let model = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), AUTOSAVE_KEY)
  expect(model.sections[sectionId].E).toBe(30000)
  await typeInto(eField, page, '0')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('alert').filter({ hasText: 'lebih besar dari nol' })).toBeVisible()
  model = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), AUTOSAVE_KEY)
  expect(model.sections[sectionId].E).toBe(30000)

  // Delete dialog: dependents are listed; Batal keeps everything.
  await page.getByRole('button', { name: `Hapus simpul ${n1}` }).click()
  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('ikut terhapus')
  await expect(dialog).toContainText('elemen')
  await page.getByRole('button', { name: 'Batal' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByText('SIMPUL: 2')).toBeVisible()

  // Escape also cancels.
  await page.getByRole('button', { name: `Hapus simpul ${n1}` }).click()
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(page.getByText('SIMPUL: 2')).toBeVisible()

  // Confirm applies the engine cascade: node AND its member disappear.
  await page.getByRole('button', { name: `Hapus simpul ${n1}` }).click()
  await page.getByRole('button', { name: 'Ya, Hapus' }).click()
  await expect(page.getByText('SIMPUL: 1')).toBeVisible()
  await expect(page.getByText('ELEMEN: 0')).toBeVisible()
})

test('save failure is announced assertively', async ({ page }) => {
  await page.goto('/')
  const card = page.locator('div').filter({ hasText: '01 · Balok Tumpuan Sederhana' }).last()
  await card.getByRole('button', { name: 'Muat contoh' }).click()
  await expect(page.getByText('SIMPUL: 3')).toBeVisible()
  // Corrupt the autosave so Simpan proyek takes its failure path.
  await page.evaluate((k) => localStorage.setItem(k, '{bukan json'), AUTOSAVE_KEY)
  await page.getByRole('button', { name: 'Simpan proyek' }).click()
  await expect(page.locator('[aria-live="assertive"]')).toContainText('Terjadi kesalahan')
})
