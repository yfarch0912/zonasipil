import type { AuthUser, Session } from "./types.ts";

/**
 * Klien sesi untuk kontrak API auth ZonaSipil.
 *
 * Keamanan:
 * - Semua request memakai `credentials: "include"` agar cookie sesi
 *   HttpOnly (dikelola penuh oleh server) ikut terkirim.
 * - Token TIDAK PERNAH dibaca, disimpan, atau ditulis oleh kode ini —
 *   tidak ada localStorage/sessionStorage. Yang disimpan pemanggil
 *   hanyalah profil user hasil `me()`/`login()`.
 * - `fetchFn` dan `baseUrl` dapat diinjeksikan untuk pengujian.
 */

/** Bentuk minimal Response yang dipakai klien ini (mudah di-mock). */
export interface FetchResponseLike {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}

export interface FetchInitLike {
  method?: string;
  credentials?: string;
  headers?: Record<string, string>;
  body?: string;
}

export type FetchFn = (url: string, init?: FetchInitLike) => Promise<FetchResponseLike>;

export interface SessionClientOptions {
  /** Implementasi fetch; default `globalThis.fetch`. */
  fetchFn?: FetchFn;
  /**
   * Basis URL API, mis. `""` (relatif, default) atau
   * `"https://zonasipil.web.id"`. Slash di akhir dibuang.
   */
  baseUrl?: string;
}

/** Error dari API auth: membawa status HTTP dan pesan server bila ada. */
export class AuthApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
  }
}

interface ApiBody {
  ok?: unknown;
  user?: unknown;
  error?: unknown;
}

function sebagaiBody(nilai: unknown): ApiBody {
  return nilai && typeof nilai === "object" ? (nilai as ApiBody) : {};
}

function sebagaiUser(nilai: unknown): AuthUser | null {
  if (!nilai || typeof nilai !== "object") return null;
  const u = nilai as Record<string, unknown>;
  if (typeof u.email !== "string" || u.email.length === 0) return null;
  return { name: typeof u.name === "string" ? u.name : "", email: u.email };
}

function pesanError(body: ApiBody, status: number): string {
  return typeof body.error === "string" && body.error.length > 0
    ? body.error
    : `Permintaan auth gagal (HTTP ${status}).`;
}

export class SessionClient {
  private readonly fetchFn: FetchFn;
  private readonly baseUrl: string;

  constructor(options: SessionClientOptions = {}) {
    const bawaan = globalThis.fetch as unknown as FetchFn | undefined;
    const fetchFn = options.fetchFn ?? bawaan;
    if (typeof fetchFn !== "function") {
      throw new Error("SessionClient: tidak ada implementasi fetch yang tersedia.");
    }
    this.fetchFn = fetchFn;
    this.baseUrl = (options.baseUrl ?? "").replace(/\/+$/, "");
  }

  private url(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  private async minta(path: string, init: FetchInitLike): Promise<{ res: FetchResponseLike; body: ApiBody }> {
    const res = await this.fetchFn(this.url(path), { credentials: "include", ...init });
    let body: ApiBody = {};
    try {
      body = sebagaiBody(await res.json());
    } catch {
      body = {};
    }
    return { res, body };
  }

  private sesiDari(body: ApiBody, status: number): Session {
    const user = sebagaiUser(body.user);
    if (!user) throw new AuthApiError(status, "Respons auth tidak memuat user yang valid.");
    return { user };
  }

  /**
   * Sesi saat ini dari cookie HttpOnly.
   * 401 (belum masuk) -> `null`, BUKAN error. Status non-ok lain ->
   * AuthApiError agar pemanggil bisa membedakan "belum login" dari
   * "layanan sesi bermasalah".
   */
  async me(): Promise<Session | null> {
    const { res, body } = await this.minta("/api/auth/me", { method: "GET" });
    if (res.status === 401) return null;
    if (!res.ok) throw new AuthApiError(res.status, pesanError(body, res.status));
    return this.sesiDari(body, res.status);
  }

  /** Masuk dengan email + kata sandi. Gagal -> AuthApiError berpesan server. */
  async login(email: string, password: string, options: { remember?: boolean } = {}): Promise<Session> {
    const { res, body } = await this.minta("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, remember: !!options.remember }),
    });
    if (!res.ok) throw new AuthApiError(res.status, pesanError(body, res.status));
    return this.sesiDari(body, res.status);
  }

  /** Daftar akun baru; backend langsung membuat sesi pada 201. */
  async register(name: string, email: string, password: string): Promise<Session> {
    const { res, body } = await this.minta("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) throw new AuthApiError(res.status, pesanError(body, res.status));
    return this.sesiDari(body, res.status);
  }

  /** Keluar: server menghapus sesi dan mengosongkan cookie. */
  async logout(): Promise<void> {
    const { res, body } = await this.minta("/api/auth/logout", { method: "POST" });
    if (!res.ok) throw new AuthApiError(res.status, pesanError(body, res.status));
  }
}
