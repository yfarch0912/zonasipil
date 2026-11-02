import { describe, expect, it } from "vitest";
import { RUTE_HASH_SAH, SLUG_ALAT, hashAlat, hashLogin, uraiHash, validasiNextWeb } from "../src/lib/gate";

describe("gate: uraiHash", () => {
  it("hash kosong dan #/ berarti beranda", () => {
    expect(uraiHash("").slug).toBe("");
    expect(uraiHash("#/").slug).toBe("");
  });
  it("slug alat terbaca", () => {
    expect(uraiHash("#/calculator").slug).toBe("calculator");
    expect(uraiHash("#/rab").slug).toBe("rab");
  });
  it("query params terbaca (next terdekode)", () => {
    const rute = uraiHash("#/login?next=%23%2Fcalculator");
    expect(rute.slug).toBe("login");
    expect(rute.params.get("next")).toBe("#/calculator");
  });
});

describe("gate: validasiNextWeb", () => {
  it("keenam rute alat dan beranda sah", () => {
    expect(SLUG_ALAT).toHaveLength(6);
    for (const slug of SLUG_ALAT) expect(validasiNextWeb(hashAlat(slug))).toBe(hashAlat(slug));
    expect(validasiNextWeb("#/")).toBe("#/");
    expect(RUTE_HASH_SAH).toContain("#/rab");
  });
  it("tujuan eksternal / tak dikenal jatuh ke #/", () => {
    expect(validasiNextWeb("https://evil.example")).toBe("#/");
    expect(validasiNextWeb("//evil.example")).toBe("#/");
    expect(validasiNextWeb("/apps/calculator")).toBe("#/"); // path situs, bukan rute shell ini
    expect(validasiNextWeb("#/survey")).toBe("#/"); // slug tanpa halaman di shell
    expect(validasiNextWeb("#/login")).toBe("#/");
    expect(validasiNextWeb(null)).toBe("#/");
    expect(validasiNextWeb("")).toBe("#/");
  });
  it("hashLogin mengenkode next dan uraiHash membacanya kembali", () => {
    const hash = hashLogin("#/steel");
    expect(hash.startsWith("#/login?next=")).toBe(true);
    expect(uraiHash(hash).params.get("next")).toBe("#/steel");
    expect(validasiNextWeb(uraiHash(hash).params.get("next"))).toBe("#/steel");
  });
});
