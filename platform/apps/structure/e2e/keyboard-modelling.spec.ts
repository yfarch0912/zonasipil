import { test, expect, type Page, type Locator } from '@playwright/test'

/**
 * Phase 7 — keyboard-accessible modelling (Phase 6 finding F4,
 * vertical slice). Builds a complete simply supported beam with a
 * mid-span point load ENTIRELY from the keyboard in the new
 * "Data Tabel" tab — no canvas pointer interaction — then runs the
 * same solver pipeline and checks the reactions in the results table
 * (5 m span, −10 kN at mid-span → Ry = +5.000 kN at both supports).
 * Selects are driven with real arrow-key presses; buttons with Enter.
 */

const AUTOSAVE_KEY = 'struktura:autosave:v1'

async function typeInto(locator: Locator, page: Page, value: string) {
  await locator.focus()
  await page.keyboard.press('Control+A')
  await page.keyboard.type(value)
}

async function selectByKeyboard(locator: Locator, page: Page, target: string) {
  await locator.focus()
  const info = await locator.evaluate((el) => {
    const s = el as HTMLSelectElement
    return {
      current: s.selectedIndex,
      options: Array.from(s.options).map((o) => o.value),
    }
  })
  const targetIndex = info.options.indexOf(target)
  expect(targetIndex, `option ${target} exists`).toBeGreaterThanOrEqual(0)
  const delta = targetIndex - info.current
  const key = delta >= 0 ? 'ArrowDown' : 'ArrowUp'
  for (let i = 0; i < Math.abs(delta); i++) await page.keyboard.press(key)
  await expect(locator).toHaveValue(target)
}

test('keyboard-only: build beam in Data Tabel, analyse, read reactions', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (e) => pageErrors.push(e.message))

  await page.goto('/')
  await page.getByLabel('Nama proyek').fill('Uji Keyboard')
  await page.getByRole('button', { name: 'Buat & buka di editor' }).click()
  await expect(page.getByText('SIMPUL: 0')).toBeVisible()

  // Enter the Data Tabel tab by keyboard.
  await page.getByRole('button', { name: 'Data Tabel' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: /Data Tabel/ })).toBeVisible()

  // ── Nodes: (0,0), (2.5,0), (5,0) ────────────────────────────────
  const xIn = page.getByLabel('X simpul baru')
  const yIn = page.getByLabel('Y simpul baru')
  const addNodeBtn = page.getByRole('button', { name: 'Tambah Simpul' })
  for (const [i, x] of ['0', '2.5', '5'].entries()) {
    await typeInto(xIn, page, x)
    await typeInto(yIn, page, '0')
    await addNodeBtn.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByText(`SIMPUL: ${i + 1}`)).toBeVisible()
  }

  const model1 = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), AUTOSAVE_KEY)
  const nodeIds = Object.keys(model1.nodes) as string[]
  expect(nodeIds).toHaveLength(3)
  const [n1, n2, n3] = nodeIds

  // ── Supports: pin at n1, roller at n3 (arrow keys on selects) ───
  await selectByKeyboard(page.getByLabel(`Tumpuan simpul ${n1}`), page, 'pin')
  await selectByKeyboard(page.getByLabel(`Tumpuan simpul ${n3}`), page, 'roller')

  // ── Members: n1–n2 (form defaults), then n2–n3 ──────────────────
  const addMemberBtn = page.getByRole('button', { name: 'Tambah Elemen' })
  await addMemberBtn.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByText('ELEMEN: 1')).toBeVisible()
  await selectByKeyboard(page.getByLabel('Simpul A elemen baru'), page, n2)
  await selectByKeyboard(page.getByLabel('Simpul B elemen baru'), page, n3)
  await addMemberBtn.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByText('ELEMEN: 2')).toBeVisible()

  // ── Point load: −10 kN on the mid node ──────────────────────────
  await selectByKeyboard(page.getByLabel('Simpul beban baru'), page, n2)
  await typeInto(page.getByLabel('Fy beban baru'), page, '-10')
  const addLoadBtn = page.getByRole('button', { name: 'Tambah Beban Titik' })
  await addLoadBtn.focus()
  await page.keyboard.press('Enter')

  const model2 = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), AUTOSAVE_KEY)
  expect(Object.keys(model2.members)).toHaveLength(2)
  expect(Object.keys(model2.loads)).toHaveLength(1)
  expect(Object.keys(model2.supports).sort()).toEqual([n1, n3].sort())

  // ── Analysis from the table view: same solver, tabular results ──
  const runBtn = page.getByRole('button', { name: 'Jalankan Analisis' })
  await runBtn.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByText(/klasifikasi VALID/).first()).toBeVisible()
  const resultsText = await page.locator('body').innerText()
  // Both supports carry +5.000 kN vertical reaction for a mid-span load.
  expect(resultsText.split('5.000').length - 1).toBeGreaterThanOrEqual(2)
  expect(pageErrors).toEqual([])
})
