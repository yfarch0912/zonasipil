# Audit & Baseline — Monorepo ZonaSipil

Tanggal audit: Senin, 2 November 2026
Lingkup: audit read-only atas tiga sumber untuk baseline monorepo baru
`~/workspace/zonasipil-platform/`. Tidak ada file sumber yang diubah dalam
audit ini. Tidak ada perintah git yang dijalankan. Tidak ada build dan
tidak ada uji e2e yang dijalankan; satu-satunya perintah eksekusi adalah
unit test Zona Structure (lihat §2.2).

Sumber yang diaudit:

1. `~/workspace/zonasipil/` — situs statis LIVE (sumber deploy produksi).
2. `~/workspace/zonasipil-structure/` — aplikasi Zona Structure (migrasi STRUKTURA).
3. `~/workspace/struktura/` — repo asal STRUKTURA (referensi sekilas).

Setiap angka di dokumen ini berasal dari perintah yang benar-benar
dijalankan pada tanggal audit (`ls`, `find`, `grep`, `cat`, `sha256sum`,
dan `npm test` untuk unit test saja), kecuali bagian yang secara eksplisit
ditandai sebagai *catatan historis*.

---

## 1. Sumber 1 — `~/workspace/zonasipil/` (situs statis LIVE)

### 1.1 Struktur folder utama

Isi tingkat atas hasil `ls -1` (31 entri):

- File: `404.html`, `AGENTS.md`, `README.md`, `ZONASIPIL-SEMUA-DOKUMEN.md`,
  `favicon.ico`, `index.html`, `package.json`, `package-lock.json`,
  `robots.txt`, `sitemap.xml`, `tsconfig.json`, `tsconfig.tsbuildinfo`,
  `vite.config.ts`
- Folder: `api/`, `apps/`, `artikel/`, `assets/`, `catalogue/`, `css/`,
  `dashboard/`, `dist/`, `docs/`, `forgot-password/`, `js/`, `legacy-v1/`,
  `login/`, `node_modules/`, `public/`, `qa/`, `qa-v2/`, `register/`, `src/`

Folder pendukung yang perlu dicatat:

- `api/` — fungsi serverless auth: `api/_lib.js` dan `api/auth/` berisi
  `register.js`, `login.js`, `logout.js`, `me.js`, `forgot.js`, `reset.js`,
  `google.js`, serta `google/callback.js`.
- `assets/` — `brand/` (logo.svg), `images/` (termasuk `images/artikel/`),
  `video/` (segmen showreel `s1`–`s4`).
- `css/` — hanya `style.css`. `js/` — hanya `main.js`.
- `catalogue/` — `README.md`, `products.json`, `validate.mjs`.
- `docs/` — dokumen arsitektur/validasi (antara lain
  `ZONASIPIL-PRODUCT-ARCHITECTURE.md`, `CUBERTO-REFERENCE-ANALYSIS.md`,
  `ENGINEERING-VALIDATION-POLICY.md`) dan `docs/skills/`.
- `qa/` dan `qa-v2/` — artefak QA.
- `public/` — aset publik untuk workstream Vite/React (lihat §1.4).

### 1.2 Rute / halaman

Rute yang ada sebagai file/folder di sumber:

| Rute | Sumber di repo |
|---|---|
| `/` (beranda) | `index.html` (71.445 byte saat audit) |
| `/404` | `404.html` |
| `/artikel/` (indeks) | `artikel/index.html` |
| `/artikel/<slug>/` | 23 folder artikel, masing-masing berisi `index.html` (dihitung dengan `ls -d artikel/*/ \| wc -l` = **23**) |
| `/apps/` (katalog) | `apps/index.html` |
| `/apps/<slug>/` | 17 folder aplikasi (lihat §1.3) |
| `/login/` | `login/index.html` |
| `/register/` | `register/index.html` |
| `/forgot-password/` | `forgot-password/index.html` |
| `/dashboard/` | `dashboard/index.html` |

Generator artikel: `artikel/build_artikel.py`; stylesheet artikel:
`artikel/artikel.css`.

`sitemap.xml` berisi **47 URL** (dihitung dengan
`grep -o "<loc>[^<]*" sitemap.xml | wc -l` = 47), terdiri dari: beranda,
indeks artikel, katalog apps, 23 URL artikel, 17 URL `/apps/<slug>/`,
serta `/login/`, `/register/`, `/forgot-password/`, `/dashboard/`.

### 1.3 Katalog aplikasi — `apps/build_apps.py`

`apps/build_apps.py` adalah generator Python (dijalankan dari root repo:
`python3 apps/build_apps.py`) yang menghasilkan `apps/index.html`
(katalog), halaman detail `apps/<slug>/index.html`, dan 4 halaman akun
(`login/`, `register/`, `forgot-password/`, `dashboard/`).

Pengecualian penting di fungsi `main()` generator tersebut: slug
`structure` **dilewati** (`continue`) dan halaman detailnya tidak
ditulis ulang, dengan komentar di kode bahwa `/apps/structure/` dilayani
oleh aplikasi Zona Structure itu sendiri (diintegrasikan 2026-11-02).
Aplikasi tersebut tetap tercantum di katalog.

Daftar `APPS` di file tersebut berisi tepat **17 aplikasi**. Label status
menurut kamus `STATUS_LABEL` di file yang sama: `available` → AVAILABLE,
`beta` → BETA, `development` → IN DEVELOPMENT, `soon` → COMING SOON.

| # | Slug | Nama | Kategori (`cat`) | Status mentah | Label status |
|---|---|---|---|---|---|
| 1 | `structure` | Zona Structure | structural | beta | BETA |
| 2 | `concrete` | Zona Concrete | structural | development | IN DEVELOPMENT |
| 3 | `steel` | Zona Steel | structural | soon | COMING SOON |
| 4 | `foundation` | Zona Foundation | structural | soon | COMING SOON |
| 5 | `rab` | Zona RAB | construction | soon | COMING SOON |
| 6 | `quantity` | Zona Quantity | construction | soon | COMING SOON |
| 7 | `project` | Zona Project | construction | soon | COMING SOON |
| 8 | `calculator` | Zona Calculator | utilities | available | AVAILABLE |
| 9 | `survey` | Zona Survey | utilities | soon | COMING SOON |
| 10 | `road` | Zona Road | utilities | soon | COMING SOON |
| 11 | `bridge` | Zona Bridge | utilities | soon | COMING SOON |
| 12 | `plan` | Zona Plan | architecture | soon | COMING SOON |
| 13 | `bim` | Zona BIM | architecture | soon | COMING SOON |
| 14 | `academy` | Zona Academy | learning | soon | COMING SOON |
| 15 | `simulator` | Zona Simulator | learning | soon | COMING SOON |
| 16 | `report` | Zona Report | documents | soon | COMING SOON |
| 17 | `library` | Zona Library | documents | soon | COMING SOON |

Ringkasan status jujur: **1 AVAILABLE** (Zona Calculator),
**1 BETA** (Zona Structure), **1 IN DEVELOPMENT** (Zona Concrete),
**14 COMING SOON**. Ke-17 folder slug tersebut benar-benar ada di
`apps/` saat audit, masing-masing berisi `index.html`. File pendukung
katalog: `apps/apps.css`, `apps/apps.js`, `apps/auth.js`.

Catatan ketidaksinkronan: docstring di kepala `build_apps.py` masih
menulis bahwa backend akun "belum ada" dan formulir tidak mengirim data,
padahal folder `api/auth/` (§1.1) sudah berisi implementasi
register/login/logout/me/forgot/reset dan login Google. Docstring
tersebut tidak mencerminkan keadaan folder `api/` saat audit.

### 1.4 Kalkulator live — konfirmasi dari kode sumber

Kalkulator berada di seksi `#kalkulator` pada `index.html` dan logikanya
di `js/main.js`, seksi 10 `initZonaSipilCalculators()`
(komentar di kode: "10. ZONASIPIL CALCULATORS (Volume Beton & Berat
Tulangan)"). Kedua rumus yang ditanyakan **terkonfirmasi**:

1. **Volume beton** — tampilan rumus di `index.html` baris 768:
   `V = p × l × t × n` (p = panjang m, l = lebar m, t = tinggi m,
   n = jumlah elemen sejenis).
   Implementasi di `js/main.js`:

   ```js
   // Volume beton: V = p x l x t x n; cadangan (%) adalah asumsi pengguna
   const bersih = num(els.inP) * num(els.inL) * num(els.inT) * num(els.inN);
   let waste = parseFloat(els.inW.value) || 0;
   if (waste < 0) waste = 0;
   outVolNet.textContent = fmt(bersih, 2) + ' m³';
   outVol.textContent = fmt(bersih * (1 + waste / 100), 2) + ' m³';
   ```

   Jadi volume dengan cadangan/waste adalah
   `V_total = p × l × t × n × (1 + waste%/100)`, dengan waste negatif
   dipotong menjadi 0. Input waste (`inW`) tampil di `index.html`
   baris 779–780 dengan nilai awal 5%.

2. **Berat besi / tulangan** — tampilan rumus di `index.html` baris 788:
   `w = 0,006165 × d²` (d = diameter nominal mm, w dalam kg/m).
   Implementasi di `js/main.js`:

   ```js
   // Berat tulangan: w = 0,006165 x d^2 (kg/m), dari pi/4 x d^2 x 7.850 kg/m3
   const d = num(els.inD);
   const wm = 0.006165 * d * d;
   outWm.textContent = fmt(wm, 3) + ' kg/m';
   outW.textContent = fmt(wm * num(els.inLen), 1) + ' kg';
   ```

   Jadi berat per meter `w = 0,006165 × d²` dan berat total adalah
   `w × panjang total (inLen)`. Konstanta diturunkan di komentar kode
   dari π/4 × d² × 7.850 kg/m³.

Di `index.html` (baris 801–803) hasil kalkulator diberi keterangan
sebagai estimasi konseptual untuk belajar dan pemeriksaan awal, bukan
pengganti perhitungan desain oleh insinyur struktur yang berwenang.

### 1.5 Folder lain: `src/`, `dist/`, `legacy-v1/`

Ketiganya **bukan bagian dari situs statis live** di atas dan dicatat
terpisah:

- `src/` + `dist/` + `package.json`/`vite.config.ts`/`tsconfig.json` —
  workstream React terpisah (rekreasi Cuberto-level). `package.json` di
  root `zonasipil/`: nama `zonasipil-web`, versi `2.0.0`, `private: true`;
  stack React ^19.1.0, Vite ^6.3.0, TypeScript ^5.8.0, Tailwind CSS
  ^4.1.0, GSAP ^3.12.5, Lenis ^1.1.14, Three ^0.170.0. `src/` berisi
  `App.tsx`, `main.tsx`, `index.css`, `components/`, `sections/`, `lib/`.
  `vite.config.ts` mengatur `build.outDir: 'dist'`; `dist/` berisi hasil
  build (`index.html`, `assets/`, `brand/`, `engineering/`, `icons/`).
- `legacy-v1/` — salinan situs statis v1 yang dipertahankan
  (`index.html`, `contoh-landing.html`, `assets/`). Menurut `AGENTS.md`
  di repo ini, v1 adalah situs produksi sampai ada persetujuan deploy
  terpisah untuk v2 — pernyataan file tersebut dicatat apa adanya.

---

## 2. Sumber 2 — `~/workspace/zonasipil-structure/` (Zona Structure)

### 2.1 Identitas dan stack

Dari `package.json`:

- Nama: `zonasipil-structure`, versi `1.0.0`, lisensi MIT,
  `"type": "module"`.
- Deskripsi menyatakan: aplikasi analisis & desain struktur web
  (solver 2D Direct Stiffness, cek beton SNI 2847:2019 + baja
  SNI 1729:2020), dimigrasi dari STRUKTURA 1.0.0 (MIT); atribusi di
  `NOTICE` dan `docs/MIGRATION-RECORD.md`.
- Scripts: `dev` (`vite -c config/vite.config.ts`), `build`
  (`tsc -b config/tsconfig.json && vite -c config/vite.config.ts build`),
  `preview`, `lint`, `format`, `format:check`,
  `test` (`vitest run -c config/vitest.config.ts`), `test:watch`,
  `test:e2e` (`playwright test -c config/playwright.config.ts`).
  Semua config berada di folder `config/`, bukan root.
- Dependensi utama: React ^19 / react-dom ^19, Radix UI (dialog, label,
  popover, select, separator, slot, toast, toggle, toggle-group,
  tooltip), `lucide-react` ^0.564.0, `clsx`, `tailwind-merge`,
  `class-variance-authority`, `autoprefixer`.
- Dev-dependensi: Vite ^6.2.0, TypeScript 5.7.3, Vitest ^3.2.7,
  Playwright ^1.64.1 (`@playwright/test`), Tailwind CSS ^4.2.0,
  ESLint ^10.2.0, Prettier ^3.8.2.

Struktur `src/`: `App.tsx`, `main.tsx`, `globals.css`, `vite-env.d.ts`,
dan folder `canvas/`, `components/`, `engine/`, `hooks/`, `platform/`,
`shared/`, `struktura/`, `tabs/`, `templates/`, `visualization/`.
Perbedaan penting terhadap repo asal: kode engine/solver berada di
`src/engine/` (di STRUKTURA berada di `src/lib/`).

Dari `zonasipil.app.json` (dibaca verbatim):

```json
{"appId":"structure","appName":"ZonaSipil Structure","appVersion":"1.0.0","minimumPlatformVersion":"0.1.0","productCode":"ZS-STRUCTURE","requiredLicense":"full","supportedFeatures":["calculators","analysis-2d","design-rc-subset","design-steel-subset","report-export","project-import-export"]}
```

### 2.2 Baseline test — dijalankan nyata

Perintah yang dijalankan persis seperti yang diminta (hanya unit test;
`npm run build` **tidak** dijalankan karena menulis `dist/`, dan e2e
**tidak** dijalankan):

```bash
cd ~/workspace/zonasipil-structure && npm test 2>&1 | tail -30
```

Hasil akhir persis dari keluaran perintah tersebut:

```
 Test Files  28 passed (28)
      Tests  237 passed (237)
   Duration  15.29s (transform 4.89s, setup 0ms, collect 12.81s, tests 2.76s, environment 13ms, prepare 8.97s)
```

Artinya: **28 file test, 237 test lulus, 0 test gagal**.
Jumlah file test juga cocok dengan hitungan filesystem:
`find tests -name "*.test.*" | wc -l` = **28**, tersebar di
`tests/benchmarks/` (3 file), `tests/integration/` (2 file),
`tests/regression/` (19 file), dan `tests/unit/` (4 file).
Folder `e2e/` berisi 10 file `*.spec.ts` (Playwright) yang tidak
dijalankan dalam audit ini.

### 2.3 Hash solver (`src/engine`)

Perintah yang dijalankan:

```bash
find ~/workspace/zonasipil-structure/src/engine -type f | sort | xargs sha256sum | sha256sum
```

Hasil:

```
00a869e1ed3426ad4741ac4f80712b8910244fdb868df54f14d931dedf6f926a  -
```

- Jumlah file di `src/engine/`: **61 file**
  (`find src/engine -type f | wc -l`).
- Awalan hash hasil hitungan adalah `00a869e1`, yang **tidak cocok**
  dengan catatan awalan `ca5a9240`. Ketidakcocokan ini dicatat apa
  adanya; penyebabnya tidak ditelusuri dalam audit ini dan tidak
  dikarang. Untuk baseline monorepo, hash yang berlaku adalah hash
  hasil hitungan di atas, bukan `ca5a9240`.

### 2.4 Catatan migrasi — `docs/MIGRATION-RECORD.md`

Ringkasan isi file tersebut (tanggal migrasi 2026-11-01, keputusan
pengguna 2026-11-01):

- Sumber: STRUKTURA 1.0.0 (MIT), folder lokal `~/workspace/struktura/`,
  repo `yfarch0912/software-perhitungan-struktur`. Snapshot diambil
  dari HEAD `77fd6e1bf537c18fff0e0e253deda63973e80102` (branch
  `feature/struktura-engineering-platform`) ditambah working tree-nya
  (satu perubahan belum ter-commit pada `docs/AUDIT_CYCLE.md`):
  219 file, 2,8 MB, di luar `.git`, `node_modules`, dan `dist`.
  Folder/repo asal dinyatakan tidak diubah oleh migrasi.
- Yang berubah di salinan: identitas paket menjadi
  `zonasipil-structure`; judul/meta halaman, wordmark, header laporan
  (`ZonaSipil Structure 1.0.0 · engine STRUKTURA 1.0.0`); Vite `base`
  dari `/software-perhitungan-struktur/` menjadi `/`; workflow GitHub
  Pages asal dihapus; ditambahkan permukaan integrasi platform
  (`zonasipil.app.json`, `src/platform/metadata.ts`, fixture lisensi
  di `fixtures/licenses/`, test kontrak `tests/platform-metadata.test.ts`,
  `docs/STATUS-MATRIX.md`, `AGENTS.md` repo).
- Yang sengaja tidak berubah: kode engineering dan numerik (solver,
  cek desain, sampel, benchmark, test dinyatakan byte-identical di luar
  string yang terlihat); kunci localStorage (`struktura:projects:v1`
  dsb.) dan skema ekspor `struktura-project`; `LICENSE` (MIT) dan
  `NOTICE` (atribusi hulu OpenAnstruk-2D) dibawa verbatim.
- Utang yang dicatat terbuka: ikon `lucide-react` belum diganti sprite
  SVG ZonaSipil; mode kalkulator mandiri dan 3D belum ada; integrasi
  lisensi/auth nyata belum ada (fixture saja).
- Verifikasi migrasi menurut file tersebut adalah suite test penuh dan
  build produksi salinan hasil migrasi; tidak ada repo GitHub yang
  dibuat, tidak ada push, dan tidak ada deploy sebagai bagian dari
  migrasi.

### 2.5 Status jujur — `docs/STATUS-MATRIX.md`

Ringkasan file tersebut (terakhir diperbarui 2026-11-01, saat migrasi;
kosakata status: PASS / FAIL / INCOMPLETE / UNVERIFIED / UNSUPPORTED /
NOT_EVALUATED; rincian per ketentuan ada di
`docs/SNI_IMPLEMENTATION_MATRIX.md` yang dinyatakan sebagai catatan
engineering otoritatif):

| Kemampuan | Status menurut STATUS-MATRIX.md |
|---|---|
| Analisis rangka/truss 2D (Direct Stiffness, Euler–Bernoulli + jalur Timoshenko) | PASS (engine, suite pra-migrasi) |
| Reaksi, diagram geser/momen/aksial, lendutan | PASS |
| Kombinasi beban — preset LRFD SNI 1727:2020 Pasal 2.3.2 | PASS (ketentuan itu saja); kombinasi ASD = UNSUPPORTED |
| Cek desain beton — subset SNI 2847:2019 (lentur/geser balok, detailing, kolom P–M parsial) | INCOMPLETE (subset); pelat dua arah, dinding, fondasi, torsi = UNSUPPORTED |
| Cek desain baja — subset SNI 1729:2020 (klasifikasi, tarik, tekan, lentur sumbu kuat, geser, gabungan) | INCOMPLETE (subset); lentur sumbu lemah dan sambungan = UNSUPPORTED |
| Verdict desain seismik | UNVERIFIED; pembangkitan hazard/spektrum = UNSUPPORTED |
| Mode Kalkulator Mandiri (form balok/kolom/pelat/fondasi/tangga) | UNSUPPORTED — belum ada di produk hasil migrasi |
| Analisis 3D & visualisasi 3D / animasi deformasi | UNSUPPORTED — produk hanya 2D |
| Peta warna utilisasi standar platform (hijau ≤0,70 / kuning ≤1,00 / merah >1,00) | NOT_EVALUATED — overlay standar platform belum diimplementasikan |
| Ekspor laporan perhitungan (level layan, tak terfaktor) | PASS (sesuai judulnya) — laporan berjudul "Laporan Hasil Analisis Layan (Tak Terfaktor)" dengan banner eksplisit bahwa laporan itu bukan laporan desain/kepatuhan |
| Impor/ekspor proyek, autosave, fingerprinting | PASS (skema `struktura-project` v1 dipertahankan) |
| Integrasi lisensi platform | NOT_EVALUATED — fixture pengembangan saja |
| Akun / sinkronisasi proyek cloud | UNSUPPORTED — proyek bersifat lokal (localStorage + ekspor file) |

---

## 3. Sumber 3 — `~/workspace/struktura/` (repo asal, sekilas)

Dibaca read-only, tidak disentuh, hanya sebagai referensi asal migrasi:

- `package.json`: nama `struktura`, versi `1.0.0`, lisensi MIT,
  `"type": "module"`. Deskripsi: "STRUKTURA — Professional web-based
  structural analysis and design (2D Direct Stiffness solver,
  SNI 2847:2019 RC + SNI 1729:2020 steel checks)".
- Scripts sama dengan salinan migrasi kecuali **tanpa** `test:e2e`
  (hanya `dev`, `build`, `preview`, `lint`, `format`, `format:check`,
  `test`, `test:watch`). Stack dependensi praktis sama dengan §2.1.
- Isi tingkat atas: `benchmarks/`, `config/`, `dist/`, `docs/`,
  `public/`, `src/`, `tests/`, `index.html`, `CHANGELOG.md`, `LICENSE`,
  `NOTICE`, `README.md`, `package.json`, `package-lock.json`,
  `tsconfig.json`, `.github/`, `node_modules/`.
- Struktur `src/`: `App.tsx`, `main.tsx`, `globals.css`,
  `vite-env.d.ts`, dan folder `canvas/`, `components/`, `hooks/`,
  `lib/`, `struktura/`, `tabs/`, `templates/`. Kode solver/engine di
  sini berada di `src/lib/` — antara lain `solver.ts`, `model.ts`,
  `geometry.ts`, `units.ts`, `analysis-pipeline.ts`,
  `analysis-diagnostics.ts`, `combinations-presets.ts`,
  `diagram-utils.ts`, `svg-renderer.ts`, serta subfolder
  `lib/design/` (core/rc/steel) dan `lib/sections/` (materials/shapes).
  Di salinan migrasi, isi yang bersesuaian berada di `src/engine/`.

Kesimpulan untuk sumber ini: STRUKTURA adalah repo asal Zona Structure;
seluruh kebutuhan baseline diambil dari salinan migrasinya (§2), dan
repo ini tetap referensi yang tidak diubah.

---

## 4. Temuan risiko & catatan

1. **`~/workspace/zonasipil/` bukan git checkout.** Pemeriksaan
   `ls -a` pada folder tersebut tidak menunjukkan folder `.git`
   (pencarian `grep -i git` atas daftar itu menghasilkan 0 hasil).
   Akibatnya perubahan pada sumber deploy produksi ini tidak terlacak
   oleh kontrol versi dari folder ini sendiri.
2. **Repo GitHub hanya berisi teks situs statis** — dicatat sebagai
   catatan yang menyertai penugasan audit ini: isi repo GitHub terkait
   tidak mencakup seluruh artefak biner/asset situs, sehingga repo
   tersebut tidak dapat diperlakukan sebagai satu-satunya sumber
   kebenaran untuk membangun ulang situs live secara utuh. (Tidak
   diverifikasi dengan perintah git dalam audit ini, sesuai batasan
   audit.)
3. **Dua workstream hidup berdampingan di satu folder.** Di
   `~/workspace/zonasipil/` terdapat sekaligus (a) situs statis live
   (`index.html` di root, `css/`, `js/`, `apps/`, `artikel/`, halaman
   akun), dan (b) workstream React/Vite terpisah (`src/`, `dist/`,
   `vite.config.ts`, `package.json` bernama `zonasipil-web` versi
   2.0.0), ditambah arsip `legacy-v1/`. Saat memindahkan ke monorepo,
   ketiganya harus dipisahkan secara eksplisit agar build React tidak
   tertukar dengan sumber deploy statis.
4. **Hash solver tidak cocok dengan catatan lama.** Hash gabungan
   `src/engine/` Zona Structure saat audit adalah
   `00a869e1ed3426ad4741ac4f80712b8910244fdb868df54f14d931dedf6f926a`
   (61 file), bukan berawalan `ca5a9240`. Baseline monorepo harus
   memakai hash baru ini; selisih terhadap catatan lama perlu
   ditelusuri terpisah sebelum ada klaim bahwa solver tidak berubah.
5. **Status live `/apps/structure/` — catatan historis, tidak
   diverifikasi live dalam audit ini.** Menurut catatan yang menyertai
   pekerjaan ZonaSipil sebelumnya: pada pemeriksaan live sebelumnya,
   `/apps/structure/` masih menyajikan halaman detail hasil generator
   dan bundle JS aplikasinya pernah mengembalikan 404, sementara file
   aplikasi hanya ada di penyimpanan Vercel. Audit ini tidak melakukan
   pemeriksaan live, jadi keadaan live saat ini **tidak** dinyatakan
   di sini. Di sisi kode, `build_apps.py` saat ini memang melewati slug
   `structure` dengan alasan rute itu dilayani aplikasi Zona Structure
   itu sendiri (lihat §1.3) — kesesuaian antara maksud di kode dan
   keadaan live perlu diverifikasi terpisah sebelum migrasi monorepo.
6. **Docstring generator apps tertinggal dari keadaan `api/`.**
   `build_apps.py` masih menyatakan backend akun belum ada, padahal
   `api/auth/` sudah berisi implementasi auth mandiri dan Google
   (lihat §1.1 dan §1.3). Dokumentasi di kepala generator perlu
   diselaraskan agar tidak menyesatkan baseline.
7. **Klaim kemampuan Structure harus dibaca dari STATUS-MATRIX.**
   Kemampuan desain beton dan baja berstatus INCOMPLETE (subset),
   verdict seismik UNVERIFIED, dan mode kalkulator mandiri, 3D, serta
   sinkronisasi cloud berstatus UNSUPPORTED (§2.5). Label BETA untuk
   Zona Structure di katalog (§1.3) konsisten dengan keadaan subset
   tersebut; baseline monorepo tidak boleh menaikkan status ini tanpa
   bukti baru.
8. **Utang ikon di Zona Structure.** Kode Structure masih memakai
   `lucide-react` (tercantum di `package.json` dan dicatat sebagai
   utang di `docs/MIGRATION-RECORD.md`), yang bertentangan dengan
   protokol anti-slop ZonaSipil yang melarang pustaka ikon generik.
   Dicatat sebagai utang yang sudah diakui, bukan temuan baru.
9. **Batasan audit ini.** Tidak ada build yang dijalankan (agar tidak
   menulis `dist/`), tidak ada e2e yang dijalankan, dan tidak ada
   verifikasi live ke `zonasipil.web.id`. Angka baseline yang sah dari
   audit ini adalah: 17 aplikasi katalog, 23 folder artikel, 47 URL
   sitemap, 28 file test / 237 test lulus / 0 gagal untuk Zona
   Structure, dan hash solver `00a869e1…f926a` atas 61 file engine.

---

*Akhir dokumen. Satu-satunya file yang dibuat oleh audit ini adalah
dokumen ini sendiri: `docs/architecture/AUDIT-BASELINE.md` di dalam
`~/workspace/zonasipil-platform/`.*

---

## Catatan rekonsiliasi hash engine (ditambahkan koordinator, 2026-11-02)

Dua angka hash engine muncul dalam pekerjaan monorepo dan keduanya benar
untuk metodenya masing-masing:

- `00a869e1…` (dokumen ini): dihitung dari `/home/hatch` dengan path
  absolut (`find ~/workspace/zonasipil-structure/src/engine …`), sehingga
  string path absolut ikut ter-hash pada keluaran `sha256sum`.
- `a01990ba…` (`apps/structure/PROVENANCE.md`): dihitung dari dalam folder
  aplikasi dengan path relatif (`find src/engine …`). Dengan metode ini
  hash asal dan hash salinan di `apps/structure/` terverifikasi **identik
  persis**, dan `diff -r` kedua pohon sumber juga identik.

Nilai yang dipakai sebagai baseline integritas salinan monorepo adalah
`a01990ba238da696ed6ce2fbf2c20c84fb3d6548178b722302b4c0d7c3248e72`
(metode path relatif dari root aplikasi). Catatan lama `ca5a9240` tidak
cocok dengan kedua metode; penyebabnya belum ditelusuri dan tidak
diasumsikan — kemungkinan metode/file-set yang berbeda saat catatan itu
dibuat.
