/**
 * Validasi path tujuan kembali (`?next=`) setelah login.
 *
 * Hanya path INTERNAL yang diterima:
 * - path absolut-situs: diawali tepat satu `/` (mis. `/apps/calculator`), atau
 * - rute hash shell web: diawali `#/` (mis. `#/calculator`).
 *
 * Ditolak (dikembalikan ke `fallback`):
 * - URL absolut / skema apa pun (`https://…`, `javascript:…`, `data:…`),
 * - protocol-relative (`//evil.com`) termasuk bentuk terenkode (`%2f%2f…`),
 * - backslash di mana pun (`/\evil`, `/apps\…`) — browser bisa
 *   menormalkannya menjadi pemisah path,
 * - karakter kontrol / spasi di dalam path,
 * - nilai kosong / bukan string,
 * - bila `allowedPrefixes` diberikan: path di luar allowlist itu.
 *   Kecocokan berarti sama persis dengan salah satu prefix, atau prefix
 *   diikuti salah satu karakter batas `/?&#`. Prefix bukan wildcard:
 *   `"#/"` hanya mengizinkan `"#/"` (dan `"#/?…"`), bukan semua rute hash.
 */

export interface ValidateNextOptions {
  /** Tujuan aman bila input ditolak. Default `"/"`. Dianggap tepercaya. */
  fallback?: string;
  /** Allowlist awalan path internal. Bila diisi, path wajib cocok salah satunya. */
  allowedPrefixes?: readonly string[];
}

const PANJANG_MAKS = 512;
// Karakter kontrol, spasi, dan DEL tidak pernah sah di dalam path tujuan.
const KARAKTER_TERLARANG = /[\u0000-\u0020\u007f]/;

function lolosPemeriksaanDasar(path: string): boolean {
  if (path.length === 0 || path.length > PANJANG_MAKS) return false;
  if (path.includes("\\")) return false;
  if (KARAKTER_TERLARANG.test(path)) return false;

  // Bentuk terenkode dari serangan yang sama juga ditolak: dekode sekali
  // lalu periksa hasil dekodenya (dekode yang gagal = tolak).
  let terdekode: string;
  try {
    terdekode = decodeURIComponent(path);
  } catch {
    return false;
  }
  if (terdekode.includes("\\")) return false;
  if (KARAKTER_TERLARANG.test(terdekode)) return false;
  if (terdekode.startsWith("//")) return false;

  if (path.startsWith("#/")) {
    // Rute hash internal: setelah "#/" tidak boleh ada "//" (itu akan
    // dibaca sebagai host oleh sebagian parser) dan tidak boleh ada skema.
    const sisa = path.slice(2);
    if (sisa.startsWith("/")) return false;
    if (/^[a-z][a-z0-9+.-]*:/i.test(sisa)) return false;
    return true;
  }
  if (path.startsWith("/")) {
    // Tepat satu slash: "//" adalah protocol-relative.
    if (path.startsWith("//")) return false;
    return true;
  }
  // Tidak diawali "/" atau "#/": URL absolut, skema berbahaya
  // (javascript:, data:, …), atau path relatif — semua ditolak.
  return false;
}

function cocokAllowlist(path: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => {
    if (path === prefix) return true;
    if (!path.startsWith(prefix)) return false;
    // Lanjutan hanya sah di karakter batas — prefix TIDAK menjadi
    // wildcard: "#/" tidak otomatis mengizinkan semua rute "#/…".
    const batas = path.charAt(prefix.length);
    return batas === "/" || batas === "?" || batas === "&" || batas === "#";
  });
}

/**
 * Kembalikan `input` bila ia path internal yang aman (dan cocok
 * allowlist bila diberikan); selain itu kembalikan `fallback`.
 */
export function validateNextPath(input: unknown, options: ValidateNextOptions = {}): string {
  const fallback = options.fallback ?? "/";
  if (typeof input !== "string") return fallback;
  const path = input.trim();
  if (!lolosPemeriksaanDasar(path)) return fallback;
  if (options.allowedPrefixes && !cocokAllowlist(path, options.allowedPrefixes)) {
    return fallback;
  }
  return path;
}
