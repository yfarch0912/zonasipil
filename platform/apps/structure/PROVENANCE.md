# PROVENANCE — ZonaSipil Structure (salinan monorepo)

- **Asal salinan:** repo/aplikasi **ZonaSipil Structure** (`~/workspace/zonasipil-structure/`),
  product code `ZS-STRUCTURE`, route `zonasipil.web.id/apps/structure`.
- **Asal-usul produk:** migrasi dari **STRUKTURA 1.0.0** tanggal **2026-11-01**
  (lihat `docs/MIGRATION-RECORD.md` di dalam salinan ini).
- **Tanggal salin ke monorepo:** 2026-11-02
  (ke `~/workspace/zonasipil-platform/apps/structure/`).
- **Cara salin:** salinan penuh isi folder asal, KECUALI `node_modules`, `dist`,
  `dist-apps-structure`, `.git`, `qa-screenshots`, dan `*.tsbuildinfo`.
  Folder asal tidak diubah (read-only, hanya dibaca/disalin).
  Hasil salinan diverifikasi `diff -r` terhadap asal (dengan pengecualian yang
  sama): **identik**, 318 file.
- **Lisensi:** MIT, milik user — file `LICENSE` dan `NOTICE` ikut tersalin
  utuh di root salinan ini.
- **Integritas engine (`src/engine/**`, 61 file):**
  perintah `find src/engine -type f | sort | xargs sha256sum | sha256sum`
  menghasilkan hash yang sama persis di folder asal dan di salinan ini:

  ```
  a01990ba238da696ed6ce2fbf2c20c84fb3d6548178b722302b4c0d7c3248e72
  ```

  Catatan: hash ini **tidak** cocok dengan awalan catatan lama `ca5a9240` —
  dilaporkan apa adanya; yang terverifikasi di sini adalah kesamaan
  asal ↔ salinan pada saat penyalinan (2026-11-02). Engine/solver tidak
  diubah sama sekali dalam proses penyalinan ini.
- **Kemandirian aplikasi:** aplikasi ini **berdiri sendiri** — berada di luar
  npm workspaces root monorepo dan membawa tooling-nya sendiri
  (`package.json` + `package-lock.json` sendiri, konfigurasi di `config/`:
  `config/vite.config.ts`, `config/tsconfig.json`, `config/vitest.config.ts`,
  `config/playwright.config.ts`, `config/eslint.config.js`).
  Install/test/build dijalankan dari folder ini, bukan dari root monorepo.
- **Aturan yang tetap berlaku:** lihat `AGENTS.md` di folder ini — kejujuran
  engineering (tidak ada klaim kepatuhan SNI yang tidak terverifikasi),
  engine tidak diubah tanpa siklus benchmark/audit, dan tidak ada push/deploy
  tanpa persetujuan eksplisit user.
