import { test, expect } from '@playwright/test'

/**
 * Phase 6 — automated accessibility checks (a subset of the audit in
 * docs/PHASE-6-ACCESSIBILITY-AUDIT.md; manual findings there are not
 * duplicated here). These checks verify mechanically testable
 * properties of the real production build: accessible names, labelled
 * inputs, keyboard reachability with a visible focus indicator,
 * Escape dismissal of flyout panels, zoom not disabled, text contrast
 * of the primary UI text, and reduced-motion rendering.
 */

test('dashboard: every button has an accessible name; every input is labelled', async ({ page }) => {
  await page.goto('/')
  const unnamed = await page.evaluate(() => {
    const bad: string[] = []
    document.querySelectorAll('button').forEach((b) => {
      const name = (b.getAttribute('aria-label') || b.textContent || '').trim()
      if (!name) bad.push(b.outerHTML.slice(0, 80))
    })
    return bad
  })
  expect(unnamed).toEqual([])
  const unlabelled = await page.evaluate(() => {
    const bad: string[] = []
    document.querySelectorAll('input, select, textarea').forEach((el) => {
      if ((el as HTMLInputElement).type === 'hidden') return
      const labelled =
        el.closest('label') !== null ||
        (el.id !== '' && document.querySelector(`label[for="${el.id}"]`) !== null) ||
        el.hasAttribute('aria-label') ||
        el.hasAttribute('aria-labelledby')
      if (!labelled) bad.push(el.outerHTML.slice(0, 80))
    })
    return bad
  })
  expect(unlabelled).toEqual([])
})

test('zoom is not disabled by the viewport meta', async ({ page }) => {
  await page.goto('/')
  const content = await page.locator('meta[name="viewport"]').getAttribute('content')
  expect(content).not.toContain('user-scalable=no')
  expect(content).not.toContain('maximum-scale=1')
})

test('keyboard: Tab reaches controls and focus is visible', async ({ page }) => {
  await page.goto('/')
  let sawVisibleFocus = false
  for (let i = 0; i < 12 && !sawVisibleFocus; i++) {
    await page.keyboard.press('Tab')
    sawVisibleFocus = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null
      if (!el || el === document.body) return false
      const s = getComputedStyle(el)
      return s.outlineStyle !== 'none' || s.boxShadow !== 'none'
    })
  }
  expect(sawVisibleFocus).toBe(true)
})

test('editor flyout: Escape dismisses the support panel', async ({ page }) => {
  await page.goto('/')
  const card = page.locator('div').filter({ hasText: '01 · Balok Tumpuan Sederhana' }).last()
  await card.getByRole('button', { name: 'Muat contoh' }).click()
  await expect(page.getByText('SIMPUL: 3')).toBeVisible()
  await page.getByText('TUMPUAN', { exact: true }).first().click()
  await expect(page.getByText('Kondisi Batas')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByText('Kondisi Batas')).toHaveCount(0)
})

test('primary text contrast meets WCAG AA ratio (>= 4.5) on dashboard', async ({ page }) => {
  await page.goto('/')
  const ratio = await page.evaluate(() => {
    const lum = (r: number, g: number, b: number) => {
      const f = (v: number) => {
        const s = v / 255
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
      }
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
    }
    const parse = (css: string) => {
      const m = css.match(/[\d.]+/g)!.map(Number)
      return { r: m[0], g: m[1], b: m[2] }
    }
    // Effective background: body's own background is transparent in
    // this app (the dashboard root div paints it), so walk up from a
    // real text element to the first non-transparent ancestor.
    const heading = [...document.querySelectorAll('*')].find((e) => e.textContent === 'Proyek contoh (edukasi, terverifikasi)')!
    let bgEl: HTMLElement | null = heading as HTMLElement
    while (bgEl && (getComputedStyle(bgEl).backgroundColor === 'rgba(0, 0, 0, 0)' || getComputedStyle(bgEl).backgroundColor === 'transparent')) bgEl = bgEl.parentElement
    const fg = parse(getComputedStyle(heading).color)
    const bg = parse(getComputedStyle(bgEl!).backgroundColor)
    const l1 = lum(fg.r, fg.g, fg.b)
    const l2 = lum(bg.r, bg.g, bg.b)
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
  })
  expect(ratio).toBeGreaterThanOrEqual(4.5)
})

test('reduced motion: app renders fully with prefers-reduced-motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByText('Proyek contoh (edukasi, terverifikasi)')).toBeVisible()
  const card = page.locator('div').filter({ hasText: '01 · Balok Tumpuan Sederhana' }).last()
  await card.getByRole('button', { name: 'Muat contoh' }).click()
  await expect(page.getByText('SIMPUL: 3')).toBeVisible()
})
