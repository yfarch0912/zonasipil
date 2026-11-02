# ZonaSipil — Autentikasi & Kontrol Akses Aplikasi

Dokumen ini menjelaskan sistem yang BENAR-BENAR terpasang (live statis
`~/workspace/zonasipil` + monorepo `~/workspace/zonasipil-platform`).
Perubahan pada dokumen ini dibuat lokal 2026-11-03 dan **belum di-deploy**.

## 1. Arsitektur (satu sistem, bukan dua)

- **Backend (live, sudah bekerja & E2E lolos 2026-11-02):** fungsi serverless
  di `api/` situs statis. `api/_lib.js`: kata sandi **scrypt**
  (N=16384, r=8, p=1, salt 16 byte, `timingSafeEqual`); token sesi acak
  32 byte disimpan **hanya sebagai hash SHA-256** di Vercel Blob privat
  (store `zonasipil-auth`); cookie `zs_session` **HttpOnly + Secure +
  SameSite=Lax**, TTL 12 jam (atau 30 hari bila "ingat saya").
- **Endpoint:** `POST /api/auth/register|login|logout|forgot|reset`,
  `GET /api/auth/me`, `GET /api/auth/google` + `google/callback`
  (OAuth server-side, state HMAC + wajib `email_verified`).
- **Tidak ada token di localStorage/sessionStorage** — sesi murni cookie.
- **Monorepo** memakai kontrak API yang sama lewat `packages/auth`
  (`SessionClient`, `credentials:"include"`). Tidak ada sistem user kedua.

## 2. Peta rute

| Kelas | Rute |
|---|---|
| Publik | `/`, `/#kalkulator` (halaman boleh dibaca; **memakai** kalkulator digate), `/artikel/*`, `/apps/` (katalog), `/apps/<slug>/` (halaman detail), `/login/`, `/register/`, `/forgot-password/`, `/reset-password/`, `/403.html`, `/404.html` |
| Protected | `/dashboard/` (guard klien + `/api/auth/me`), pemakaian kalkulator beranda, aksi "Buka/Gunakan" untuk app **available/beta** (Calculator, Structure), 6 halaman tool monorepo (`calculator, quantity, concrete, steel, foundation, rab`) di shell `apps/web` |
| Planned | 14 app `coming-soon` + Concrete `in-development` di katalog live; 10 entri `planned` di registry monorepo — tampil "Segera Hadir", tidak bisa dibuka sebagai tool, tidak digate login |
| API privat | `GET /api/auth/me` → 401 tanpa sesi valid. Operasi data per-user lain belum ada (belum ada fitur simpan proyek), jadi belum ada permukaan IDOR; isolasi user saat ini by-construction (identitas selalu dari cookie sesi) |

Alur: app dipilih → `apps/gate.js` (live) / gate `apps/web` (monorepo) cek
sesi → anonim diarahkan ke `/login/?next=<path tervalidasi>` → setelah
login/daftar (email ATAU Google) pengguna kembali ke tujuan.
Validasi `next` fail-closed: allowlist `/`, `/apps…`, `/dashboard…`,
`/artikel…` (live) — URL eksternal, `//`, backslash, skema berbahaya,
enkode berlapis, serta `/login/` dan `/api/` sebagai next semuanya ditolak
ke default `/dashboard/`. Untuk Google, `next` disimpan di dalam state
OAuth bertanda tangan HMAC dan divalidasi ulang di callback.

## 3. Keamanan — status per butir

- Hashing scrypt + token ter-hash + cookie flags: **terpasang & teruji**.
- Rate limit: login 8 gagal/15 mnt per email; register 5/15 mnt per IP+email;
  forgot 3/15 mnt per email (respons tetap generik); reset 10/15 mnt per IP.
  Implementasi bucket Blob get→put **tidak atomik** — mitigasi, bukan
  jaminan ketat (dicatat jujur).
- Login selalu menjalankan verifikasi scrypt (hash dummy untuk email tak
  dikenal) agar waktu respons tidak membocorkan email terdaftar.
- Reset kata sandi: token 1 jam, sekali pakai, ter-hash; **setelah reset
  semua sesi lama akun dicabut** (indeks sesi per email di `_lib.js`);
  kata sandi 8–72 karakter di semua jalur.
- Logout menginvalidasi sesi di server (`blobDel`) + menghapus cookie.
- Error login & forgot generik. Register menjawab 409 untuk email duplikat
  — disengaja sesuai kebutuhan UX master prompt ("tangani email sudah
  terdaftar"); risikonya enumerasi pendaftaran, dimitigasi rate limit.
- CSRF: mengandalkan `SameSite=Lax` + body JSON; belum ada cek Origin
  eksplisit (defence-in-depth yang belum dipasang).
- Peran/admin: **belum ada** sistem role/entitlement/paket. Semua user
  terdaftar setara. Kelas `restricted` belum diterapkan karena belum ada
  sistem paket yang nyata.

## 4. Keterbatasan (jujur)

1. **Verifikasi email: belum ada.** Akun aktif segera setelah daftar.
2. **Email reset belum terkirim.** `forgot` membuat token server-side dan
   menjawab generik; belum ada penyedia email yang terhubung, jadi user
   belum bisa menerima tautannya. Halaman `/reset-password/` sudah dibuat
   dan mengonsumsi API yang ada — begitu penyedia email dipasang, alurnya
   lengkap tanpa perubahan halaman.
3. **Login Google di produksi** masih menunggu langkah user: mendaftarkan
   redirect URI `https://zonasipil.web.id/api/auth/google/callback` di
   Google Cloud Console. Kode (termasuk dukungan `?next=`) sudah siap lokal.
4. **Zona Structure interaktif belum live** di `/apps/structure/` (hanya
   asetnya di storage Vercel; index tidak diaktifkan). Gate-nya berlaku di
   level katalog (tombol aksi beta) dan monorepo, bukan di dalam app-nya.
5. **Penyimpanan proyek per user: belum ada.** Dashboard menampilkan
   identitas + katalog app + empty state yang jujur; tidak ada data
   aktivitas/proyek palsu.
6. Halaman tool monorepo adalah preview lokal (`deployed:false` untuk
   semua app di registry) — gate monorepo teruji unit, belum melayani
   trafik produksi.

## 5. Variabel lingkungan (NAMA saja — nilai tidak pernah ditulis di repo)

| Nama | Dipakai oleh |
|---|---|
| `BLOB_READ_WRITE_TOKEN` | `api/_lib.js` (akses Blob privat) |
| `AUTH_SECRET` | tanda tangan state OAuth (`api/auth/google.js`, `callback.js`) |
| `GOOGLE_CLIENT_ID` | `api/auth/google.js`, `google/callback.js` |
| `GOOGLE_CLIENT_SECRET` | `google/callback.js` (hanya server) |

## 6. Menjalankan lokal

- Situs statis: layani `~/workspace/zonasipil` dengan server statis apa pun;
  halaman publik + gate dapat diperiksa, tetapi `/api/auth/*` butuh runtime
  fungsi Vercel (atau harness stub) — tanpa itu gate fail-closed ke login.
- Monorepo: `cd ~/workspace/zonasipil-platform && npm install && npm test`
  (201 tes), `npm run typecheck`, `npm run build`, `npm run dev` untuk shell web.
- Test backend lokal tanpa produksi: harness stub Blob in-memory di
  `/tmp/auth-harness.mjs` (15 assertion: register/duplikat/login/me/reset/
  pencabutan sesi/rate-limit) — tidak menyentuh akun/data produksi.

## 7. Riwayat perubahan 2026-11-03 (lokal, belum deploy)

`apps/gate.js` (baru), `403.html` (baru), `reset-password/` (baru),
`apps/auth.js` (dukungan `next` + form reset + teruskan `next` ke Google),
`api/_lib.js` (limiter bersama, indeks+pecabutan sesi, dummy hash, cleanup
sesi kedaluwarsa), `api/auth/{login,register,forgot,reset}.js`,
`api/auth/google.js` + `callback.js` (`next` via state HMAC),
`qa/deploy_apps.py` (manifest menyertakan `gate.js`, `reset-password/`,
`403.html` agar deploy cron artikel tidak menjatuhkannya),
monorepo: `packages/auth` (baru), registry field `access`, gate `apps/web`.
