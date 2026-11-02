import { test, expect, type Page } from '@playwright/test'

/**
 * Phase 7 — GESER SIMPUL drag-move coverage (the Phase 6 gap).
 * Drags sample 01's loaded node from x=2 m to x=3 m on the canvas
 * using a mapper calibrated from the editor's own status-bar readout,
 * then verifies: the autosaved coordinates changed, the connected
 * member lengths changed, and the re-run solver's reactions match the
 * new statics (load now 3 m from the left support of a 5 m beam:
 * R_left = 10·(5−3)/5 = 4 kN, R_right = 10·3/5 = 6 kN — the mirror of
 * the original 6/4).
 */

const AUTOSAVE_KEY = 'struktura:autosave:v1'

async function makeMapper(page: Page) {
  const canvas = page.locator('canvas').first()
  const box = (await canvas.boundingBox())!
  const readXY = async () => {
    const t = await page.locator('body').innerText()
    return {
      x: parseFloat(/X: (-?[\d.]+) m/.exec(t)![1]),
      y: parseFloat(/Y: (-?[\d.]+) m/.exec(t)![1]),
    }
  }
  const px = async (fx: number, fy: number) => {
    await page.mouse.move(box.x + box.width * fx, box.y + box.height * fy)
    await page.waitForTimeout(180)
    return readXY()
  }
  const a = await px(0.3, 0.5)
  const b = await px(0.7, 0.5)
  const c = await px(0.7, 0.8)
  const sx = (b.x - a.x) / (box.width * 0.4)
  const sy = (c.y - b.y) / (box.height * 0.3)
  return (mx: number, my: number) => ({
    x: box.x + box.width * 0.3 + (mx - a.x) / sx,
    y: box.y + box.height * 0.5 + (my - a.y) / sy,
  })
}

test('GESER SIMPUL: drag loaded node 2 m → 3 m, geometry and reactions follow', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (e) => pageErrors.push(e.message))

  await page.goto('/')
  const card = page.locator('div').filter({ hasText: '01 · Balok Tumpuan Sederhana' }).last()
  await card.getByRole('button', { name: 'Muat contoh' }).click()
  await expect(page.getByText('SIMPUL: 3')).toBeVisible()

  const before = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), AUTOSAVE_KEY)
  const loadedNode = Object.values(before.loads).find((l: { type: string }) => l.type === 'point') as { nodeId: string }
  const nodeBefore = before.nodes[loadedNode.nodeId]
  // Sample 01's actual geometry (from its template): span 5 m centred
  // on the origin — supports at x=-2.5 / +2.5, load node at x=-0.5
  // (2 m from the left support). The drag target is 3 m from the left
  // support: x = +0.5.
  const supportXs = (Object.values(before.supports) as { nodeId: string }[])
    .map((s) => (before.nodes[s.nodeId] as { x: number }).x)
    .sort((a, b) => a - b)
  expect(supportXs[1] - supportXs[0]).toBe(5)
  expect(nodeBefore.x - supportXs[0]).toBe(2)
  const targetX = supportXs[0] + 3

  await page.getByRole('button', { name: /GESER/ }).click()
  await page.waitForTimeout(400)
  // The move-node flyout offers "coordinates" and "screen" modes; make
  // sure screen (drag) mode is active if a mode switch is presented.
  const flyoutText = await page.locator('body').innerText()
  if (/Mode/.test(flyoutText)) {
    const screenBtn = page.getByRole('button', { name: /layar|screen/i }).first()
    if (await screenBtn.count()) await screenBtn.click().catch(() => {})
  }

  const toPx = await makeMapper(page)
  const from = toPx(nodeBefore.x, nodeBefore.y)
  const to = toPx(targetX, nodeBefore.y)
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(to.x, to.y, { steps: 12 })
  await page.mouse.up()
  await page.waitForTimeout(800)

  const after = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), AUTOSAVE_KEY)
  const nodeAfter = after.nodes[loadedNode.nodeId]
  expect(Math.abs(nodeAfter.x - targetX)).toBeLessThan(0.01)
  expect(Math.abs(nodeAfter.y - nodeBefore.y)).toBeLessThan(0.01)

  // Connected member geometry changed: lengths are now 3 m and 2 m.
  const nodes = after.nodes as Record<string, { x: number; y: number }>
  const lengths = Object.values(after.members)
    .map((m) => {
      const a = nodes[(m as { a: string }).a]
      const b = nodes[(m as { b: string }).b]
      return Math.hypot(b.x - a.x, b.y - a.y)
    })
    .sort((p, q) => p - q)
  expect(lengths).toEqual([2, 3])

  // Re-run analysis: reactions swap to 4 / 6 kN per the new statics.
  await page.getByText('Analisis', { exact: true }).first().click()
  await page.getByRole('button', { name: 'Nonaktif' }).click()
  await expect(page.getByText('+4 kN', { exact: true })).toBeVisible()
  await expect(page.getByText('+6 kN', { exact: true })).toBeVisible()
  expect(pageErrors).toEqual([])
})
