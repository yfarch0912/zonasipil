import type { AccessDecision, AccessSubject, Session } from "./types.ts";

/**
 * Klasifikasi akses murni: (entri registry, sesi saat ini) -> keputusan.
 *
 * Matriks:
 * | access    | sesi null        | sesi ada |
 * |-----------|------------------|----------|
 * | public    | allow            | allow    |
 * | protected | login-required   | allow    |
 * | planned   | planned          | planned  |
 * | (lainnya) | denied           | denied   |
 *
 * `planned` menang atas sesi: aplikasi yang belum punya alat tidak bisa
 * dibuka hanya karena pengguna sudah login.
 */
export function classifyAccess(entry: AccessSubject, session: Session | null): AccessDecision {
  switch (entry.access) {
    case "public":
      return "allow";
    case "protected":
      return session && session.user ? "allow" : "login-required";
    case "planned":
      return "planned";
    default:
      // Nilai access tak dikenal: fail-closed, jangan pernah allow.
      return "denied";
  }
}
