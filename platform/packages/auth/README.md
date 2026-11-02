# @zonasipil/auth

Paket autentikasi ZonaSipil untuk monorepo zonasipil-platform: logika
murni gate akses + klien sesi untuk kontrak API auth live.

## Kontrak backend (zonasipil.web.id, tidak diubah oleh paket ini)

| Method & path          | Sukses                              | Gagal                        |
|------------------------|-------------------------------------|------------------------------|
| `GET /api/auth/me`     | 200 `{ ok: true, user }`            | 401 `{ ok: false, error }`   |
| `POST /api/auth/login` | 200 `{ ok: true, user }` + cookie   | 4xx `{ ok: false, error }`   |
| `POST /api/auth/register` | 201 `{ ok: true, user }` + cookie | 4xx `{ ok: false, error }`   |
| `POST /api/auth/logout`| 200 `{ ok: true }`                  | —                            |

Sesi adalah cookie HttpOnly yang dikelola server. Paket ini **tidak
pernah** menyimpan token di localStorage/sessionStorage; frontend hanya
memegang profil user (`{ name, email }`) di memori.

## Isi

- `validateNextPath(input, { fallback, allowedPrefixes })` — hanya path
  internal (`/…` satu slash, atau rute hash `#/…`) yang lolos; URL
  absolut, skema berbahaya, protocol-relative, dan backslash ditolak.
- `classifyAccess(entry, session)` — matriks: public→allow,
  protected→allow/login-required, planned→planned, tak dikenal→denied.
  Menerima entri `@zonasipil/application-registry` apa adanya
  (kompatibel struktural lewat field `access`).
- `SessionClient` — `me()` (401→`null`), `login()`, `register()`,
  `logout()`; semua request `credentials: "include"`; `fetchFn` dan
  `baseUrl` dapat diinjeksikan untuk pengujian.
