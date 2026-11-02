/**
 * Tipe sesi untuk kontrak API auth ZonaSipil (backend live zonasipil.web.id):
 *
 *   GET  /api/auth/me       -> 200 { ok: true, user } | 401 { ok: false, error }
 *   POST /api/auth/login    -> 200 { ok: true, user } + Set-Cookie sesi
 *   POST /api/auth/register -> 201 { ok: true, user } + Set-Cookie sesi
 *   POST /api/auth/logout   -> 200 { ok: true }
 *
 * Sesi adalah cookie HttpOnly yang dikelola server. Paket ini TIDAK
 * PERNAH menyimpan token/sesi di localStorage atau storage browser lain.
 */

/** Bentuk `user` yang dikembalikan backend live (name + email). */
export interface AuthUser {
  name: string;
  email: string;
}

/** Sesi yang diketahui frontend: hanya profil user; token tetap di cookie HttpOnly. */
export interface Session {
  user: AuthUser;
}

/**
 * Tingkat akses sebuah entri registry. Nilainya sama persis dengan
 * `AppAccess` di `@zonasipil/application-registry`; didefinisikan ulang
 * di sini (union literal yang identik, kompatibel secara struktural)
 * agar paket auth tidak bergantung pada registry — pemanggil cukup
 * melewatkan entri registry apa adanya.
 */
export type AccessLevel = "public" | "protected" | "planned";

/** Bagian minimal entri registry yang dibutuhkan keputusan akses. */
export interface AccessSubject {
  access: AccessLevel;
}

/**
 * Hasil klasifikasi akses:
 * - `allow`          — boleh dibuka sekarang.
 * - `login-required` — alat protected dan belum ada sesi: tampilkan gate login.
 * - `planned`        — belum ada alat yang bisa dibuka ("Segera Hadir"),
 *                      berlaku juga untuk pengguna yang sudah login.
 * - `denied`         — nilai access tidak dikenal (defensif; fail-closed).
 */
export type AccessDecision = "allow" | "login-required" | "planned" | "denied";
