# STATUS — ZonaSipil Platform

Per 2026-11-02, setelah verifikasi akhir dari root monorepo.
Kategori mengikuti format wajib: selesai terverifikasi / terimplementasi
belum terverifikasi penuh / tidak diimplementasikan / terblokir.

**Pembaruan 2026-11-02 (eksekusi lanjutan, persetujuan pemilik "gas
semua"):** UI web untuk 6 inti logika dibangun di `apps/web/`, registry
menambah field `implementation`, E2E Zona Structure dijalankan ulang di
monorepo (39/39), dan monorepo di-push ke GitHub repo `yfarch0912/
zonasipil` folder `platform/` (lihat bagian "Push GitHub" di bawah).

## Selesai & terverifikasi (tes dijalankan, angka nyata)

| Komponen | Bukti |
|---|---|
| `apps/structure` (Zona Structure) | Salinan identik dari `zonasipil-structure` (`diff -r` bersih; hash engine path-relatif `a01990ba…` sama asal↔salinan). Di lokasi baru: `npm install` OK, `npm test` **237/237** (28 file), `npm run build` OK. Diverifikasi ulang oleh koordinator setelah semua pekerjaan selesai: 237/237. **E2E Playwright dijalankan ulang di monorepo 2026-11-02: 39/39 lulus** (10 file spec, Chromium headless, 0 gagal/0 skip), unit tetap 237/237 sesudahnya. |
| `packages/engineering-core` | Termasuk dalam 155 test root. Konversi satuan 7 kategori, `formatAngkaID`, konstanta material. |
| `packages/application-registry` | 17 entri persis dari `build_apps.py` situs live (1 available, 1 beta, 1 in-development, 14 coming-soon); test keunikan slug & status. **Ditambah field `implementation {logic, ui, deployed}`** yang membedakan status publik live (`status`, tidak berubah) dari keadaan monorepo: 7 app (structure + 6 inti logika) `{logic:true, ui:true}`, 10 app lain `{logic:false, ui:false}`, dan `deployed:false` untuk **semua** entri — implementasi monorepo belum berjalan di situs live. 13 test registry. |
| `apps/web` (ZonaSipil Apps) | Shell web Vite + TS vanilla: navigasi dari registry + 6 halaman kerja (calculator, quantity, concrete, steel, foundation, rab) yang **memanggil paket logika** (tanpa rumus ditulis ulang di UI), validasi input berbahasa Indonesia, bagian "Metode & batas" per halaman dari README modul. Lib murni UI teruji: 22 test (parser angka Indonesia, format, adapter state RAB, satuan). Build Vite hijau; pratinjau lokal HTTP 200. |
| `apps/calculator` | 14 test. Konsisten situs live: beton 3,00/3,15 m³; besi D13 1,041885 kg/m; 120 m = 125,03 kg. |
| `apps/quantity` | 23 test. Bata/m² 79,365 (rumus transparan), plester, rekap material. |
| `apps/concrete` | 24 test. Whitney: balok referensi Mn 232,41 / φMn 209,17 kN·m. |
| `apps/steel` | 15 test. Profil I: A 4533 mm², Ix 69.325.191 mm⁴; Euler/Johnson terverifikasi. |
| `apps/foundation` | 15 test. Terzaghi/Vesic φ=30°: Nq 18,4011, Nc 30,1396, Nγ 22,4025; qult lajur 935,05 kPa. |
| `apps/rab` | 15 test. Rekap + PPN parameter + ekspor CSV/JSON; grand total referensi eksak 4.995.000. |
| Monorepo (root) | `npm install` OK · `npm test` **155/155** (9 file: 129 lama + 4 registry + 22 web) · `npm run typecheck` exit 0 · `npm run build` exit 0 (kini termasuk build Vite `apps/web`). Total keseluruhan termasuk Structure: **392 test unit lulus + 39 E2E lulus, 0 gagal**. |

## Terimplementasi, belum terverifikasi penuh

- **Interaksi halaman `apps/web`**: yang teruji otomatis adalah lib
  murni UI (22 test). Halaman-halamannya terverifikasi lewat typecheck
  strict, build Vite, dan pratinjau lokal HTTP 200 — **belum ada uji
  browser klik-per-klik** untuk keenam halaman.
- **`build` monorepo** = typecheck penuh tanpa emit (keputusan
  terdokumentasi di `packages/README.md`) + build Vite untuk
  `apps/web`: inti logika dikonsumsi sebagai sumber TS. Belum ada
  bundling/publikasi paket.
- **sectionproperties** (upstream properti penampang): evaluasi belum
  tuntas — halaman GitHub gagal dibuka saat riset; statusnya
  "tidak terverifikasi dari halaman" di `docs/upstream-sources/`.

## Tidak diimplementasikan (jujur)

- **Antarmuka web** untuk calculator/concrete/steel/foundation/quantity/
  rab: **sudah dibangun** di `apps/web/` (lihat tabel terverifikasi),
  tetapi hanya berjalan sebagai pratinjau lokal monorepo — **belum
  di-deploy** ke situs live. UI calculator di situs live tetap versi
  statis lama; status publik keenam app di situs live tetap persis
  seperti field `status` registry. Batas UI yang diketahui: form Rekap
  Quantity mendukung satu jenis elemen per hitungan (multi-elemen belum
  ada di UI, walau fungsi logikanya mendukung).
- **Zona Structure**: kemampuan yang oleh proyek asalnya ditandai
  INCOMPLETE/UNVERIFIED/UNSUPPORTED tetap begitu (cek RC/steel subset,
  seismik UNVERIFIED, 3D & cloud sync UNSUPPORTED) — lihat ringkasan di
  `docs/architecture/AUDIT-BASELINE.md`.
- **Modul road/bridge/plan/bim/academy/survey/project/simulator/report/
  library**: tidak ada folder dan tidak ada logika — hanya entri
  registry `coming-soon`.
- Settlement pondasi, kelompok tiang, tanah berlapis, muka air tanah
  (foundation): UNSUPPORTED. Cek desain baja sesuai kode: UNSUPPORTED.
  Geser/torsi/layan beton, balok T, tulangan rangkap: UNSUPPORTED.
  AHSP/harga satuan resmi (rab): tidak termasuk.

## Push GitHub — folder `platform/` (dilaksanakan 2026-11-02)

Atas persetujuan pemilik, isi monorepo ini di-push ke repo yang sudah
ada **`yfarch0912/zonasipil`**, branch `main`, di bawah folder
`platform/` — tanpa menyentuh file situs statis di root repo. Mekanik:
snapshot `push_files` konektor GitHub (hanya file teks UTF-8).

**Dikecualikan dari push (biner & artefak — hidup hanya di lokal):**
- `apps/structure/public/fonts/InterVariable.woff2` (biner)
- `apps/structure/public/fonts/JetBrainsMonoVariable.woff2` (biner)
- Semua yang ter-`.gitignore`: `node_modules/`, `dist/` (termasuk
  `apps/web/dist/` dan `apps/structure/dist/`), `coverage/`,
  `*.tsbuildinfo`.

**Hasil push:** commit `8992aabce08c49758b500a7e48893c873cebf445`
di `main` — **386 file teks (2,93 MiB)** ter-push di bawah `platform/`,
di atas head situs yang tidak berubah (`0a5a6fd2…`). Terverifikasi
balik via API: `platform/` terbaca, `platform/apps/web/package.json`
ada, dan kedua font `.woff2` memang **tidak ada** di remote. Catatan
sinkronisasi snapshot disimpan di
`~/workspace/zonasipil-platform-push.muse-github-snapshot-sync.json`.

## Terblokir oleh faktor eksternal (di luar wewenang eksekusi otonom)

- **Deploy produksi** zonasipil.web.id dari monorepo: tidak diotorisasi;
  produksi tetap dari folder situs statis oleh proses yang sudah ada.
  `apps/web` dan implementasi monorepo lain **belum tayang** di situs
  live (`implementation.deployed: false` untuk semua entri registry).
- **Aktivasi app Structure di rute live `/apps/structure/`**: keputusan
  pemilik yang masih tertunda dari pekerjaan sebelumnya; tidak diubah.
- **Catatan hash lama `ca5a9240`**: tidak cocok dengan hash engine yang
  terukur hari ini pada dua metode; penyebab belum ditelusuri (lihat
  catatan rekonsiliasi di `docs/architecture/AUDIT-BASELINE.md`).
  Baseline integritas yang sah sekarang adalah `a01990ba…`.

## Titik lanjutan yang disarankan (urut nilai)

1. Uji browser klik-per-klik untuk 6 halaman `apps/web` (Playwright
   ringan) agar interaksi UI naik menjadi terverifikasi penuh.
2. Keputusan pemilik: jalur tayang `apps/web` (dan app monorepo lain)
   ke situs live — sampai diputuskan, `deployed` tetap false.
3. Evaluasi ulang sectionproperties di sesi tersendiri.
4. Form Rekap Quantity multi-elemen di UI.
