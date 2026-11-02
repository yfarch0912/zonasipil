import { test, expect, type Page } from '@playwright/test'

/**
 * Phase 6 — E2E workflow expansion. Every scenario drives the real
 * production build in a browser; engineering assertions read the LIVE
 * solver output rendered by the app (and, where geometry is created by
 * canvas clicks, the autosaved model in localStorage is read back so
 * expected reactions are computed from the ACTUAL built geometry by
 * statics — never from fixture text).
 */

const AUTOSAVE_KEY = 'struktura:autosave:v1'

async function openSample(page: Page, title: string, simpul: string) {
  await page.goto('/')
  const card = page.locator('div').filter({ hasText: title }).last()
  await card.getByRole('button', { name: 'Muat contoh' }).click()
  await expect(page.getByText(simpul)).toBeVisible()
}

/**
 * Calibrate mouse pixels → model coordinates using the editor's own
 * status-bar readout (X/Y follow the cursor). The canvas view re-fits
 * when panels change, so fixed pixel fractions are unreliable; this
 * mapper is derived fresh from the live view each time it is built.
 */
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

async function readAutosaveModel(page: Page) {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  }, AUTOSAVE_KEY)
}

/** Parse the Ringkasan reaction panel into { nodeId: Ry } numbers. */
async function ringkasanReactions(page: Page): Promise<Record<string, number>> {
  const text = await page.locator('body').innerText()
  const out: Record<string, number> = {}
  // Panel rows look like: "n1 | Rx | +0 kN | Ry | +6 kN | Mz | +0 kN·m"
  const rowRe = /(\S+)\s*\|\s*Rx\s*\|\s*([+-]?[\d.,]+) kN\s*\|\s*Ry\s*\|\s*([+-]?[\d.,]+) kN/g
  let m: RegExpExecArray | null
  while ((m = rowRe.exec(text.replace(/\n/g, ' | '))) !== null) {
    out[m[1]] = parseFloat(m[3].replace(',', '.'))
  }
  return out
}

test('sample 02 cantilever → analysis → reactions +50 kN / moment +125 kN·m', async ({ page }) => {
  await openSample(page, '02 · Balok Kantilever', 'SIMPUL: 2')
  await page.getByText('Analisis', { exact: true }).first().click()
  await expect(page.getByText('REAKSI', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Hasil analisis TIDAK MASUK AKAL SECARA FISIK')).toHaveCount(0)
  await page.getByRole('button', { name: 'Nonaktif' }).click() // Ringkasan on
  await expect(page.getByText('+50 kN', { exact: true })).toBeVisible()
  await expect(page.getByText('+125 kN·m', { exact: true })).toBeVisible()
})

test('build a simply supported beam from scratch → supports, load, live reactions match statics', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Nama proyek').fill('Uji Bangun Balok')
  await page.getByRole('button', { name: 'Buat & buka di editor' }).click()
  await expect(page.getByText('SIMPUL: 0')).toBeVisible()

  const canvas = page.locator('canvas').first()
  const box = (await canvas.boundingBox())!
  const y = box.y + box.height * 0.6
  const p1 = { x: box.x + box.width * 0.3, y }
  const p2 = { x: box.x + box.width * 0.6, y }
  const pmid = { x: box.x + box.width * 0.45, y }

  // Geometry: two nodes, one member, then a mid node that splits it.
  await page.getByText('SIMPUL', { exact: true }).first().click()
  await page.mouse.click(p1.x, p1.y)
  await page.mouse.click(p2.x, p2.y)
  await expect(page.getByText('SIMPUL: 2')).toBeVisible()
  await page.getByText('ELEMEN', { exact: true }).first().click()
  await page.mouse.click(p1.x, p1.y)
  await page.mouse.click(p2.x, p2.y)
  await expect(page.getByText('ELEMEN: 1')).toBeVisible()
  await page.getByText('SIMPUL', { exact: true }).first().click()
  await page.mouse.click(pmid.x, pmid.y)
  await expect(page.getByText('SIMPUL: 3')).toBeVisible()
  await expect(page.getByText('ELEMEN: 2')).toBeVisible()

  // Supports: pin at left node, roller at right node → determinate.
  await page.getByText('TUMPUAN', { exact: true }).first().click()
  await page.getByText('Sendi', { exact: true }).first().click()
  await page.mouse.click(p1.x, p1.y)
  await page.getByText('Rol', { exact: true }).first().click()
  await page.mouse.click(p2.x, p2.y)
  await expect(page.getByText('TERTENTU', { exact: true })).toBeVisible()

  // Loading: 10 kN downward point load on the mid node. The view
  // re-fits when the Beban panel opens, so locate the mid node from
  // the autosaved geometry through a freshly calibrated mapper.
  await page.getByText('Beban', { exact: true }).first().click()
  await page.getByText('TITIK', { exact: true }).first().click()
  const magnitude = page.locator('input:visible').first()
  await magnitude.fill('-10')
  const preLoad = await readAutosaveModel(page)
  const preNodes = Object.values(preLoad.nodes) as { id: string; x: number; y: number }[]
  const midNode = [...preNodes].sort((p, q) => p.x - q.x)[1]
  const toPx = await makeMapper(page)
  const midPx = toPx(midNode.x, midNode.y)
  await page.mouse.click(midPx.x, midPx.y)
  await page.waitForTimeout(500)
  const withLoad = await readAutosaveModel(page)
  expect(Object.keys(withLoad.loads).length).toBe(1)

  // Analysis: reactions must equal statics computed from the ACTUAL
  // autosaved geometry (grid snapping decides the exact span).
  await page.getByText('Analisis', { exact: true }).first().click()
  await expect(page.getByText('REAKSI', { exact: true }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Nonaktif' }).click()
  await page.waitForTimeout(500)

  const model = await readAutosaveModel(page)
  expect(model).not.toBeNull()
  const nodes = Object.values(model.nodes) as { id: string; x: number; y: number }[]
  const supports = model.supports as Record<string, { nodeId: string; type: string }>
  const supNodes = Object.values(supports).map((s) => nodes.find((n) => n.id === s.nodeId)!).sort((a, b) => a.x - b.x)
  type SavedLoad = { type: string; nodeId?: string; fy?: number }
  const load = (Object.values(model.loads) as SavedLoad[]).find((l) => l.type === 'point')!
  const loadNode = nodes.find((n) => n.id === load.nodeId)!
  const L = supNodes[1].x - supNodes[0].x
  const a = loadNode.x - supNodes[0].x
  const P = Math.abs(load.fy)
  const expLeft = (P * (L - a)) / L
  const expRight = (P * a) / L

  const got = await ringkasanReactions(page)
  const rys = Object.values(got)
  expect(rys.length).toBe(2)
  expect(Math.abs(Math.min(...rys) - Math.min(expLeft, expRight))).toBeLessThan(0.06)
  expect(Math.abs(Math.max(...rys) - Math.max(expLeft, expRight))).toBeLessThan(0.06)
  expect(Math.abs(rys.reduce((s, v) => s + v, 0) - P)).toBeLessThan(0.06)
})

test('material/section edit on sample 01 → derived properties update, reactions stay 6/4', async ({ page }) => {
  await openSample(page, '01 · Balok Tumpuan Sederhana', 'SIMPUL: 3')
  // The MATERIAL tool is a section-library editor: fields stay disabled
  // until "Ubah material" starts an edit; "Simpan perubahan" commits.
  await page.getByRole('button', { name: 'MATERIAL' }).click()
  await page.getByRole('button', { name: 'Ubah material' }).click()
  const inputs = page.locator('input:visible')
  await expect(inputs.nth(1)).toHaveValue('300') // b (mm)
  await inputs.nth(1).fill('400')
  await page.getByRole('button', { name: 'Simpan perubahan' }).click()
  await page.waitForTimeout(800)

  const model = await readAutosaveModel(page)
  const section = Object.values(model.sections)[0] as { derived?: { A?: number }; A?: number }
  const A = section.derived?.A ?? section.A!
  expect(Math.abs(A - 400 * 500)).toBeLessThan(1) // A = b·h updated live

  await page.getByText('Analisis', { exact: true }).first().click()
  await page.getByRole('button', { name: 'Nonaktif' }).click()
  await expect(page.getByText('+6 kN', { exact: true })).toBeVisible()
  await expect(page.getByText('+4 kN', { exact: true })).toBeVisible()
})

test('unstable model (no supports) → solver diagnostics surface, no fake results', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Nama proyek').fill('Uji Model Labil')
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
  await expect(page.getByText('TIDAK STABIL', { exact: true })).toBeVisible()

  await page.getByText('Analisis', { exact: true }).first().click()
  await page.waitForTimeout(800)
  const text = await page.locator('body').innerText()
  expect(/tidak stabil|tidak dapat diselesaikan|gagal|SINGULAR|labil/i.test(text)).toBe(true)
  expect(text).not.toContain('+6 kN')
})

test('invalid JSON import → error shown, no project opened', async ({ page }) => {
  await page.goto('/')
  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles({
    name: 'rusak.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{ini bukan json sama sekali'),
  })
  await page.waitForTimeout(800)
  const text = await page.locator('body').innerText()
  expect(/bukan JSON yang valid|gagal|tidak valid|error|tidak dapat/i.test(text)).toBe(true)
  await expect(page.getByLabel('Nama proyek')).toBeVisible() // still on dashboard
})

test('persistence: built model survives reload via autosave', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Nama proyek').fill('Uji Persistensi')
  await page.getByRole('button', { name: 'Buat & buka di editor' }).click()
  await expect(page.getByText('SIMPUL: 0')).toBeVisible()
  const canvas = page.locator('canvas').first()
  const box = (await canvas.boundingBox())!
  const y = box.y + box.height * 0.6
  await page.getByText('SIMPUL', { exact: true }).first().click()
  await page.mouse.click(box.x + box.width * 0.35, y)
  await page.mouse.click(box.x + box.width * 0.55, y)
  await expect(page.getByText('SIMPUL: 2')).toBeVisible()
  await page.waitForTimeout(1200) // autosave debounce

  await page.reload()
  await page.getByRole('button', { name: 'Buka editor (model saat ini)' }).click()
  await expect(page.getByText('SIMPUL: 2')).toBeVisible()
})

test('no external runtime requests; self-hosted fonts active', async ({ page }) => {
  const external: string[] = []
  page.on('request', (r) => {
    const u = new URL(r.url())
    if (u.hostname !== '127.0.0.1' && u.hostname !== 'localhost') external.push(r.url())
  })
  await openSample(page, '01 · Balok Tumpuan Sederhana', 'SIMPUL: 3')
  await page.getByText('Analisis', { exact: true }).first().click()
  await page.waitForTimeout(800)
  expect(external).toEqual([])
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready
    return { inter: document.fonts.check('16px Inter'), mono: document.fonts.check('12px "JetBrains Mono"') }
  })
  expect(fonts.inter).toBe(true)
  expect(fonts.mono).toBe(true)
})
