import { describe, expect, it } from "vitest";
import {
  dayaDukungIzin,
  dayaDukungUltimit,
  faktorDayaDukung,
  ukuranTelapakPersegi,
} from "../src/index";

/** Pemeriksaan toleransi relatif, mis. 0,015 = 1,5%. */
function dekatRelatif(aktual: number, acuan: number, tolRelatif = 0.015): void {
  expect(Math.abs(aktual - acuan)).toBeLessThanOrEqual(Math.abs(acuan) * tolRelatif);
}

describe("faktorDayaDukung", () => {
  it("φ = 30° cocok dengan nilai tabel buku teks (tol 1,5%)", () => {
    const f = faktorDayaDukung(30);
    dekatRelatif(f.Nq, 18.4);
    dekatRelatif(f.Nc, 30.14);
    // Nγ Vesic = 2(Nq+1)tanφ ≈ 22,40 pada φ=30°.
    dekatRelatif(f.Ngamma, 22.4);
  });

  it("φ = 0 memakai nilai khusus Terzaghi", () => {
    expect(faktorDayaDukung(0)).toEqual({ Nc: 5.7, Nq: 1, Ngamma: 0 });
  });

  it("faktor naik seiring φ membesar", () => {
    const f20 = faktorDayaDukung(20);
    const f30 = faktorDayaDukung(30);
    const f40 = faktorDayaDukung(40);
    expect(f20.Nq).toBeLessThan(f30.Nq);
    expect(f30.Nq).toBeLessThan(f40.Nq);
    expect(f20.Nc).toBeLessThan(f30.Nc);
    expect(f20.Ngamma).toBeLessThan(f30.Ngamma);
  });

  it("menolak phi tidak valid", () => {
    expect(() => faktorDayaDukung(-5)).toThrowError(/phi/);
    expect(() => faktorDayaDukung(90)).toThrowError(/phi/);
    expect(() => faktorDayaDukung(Number.NaN)).toThrowError(/phi/);
  });
});

describe("dayaDukungUltimit", () => {
  const dasar = { c: 10, phi: 30, gamma: 18, B: 1.5, Df: 1 } as const;

  it("lajur: cocok dengan perhitungan tangan ±935,0 kPa (tol 1,5%)", () => {
    // 10×30,14 + 18×18,40 + 0,5×18×1,5×22,40 = 301,4 + 331,2 + 302,4 = 935,0
    const hasil = dayaDukungUltimit({ ...dasar, bentuk: "lajur" });
    dekatRelatif(hasil.qult, 935.0);
    expect(hasil.qultKpa).toBe(hasil.qult);
    dekatRelatif(hasil.Nc, 30.14);
    dekatRelatif(hasil.Nq, 18.4);
    dekatRelatif(hasil.Ngamma, 22.4);
    expect(hasil.q).toBeCloseTo(18, 10);
  });

  it("persegi: memakai koefisien bentuk 1,3 dan 0,4 (±965,0 kPa)", () => {
    // 1,3×10×30,14 + 18×18,40 + 0,4×18×1,5×22,40 ≈ 391,8 + 331,2 + 241,9 = 965,0
    const hasil = dayaDukungUltimit({ ...dasar, bentuk: "persegi" });
    dekatRelatif(hasil.qult, 965.0);
  });

  it("φ = 0: suku Nγ hilang dan Nc = 5,7", () => {
    const hasil = dayaDukungUltimit({
      c: 20,
      phi: 0,
      gamma: 18,
      B: 2,
      Df: 1,
      bentuk: "lajur",
    });
    // 20×5,7 + 18×1 + 0 = 132 kPa
    expect(hasil.qult).toBeCloseTo(132, 10);
  });

  it("menolak masukan tidak valid", () => {
    expect(() => dayaDukungUltimit({ ...dasar, c: -1, bentuk: "lajur" })).toThrowError(
      /Kohesi/,
    );
    expect(() => dayaDukungUltimit({ ...dasar, gamma: 0, bentuk: "lajur" })).toThrowError(
      /gamma/,
    );
    expect(() => dayaDukungUltimit({ ...dasar, B: 0, bentuk: "lajur" })).toThrowError(/B/);
    expect(() => dayaDukungUltimit({ ...dasar, Df: -0.5, bentuk: "lajur" })).toThrowError(
      /Df/,
    );
    expect(() =>
      dayaDukungUltimit({ ...dasar, bentuk: "lingkaran" as never }),
    ).toThrowError(/Bentuk/);
  });
});

describe("dayaDukungIzin", () => {
  it("membagi qult dengan faktor keamanan (baku 3)", () => {
    expect(dayaDukungIzin(900)).toBe(300);
    expect(dayaDukungIzin(900, 3)).toBe(300);
    expect(dayaDukungIzin(900, 2)).toBe(450);
  });

  it("menolak faktor keamanan tidak valid", () => {
    expect(() => dayaDukungIzin(900, 0)).toThrowError(/Faktor keamanan/);
    expect(() => dayaDukungIzin(-1)).toThrowError(/qult/);
  });
});

describe("ukuranTelapakPersegi", () => {
  const kasus = {
    bebanKn: 500,
    c: 10,
    phi: 30,
    gamma: 18,
    Df: 1,
    faktorKeamanan: 3,
  };

  it("menghasilkan B kelipatan 0,05 m dengan tekanan aktual ≤ qall", () => {
    const hasil = ukuranTelapakPersegi(kasus);
    expect(hasil.B).toBeGreaterThanOrEqual(0.5);
    expect(hasil.B).toBeLessThanOrEqual(10);
    // Kelipatan 0,05 m (dalam batas presisi floating point).
    expect(Math.abs(hasil.B / 0.05 - Math.round(hasil.B / 0.05))).toBeLessThan(1e-9);
    expect(hasil.tekananAktual).toBeLessThanOrEqual(hasil.qall);
    expect(hasil.tekananAktual).toBeCloseTo(kasus.bebanKn / (hasil.B * hasil.B), 10);
  });

  it("B terpilih adalah yang terkecil: satu langkah lebih kecil gagal", () => {
    const hasil = ukuranTelapakPersegi(kasus);
    if (hasil.B > 0.5) {
      const bLebihKecil = Math.round((hasil.B - 0.05) * 100) / 100;
      const { qult } = dayaDukungUltimit({
        c: kasus.c,
        phi: kasus.phi,
        gamma: kasus.gamma,
        B: bLebihKecil,
        Df: kasus.Df,
        bentuk: "persegi",
      });
      const qallKecil = dayaDukungIzin(qult, kasus.faktorKeamanan);
      expect(kasus.bebanKn / (bLebihKecil * bLebihKecil)).toBeGreaterThan(qallKecil);
    }
  });

  it("beban lebih besar membutuhkan telapak lebih besar", () => {
    const ringan = ukuranTelapakPersegi({ ...kasus, bebanKn: 200 });
    const berat = ukuranTelapakPersegi({ ...kasus, bebanKn: 2000 });
    expect(berat.B).toBeGreaterThan(ringan.B);
  });

  it("melempar Error bila tidak konvergen sampai 10 m", () => {
    expect(() => ukuranTelapakPersegi({ ...kasus, bebanKn: 1_000_000_000 })).toThrowError(
      /Tidak ditemukan/,
    );
  });

  it("menolak masukan tidak valid", () => {
    expect(() => ukuranTelapakPersegi({ ...kasus, bebanKn: 0 })).toThrowError(/Beban/);
    expect(() => ukuranTelapakPersegi({ ...kasus, bebanKn: -10 })).toThrowError(/Beban/);
    expect(() => ukuranTelapakPersegi({ ...kasus, faktorKeamanan: 0 })).toThrowError(
      /Faktor keamanan/,
    );
  });
});
