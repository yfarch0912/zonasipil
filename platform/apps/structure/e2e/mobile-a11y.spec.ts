import { test, expect, devices } from '@playwright/test'

/**
 * Phase 7 — mobile viewport + screen-reader semantics validation.
 * DOM- and layout-level evidence only: no claim of NVDA/JAWS/
 * VoiceOver testing (those tools are not available in this
 * environment; see docs/PHASE-7-ACCESSIBILITY-VALIDATION.md).
 */

const pixel7 = { ...devices['Pixel 7'] } as Record<string, unknown>
delete pixel7.defaultBrowserType

test.describe('mobile viewport (Pixel 7 emulation)', () => {
  test.use(pixel7)

  test('dashboard renders without page-level horizontal overflow', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Buat & buka di editor' })).toBeVisible()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)
  })

  test('editor + Data Tabel usable on a phone viewport; touch targets measured', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('div').filter({ hasText: '01 · Balok Tumpuan Sederhana' }).last()
    await card.getByRole('button', { name: 'Muat contoh' }).scrollIntoViewIfNeeded()
    await card.getByRole('button', { name: 'Muat contoh' }).tap()
    await expect(page.getByText('SIMPUL: 3')).toBeVisible()
    // The editor opens behind a full-screen "better on desktop"
    // advisory on small screens; a real user dismisses it first.
    const continueBtn = page.getByRole('button', { name: 'Tetap Lanjutkan' })
    if (await continueBtn.isVisible().catch(() => false)) await continueBtn.tap()
    await page.getByRole('button', { name: 'Data Tabel' }).scrollIntoViewIfNeeded()
    await page.getByRole('button', { name: 'Data Tabel' }).tap()
    await expect(page.getByRole('heading', { name: /Data Tabel/ })).toBeVisible()
    // The node table renders with real header cells on mobile too.
    await expect(page.locator('table').first().locator('th', { hasText: 'Tumpuan' })).toBeVisible()

    // Touch targets: the Data Tabel editor's own controls must meet
    // the WCAG 2.5.8 (AA) 24px minimum. The global smallest target is
    // measured and logged as evidence — Phase 7 found the status-bar
    // STATUS pill is 16px tall (recorded as finding F7 in the
    // validation doc, not asserted here).
    const measure = (scope: string) =>
      page.evaluate((sel) => {
        const root = sel ? document.querySelector(sel)! : document
        const out: { w: number; h: number; label: string }[] = []
        root.querySelectorAll('button').forEach((b) => {
          const r = b.getBoundingClientRect()
          if (r.width > 0 && r.height > 0) {
            out.push({ w: r.width, h: r.height, label: (b.textContent ?? '').trim().slice(0, 24) })
          }
        })
        return out
      }, scope)
    const all = await measure('')
    const inMain = await measure('main')
    const globalSmallest = all.reduce((a, b) => (a.h <= b.h ? a : b))
    console.log(
      `touch targets: global n=${all.length} smallest=${globalSmallest.h}px (${globalSmallest.label}); ` +
        `Data Tabel main n=${inMain.length} smallest=${Math.min(...inMain.map((s) => s.h))}px`,
    )
    expect(inMain.length).toBeGreaterThan(5)
    expect(Math.min(...inMain.map((s) => s.h))).toBeGreaterThanOrEqual(24)
  })

  test('200%-equivalent narrow layout: 320px viewport keeps dashboard operable', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 })
    await page.goto('/')
    await expect(page.getByLabel('Nama proyek')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Buat & buka di editor' })).toBeVisible()
  })
})

test.describe('screen-reader semantics (DOM inspection)', () => {
  test('landmarks and heading structure on dashboard and Data Tabel', async ({ page }) => {
    await page.goto('/')
    const dash = await page.evaluate(() => ({
      header: document.querySelectorAll('header').length,
      main: document.querySelectorAll('main').length,
      h1: document.querySelectorAll('h1').length,
    }))
    expect(dash.header).toBeGreaterThanOrEqual(1)

    const card = page.locator('div').filter({ hasText: '01 · Balok Tumpuan Sederhana' }).last()
    await card.getByRole('button', { name: 'Muat contoh' }).click()
    await expect(page.getByText('SIMPUL: 3')).toBeVisible()
    const editor = await page.evaluate(() => ({
      nav: document.querySelectorAll('nav').length,
      main: document.querySelectorAll('main').length,
      aside: document.querySelectorAll('aside').length,
    }))
    expect(editor.main).toBe(1)
    expect(editor.aside).toBeGreaterThanOrEqual(1)

    await page.getByRole('button', { name: 'Data Tabel' }).click()
    const tables = await page.evaluate(() =>
      Array.from(document.querySelectorAll('table')).map((t) => t.querySelectorAll('th').length),
    )
    expect(tables.length).toBeGreaterThanOrEqual(3)
    expect(tables.every((n) => n >= 3)).toBe(true)
  })

  test('analysis issues dialog: role=dialog, focus moves in, Escape closes', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Nama proyek').fill('Uji Dialog')
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
    await page.getByText('Analisis', { exact: true }).first().click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    const focusInside = await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"]')
      return !!d && (d === document.activeElement || d.contains(document.activeElement))
    })
    expect(focusInside).toBe(true)
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })
})
