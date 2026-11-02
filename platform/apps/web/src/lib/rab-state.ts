import type { ItemPekerjaan } from "@zonasipil/app-rab";
import { parseField } from "./parse.ts";

/**
 * State tabel RAB di UI. Angka disimpan sebagai teks mentah input
 * (agar koma desimal Indonesia tidak hilang saat mengetik); konversi
 * ke ItemPekerjaan dilakukan di sini, satu-satunya tempat adapter ini.
 */
export interface BarisRAB {
  id: number;
  seksi: string;
  uraian: string;
  volume: string;
  satuan: string;
  hargaSatuan: string;
}

export function buatBaris(id: number, sebagian: Partial<Omit<BarisRAB, "id">> = {}): BarisRAB {
  return { id, seksi: "", uraian: "", volume: "", satuan: "", hargaSatuan: "", ...sebagian };
}

export function idBerikutnya(baris: readonly BarisRAB[]): number {
  return baris.reduce((maks, b) => Math.max(maks, b.id), 0) + 1;
}

export function tambahBaris(
  baris: readonly BarisRAB[],
  sebagian: Partial<Omit<BarisRAB, "id">> = {},
): BarisRAB[] {
  return [...baris, buatBaris(idBerikutnya(baris), sebagian)];
}

export function hapusBaris(baris: readonly BarisRAB[], id: number): BarisRAB[] {
  return baris.filter((b) => b.id !== id);
}

export function ubahBaris(
  baris: readonly BarisRAB[],
  id: number,
  sebagian: Partial<Omit<BarisRAB, "id">>,
): BarisRAB[] {
  return baris.map((b) => (b.id === id ? { ...b, ...sebagian } : b));
}

/** Baris dianggap kosong bila uraian, volume, dan harga semuanya kosong. */
export function barisKosong(b: BarisRAB): boolean {
  return b.uraian.trim() === "" && b.volume.trim() === "" && b.hargaSatuan.trim() === "";
}

/**
 * Konversi satu baris UI menjadi ItemPekerjaan.
 * Melempar Error Bahasa Indonesia bila teks kosong / angka tidak valid.
 */
export function barisKeItem(b: BarisRAB): ItemPekerjaan {
  if (b.uraian.trim() === "") throw new Error("Uraian pekerjaan tidak boleh kosong.");
  if (b.satuan.trim() === "") throw new Error("Satuan tidak boleh kosong.");
  const volume = parseField(b.volume, { label: "Volume", tidakNegatif: true });
  if (!volume.ok) throw new Error(volume.error);
  const harga = parseField(b.hargaSatuan, { label: "Harga satuan", tidakNegatif: true });
  if (!harga.ok) throw new Error(harga.error);
  const item: ItemPekerjaan = {
    uraian: b.uraian.trim(),
    volume: volume.value,
    satuan: b.satuan.trim(),
    hargaSatuan: harga.value,
  };
  if (b.seksi.trim() !== "") item.seksi = b.seksi.trim();
  return item;
}

/** Konversi semua baris non-kosong; baris kosong dilewati. */
export function daftarKeItems(baris: readonly BarisRAB[]): ItemPekerjaan[] {
  return baris.filter((b) => !barisKosong(b)).map(barisKeItem);
}
