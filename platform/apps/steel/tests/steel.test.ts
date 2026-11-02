import { describe, expect, it } from "vitest";
import { bebanKritisKolom, propertiProfilI } from "../src/index";

/** Toleransi relatif untuk nilai referensi (0,5% sesuai brief). */
function dekatRelatif(aktual: number, referensi: number, tol = 0.005): void {
  expect(Math.abs(aktual - referensi)).toBeLessThanOrEqual(Math.abs(referensi) * tol);
}

describe("propertiProfilI — penampang I simetris", () => {
  // Referensi dihitung ulang manual untuk h=300, b=150, tw=6,5, tf=9:
  // A  = 2×150×9 + (300−18)×6,5 = 2700 + 1833 = 4533 mm²
  // Ix = (150×300³ − 143,5×282³)/12 = 69.325.191 mm⁴
  // Iy = (2×9×150³ + 282×6,5³)/12  = 5.068.954 mm⁴
  // berat = 4533×1e-6×7850 = 35,584 kg/m
  const p = propertiProfilI({ h: 300, b: 150, tw: 6.5, tf: 9 });

  it("A = 4533 mm²", () => {
    expect(Math.abs(p.A - 4533)).toBeLessThanOrEqual(1e-9);
  });
  it("Ix ≈ 69,3×10⁶ mm⁴", () => dekatRelatif(p.Ix, 69_325_191));
  it("Iy ≈ 5,07×10⁶ mm⁴", () => dekatRelatif(p.Iy, 5_068_954));
  it("Sx dan Sy konsisten dengan Ix/(h/2) dan Iy/(b/2)", () => {
    dekatRelatif(p.Sx, 462_168);
    dekatRelatif(p.Sy, 67_586);
    dekatRelatif(p.Sx, p.Ix / 150, 1e-12);
    dekatRelatif(p.Sy, p.Iy / 75, 1e-12);
  });
  it("rx ≈ 123,67 mm dan ry ≈ 33,44 mm (rx > ry)", () => {
    dekatRelatif(p.rx, 123.667);
    dekatRelatif(p.ry, 33.44);
    expect(p.rx).toBeGreaterThan(p.ry);
  });
  it("berat per meter ≈ 35,6 kg/m", () => dekatRelatif(p.beratPerMeter, 35.584));

  it("penampang persegi panjang penuh tereduksi dengan benar (tw = b)", () => {
    // tw = b → penampang kotak pejal 100×200: A = 20000, Ix = 100×200³/12
    const kotak = propertiProfilI({ h: 200, b: 100, tw: 100, tf: 10 });
    dekatRelatif(kotak.A, 20_000, 1e-12);
    dekatRelatif(kotak.Ix, (100 * 200 ** 3) / 12, 1e-12);
  });

  it("menolak geometri tidak fisik", () => {
    expect(() => propertiProfilI({ h: 0, b: 150, tw: 6.5, tf: 9 })).toThrowError(/h \(mm\)/);
    expect(() => propertiProfilI({ h: 300, b: 150, tw: 6.5, tf: 150 })).toThrowError(/2×tf/);
    expect(() => propertiProfilI({ h: 300, b: 150, tw: 6.5, tf: 160 })).toThrowError(/2×tf/);
    expect(() => propertiProfilI({ h: 300, b: 100, tw: 120, tf: 9 })).toThrowError(/tw/);
    expect(() => propertiProfilI({ h: 300, b: 150, tw: Number.NaN, tf: 9 })).toThrowError(/tw/);
  });
});

describe("bebanKritisKolom — teori tekuk klasik kolom ideal", () => {
  it("Cc untuk E=200000 MPa, fy=250 MPa ≈ 125,66", () => {
    // Cc = √(2π²×200000/250) = √15791,4 ≈ 125,664
    const hasil = bebanKritisKolom({ E: 200000, fy: 250, A: 4533, r: 10, KL: 800 });
    dekatRelatif(hasil.Cc, 125.664);
  });

  it("kasus Euler: λ=150 > Cc → σcr ≈ 87,7 MPa", () => {
    // σcr = π²×200000/150² = 87,730 MPa; Pcr = 87,730×4533/1000 = 397,7 kN
    const hasil = bebanKritisKolom({ E: 200000, fy: 250, A: 4533, r: 10, KL: 1500 });
    expect(hasil.metode).toBe("euler");
    dekatRelatif(hasil.lambda, 150, 1e-12);
    dekatRelatif(hasil.sigmaKritisMPa, 87.73);
    dekatRelatif(hasil.bebanKritisKn, 397.68);
  });

  it("kasus Johnson: λ=80 ≤ Cc → σcr ≈ 199,3 MPa", () => {
    // σcr = 250×(1 − 250×80²/(4π²×200000)) = 250×(1 − 0,20264) = 199,34 MPa
    // Pcr = 199,34×4533/1000 = 903,6 kN
    const hasil = bebanKritisKolom({ E: 200000, fy: 250, A: 4533, r: 10, KL: 800 });
    expect(hasil.metode).toBe("johnson");
    dekatRelatif(hasil.lambda, 80, 1e-12);
    dekatRelatif(hasil.sigmaKritisMPa, 199.34);
    dekatRelatif(hasil.bebanKritisKn, 903.61);
  });

  it("E default = 200000 MPa bila tidak diberikan", () => {
    const denganE = bebanKritisKolom({ E: 200000, fy: 250, A: 4533, r: 10, KL: 800 });
    const tanpaE = bebanKritisKolom({ fy: 250, A: 4533, r: 10, KL: 800 });
    expect(tanpaE.sigmaKritisMPa).toBe(denganE.sigmaKritisMPa);
    expect(tanpaE.Cc).toBe(denganE.Cc);
  });

  it("peralihan metode terjadi di sekitar λ = Cc", () => {
    const diBawah = bebanKritisKolom({ fy: 250, A: 1000, r: 10, KL: 1200 }); // λ=120 < Cc
    const diAtas = bebanKritisKolom({ fy: 250, A: 1000, r: 10, KL: 1300 }); // λ=130 > Cc
    expect(diBawah.metode).toBe("johnson");
    expect(diAtas.metode).toBe("euler");
  });

  it("σcr Johnson selalu di bawah fy dan σcr Euler menurun dengan λ", () => {
    const j = bebanKritisKolom({ fy: 250, A: 1000, r: 10, KL: 100 });
    expect(j.sigmaKritisMPa).toBeLessThan(250);
    expect(j.sigmaKritisMPa).toBeGreaterThan(0);
    const e1 = bebanKritisKolom({ fy: 250, A: 1000, r: 10, KL: 2000 });
    const e2 = bebanKritisKolom({ fy: 250, A: 1000, r: 10, KL: 3000 });
    expect(e1.sigmaKritisMPa).toBeGreaterThan(e2.sigmaKritisMPa);
  });

  it("menolak input tidak fisik", () => {
    expect(() => bebanKritisKolom({ fy: 250, A: 4533, r: 0, KL: 800 })).toThrowError(/r \(mm\)/);
    expect(() => bebanKritisKolom({ fy: 250, A: 4533, r: 10, KL: -800 })).toThrowError(/KL/);
    expect(() => bebanKritisKolom({ fy: 0, A: 4533, r: 10, KL: 800 })).toThrowError(/fy/);
    expect(() => bebanKritisKolom({ E: -1, fy: 250, A: 4533, r: 10, KL: 800 })).toThrowError(/E \(MPa\)/);
    expect(() => bebanKritisKolom({ fy: 250, A: Number.NaN, r: 10, KL: 800 })).toThrowError(/A \(mm²\)/);
  });
});
