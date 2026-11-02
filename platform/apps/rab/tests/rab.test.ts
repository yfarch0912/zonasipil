import { describe, expect, it } from "vitest";
import {
  bulatRupiah,
  eksporCSV,
  eksporJSON,
  hitungItem,
  hitungRAB,
  type ItemPekerjaan,
} from "../src/index";

const itemBeton: ItemPekerjaan = {
  uraian: "Beton struktur",
  volume: 2.5,
  satuan: "m3",
  hargaSatuan: 1_200_000,
  seksi: "Pekerjaan Struktur",
};

const itemBesi: ItemPekerjaan = {
  uraian: "Besi tulangan",
  volume: 10,
  satuan: "kg",
  hargaSatuan: 150_000,
};

describe("hitungItem", () => {
  it("jumlah = volume × hargaSatuan", () => {
    expect(hitungItem(itemBeton).jumlah).toBe(3_000_000);
    expect(hitungItem(itemBesi).jumlah).toBe(1_500_000);
  });

  it("item tanpa seksi masuk seksi Umum", () => {
    expect(hitungItem(itemBesi).seksi).toBe("Umum");
    expect(hitungItem(itemBeton).seksi).toBe("Pekerjaan Struktur");
  });

  it("volume nol dan harga nol sah (jumlah 0)", () => {
    expect(hitungItem({ uraian: "Gratis", volume: 0, satuan: "ls", hargaSatuan: 0 }).jumlah).toBe(0);
  });

  it("menolak item tidak valid", () => {
    expect(() => hitungItem({ ...itemBeton, volume: -1 })).toThrowError(/Volume/);
    expect(() => hitungItem({ ...itemBeton, hargaSatuan: -1000 })).toThrowError(
      /Harga satuan/,
    );
    expect(() => hitungItem({ ...itemBeton, uraian: "" })).toThrowError(/Uraian/);
    expect(() => hitungItem({ ...itemBeton, uraian: "   " })).toThrowError(/Uraian/);
    expect(() => hitungItem({ ...itemBeton, satuan: "" })).toThrowError(/Satuan/);
    expect(() => hitungItem({ ...itemBeton, volume: Number.NaN })).toThrowError(/Volume/);
    expect(() => hitungItem({ ...itemBeton, seksi: " " })).toThrowError(/Seksi/);
  });
});

describe("hitungRAB", () => {
  it("dua item diketahui: total, pajak 11%, dan grand total eksak", () => {
    const hasil = hitungRAB([itemBeton, itemBesi]);
    expect(hasil.perItem.map((i) => i.jumlah)).toEqual([3_000_000, 1_500_000]);
    expect(hasil.totalSebelumPajak).toBe(4_500_000);
    expect(hasil.ppnPersen).toBe(11);
    expect(hasil.ppn).toBe(495_000);
    expect(hasil.grandTotal).toBe(4_995_000);
  });

  it("subtotal per seksi mengelompok dengan benar", () => {
    const hasil = hitungRAB([
      itemBeton,
      itemBesi,
      {
        uraian: "Bekisting",
        volume: 4,
        satuan: "m2",
        hargaSatuan: 250_000,
        seksi: "Pekerjaan Struktur",
      },
    ]);
    expect(hasil.perSeksi).toEqual([
      { seksi: "Pekerjaan Struktur", subtotal: 4_000_000 },
      { seksi: "Umum", subtotal: 1_500_000 },
    ]);
    expect(hasil.totalSebelumPajak).toBe(5_500_000);
  });

  it("ppnPersen adalah parameter: 0% dan 10% menghasilkan pajak sesuai isian", () => {
    const tanpaPajak = hitungRAB([itemBeton, itemBesi], { ppnPersen: 0 });
    expect(tanpaPajak.ppn).toBe(0);
    expect(tanpaPajak.grandTotal).toBe(4_500_000);

    const sepuluh = hitungRAB([itemBeton, itemBesi], { ppnPersen: 10 });
    expect(sepuluh.ppn).toBe(450_000);
    expect(sepuluh.grandTotal).toBe(4_950_000);
  });

  it("daftar kosong menghasilkan semua total 0", () => {
    const hasil = hitungRAB([]);
    expect(hasil.perItem).toEqual([]);
    expect(hasil.perSeksi).toEqual([]);
    expect(hasil.totalSebelumPajak).toBe(0);
    expect(hasil.ppn).toBe(0);
    expect(hasil.grandTotal).toBe(0);
  });

  it("satu item tidak valid menggagalkan seluruh perhitungan", () => {
    expect(() => hitungRAB([itemBeton, { ...itemBesi, volume: -2 }])).toThrowError(/Volume/);
    expect(() => hitungRAB([itemBeton], { ppnPersen: -1 })).toThrowError(/ppnPersen/);
  });
});

describe("bulatRupiah", () => {
  it("membulatkan ke rupiah bulat terdekat", () => {
    expect(bulatRupiah(1234.4)).toBe(1234);
    expect(bulatRupiah(1234.5)).toBe(1235);
    expect(bulatRupiah(4_995_000)).toBe(4_995_000);
  });

  it("menolak nilai tidak hingga", () => {
    expect(() => bulatRupiah(Number.POSITIVE_INFINITY)).toThrowError(/rupiah/);
  });
});

describe("eksporCSV", () => {
  const csv = eksporCSV(hitungRAB([itemBeton, itemBesi]));

  it("memakai header dan pemisah titik koma", () => {
    expect(csv.split("\n")[0]).toBe("Seksi;Uraian;Volume;Satuan;Harga Satuan;Jumlah");
  });

  it("mengandung baris item dan baris total", () => {
    expect(csv).toContain("Pekerjaan Struktur;Beton struktur;2.5;m3;1200000;3000000");
    expect(csv).toContain("Umum;Besi tulangan;10;kg;150000;1500000");
    expect(csv).toContain("Total Sebelum Pajak");
    expect(csv).toContain("4500000");
    expect(csv).toContain("Pajak (11%)");
    expect(csv).toContain("495000");
    expect(csv).toContain("Grand Total");
    expect(csv).toContain("4995000");
  });

  it("uraian berisi titik koma dibungkus tanda kutip", () => {
    const hasil = hitungRAB([
      { uraian: "Galian; urugan kembali", volume: 1, satuan: "ls", hargaSatuan: 1000 },
    ]);
    expect(eksporCSV(hasil)).toContain('"Galian; urugan kembali"');
  });
});

describe("eksporJSON", () => {
  it("menghasilkan JSON rapi yang dapat di-parse kembali", () => {
    const json = eksporJSON(hitungRAB([itemBeton, itemBesi]));
    const parsed = JSON.parse(json) as ReturnType<typeof hitungRAB>;
    expect(parsed.totalSebelumPajak).toBe(4_500_000);
    expect(parsed.ppn).toBe(495_000);
    expect(parsed.grandTotal).toBe(4_995_000);
    expect(parsed.perItem).toHaveLength(2);
    expect(json).toContain("\n  ");
  });
});
