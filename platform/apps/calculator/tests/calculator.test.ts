import { describe, expect, it } from "vitest";
import {
  APP_SLUG,
  beratTulangan,
  convert,
  convertArea,
  convertForce,
  convertLength,
  convertMass,
  convertMoment,
  convertPressure,
  convertVolume,
  volumeBeton,
} from "../src/index";

describe("volumeBeton", () => {
  it("kasus verifikasi situs live: 3 × 2 × 0,5 m, 1 elemen, waste 5%", () => {
    const hasil = volumeBeton(3, 2, 0.5, 1, 5);
    expect(hasil.bersih).toBeCloseTo(3.0, 10);
    expect(hasil.denganWaste).toBeCloseTo(3.15, 10);
  });

  it("waste bawaan adalah 5%", () => {
    const hasil = volumeBeton(2, 1, 0.1, 4);
    expect(hasil.bersih).toBeCloseTo(0.8, 10);
    expect(hasil.denganWaste).toBeCloseTo(0.84, 10);
  });

  it("waste 0% membuat denganWaste sama dengan bersih", () => {
    const hasil = volumeBeton(4, 0.3, 0.2, 10, 0);
    expect(hasil.bersih).toBeCloseTo(2.4, 10);
    expect(hasil.denganWaste).toBeCloseTo(2.4, 10);
  });

  it("waste 100% menggandakan volume bersih (batas rentang)", () => {
    const hasil = volumeBeton(1, 1, 1, 1, 100);
    expect(hasil.bersih).toBeCloseTo(1, 10);
    expect(hasil.denganWaste).toBeCloseTo(2, 10);
  });

  it("menolak dimensi tidak positif / NaN", () => {
    expect(() => volumeBeton(0, 2, 0.5, 1)).toThrow(Error);
    expect(() => volumeBeton(-3, 2, 0.5, 1)).toThrow(Error);
    expect(() => volumeBeton(3, Number.NaN, 0.5, 1)).toThrow(Error);
    expect(() => volumeBeton(3, 2, -0.5, 1)).toThrow(Error);
    expect(() => volumeBeton(3, 2, Number.POSITIVE_INFINITY, 1)).toThrow(
      Error,
    );
  });

  it("menolak jumlah elemen 0, negatif, atau bukan bilangan bulat", () => {
    expect(() => volumeBeton(3, 2, 0.5, 0)).toThrow(Error);
    expect(() => volumeBeton(3, 2, 0.5, -2)).toThrow(Error);
    expect(() => volumeBeton(3, 2, 0.5, 1.5)).toThrow(Error);
  });

  it("menolak waste di luar rentang 0–100", () => {
    expect(() => volumeBeton(3, 2, 0.5, 1, -1)).toThrow(Error);
    expect(() => volumeBeton(3, 2, 0.5, 1, 101)).toThrow(Error);
    expect(() => volumeBeton(3, 2, 0.5, 1, Number.NaN)).toThrow(Error);
  });
});

describe("beratTulangan", () => {
  it("kasus verifikasi: D13 per meter ≈ 1,042 kg/m (tol 0,001)", () => {
    const { perMeter } = beratTulangan(13, 1);
    expect(Math.abs(perMeter - 1.042)).toBeLessThanOrEqual(0.001);
    // Nilai eksak rumus: 0,006165 × 13² = 1,041885 kg/m
    expect(perMeter).toBeCloseTo(1.041885, 9);
  });

  it("kasus verifikasi: D13 sepanjang 120 m ≈ 125,0 kg (tol 0,1)", () => {
    const { total } = beratTulangan(13, 120);
    expect(Math.abs(total - 125.0)).toBeLessThanOrEqual(0.1);
    // Nilai eksak rumus: 1,041885 × 120 = 125,0262 kg
    expect(total).toBeCloseTo(125.0262, 6);
  });

  it("D10 = 0,6165 kg/m sesuai faktor 0,006165", () => {
    const { perMeter, total } = beratTulangan(10, 12);
    expect(perMeter).toBeCloseTo(0.6165, 9);
    expect(total).toBeCloseTo(7.398, 9);
  });

  it("menolak diameter / panjang tidak positif atau NaN", () => {
    expect(() => beratTulangan(0, 10)).toThrow(Error);
    expect(() => beratTulangan(-13, 10)).toThrow(Error);
    expect(() => beratTulangan(Number.NaN, 10)).toThrow(Error);
    expect(() => beratTulangan(13, 0)).toThrow(Error);
    expect(() => beratTulangan(13, -5)).toThrow(Error);
    expect(() => beratTulangan(13, Number.NaN)).toThrow(Error);
  });
});

describe("konversi satuan (ekspor ulang dari engineering-core)", () => {
  it("fungsi convert* tersedia dan bekerja apa adanya", () => {
    expect(convertLength(1, "m", "cm")).toBeCloseTo(100, 10);
    expect(convertLength(1, "inch", "mm")).toBeCloseTo(25.4, 10);
    expect(convertArea(1, "ha", "m2")).toBe(10000);
    expect(convertVolume(1, "m3", "liter")).toBeCloseTo(1000, 9);
    expect(convertMass(1, "ton", "kg")).toBe(1000);
    expect(convertForce(1, "tf", "N")).toBe(9806.65);
    expect(convertMoment(1, "kgfm", "Nm")).toBe(9.80665);
    expect(convertPressure(1, "MPa", "kPa")).toBeCloseTo(1000, 9);
    expect(convert(2.5, "kg", "g", "mass")).toBeCloseTo(2500, 10);
  });

  it("galat core diteruskan: satuan tak dikenal / nilai NaN melempar", () => {
    expect(() => convertLength(1, "m" as never, "league" as never)).toThrow(
      Error,
    );
    expect(() => convert(Number.NaN, "m", "cm", "length")).toThrow(Error);
  });

  it("slug app tetap calculator", () => {
    expect(APP_SLUG).toBe("calculator");
  });
});
