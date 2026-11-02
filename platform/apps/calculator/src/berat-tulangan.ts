import { beratBesiPerMeter } from "@zonasipil/engineering-core";
import { pastikanPositif } from "./validasi.ts";

/** Hasil perhitungan berat tulangan baja. */
export interface HasilBeratTulangan {
  /** Berat per meter batang, kg/m: 0,006165 × diameter² (diameter dalam mm). */
  perMeter: number;
  /** Berat total, kg: perMeter × panjang total (m). */
  total: number;
}

/**
 * Berat tulangan baja berdasarkan diameter nominal dan panjang total.
 *
 *   perMeter = beratBesiPerMeter(diameter) = 0,006165 × d²   (kg/m)
 *   total    = perMeter × panjang total                      (kg)
 *
 * Faktor 0,006165 berasal dari @zonasipil/engineering-core
 * (turunan massa jenis baja 7850 kg/m³). Fungsi ini hanya menjumlahkan
 * panjang lurus; bengkokan, kait, dan sambungan lewatan TIDAK dihitung —
 * masukkan panjang total termasuk bagian tersebut secara manual.
 *
 * Validasi: diameter dan panjang harus > 0. (Fungsi core hanya menolak
 * nilai tak berhingga, jadi pemeriksaan positif dilakukan di sini.)
 */
export function beratTulangan(
  diameterMm: number,
  panjangTotalM: number,
): HasilBeratTulangan {
  pastikanPositif(diameterMm, "Diameter tulangan (mm)");
  pastikanPositif(panjangTotalM, "Panjang total tulangan (m)");

  const perMeter = beratBesiPerMeter(diameterMm);
  return { perMeter, total: perMeter * panjangTotalM };
}
