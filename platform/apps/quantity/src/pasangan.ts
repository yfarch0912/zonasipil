import {
  pastikanPersen,
  pastikanPositif,
  pastikanTidakNegatif,
} from "./validasi.ts";

/**
 * Kebutuhan bata per m² dinding setengah bata (satu lapis, bata
 * terpasang memanjang mengikuti muka dinding).
 *
 * Satu bata beserta siar (nat) di sekelilingnya menempati bidang:
 *
 *   (panjangBata + tebalSiar) × (tinggiBata + tebalSiar)   (m²)
 *
 * sehingga:
 *
 *   kebutuhan per m² = 1 / ((panjangBata + siar) × (tinggiBata + siar))
 *
 * Contoh: bata 0,20 × 0,05 m dengan siar 0,01 m
 *   -> 1 / (0,21 × 0,06) = 79,365... bata/m².
 *
 * Validasi: panjang/tinggi bata harus > 0, tebal siar >= 0 (0 berarti
 * tanpa siar). Hasil adalah angka teoritis (boleh pecahan); pembulatan
 * ke kebutuhan utuh dilakukan oleh kebutuhanBata().
 */
export function kebutuhanBataPerM2(
  panjangBataM: number,
  tinggiBataM: number,
  tebalSiarM = 0.01,
): number {
  pastikanPositif(panjangBataM, "Panjang bata (m)");
  pastikanPositif(tinggiBataM, "Tinggi bata (m)");
  pastikanTidakNegatif(tebalSiarM, "Tebal siar/nat (m)");

  return 1 / ((panjangBataM + tebalSiarM) * (tinggiBataM + tebalSiarM));
}

/**
 * Total kebutuhan bata untuk luas dinding tertentu, dalam satuan bata
 * utuh (selalu dibulatkan ke atas dengan Math.ceil):
 *
 *   total = ceil( kebutuhanBataPerM2 × luas × (1 + persenWaste/100) )
 *
 * Luas yang dimasukkan harus sudah luas bersih dinding (bukaan seperti
 * pintu/jendela dikurangi sendiri oleh pemanggil — fungsi ini tidak
 * tahu adanya bukaan).
 *
 * Validasi: luas dan ukuran bata > 0, siar >= 0, waste 0–100.
 */
export function kebutuhanBata(
  luasM2: number,
  panjangBataM: number,
  tinggiBataM: number,
  tebalSiarM = 0.01,
  persenWaste = 0,
): number {
  pastikanPositif(luasM2, "Luas dinding (m²)");
  pastikanPersen(persenWaste, "Persentase waste bata");

  const perM2 = kebutuhanBataPerM2(panjangBataM, tinggiBataM, tebalSiarM);
  return Math.ceil(perM2 * luasM2 * (1 + persenWaste / 100));
}

/**
 * Volume mortar plesteran (basah/teoritis) untuk suatu luas permukaan:
 *
 *   volume = luas × tebal   (m³)
 *
 * Tebal baku bawaan 0,015 m (15 mm). Ini volume plester jadi di dinding,
 * BUKAN kebutuhan bahan kering (semen/pasir) — konversi ke sak semen
 * atau m³ pasir tidak dilakukan di sini.
 *
 * Validasi: luas dan tebal harus > 0.
 */
export function volumeMortarPlester(luasM2: number, tebalM = 0.015): number {
  pastikanPositif(luasM2, "Luas plesteran (m²)");
  pastikanPositif(tebalM, "Tebal plesteran (m)");

  return luasM2 * tebalM;
}

/**
 * Luas acian = luas permukaan yang diplester/dicakup, dalam m².
 *
 * Acian dihitung per m² luas permukaan (lapisan sangat tipis di atas
 * plesteran), jadi hasilnya sama dengan luas masukan. Fungsi ini ada
 * agar take-off acian eksplisit dalam daftar pekerjaan, bukan karena
 * ada rumus tersembunyi: tidak ada faktor tebal atau konversi ke kg
 * bahan acian di sini.
 *
 * Validasi: luas harus > 0.
 */
export function luasAcian(luasM2: number): number {
  pastikanPositif(luasM2, "Luas acian (m²)");

  return luasM2;
}
