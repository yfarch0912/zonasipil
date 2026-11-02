import { pastikanBulatMinimal, pastikanPositif } from "./validasi.ts";

/**
 * Volume beton satu jenis elemen berbentuk prisma persegi panjang,
 * dikalikan jumlah elemen sejenis:
 *
 *   volume = panjang × lebar × tebal × jumlah   (m³)
 *
 * Validasi: panjang/lebar/tebal harus > 0, jumlah bilangan bulat >= 1.
 * Volume ini adalah volume geometris murni — belum termasuk waste dan
 * belum dikurangi volume tulangan di dalamnya.
 */
export function volumeBetonElemen(
  panjangM: number,
  lebarM: number,
  tebalM: number,
  jumlah: number,
): number {
  pastikanPositif(panjangM, "Panjang elemen (m)");
  pastikanPositif(lebarM, "Lebar elemen (m)");
  pastikanPositif(tebalM, "Tebal/tinggi elemen (m)");
  pastikanBulatMinimal(jumlah, "Jumlah elemen", 1);

  return panjangM * lebarM * tebalM * jumlah;
}
