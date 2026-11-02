# ZonaSipil Platform — Monorepo

Monorepo lokal ekosistem aplikasi teknik sipil **ZonaSipil**
(zonasipil.web.id). Repo ini adalah *sumber kode* aplikasi; situs statis
live tetap berada di folder terpisah (`~/workspace/zonasipil/`, sumber
deploy produksi) dan **tidak** disentuh oleh repo ini.

Dibangun 2026-11-02 sebagai pelaksanaan "Full Autonomous Engineering
Master Prompt". Status kejujuran per aplikasi: lihat `docs/STATUS.md`.

## Struktur

```
zonasipil-platform/
  apps/
    structure/     Aplikasi Zona Structure (React+Vite, solver struktur 2D)
                   — salinan terverifikasi dari repo zonasipil-structure,
                   tooling mandiri di luar npm workspaces (lihat PROVENANCE.md)
    web/           Shell web "ZonaSipil Apps" (Vite + TS vanilla): 6 halaman
                   kerja yang memanggil inti logika di bawah ini
    calculator/    Inti logika kalkulator (TypeScript murni + test)
    concrete/      Inti logika beton bertulang (TypeScript murni + test)
    steel/         Inti logika baja (TypeScript murni + test)
    foundation/    Inti logika pondasi dangkal (TypeScript murni + test)
    quantity/      Inti logika take-off volume (TypeScript murni + test)
    rab/           Inti logika RAB (TypeScript murni + test)
  packages/
    engineering-core/       Konversi satuan, format angka ID, konstanta material
    application-registry/   Satu-satunya sumber metadata + status 17 aplikasi
  docs/
    architecture/           AUDIT-BASELINE.md
    upstream-sources/       UPSTREAM-EVALUATION.md
    engineering-validation/ Nilai referensi + toleransi tes numerik
    STATUS.md               Status jujur keseluruhan
```

Aplikasi road/bridge/plan/bim/academy/survey/project/simulator/report/
library **tidak** dibuatkan folder: belum ada implementasi nyata untuknya.
Kehadirannya hanya sebagai entri `coming-soon` di application-registry —
sesuai prinsip repo ini: tidak ada folder/fitur kosong berpura-pura jadi.

## Menjalankan secara lokal

Prasyarat: Node.js ≥ 20, npm.

```bash
# 1. Inti logika (packages + 6 app) + aplikasi web — dari root monorepo
npm install
npm test          # vitest: 155 test (packages + apps + lib web)
npm run typecheck # tsc --noEmit, strict
npm run build     # typecheck penuh + build Vite apps/web (lihat catatan build)

# 2. Aplikasi web saja (pratinjau lokal)
npm run dev --workspace @zonasipil/app-web

# 3. Aplikasi Zona Structure (mandiri, di luar workspaces)
cd apps/structure
npm install
npm test          # 237 unit test (benchmark analitik + regresi)
npm run test:e2e  # 39 test Playwright (headless) — terverifikasi 2026-11-02
npm run build     # tsc -b + vite build
npm run dev       # server pengembangan Vite
```

## Catatan build

**Build monorepo (di luar structure) = typecheck penuh + build web.**
`npm run build` menjalankan `tsc --noEmit -p tsconfig.json` lalu build
Vite untuk `apps/web`. Alasannya: package diekspor
langsung dari sumber TypeScript (`exports: ./src/index.ts`) dan path
alias `@zonasipil/*` menunjuk ke `src/index.ts`, sehingga emit ke `dist/`
per package tidak diperlukan pada tahap ini. Lolos `build` berarti
seluruh sumber + test di packages dan 6 apps lolos pemeriksaan tipe
strict tanpa error. (Rincian tambahan ada di `packages/README.md`.)
`apps/structure` punya build sungguhan sendiri (`tsc -b` + Vite).

## Prinsip kejujuran teknik (mengikat seluruh repo)

- Tidak ada klaim kepatuhan SNI/ACI/AISC/Eurocode. Modul inti logika
  memakai metode *textbook* umum yang didokumentasikan per modul.
- Kemampuan yang belum diimplementasikan ditandai eksplisit
  `UNSUPPORTED` / `NOT IMPLEMENTED` di README modul dan `docs/STATUS.md`.
- Setiap angka pada tes numerik punya nilai referensi hitung-tangan
  terdokumentasi (`docs/engineering-validation/`).
- Tidak ada deploy produksi atau perubahan DNS dari repo ini tanpa
  persetujuan eksplisit pemilik. Push GitHub dilaksanakan 2026-11-02
  atas persetujuan pemilik, terbatas folder `platform/` di repo
  `yfarch0912/zonasipil` (lihat `docs/STATUS.md`).

## Lisensi & provenance

- `apps/structure/`: MIT — aplikasi milik pemilik ZonaSipil, migrasi dari
  STRUKTURA 1.0.0 (lihat `apps/structure/LICENSE`, `NOTICE`,
  `PROVENANCE.md`). Engine lokal ini sendiri adalah turunan MIT dari fork
  OpenANSTRUK-2D (lihat `docs/upstream-sources/UPSTREAM-EVALUATION.md`).
- Kode inti logika di `packages/` dan `apps/{calculator,concrete,steel,
  foundation,quantity,rab}/`: karya orisinal repo ini; rumus textbook
  umum, bukan reproduksi teks standar berhak cipta.
