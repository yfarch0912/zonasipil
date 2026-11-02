import { describe, expect, it } from "vitest";
import {
  APP_SLUG,
  beratTulanganElemen,
  kebutuhanBata,
  kebutuhanBataPerM2,
  luasAcian,
  rekapMaterial,
  volumeBetonElemen,
  volumeMortarPlester,
} from "../src/index";

describe("volumeBetonElemen", () => {
  it("p × l × t × jumlah: 3 × 2 × 0,5 × 2 = 6 m³", () => {
    expect(volumeBetonElemen(3, 2, 0.5, 2)).toBeCloseTo(6, 10);
  });

  it("balok 4 × 0,3 × 0,4 m sebanyak 5 buah = 2,4 m³", () => {
    expect(volumeBetonElemen(4, 0.3, 0.4, 5)).toBeCloseTo(2.4, 10);
  });

  it("menolak dimensi tidak positif dan jumlah tidak bulat / < 1", () => {
    expect(() => volumeBetonElemen(0, 2, 0.5, 1)).toThrow(Error);
    expect(() => volumeBetonElemen(3, -2, 0.5, 1)).toThrow(Error);
    expect(() => volumeBetonElemen(3, 2, Number.NaN, 1)).toThrow(Error);
    expect(() => volumeBetonElemen(3, 2, 0.5, 0)).toThrow(Error);
    expect(() => volumeBetonElemen(3, 2, 0.5, 2.5)).toThrow(Error);
  });
});

describe("beratTulanganElemen", () => {
  it("D13, 10 batang × 12 m: perMeter 1,041885 kg/m, total 125,0262 kg", () => {
    const hasil = beratTulanganElemen({
      diameterMm: 13,
      jumlahBatang: 10,
      panjangPerBatangM: 12,
    });
    expect(hasil.perMeter).toBeCloseTo(1.041885, 9);
    expect(hasil.totalKg).toBeCloseTo(125.0262, 6);
  });

  it("D16 = 0,006165 × 256 = 1,57824 kg/m", () => {
    const hasil = beratTulanganElemen({
      diameterMm: 16,
      jumlahBatang: 8,
      panjangPerBatangM: 4,
    });
    expect(hasil.perMeter).toBeCloseTo(1.57824, 9);
    expect(hasil.totalKg).toBeCloseTo(50.50368, 6);
  });

  it("menolak diameter tidak positif, jumlah batang < 1 / pecahan, panjang <= 0", () => {
    expect(() =>
      beratTulanganElemen({ diameterMm: 0, jumlahBatang: 4, panjangPerBatangM: 6 }),
    ).toThrow(Error);
    expect(() =>
      beratTulanganElemen({ diameterMm: -10, jumlahBatang: 4, panjangPerBatangM: 6 }),
    ).toThrow(Error);
    expect(() =>
      beratTulanganElemen({ diameterMm: 10, jumlahBatang: 0, panjangPerBatangM: 6 }),
    ).toThrow(Error);
    expect(() =>
      beratTulanganElemen({ diameterMm: 10, jumlahBatang: 1.5, panjangPerBatangM: 6 }),
    ).toThrow(Error);
    expect(() =>
      beratTulanganElemen({ diameterMm: 10, jumlahBatang: 4, panjangPerBatangM: 0 }),
    ).toThrow(Error);
  });
});

describe("kebutuhanBataPerM2", () => {
  it("kasus verifikasi: bata 0,20 × 0,05 m, siar 0,01 -> 1/(0,21 × 0,06) = 79,365… (tol 0,01)", () => {
    const hasil = kebutuhanBataPerM2(0.2, 0.05, 0.01);
    expect(Math.abs(hasil - 79.365079)).toBeLessThanOrEqual(0.01);
    expect(hasil).toBeCloseTo(1 / (0.21 * 0.06), 9);
  });

  it("siar bawaan adalah 0,01 m", () => {
    expect(kebutuhanBataPerM2(0.2, 0.05)).toBeCloseTo(
      kebutuhanBataPerM2(0.2, 0.05, 0.01),
      12,
    );
  });

  it("tanpa siar: 1/(0,20 × 0,05) = 100 bata/m²", () => {
    expect(kebutuhanBataPerM2(0.2, 0.05, 0)).toBeCloseTo(100, 10);
  });

  it("menolak ukuran bata tidak positif dan siar negatif / NaN", () => {
    expect(() => kebutuhanBataPerM2(0, 0.05)).toThrow(Error);
    expect(() => kebutuhanBataPerM2(0.2, -0.05)).toThrow(Error);
    expect(() => kebutuhanBataPerM2(0.2, 0.05, -0.01)).toThrow(Error);
    expect(() => kebutuhanBataPerM2(Number.NaN, 0.05)).toThrow(Error);
  });
});

describe("kebutuhanBata", () => {
  it("10 m² bata 0,20 × 0,05 siar 0,01: 79,365… × 10 = 793,65 -> dibulatkan ke atas 794", () => {
    expect(kebutuhanBata(10, 0.2, 0.05, 0.01)).toBe(794);
    expect(kebutuhanBata(10, 0.2, 0.05)).toBe(794);
  });

  it("dengan waste 5%: 793,65… × 1,05 = 833,33… -> 834", () => {
    expect(kebutuhanBata(10, 0.2, 0.05, 0.01, 5)).toBe(834);
  });

  it("hasil selalu bilangan bulat", () => {
    expect(Number.isInteger(kebutuhanBata(3.7, 0.2, 0.05))).toBe(true);
  });

  it("menolak luas tidak positif dan waste di luar 0–100", () => {
    expect(() => kebutuhanBata(0, 0.2, 0.05)).toThrow(Error);
    expect(() => kebutuhanBata(-4, 0.2, 0.05)).toThrow(Error);
    expect(() => kebutuhanBata(10, 0.2, 0.05, 0.01, 101)).toThrow(Error);
    expect(() => kebutuhanBata(10, 0.2, 0.05, 0.01, -5)).toThrow(Error);
  });
});

describe("volumeMortarPlester dan luasAcian", () => {
  it("plester: luas × tebal, tebal bawaan 0,015 m -> 10 m² = 0,15 m³", () => {
    expect(volumeMortarPlester(10)).toBeCloseTo(0.15, 10);
    expect(volumeMortarPlester(20, 0.02)).toBeCloseTo(0.4, 10);
  });

  it("acian dihitung per m²: luas keluaran sama dengan luas masukan", () => {
    expect(luasAcian(25)).toBe(25);
    expect(luasAcian(12.5)).toBeCloseTo(12.5, 12);
  });

  it("menolak luas / tebal tidak positif", () => {
    expect(() => volumeMortarPlester(0)).toThrow(Error);
    expect(() => volumeMortarPlester(10, 0)).toThrow(Error);
    expect(() => volumeMortarPlester(10, -0.015)).toThrow(Error);
    expect(() => luasAcian(0)).toThrow(Error);
    expect(() => luasAcian(Number.NaN)).toThrow(Error);
  });
});

describe("rekapMaterial", () => {
  it("menjumlahkan beton & tulangan lintas elemen (hitung tangan)", () => {
    // Balok : beton 4 × 0,3 × 0,4 × 2 = 0,96 m³
    //         tulangan D16: 1,57824 kg/m × 8 batang × 4 m = 50,50368 kg
    // Kolom : beton 3 × 0,3 × 0,3 × 4 = 1,08 m³
    //         tulangan D13: 1,041885 kg/m × 12 batang × 3 m = 37,50786 kg
    // Total : beton 2,04 m³ ; tulangan 88,01154 kg
    const hasil = rekapMaterial([
      {
        nama: "Balok B1",
        beton: { panjangM: 4, lebarM: 0.3, tebalM: 0.4, jumlah: 2 },
        tulangan: [{ diameterMm: 16, jumlahBatang: 8, panjangPerBatangM: 4 }],
      },
      {
        nama: "Kolom K1",
        beton: { panjangM: 3, lebarM: 0.3, tebalM: 0.3, jumlah: 4 },
        tulangan: [
          { diameterMm: 13, jumlahBatang: 12, panjangPerBatangM: 3 },
        ],
      },
    ]);

    expect(hasil.totalVolumeBetonM3).toBeCloseTo(2.04, 9);
    expect(hasil.totalBeratTulanganKg).toBeCloseTo(88.01154, 6);
    expect(hasil.rincian).toHaveLength(2);
    expect(hasil.rincian[0].nama).toBe("Balok B1");
    expect(hasil.rincian[0].volumeBetonM3).toBeCloseTo(0.96, 9);
    expect(hasil.rincian[0].beratTulanganKg).toBeCloseTo(50.50368, 6);
    expect(hasil.rincian[1].volumeBetonM3).toBeCloseTo(1.08, 9);
    expect(hasil.rincian[1].beratTulanganKg).toBeCloseTo(37.50786, 6);
  });

  it("elemen hanya beton / hanya tulangan tetap direkap, sisi kosong bernilai 0", () => {
    const hasil = rekapMaterial([
      { beton: { panjangM: 2, lebarM: 1, tebalM: 0.1, jumlah: 1 } },
      {
        tulangan: [
          { diameterMm: 10, jumlahBatang: 5, panjangPerBatangM: 2 },
        ],
      },
    ]);
    expect(hasil.totalVolumeBetonM3).toBeCloseTo(0.2, 10);
    // D10: 0,6165 × 5 × 2 = 6,165 kg
    expect(hasil.totalBeratTulanganKg).toBeCloseTo(6.165, 9);
    expect(hasil.rincian[0].nama).toBe("Elemen ke-1");
    expect(hasil.rincian[0].beratTulanganKg).toBe(0);
    expect(hasil.rincian[1].volumeBetonM3).toBe(0);
  });

  it("beberapa kelompok diameter dalam satu elemen dijumlahkan", () => {
    const hasil = rekapMaterial([
      {
        nama: "Pelat",
        tulangan: [
          { diameterMm: 10, jumlahBatang: 10, panjangPerBatangM: 3 },
          { diameterMm: 8, jumlahBatang: 10, panjangPerBatangM: 3 },
        ],
      },
    ]);
    // D10: 0,6165 × 30 = 18,495 kg ; D8: 0,39456 × 30 = 11,8368 kg
    expect(hasil.totalBeratTulanganKg).toBeCloseTo(30.3318, 6);
  });

  it("menolak daftar kosong dan elemen tanpa beton maupun tulangan", () => {
    expect(() => rekapMaterial([])).toThrow(Error);
    expect(() => rekapMaterial([{ nama: "Kosong" }])).toThrow(Error);
    expect(() => rekapMaterial([{ tulangan: [] }])).toThrow(Error);
  });

  it("galat validasi bagian diteruskan (mis. dimensi beton negatif)", () => {
    expect(() =>
      rekapMaterial([
        { beton: { panjangM: -1, lebarM: 0.3, tebalM: 0.4, jumlah: 1 } },
      ]),
    ).toThrow(Error);
  });

  it("slug app tetap quantity", () => {
    expect(APP_SLUG).toBe("quantity");
  });
});
