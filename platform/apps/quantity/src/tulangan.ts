import { beratBesiPerMeter } from "@zonasipil/engineering-core";
import { pastikanBulatMinimal, pastikanPositif } from "./validasi.ts";

/** Input berat tulangan untuk satu kelompok batang sejenis. */
export interface InputTulanganElemen {
  /** Diameter nominal batang, mm. Harus > 0. */
  diameterMm: number;
  /** Jumlah batang. Bilangan bulat >= 1. */
  jumlahBatang: number;
  /** Panjang satu batang, m. Harus > 0. */
  panjangPerBatangM: number;
}

/** Hasil perhitungan berat tulangan satu kelompok batang. */
export interface HasilBeratTulanganElemen {
  /** Berat per meter batang, kg/m: 0,006165 × diameter². */
  perMeter: number;
  /** Berat total kelompok ini, kg: perMeter × jumlahBatang × panjangPerBatang. */
  totalKg: number;
}

/**
 * Berat tulangan untuk satu kelompok batang berdiameter sama:
 *
 *   perMeter = 0,006165 × d²                            (kg/m)
 *   totalKg  = perMeter × jumlahBatang × panjangPerBatang (kg)
 *
 * Faktor 0,006165 diambil dari beratBesiPerMeter di
 * @zonasipil/engineering-core. Panjang per batang adalah panjang lurus
 * yang dimasukkan pemanggil; bengkokan, kait, sengkang, dan sambungan
 * lewatan TIDAK ditambahkan otomatis.
 */
export function beratTulanganElemen(
  input: InputTulanganElemen,
): HasilBeratTulanganElemen {
  pastikanPositif(input.diameterMm, "Diameter tulangan (mm)");
  pastikanBulatMinimal(input.jumlahBatang, "Jumlah batang", 1);
  pastikanPositif(input.panjangPerBatangM, "Panjang per batang (m)");

  const perMeter = beratBesiPerMeter(input.diameterMm);
  const totalKg = perMeter * input.jumlahBatang * input.panjangPerBatangM;
  return { perMeter, totalKg };
}
