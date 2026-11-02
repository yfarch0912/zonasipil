import {
  pastikanBulatMinimal,
  pastikanPersen,
  pastikanPositif,
} from "./validasi.ts";

/** Hasil perhitungan volume beton. Semua nilai dalam m³. */
export interface HasilVolumeBeton {
  /** Volume bersih teoritis: panjang × lebar × tebal × jumlah elemen. */
  bersih: number;
  /** Volume bersih ditambah cadangan waste: bersih × (1 + wastePersen/100). */
  denganWaste: number;
}

/**
 * Volume beton untuk elemen berbentuk prisma persegi panjang
 * (mis. pelat, balok, kolom, sloof) — rumus yang sama dengan
 * kalkulator di situs live zonasipil.web.id:
 *
 *   bersih      = panjang × lebar × tebal × jumlah elemen   (m³)
 *   denganWaste = bersih × (1 + wastePersen / 100)          (m³)
 *
 * Validasi: panjang/lebar/tebal harus > 0, jumlah elemen bilangan
 * bulat >= 1, wastePersen dalam rentang 0–100.
 */
export function volumeBeton(
  panjangM: number,
  lebarM: number,
  tebalM: number,
  jumlahElemen: number,
  wastePersen = 5,
): HasilVolumeBeton {
  pastikanPositif(panjangM, "Panjang (m)");
  pastikanPositif(lebarM, "Lebar (m)");
  pastikanPositif(tebalM, "Tebal/tinggi (m)");
  pastikanBulatMinimal(jumlahElemen, "Jumlah elemen", 1);
  pastikanPersen(wastePersen, "Persentase waste beton");

  const bersih = panjangM * lebarM * tebalM * jumlahElemen;
  const denganWaste = bersih * (1 + wastePersen / 100);
  return { bersih, denganWaste };
}
