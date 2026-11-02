import { test, expect, type Page } from '@playwright/test'

/**
 * Interactive Member Inspector.
 *
 * Sample 01 geometry (from its template): supports at x=-2.5 (pin)
 * and x=+2.5 (roller), loaded node at x=-0.5 with P=10 kN down.
 * Left member L=2 m, right member L=3 m. Statics: R_left=6, R_right=4;
 * bending moment at the loaded joint = 6·2 = 12 kN·m (sagging +),
 * growing linearly from 0 at the pin.
 *
 * Canvas interaction helpers: the status-bar X/Y readout reports
 * grid-snapped coordinates (0.5 m cells), so the pixel<->model
 * mapper is a least-squares fit over many hover probes (quantisation
 * averages out; member midpoints tolerate the residual error).
 * Node clicks use the snap-to-node plateau: pixels whose readout is
 * exactly the node's coordinates form a disk around the node.
 */

async function readXY(page: Page) {
  for (let i = 0; i < 12; i++) {
    const t = await page.locator('body').innerText()
    const mx = /X: (-?[\d.]+) m/.exec(t)
    const my = /Y: (-?[\d.]+) m/.exec(t)
    if (mx && my) return { x: parseFloat(mx[1]), y: parseFloat(my[1]) }
    await page.waitForTimeout(150)
  }
  throw new Error('status-bar X/Y readout not found')
}

/** Hover at a viewport point and read the readout once it has
 * stabilised (two consecutive equal readings after the move). */
async function probeAt(page: Page, x: number, y: number) {
  await page.mouse.move(x, y)
  await page.waitForTimeout(300)
  let prev = await readXY(page)
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(180)
    const cur = await readXY(page)
    if (cur.x === prev.x && cur.y === prev.y) return cur
    prev = cur
  }
  return prev
}

function fitLine(pts: { p: number; w: number }[]) {
  const n = pts.length
  const sp = pts.reduce((s, q) => s + q.p, 0)
  const sw = pts.reduce((s, q) => s + q.w, 0)
  const spp = pts.reduce((s, q) => s + q.p * q.p, 0)
  const spw = pts.reduce((s, q) => s + q.p * q.w, 0)
  const b = (n * spw - sp * sw) / (n * spp - sp * sp)
  const a = (sw - b * sp) / n
  return { a, b }
}

async function makeMapper(page: Page) {
  const canvas = page.locator('canvas').first()
  await page.waitForFunction(() => {
    const c = document.querySelector('canvas')
    return !!c && c.clientWidth > 200 && c.clientHeight > 200
  })
  // Panels above the canvas can push it partly below the fold;
  // bring it fully into view BEFORE calibrating so no probe or
  // click lands outside the viewport mid-calibration.
  await canvas.scrollIntoViewIfNeeded()
  await page.waitForTimeout(350)
  const box = (await canvas.boundingBox())!
  const probe = async (fx: number, fy: number) =>
    probeAt(page, box.x + box.width * fx, box.y + box.height * fy)
  const xPts: { p: number; w: number }[] = []
  for (const fx of [0.12, 0.26, 0.4, 0.54, 0.68, 0.82]) {
    const r = await probe(fx, 0.42)
    xPts.push({ p: box.x + box.width * fx, w: r.x })
  }
  const yPts: { p: number; w: number }[] = []
  for (const fy of [0.2, 0.38, 0.56, 0.74]) {
    const r = await probe(0.5, fy)
    yPts.push({ p: box.y + box.height * fy, w: r.y })
  }
  const fxFit = fitLine(xPts)
  let fyFit = fitLine(yPts)
  if (!Number.isFinite(fyFit.b) || Math.abs(fyFit.b) < 1e-9) {
    // Degenerate Y fit (e.g. all probes snapped to one row): the
    // canvas uses a uniform world scale, so derive Y from the X
    // scale (opposite sign — screen Y grows downward) anchored on
    // the middle probe.
    const mid = yPts[Math.floor(yPts.length / 2)]
    const b = -fxFit.b
    fyFit = { a: mid.w - b * mid.p, b }
  }
  if (!Number.isFinite(fxFit.b) || Math.abs(fxFit.b) < 1e-9) {
    throw new Error(`degenerate mapper fit: xPts=${JSON.stringify(xPts)} yPts=${JSON.stringify(yPts)}`)
  }
  return (mx: number, my: number) => ({
    x: (mx - fxFit.a) / fxFit.b,
    y: (my - fyFit.a) / fyFit.b,
  })
}

async function clickModel(page: Page, mx: number, my: number) {
  let toPx = await makeMapper(page)
  let p = toPx(mx, my)
  const canvas = page.locator('canvas').first()
  const box = (await canvas.boundingBox())!
  const vp = page.viewportSize()!
  if (
    p.x < box.x || p.x > box.x + box.width || p.y < box.y || p.y > box.y + box.height ||
    p.x < 0 || p.x > vp.width || p.y < 0 || p.y > vp.height
  ) {
    // Target sits outside the visible canvas (panels pushed it
    // below the fold): scroll it into view and recalibrate once.
    await canvas.scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    toPx = await makeMapper(page)
    p = toPx(mx, my)
  }
  await page.mouse.click(p.x, p.y)
  await page.waitForTimeout(350)
}

/** Click a node precisely via its snap-to-node readout plateau. */
async function clickNode(page: Page, tx: number, ty: number) {
  const toPx = await makeMapper(page)
  const est = toPx(tx, ty)
  const hits: { x: number; y: number }[] = []
  for (let dx = -36; dx <= 36; dx += 12) {
    for (let dy = -36; dy <= 36; dy += 12) {
      const r = await probeAt(page, est.x + dx, est.y + dy)
      if (Math.abs(r.x - tx) < 0.001 && Math.abs(r.y - ty) < 0.001) {
        hits.push({ x: est.x + dx, y: est.y + dy })
      }
    }
  }
  if (!hits.length) throw new Error(`node plateau not found for (${tx}, ${ty})`)
  const cx = hits.reduce((s, h) => s + h.x, 0) / hits.length
  const cy = hits.reduce((s, h) => s + h.y, 0) / hits.length
  await page.mouse.click(cx, cy)
  await page.waitForTimeout(350)
}

async function loadSample01(page: Page) {
  await page.goto('/')
  const card = page.locator('div').filter({ hasText: '01 · Balok Tumpuan Sederhana' }).last()
  await card.getByRole('button', { name: 'Muat contoh' }).click()
  await expect(page.getByText('SIMPUL: 3')).toBeVisible()
  const cont = page.getByRole('button', { name: 'Tetap Lanjutkan' })
  if (await cont.count()) await cont.click().catch(() => {})
  await page.getByRole('button', { name: 'Analisis', exact: true }).click()
  await expect(page.getByText('Animasi Deformasi')).toBeVisible()
}

const memberSection = (page: Page) =>
  page.locator('section').filter({ hasText: 'Inspektor Elemen' })

test.use({ viewport: { width: 1440, height: 1150 } })

test('member inspector: select, values, slider, switch, persist, clear, node', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (e) => pageErrors.push(e.message))
  await loadSample01(page)
  await expect(memberSection(page)).toHaveCount(0)

  // Select the LEFT member directly in the Analisis view
  // (midpoint x=-1.5, y=0; L=2 m).
  await clickModel(page, -1.5, 0)
  const sec = memberSection(page)
  await expect(sec).toBeVisible()
  await expect(sec).toContainText('2.000 m') // Panjang
  await expect(sec).toContainText('12.000') // M at the loaded joint (end B)
  // Default xi = 0.50 -> x = 1.000 m, M(x) = 6 kN x 1 m = 6.000 kN·m.
  await expect(sec).toContainText('6.000')

  // Keyboard: End -> xi = 1.00, M(x) = joint moment 12.000.
  const slider = sec.getByLabel('Posisi inspeksi sepanjang elemen')
  await slider.focus()
  await page.keyboard.press('End')
  await expect(sec).toContainText('1.00')
  await expect(sec).toContainText('12.000')
  // Home -> xi = 0, M(x) = pin-end moment ~ 0.
  await page.keyboard.press('Home')
  await expect(sec).toContainText('0.00')
  const secText = await sec.innerText()
  expect(/M\(x\)\s+-?0\.000/.test(secText)).toBeTruthy()

  // Switch to the RIGHT member (midpoint x=+1.0; L=3 m). xi is still
  // 0, so M(x) reads the joint moment again: 12.000.
  await clickModel(page, 1.0, 0)
  await expect(sec).toContainText('3.000 m')
  await expect(sec).toContainText('12.000')

  // Selection persists across RESULT-VIEW changes inside Analisis:
  // switch the displayed load case (Beban Mati -> Berat Sendiri);
  // the same member stays inspected, its numbers now come from the
  // newly displayed result.
  await page.getByRole('combobox').filter({ hasText: 'Beban Mati' }).click()
  await page.getByRole('option', { name: 'Berat Sendiri' }).click()
  await page.waitForTimeout(400)
  await expect(memberSection(page)).toBeVisible()
  await expect(memberSection(page)).toContainText('3.000 m')

  // Click empty canvas -> selection cleared, inspector disappears.
  await clickModel(page, 0, 2.5)
  await expect(memberSection(page)).toHaveCount(0)

  // Node inspector: clicking the loaded node itself (plateau scan
  // over its snap-to-node readout) inspects the node, not a member.
  await clickNode(page, -0.5, 0)
  const nodeSec = page.locator('section').filter({ hasText: 'Inspektor Simpul' })
  await expect(nodeSec).toBeVisible()
  await expect(nodeSec).toContainText('(-0.500, 0.000) m')
  await expect(page.getByText('SIMPUL: 3')).toBeVisible() // nothing deleted or added

  expect(pageErrors).toEqual([])
})

test('member inspector: no solver result -> honest unavailable message', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Nama proyek').fill('Uji Inspektor')
  await page.getByRole('button', { name: 'Buat & buka di editor' }).click()
  await page.getByRole('button', { name: 'Data Tabel' }).click()
  await expect(page.getByRole('heading', { name: /Data Tabel/ })).toBeVisible()

  const xIn = page.getByLabel('X simpul baru')
  const yIn = page.getByLabel('Y simpul baru')
  const addNodeBtn = page.getByRole('button', { name: 'Tambah Simpul' })
  await xIn.fill('0')
  await yIn.fill('0')
  await addNodeBtn.click()
  await xIn.fill('4')
  await yIn.fill('0')
  await addNodeBtn.click()

  const model = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('struktura:autosave:v1')!),
  )
  const nodeIds = Object.keys(model.nodes)
  expect(nodeIds).toHaveLength(2)
  await page.getByLabel('Simpul A elemen baru').selectOption(nodeIds[0])
  await page.getByLabel('Simpul B elemen baru').selectOption(nodeIds[1])
  await page.getByRole('button', { name: 'Tambah Elemen' }).click()
  await page.waitForTimeout(400)

  // No supports -> analysis cannot produce results for this member.
  await page.getByRole('button', { name: 'Analisis', exact: true }).click()
  await expect(page.getByText('Animasi Deformasi')).toBeVisible()
  // The unstable classification opens the "Peringatan analisis"
  // dialog over the editor; dismiss it before touching the canvas.
  const warnDialog = page.getByRole('dialog', { name: 'Peringatan analisis' })
  if (await warnDialog.count()) {
    await page.keyboard.press('Escape')
    await expect(warnDialog).toHaveCount(0)
  }
  await clickModel(page, 2, 0)
  const sec = memberSection(page)
  await expect(sec).toBeVisible()
  await expect(sec).toContainText('4.000 m')
  await expect(sec).toContainText('Hasil analisis tidak tersedia untuk elemen ini.')
})

test.describe('mobile viewport', () => {
  // Landscape phone — the orientation the app's own advisory modal
  // recommends for the editor on small screens.
  test.use({ viewport: { width: 915, height: 412 } })

  test('member inspector: panel usable on a phone-width viewport', async ({ page }) => {
    await loadSample01(page)
    await clickModel(page, -1.5, 0)
    const sec = memberSection(page)
    await expect(sec).toHaveCount(1)
    await sec.scrollIntoViewIfNeeded()
    await expect(sec).toBeVisible()
    await expect(sec).toContainText('2.000 m')
    await expect(sec).toContainText('12.000')
  })
})
