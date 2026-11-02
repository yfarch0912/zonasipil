import { volumeBetonElemen } from "./elemen-beton.ts";
import {
  beratTulanganElemen,
  type InputTulanganElemen,
} from "./tulangan.ts";

/** Dimensi beton satu elemen (prisma persegi panjang). */
export interface InputBetonElemen {
  /** Panjang elemen, m. Harus > 0. */
  panjangM: number;
  /** Lebar elemen, m. Harus > 0. */
  lebarM: number;
  /** Tebal/tinggi elemen, m. Harus > 0. */
  tebalM: number;
  /** Jumlah elemen sejenis. Bilangan bulat >= 1. */
  jumlah: number;
}

/**
 * Satu baris rekap: satu jenis elemen pekerjaan.
 * Minimal salah satu dari `beton` atau `tulangan` harus diisi.
 */
export interface ElemenRekap {
  /** Nama elemen, mis. "Balok B1" atau "Kolom K1". Bawaan: "Elemen ke-<n>". */
  nama?: string;
  /** Dimensi beton elemen ini; boleh kosong bila elemen tanpa beton. */
  beton?: InputBetonElemen;
  /**
   * Kelompok tulangan elemen ini (satu entri per diameter).
   * Boleh kosong bila elemen tanpa tulangan.
   */
  tulangan?: InputTulanganElemen[];
}

/** Rincian hasil rekap untuk satu elemen. */
export interface RincianRekapElemen {
  nama: string;
  /** Volume beton elemen ini, m³ (0 bila tanpa beton). */
  volumeBetonM3: number;
  /** Berat tulangan elemen ini, kg (0 bila tanpa tulangan). */
  beratTulanganKg: number;
}

/** Hasil rekap material keseluruhan. */
export interface HasilRekapMaterial {
  /** Total volume beton semua elemen, m³. */
  totalVolumeBetonM3: number;
  /** Total berat tulangan semua elemen, kg. */
  totalBeratTulanganKg: number;
  /** Rincian per elemen, sesuai urutan masukan. */
  rincian: RincianRekapElemen[];
}

/**
 * Rekap material dari daftar elemen: menjumlahkan volume beton dan
 * berat tulangan seluruh elemen.
 *
 *   totalVolumeBetonM3  = Σ (panjang × lebar × tebal × jumlah) tiap elemen
 *   totalBeratTulanganKg = Σ (0,006165 × d² × jumlahBatang × panjangPerBatang)
 *
 * Rekap ini hanya penjumlahan hasil rumus per elemen di atas — tidak
 * ada waste, faktor susut, atau konversi satuan pembelian di dalamnya.
 *
 * Validasi: daftar tidak boleh kosong; setiap elemen wajib punya beton
 * dan/atau tulangan; validasi tiap rumus bagian berlaku penuh.
 */
export function rekapMaterial(
  daftarElemen: ElemenRekap[],
): HasilRekapMaterial {
  if (!Array.isArray(daftarElemen) || daftarElemen.length === 0) {
    throw new Error("Daftar elemen rekap tidak boleh kosong");
  }

  const rincian: RincianRekapElemen[] = daftarElemen.map((elemen, i) => {
    const nama = elemen.nama ?? `Elemen ke-${i + 1}`;
    const punyaBeton = elemen.beton !== undefined && elemen.beton !== null;
    const punyaTulangan =
      Array.isArray(elemen.tulangan) && elemen.tulangan.length > 0;

    if (!punyaBeton && !punyaTulangan) {
      throw new Error(
        `Elemen "${nama}" harus memiliki beton dan/atau tulangan untuk direkap`,
      );
    }

    const volumeBetonM3 = punyaBeton
      ? volumeBetonElemen(
          elemen.beton!.panjangM,
          elemen.beton!.lebarM,
          elemen.beton!.tebalM,
          elemen.beton!.jumlah,
        )
      : 0;

    const beratTulanganKg = punyaTulangan
      ? elemen.tulangan!.reduce(
          (jumlah, kelompok) => jumlah + beratTulanganElemen(kelompok).totalKg,
          0,
        )
      : 0;

    return { nama, volumeBetonM3, beratTulanganKg };
  });

  return {
    totalVolumeBetonM3: rincian.reduce((j, r) => j + r.volumeBetonM3, 0),
    totalBeratTulanganKg: rincian.reduce((j, r) => j + r.beratTulanganKg, 0),
    rincian,
  };
}
