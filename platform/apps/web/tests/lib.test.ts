import { describe, expect, it } from "vitest";
import { parseAngkaID, parseField } from "../src/lib/parse";
import { formatHasil, formatRupiah } from "../src/lib/format";
import {
  barisKeItem,
  barisKosong,
  buatBaris,
  daftarKeItems,
  hapusBaris,
  tambahBaris,
  ubahBaris,
} from "../src/lib/rab-state";
import { UNIT_KINDS, UNIT_OPTIONS } from "../src/lib/units";

describe("parseAngkaID", () => {
  it("menerima format Indonesia 1.234,56", () => {
    expect(parseAngkaID("1.234,56")).toEqual({ ok: true, value: 1234.56 });
  });
  it("menerima koma desimal sederhana 0,5", () => {
    expect(parseAngkaID("0,5")).toEqual({ ok: true, value: 0.5 });
  });
  it("menerima titik desimal 1234.56", () => {
    expect(parseAngkaID("1234.56")).toEqual({ ok: true, value: 1234.56 });
  });
  it("menolak kosong", () => {
    const h = parseAngkaID("  ");
    expect(h.ok).toBe(false);
    if (!h.ok) expect(h.error).toContain("kosong");
  });
  it("menolak non-numerik", () => {
    expect(parseAngkaID("abc").ok).toBe(false);
    expect(parseAngkaID("12a").ok).toBe(false);
  });
  it("menolak koma ganda dan titik ganda tanpa koma", () => {
    expect(parseAngkaID("1,2,3").ok).toBe(false);
    expect(parseAngkaID("1.2.3").ok).toBe(false);
  });
  it("tidak pernah menghasilkan NaN", () => {
    for (const s of ["", "x", "1.2.3", ",,", "NaN", "Infinity"]) {
      const h = parseAngkaID(s);
      if (h.ok) expect(Number.isFinite(h.value)).toBe(true);
      else expect(h.error.length).toBeGreaterThan(0);
    }
  });
});

describe("parseField", () => {
  it("menolak negatif/0 untuk field positif dengan pesan menyebut label", () => {
    const h = parseField("-3", { label: "Panjang (m)", positif: true });
    expect(h.ok).toBe(false);
    if (!h.ok) expect(h.error).toContain("Panjang (m)");
    expect(parseField("0", { label: "Panjang (m)", positif: true }).ok).toBe(false);
  });
  it("mengizinkan 0 untuk field tidakNegatif, menolak negatif", () => {
    expect(parseField("0", { label: "Kohesi", tidakNegatif: true })).toEqual({ ok: true, value: 0 });
    expect(parseField("-1", { label: "Kohesi", tidakNegatif: true }).ok).toBe(false);
  });
  it("menolak pecahan untuk field bulat", () => {
    expect(parseField("2,5", { label: "Jumlah elemen", bulat: true }).ok).toBe(false);
    expect(parseField("2", { label: "Jumlah elemen", bulat: true }).ok).toBe(true);
  });
  it("menolak nilai di atas maksimum (persen)", () => {
    expect(parseField("101", { label: "Waste (%)", maksimum: 100 }).ok).toBe(false);
    expect(parseField("100", { label: "Waste (%)", maksimum: 100 }).ok).toBe(true);
  });
});

describe("format", () => {
  it("formatHasil memakai format Indonesia", () => {
    expect(formatHasil(1234.5, 2)).toBe("1.234,50");
    expect(formatHasil(3, 3)).toBe("3,000");
  });
  it("formatHasil tidak pernah NaN/undefined", () => {
    expect(formatHasil(Number.NaN)).toBe("—");
    expect(formatHasil(Number.POSITIVE_INFINITY)).toBe("—");
  });
  it("formatRupiah membulatkan dan memakai pemisah ribuan", () => {
    expect(formatRupiah(4995000)).toBe("Rp4.995.000");
    expect(formatRupiah(1500.6)).toBe("Rp1.501");
    expect(formatRupiah(Number.NaN)).toBe("—");
  });
});

describe("rab-state", () => {
  it("tambahBaris menambah dengan id baru unik, tidak mengubah aslinya", () => {
    const awal = [buatBaris(1, { uraian: "A" })];
    const baru = tambahBaris(awal, { uraian: "B" });
    expect(baru).toHaveLength(2);
    expect(baru[1].id).toBe(2);
    expect(awal).toHaveLength(1);
  });
  it("hapusBaris hanya menghapus id sasaran", () => {
    const awal = tambahBaris([buatBaris(1)], {});
    expect(hapusBaris(awal, 1).map((b) => b.id)).toEqual([2]);
    expect(hapusBaris(awal, 99)).toHaveLength(2);
  });
  it("ubahBaris mengubah baris sasaran saja", () => {
    const awal = [buatBaris(1, { uraian: "A" }), buatBaris(2, { uraian: "B" })];
    const baru = ubahBaris(awal, 2, { uraian: "B2" });
    expect(baru[0].uraian).toBe("A");
    expect(baru[1].uraian).toBe("B2");
  });
  it("barisKeItem mengonversi angka format Indonesia", () => {
    const item = barisKeItem(
      buatBaris(1, { seksi: " Struktur ", uraian: "Beton", volume: "2,5", satuan: "m3", hargaSatuan: "1.200.000" }),
    );
    expect(item).toEqual({ seksi: "Struktur", uraian: "Beton", volume: 2.5, satuan: "m3", hargaSatuan: 1200000 });
  });
  it("barisKeItem tanpa seksi tidak mengisi seksi (paket memakai Umum)", () => {
    const item = barisKeItem(buatBaris(1, { uraian: "X", volume: "1", satuan: "ls", hargaSatuan: "100" }));
    expect("seksi" in item).toBe(false);
  });
  it("barisKeItem melempar Error Indonesia untuk uraian kosong / volume negatif / harga non-numerik", () => {
    expect(() => barisKeItem(buatBaris(1, { volume: "1", satuan: "m3", hargaSatuan: "1" }))).toThrow(/Uraian/);
    expect(() =>
      barisKeItem(buatBaris(1, { uraian: "X", volume: "-1", satuan: "m3", hargaSatuan: "1" })),
    ).toThrow(/Volume/);
    expect(() =>
      barisKeItem(buatBaris(1, { uraian: "X", volume: "1", satuan: "m3", hargaSatuan: "abc" })),
    ).toThrow(/Harga satuan/);
  });
  it("daftarKeItems melewati baris kosong", () => {
    const baris = [buatBaris(1), buatBaris(2, { uraian: "X", volume: "1", satuan: "ls", hargaSatuan: "100" })];
    expect(barisKosong(baris[0])).toBe(true);
    expect(daftarKeItems(baris)).toHaveLength(1);
    expect(daftarKeItems([buatBaris(1)])).toEqual([]);
  });
});

describe("units lib", () => {
  it("setiap kategori punya minimal 3 satuan dan kategori lengkap", () => {
    expect(UNIT_KINDS).toEqual(["length", "area", "volume", "mass", "force", "moment", "pressure"]);
    for (const k of UNIT_KINDS) expect(UNIT_OPTIONS[k].length).toBeGreaterThanOrEqual(3);
  });
});
