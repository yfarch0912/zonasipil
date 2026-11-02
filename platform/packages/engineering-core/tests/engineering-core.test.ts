import { describe, expect, it } from "vitest";
import {
  FAKTOR_BERAT_BESI,
  GRAVITASI,
  RHO_BAJA,
  RHO_BETON_BERTULANG,
  beratBesiPerMeter,
  convert,
  convertArea,
  convertForce,
  convertLength,
  convertMass,
  convertMoment,
  convertPressure,
  convertVolume,
  formatAngkaID,
} from "../src/index";

function closeToRel(actual: number, expected: number, relTol: number) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(
    Math.abs(expected) * relTol,
  );
}

describe("konversi panjang", () => {
  it("inch dan ft berbasis definisi eksak", () => {
    expect(convertLength(1, "inch", "mm")).toBeCloseTo(25.4, 12);
    expect(convertLength(1, "ft", "mm")).toBeCloseTo(304.8, 12);
    expect(convertLength(12, "inch", "ft")).toBeCloseTo(1, 12);
  });
  it("bolak-balik m <-> km / cm / mm", () => {
    expect(convertLength(1, "km", "m")).toBe(1000);
    expect(convertLength(2500, "m", "km")).toBe(2.5);
    closeToRel(convertLength(convertLength(3.75, "m", "cm"), "cm", "m"), 3.75, 1e-12);
    closeToRel(convertLength(convertLength(42, "mm", "inch"), "inch", "mm"), 42, 1e-12);
  });
});

describe("konversi luas", () => {
  it("m2 <-> ha / cm2 / mm2 bolak-balik", () => {
    expect(convertArea(1, "ha", "m2")).toBe(10000);
    expect(convertArea(10000, "m2", "ha")).toBe(1);
    expect(convertArea(1, "m2", "cm2")).toBeCloseTo(10000, 9);
    closeToRel(convertArea(convertArea(2.5, "m2", "mm2"), "mm2", "m2"), 2.5, 1e-12);
  });
});

describe("konversi volume", () => {
  it("m3 <-> liter / cm3 bolak-balik", () => {
    expect(convertVolume(1, "m3", "liter")).toBeCloseTo(1000, 9);
    expect(convertVolume(1500, "liter", "m3")).toBeCloseTo(1.5, 12);
    closeToRel(convertVolume(convertVolume(0.75, "m3", "cm3"), "cm3", "m3"), 0.75, 1e-12);
    expect(convertVolume(1, "cm3", "mm3")).toBeCloseTo(1000, 9);
  });
});

describe("konversi massa", () => {
  it("kg <-> g / ton bolak-balik", () => {
    expect(convertMass(1, "ton", "kg")).toBe(1000);
    expect(convertMass(2500, "g", "kg")).toBe(2.5);
    closeToRel(convertMass(convertMass(80, "kg", "ton"), "ton", "kg"), 80, 1e-12);
  });
});

describe("konversi gaya", () => {
  it("N <-> kN / tf dengan 1 tf = 9806,65 N", () => {
    expect(convertForce(1, "tf", "N")).toBe(9806.65);
    expect(convertForce(9806.65, "N", "tf")).toBeCloseTo(1, 12);
    expect(convertForce(1, "kN", "N")).toBe(1000);
    closeToRel(convertForce(convertForce(12.5, "kN", "tf"), "tf", "kN"), 12.5, 1e-12);
  });
});

describe("konversi momen", () => {
  it("Nm <-> kNm / kgfm bolak-balik", () => {
    expect(convertMoment(1, "kNm", "Nm")).toBe(1000);
    expect(convertMoment(1, "kgfm", "Nm")).toBe(9.80665);
    closeToRel(convertMoment(convertMoment(37, "Nm", "kgfm"), "kgfm", "Nm"), 37, 1e-12);
  });
});

describe("konversi tegangan/tekanan", () => {
  it("Pa <-> kPa / MPa / kgfcm2 dengan 1 kgf/cm² = 98066,5 Pa", () => {
    expect(convertPressure(1, "kgfcm2", "Pa")).toBe(98066.5);
    expect(convertPressure(1, "MPa", "Pa")).toBe(1e6);
    expect(convertPressure(250, "kPa", "MPa")).toBeCloseTo(0.25, 12);
    closeToRel(
      convertPressure(convertPressure(30, "MPa", "kgfcm2"), "kgfcm2", "MPa"),
      30,
      1e-12,
    );
    // generic convert() dengan kind pressure/stress juga bekerja
    expect(convert(1, "MPa", "kPa", "pressure")).toBeCloseTo(1000, 9);
    expect(convert(1, "MPa", "kPa", "stress")).toBeCloseTo(1000, 9);
  });
});

describe("error cases", () => {
  it("unit tak dikenal melempar Error", () => {
    expect(() => convert(1, "yard", "m", "length")).toThrow(Error);
    expect(() => convert(1, "m", "parsec", "length")).toThrow(Error);
    expect(() => convertLength(1, "m" as never, "league" as never)).toThrow(Error);
  });
  it("kind tak dikenal melempar Error", () => {
    expect(() => convert(1, "m", "m", "kecepatan")).toThrow(Error);
  });
  it("NaN / Infinity melempar Error", () => {
    expect(() => convert(Number.NaN, "m", "cm", "length")).toThrow(Error);
    expect(() => convert(Number.POSITIVE_INFINITY, "m", "cm", "length")).toThrow(Error);
    expect(() => formatAngkaID(Number.NaN, 2)).toThrow(Error);
  });
});

describe("formatAngkaID", () => {
  it("memformat ribuan '.' dan desimal ','", () => {
    expect(formatAngkaID(1234567.891, 2)).toBe("1.234.567,89");
    expect(formatAngkaID(3, 2)).toBe("3,00");
    expect(formatAngkaID(1000, 0)).toBe("1.000");
    expect(formatAngkaID(123456789, 0)).toBe("123.456.789");
    expect(formatAngkaID(0, 2)).toBe("0,00");
    expect(formatAngkaID(-1234.5, 1)).toBe("-1.234,5");
    expect(formatAngkaID(999.999, 2)).toBe("1.000,00");
  });
});

describe("konstanta material", () => {
  it("nilai konstanta sesuai definisi", () => {
    expect(RHO_BETON_BERTULANG).toBe(2400);
    expect(RHO_BAJA).toBe(7850);
    expect(GRAVITASI).toBe(9.80665);
    expect(FAKTOR_BERAT_BESI).toBe(0.006165);
  });
  it("berat besi D13 = 0,006165 × 13² = 1,041885 kg/m (tol 1e-9 relatif)", () => {
    const w = FAKTOR_BERAT_BESI * 13 * 13;
    closeToRel(w, 1.041885, 1e-9);
    closeToRel(beratBesiPerMeter(13), 1.041885, 1e-9);
  });
});
