import { describe, expect, it } from "vitest";
import {
  beta1,
  estimasiMaterialBeton,
  kapasitasLenturBalok,
  tulanganMinimumBalok,
} from "../src/index";

/** Toleransi relatif untuk nilai referensi (0,5% sesuai brief). */
function dekatRelatif(aktual: number, referensi: number, tol = 0.005): void {
  expect(Math.abs(aktual - referensi)).toBeLessThanOrEqual(Math.abs(referensi) * tol);
}

describe("beta1 — faktor blok tegangan Whitney", () => {
  it("fc = 25 MPa → 0,85", () => {
    expect(Math.abs(beta1(25) - 0.85)).toBeLessThanOrEqual(1e-9);
  });
  it("fc = 28 MPa (batas atas datar) → 0,85", () => {
    expect(Math.abs(beta1(28) - 0.85)).toBeLessThanOrEqual(1e-9);
  });
  it("fc = 35 MPa → 0,80 (turun 0,05 per 7 MPa)", () => {
    expect(Math.abs(beta1(35) - 0.8)).toBeLessThanOrEqual(1e-9);
  });
  it("fc = 56 MPa → 0,65 (mencapai lantai)", () => {
    expect(Math.abs(beta1(56) - 0.65)).toBeLessThanOrEqual(1e-9);
  });
  it("fc sangat tinggi tetap dibatasi lantai 0,65", () => {
    expect(beta1(100)).toBe(0.65);
  });
  it("menolak fc tidak fisik", () => {
    expect(() => beta1(0)).toThrowError(/fc/);
    expect(() => beta1(-25)).toThrowError(/fc/);
    expect(() => beta1(Number.NaN)).toThrowError(/fc/);
  });
});

describe("kapasitasLenturBalok — kasus referensi tension-controlled", () => {
  // Referensi dihitung ulang manual:
  // a = 1472,6×400/(0,85×25×250) = 110,878 mm; c = a/0,85 = 130,445 mm
  // εt = 0,003×(450−130,445)/130,445 = 0,007349 → tension-controlled
  // Mn = 1472,6×400×(450−110,878/2) = 232,41 kN·m; φMn = 0,9×Mn = 209,17 kN·m
  const hasil = kapasitasLenturBalok({ b: 250, d: 450, As: 1472.6, fy: 400, fc: 25 });

  it("a ≈ 110,9 mm", () => dekatRelatif(hasil.a, 110.878));
  it("c ≈ 130,4 mm", () => dekatRelatif(hasil.c, 130.445));
  it("εt ≈ 0,00735 (≥ 0,005)", () => dekatRelatif(hasil.epsilonT, 0.007349));
  it("Mn ≈ 232,4 kN·m", () => dekatRelatif(hasil.Mn_kNm, 232.41));
  it("tensionControlled = true dan φ = 0,9", () => {
    expect(hasil.tensionControlled).toBe(true);
    expect(hasil.phi).toBe(0.9);
  });
  it("φMn ≈ 209,2 kN·m", () => dekatRelatif(hasil.phiMn_kNm, 209.17));
  it("tanpa peringatan pada penampang tension-controlled", () => {
    expect(hasil.peringatan).toBeNull();
  });
});

describe("kapasitasLenturBalok — zona transisi dan compression-controlled", () => {
  it("zona transisi: φ terinterpolasi antara 0,75 dan 0,90 + peringatan", () => {
    // As = 2500 → a = 188,235; c = 221,453; εt = 0,003096 (εy = 0,002 < εt < 0,005)
    // φ = 0,75 + 0,15×(0,003096−0,002)/(0,005−0,002) = 0,8048
    const hasil = kapasitasLenturBalok({ b: 250, d: 450, As: 2500, fy: 400, fc: 25 });
    expect(hasil.tensionControlled).toBe(false);
    dekatRelatif(hasil.epsilonT, 0.0030961);
    dekatRelatif(hasil.phi, 0.8048);
    expect(hasil.phi).toBeGreaterThan(0.75);
    expect(hasil.phi).toBeLessThan(0.9);
    dekatRelatif(hasil.phiMn_kNm, hasil.phi * hasil.Mn_kNm, 1e-9);
    expect(hasil.peringatan).not.toBeNull();
    expect(hasil.peringatan).toMatch(/TIDAK tension-controlled/);
  });

  it("εt di bawah εy: φ dibatasi 0,75 dan ada peringatan keras baja belum leleh", () => {
    // As = 3500 → c = 310,03; εt = 0,001354 < εy = 0,002
    const hasil = kapasitasLenturBalok({ b: 250, d: 450, As: 3500, fy: 400, fc: 25 });
    expect(hasil.epsilonT).toBeLessThan(0.002);
    expect(hasil.phi).toBe(0.75);
    expect(hasil.peringatan).toMatch(/PERINGATAN KERAS/);
  });

  it("menolak input tidak fisik", () => {
    expect(() => kapasitasLenturBalok({ b: 0, d: 450, As: 1472.6, fy: 400, fc: 25 })).toThrowError(/b \(mm\)/);
    expect(() => kapasitasLenturBalok({ b: 250, d: -450, As: 1472.6, fy: 400, fc: 25 })).toThrowError(/d \(mm\)/);
    expect(() => kapasitasLenturBalok({ b: 250, d: 450, As: 0, fy: 400, fc: 25 })).toThrowError(/As/);
    expect(() => kapasitasLenturBalok({ b: 250, d: 450, As: 1472.6, fy: 0, fc: 25 })).toThrowError(/fy/);
    expect(() => kapasitasLenturBalok({ b: 250, d: 450, As: 1472.6, fy: 400, fc: Number.POSITIVE_INFINITY })).toThrowError(/fc/);
  });

  it("menolak penampang dengan c ≥ d (di luar cakupan model)", () => {
    expect(() => kapasitasLenturBalok({ b: 250, d: 450, As: 20000, fy: 400, fc: 25 })).toThrowError(/Sumbu netral/);
  });
});

describe("tulanganMinimumBalok", () => {
  it("kasus referensi: fc=25, fy=400 → ρmin = 0,0035; AsMin(b=250,d=450) = 393,75 mm²", () => {
    const hasil = tulanganMinimumBalok({ b: 250, d: 450, fy: 400, fc: 25 });
    // maks(0,25×√25/400 ; 1,4/400) = maks(0,003125 ; 0,0035) = 0,0035
    expect(Math.abs(hasil.rhoMin - 0.0035)).toBeLessThanOrEqual(1e-12);
    expect(Math.abs(hasil.AsMin - 393.75)).toBeLessThanOrEqual(1e-9);
  });

  it("suku akar yang memerintah bila lebih besar", () => {
    // fc=40, fy=250: 0,25×√40/250 = 0,006325 > 1,4/250 = 0,0056
    const hasil = tulanganMinimumBalok({ b: 200, d: 400, fy: 250, fc: 40 });
    dekatRelatif(hasil.rhoMin, 0.00632456);
    dekatRelatif(hasil.AsMin, 0.00632456 * 200 * 400);
  });

  it("menolak input tidak fisik", () => {
    expect(() => tulanganMinimumBalok({ b: 250, d: 450, fy: 400, fc: 0 })).toThrowError(/fc/);
    expect(() => tulanganMinimumBalok({ b: 250, d: 450, fy: -400, fc: 25 })).toThrowError(/fy/);
  });
});

describe("estimasiMaterialBeton — metode volume kering", () => {
  it("kasus referensi: 1 m³ campuran 1:2:3", () => {
    // volume kering = 1,54; total bagian 6
    // semen = 1,54×(1/6)×1440 = 369,6 kg → ceil(369,6/50) = 8 zak
    // pasir = 1,54×2/6 = 0,51333 m³; kerikil = 1,54×3/6 = 0,77 m³
    const hasil = estimasiMaterialBeton(1, { semen: 1, pasir: 2, kerikil: 3 });
    dekatRelatif(hasil.semenKg, 369.6, 1e-9);
    expect(hasil.semenZak).toBe(8);
    dekatRelatif(hasil.pasirM3, 0.5133333333, 1e-6);
    dekatRelatif(hasil.kerikilM3, 0.77, 1e-9);
  });

  it("campuran default sama dengan 1:2:3", () => {
    const hasil = estimasiMaterialBeton(1);
    dekatRelatif(hasil.semenKg, 369.6, 1e-9);
    expect(hasil.semenZak).toBe(8);
  });

  it("skala linier terhadap volume dan proporsional terhadap campuran", () => {
    const hasil = estimasiMaterialBeton(2, { semen: 1, pasir: 1.5, kerikil: 3 });
    // volume kering 3,08; total bagian 5,5
    dekatRelatif(hasil.semenKg, 3.08 * (1 / 5.5) * 1440, 1e-9);
    dekatRelatif(hasil.pasirM3, 3.08 * (1.5 / 5.5), 1e-9);
    dekatRelatif(hasil.kerikilM3, 3.08 * (3 / 5.5), 1e-9);
    expect(hasil.semenZak).toBe(Math.ceil(hasil.semenKg / 50));
  });

  it("menolak volume dan campuran tidak fisik", () => {
    expect(() => estimasiMaterialBeton(0)).toThrowError(/Volume beton/);
    expect(() => estimasiMaterialBeton(-1)).toThrowError(/Volume beton/);
    expect(() => estimasiMaterialBeton(1, { semen: 0, pasir: 0, kerikil: 0 })).toThrowError(/total bagian/);
    expect(() => estimasiMaterialBeton(1, { semen: -1, pasir: 2, kerikil: 3 })).toThrowError(/semen/);
  });
});
