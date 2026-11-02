import { describe, expect, it, vi } from "vitest";
import { getApp } from "@zonasipil/application-registry";
import {
  AuthApiError,
  SessionClient,
  classifyAccess,
  validateNextPath,
  type FetchFn,
  type Session,
} from "../src/index";

const SESI: Session = { user: { name: "Penguji", email: "uji@contoh.id" } };

describe("validateNextPath — internal diterima", () => {
  it("path situs internal", () => {
    expect(validateNextPath("/apps/calculator")).toBe("/apps/calculator");
    expect(validateNextPath("/")).toBe("/");
    expect(validateNextPath("/apps/rab?dari=login")).toBe("/apps/rab?dari=login");
  });

  it("rute hash shell web", () => {
    expect(validateNextPath("#/calculator")).toBe("#/calculator");
    expect(validateNextPath("#/")).toBe("#/");
  });

  it("allowlist: cocok persis atau diikuti batas query", () => {
    const opsi = { allowedPrefixes: ["/apps/calculator", "#/calculator"], fallback: "#/" };
    expect(validateNextPath("/apps/calculator", opsi)).toBe("/apps/calculator");
    expect(validateNextPath("/apps/calculator?x=1", opsi)).toBe("/apps/calculator?x=1");
    expect(validateNextPath("#/calculator", opsi)).toBe("#/calculator");
  });
});

describe("validateNextPath — eksternal/berbahaya ditolak ke fallback", () => {
  const kasus: Array<[string, unknown]> = [
    ["URL absolut https", "https://evil.example/apps/calculator"],
    ["URL absolut http", "http://evil.example/"],
    ["protocol-relative", "//evil.example/apps"],
    ["protocol-relative terenkode", "%2f%2fevil.example"],
    ["skema javascript:", "javascript:alert(1)"],
    ["skema data:", "data:text/html,<script>1</script>"],
    ["backslash setelah slash", "/\\evil.example"],
    ["backslash di tengah path", "/apps\\calculator"],
    ["backslash terenkode", "/apps%5ccalculator"],
    ["hash protocol-relative", "#//evil.example"],
    ["path relatif", "apps/calculator"],
    ["string kosong", ""],
    ["hanya spasi", "   "],
    ["spasi di dalam path", "/apps/cal culator"],
    ["bukan string (null)", null],
    ["bukan string (undefined)", undefined],
    ["bukan string (angka)", 42],
    ["bukan string (objek)", { toString: () => "/apps/calculator" }],
  ];
  for (const [nama, input] of kasus) {
    it(nama, () => {
      expect(validateNextPath(input, { fallback: "#/" })).toBe("#/");
    });
  }

  it("fallback bawaan adalah /", () => {
    expect(validateNextPath("https://evil.example")).toBe("/");
    expect(validateNextPath(null)).toBe("/");
  });

  it("allowlist: path internal di luar allowlist tetap ditolak", () => {
    const opsi = { allowedPrefixes: ["/apps/calculator"], fallback: "/" };
    expect(validateNextPath("/apps/survey", opsi)).toBe("/");
    expect(validateNextPath("/apps/calculator-lain", opsi)).toBe("/");
    expect(validateNextPath("#/calculator", opsi)).toBe("/");
  });
});

describe("classifyAccess — matriks (memakai entri registry asli)", () => {
  const publik = { access: "public" as const };
  const calculator = getApp("calculator")!; // protected
  const survey = getApp("survey")!; // planned

  it("public: anon dan authed sama-sama allow", () => {
    expect(classifyAccess(publik, null)).toBe("allow");
    expect(classifyAccess(publik, SESI)).toBe("allow");
  });

  it("protected: anon -> login-required, authed -> allow", () => {
    expect(calculator.access).toBe("protected");
    expect(classifyAccess(calculator, null)).toBe("login-required");
    expect(classifyAccess(calculator, SESI)).toBe("allow");
  });

  it("planned: planned untuk anon maupun authed", () => {
    expect(survey.access).toBe("planned");
    expect(classifyAccess(survey, null)).toBe("planned");
    expect(classifyAccess(survey, SESI)).toBe("planned");
  });

  it("nilai access tak dikenal -> denied (fail-closed)", () => {
    const aneh = { access: "rahasia" as never };
    expect(classifyAccess(aneh, null)).toBe("denied");
    expect(classifyAccess(aneh, SESI)).toBe("denied");
  });
});

/** Mock fetch: mencatat panggilan, menjawab dari penangan yang diberikan. */
function mockFetch(penangan: (url: string) => { status: number; body: unknown }) {
  const panggil: Array<{ url: string; init?: Parameters<FetchFn>[1] }> = [];
  const fetchFn: FetchFn = async (url, init) => {
    panggil.push({ url, init });
    const { status, body } = penangan(url);
    return { ok: status >= 200 && status < 300, status, json: async () => body };
  };
  return { fetchFn, panggil };
}

describe("SessionClient", () => {
  it("me(): 401 -> null (bukan error), request pakai credentials include", async () => {
    const { fetchFn, panggil } = mockFetch(() => ({ status: 401, body: { ok: false, error: "Belum masuk." } }));
    const klien = new SessionClient({ fetchFn });
    await expect(klien.me()).resolves.toBeNull();
    expect(panggil).toHaveLength(1);
    expect(panggil[0].url).toBe("/api/auth/me");
    expect(panggil[0].init?.method).toBe("GET");
    expect(panggil[0].init?.credentials).toBe("include");
  });

  it("me(): 200 -> sesi berisi user dari backend", async () => {
    const { fetchFn } = mockFetch(() => ({
      status: 200,
      body: { ok: true, user: { name: "Penguji", email: "uji@contoh.id" } },
    }));
    await expect(new SessionClient({ fetchFn }).me()).resolves.toEqual(SESI);
  });

  it("me(): 500 -> AuthApiError (dibedakan dari belum login)", async () => {
    const { fetchFn } = mockFetch(() => ({ status: 500, body: { ok: false, error: "Server bermasalah." } }));
    await expect(new SessionClient({ fetchFn }).me()).rejects.toMatchObject({
      name: "AuthApiError",
      status: 500,
      message: "Server bermasalah.",
    });
  });

  it("login(): sukses mengirim email/password sebagai JSON dan mengembalikan sesi", async () => {
    const { fetchFn, panggil } = mockFetch(() => ({
      status: 200,
      body: { ok: true, user: { name: "Penguji", email: "uji@contoh.id" } },
    }));
    const klien = new SessionClient({ fetchFn });
    await expect(klien.login("uji@contoh.id", "rahasia123")).resolves.toEqual(SESI);
    expect(panggil[0].url).toBe("/api/auth/login");
    expect(panggil[0].init?.method).toBe("POST");
    expect(panggil[0].init?.credentials).toBe("include");
    expect(JSON.parse(panggil[0].init?.body ?? "{}")).toMatchObject({
      email: "uji@contoh.id",
      password: "rahasia123",
    });
  });

  it("login(): gagal 401 -> AuthApiError dengan pesan server", async () => {
    const { fetchFn } = mockFetch(() => ({
      status: 401,
      body: { ok: false, error: "Email atau kata sandi tidak tepat." },
    }));
    const klien = new SessionClient({ fetchFn });
    const err = await klien.login("uji@contoh.id", "salah").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(AuthApiError);
    expect((err as AuthApiError).status).toBe(401);
    expect((err as AuthApiError).message).toBe("Email atau kata sandi tidak tepat.");
  });

  it("register(): 201 -> sesi; logout(): POST ke /api/auth/logout", async () => {
    const { fetchFn, panggil } = mockFetch((url) =>
      url.endsWith("/register")
        ? { status: 201, body: { ok: true, user: { name: "Baru", email: "baru@contoh.id" } } }
        : { status: 200, body: { ok: true } },
    );
    const klien = new SessionClient({ fetchFn });
    await expect(klien.register("Baru", "baru@contoh.id", "rahasia123")).resolves.toEqual({
      user: { name: "Baru", email: "baru@contoh.id" },
    });
    await expect(klien.logout()).resolves.toBeUndefined();
    expect(panggil.map((p) => p.url)).toEqual(["/api/auth/register", "/api/auth/logout"]);
    expect(panggil.every((p) => p.init?.credentials === "include")).toBe(true);
  });

  it("baseUrl dipakai dan slash akhirnya dibuang", async () => {
    const { fetchFn, panggil } = mockFetch(() => ({ status: 401, body: { ok: false } }));
    const klien = new SessionClient({ fetchFn, baseUrl: "https://zonasipil.web.id/" });
    await klien.me();
    expect(panggil[0].url).toBe("https://zonasipil.web.id/api/auth/me");
  });

  it("tidak menyentuh localStorage/sessionStorage sama sekali", async () => {
    const spyGet = vi.fn();
    const penyimpanan = { getItem: spyGet, setItem: vi.fn(), removeItem: vi.fn() };
    vi.stubGlobal("localStorage", penyimpanan);
    vi.stubGlobal("sessionStorage", penyimpanan);
    try {
      const { fetchFn } = mockFetch(() => ({
        status: 200,
        body: { ok: true, user: { name: "Penguji", email: "uji@contoh.id" } },
      }));
      const klien = new SessionClient({ fetchFn });
      await klien.me();
      await klien.login("uji@contoh.id", "rahasia123");
      await klien.logout();
      expect(penyimpanan.getItem).not.toHaveBeenCalled();
      expect(penyimpanan.setItem).not.toHaveBeenCalled();
      expect(penyimpanan.removeItem).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
