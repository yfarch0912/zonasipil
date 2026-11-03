import { validateNextPath } from "@zonasipil/auth";

/**
 * Helper murni routing + gate untuk shell web (hash routing).
 * Logika validasi `next` sepenuhnya milik paket `@zonasipil/auth`;
 * modul ini hanya tahu bentuk rute hash shell ini.
 */

/** Slug halaman alat yang dirender shell ini (protected di registry). */
export const SLUG_ALAT = ["calculator", "quantity", "concrete", "steel", "foundation", "rab"] as const;

/** Rute hash internal yang sah sebagai tujuan kembali setelah login. */
export const RUTE_HASH_SAH: readonly string[] = [
  "#/",
  ...SLUG_ALAT.map((slug) => `#/${slug}`),
];

export interface RuteHash {
  slug: string;
  params: URLSearchParams;
}

/** Urai `location.hash` ("#/login?next=…") menjadi slug + query params. */
export function uraiHash(hash: string): RuteHash {
  const mentah = hash.replace(/^#\/?/, "");
  const [slugMentah = "", query = ""] = mentah.split("?", 2);
  return { slug: slugMentah.split("/")[0] ?? "", params: new URLSearchParams(query) };
}

export function hashAlat(slug: string): string {
  return `#/${slug}`;
}

/** Hash halaman login yang membawa tujuan kembali (sudah terenkode). */
export function hashLogin(next: string): string {
  return `#/login?next=${encodeURIComponent(next)}`;
}

/**
 * URL halaman masuk LIVE ZonaSipil (/login/) dengan `?next=` kembali ke
 * rute shell ini (/apps/web/#/…). Shell TIDAK punya formulir login
 * sendiri: autentikasi selalu terjadi di halaman live, memakai sesi
 * cookie yang sama. `next` divalidasi dulu oleh validasiNextWeb; sisi
 * live (apps/gate.js) memvalidasi ulang path + jangkarnya.
 */
export function urlLoginLive(next: string): string {
  const tujuan = validasiNextWeb(next);
  return `/login/?next=${encodeURIComponent(`/apps/web/${tujuan}`)}`;
}

/**
 * Validasi `?next=` untuk shell ini: harus rute hash internal yang
 * dikenal; apa pun selain itu jatuh ke beranda `#/`.
 */
export function validasiNextWeb(nilai: string | null): string {
  return validateNextPath(nilai, { fallback: "#/", allowedPrefixes: RUTE_HASH_SAH });
}
