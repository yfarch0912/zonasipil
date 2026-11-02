/**
 * App "rab" — Rencana Anggaran Biaya (RAB) sederhana: perkalian
 * volume × harga satuan per item pekerjaan, subtotal per seksi,
 * pajak persentase, dan ekspor CSV/JSON.
 *
 * KEJUJURAN METODE: modul ini hanya melakukan aritmetika daftar
 * harga. Ia TIDAK menyediakan koefisien analisis harga satuan
 * (AHSP), harga satuan resmi, maupun tarif pajak resmi mana pun.
 * Persentase pajak adalah PARAMETER yang diisi pengguna (nilai
 * awal 11) — tarif yang berlaku mengikuti ketentuan perpajakan
 * yang berlaku saat dokumen dipakai, dan pengguna wajib memeriksa
 * nilai terkini sebelum memakai hasil ini untuk keperluan resmi.
 *
 * Mata uang: rupiah (Rp), tanpa satuan sen. Perhitungan dilakukan
 * dengan presisi penuh (bilangan floating point); gunakan
 * `bulatRupiah` untuk penyajian bilangan bulat rupiah.
 */

export const APP_SLUG = "rab";

/** Nama seksi baku untuk item yang tidak menyebutkan seksi. */
export const SEKSI_UMUM = "Umum";

// ---------------------------------------------------------------------------
// Tipe
// ---------------------------------------------------------------------------

export interface ItemPekerjaan {
  /** Uraian pekerjaan, tidak boleh kosong. */
  uraian: string;
  /** Volume pekerjaan, harus ≥ 0. */
  volume: number;
  /** Satuan volume (mis. "m3", "m2", "kg", "ls"), tidak boleh kosong. */
  satuan: string;
  /** Harga satuan dalam rupiah, harus ≥ 0. */
  hargaSatuan: number;
  /** Seksi/bagian pekerjaan; kosong berarti masuk seksi "Umum". */
  seksi?: string;
}

export interface ItemTerhitung extends ItemPekerjaan {
  /** Seksi efektif (selalu terisi; "Umum" bila item tidak menyebutnya). */
  seksi: string;
  /** Jumlah harga item: volume × hargaSatuan, rupiah. */
  jumlah: number;
}

export interface SubtotalSeksi {
  seksi: string;
  subtotal: number;
}

export interface OpsiRAB {
  /**
   * Persentase pajak dalam persen (baku 11). Ini parameter masukan,
   * BUKAN klaim tarif pajak resmi — lihat catatan di kepala modul.
   */
  ppnPersen?: number;
}

export interface HasilRAB {
  perItem: ItemTerhitung[];
  perSeksi: SubtotalSeksi[];
  /** Jumlah semua item sebelum pajak, rupiah. */
  totalSebelumPajak: number;
  /** Persentase pajak yang dipakai, dalam persen. */
  ppnPersen: number;
  /** Nominal pajak: totalSebelumPajak × ppnPersen / 100, rupiah. */
  ppn: number;
  /** Total akhir termasuk pajak, rupiah. */
  grandTotal: number;
}

// ---------------------------------------------------------------------------
// Validasi
// ---------------------------------------------------------------------------

function pastikanTeksTidakKosong(nama: string, nilai: string): void {
  if (typeof nilai !== "string" || nilai.trim() === "") {
    throw new Error(`${nama} tidak boleh kosong`);
  }
}

function pastikanNonNegatif(nama: string, nilai: number): void {
  if (typeof nilai !== "number" || !Number.isFinite(nilai)) {
    throw new Error(`${nama} harus berupa bilangan hingga, diterima: ${nilai}`);
  }
  if (nilai < 0) {
    throw new Error(`${nama} tidak boleh negatif, diterima: ${nilai}`);
  }
}

function validasiItem(item: ItemPekerjaan): void {
  if (item === null || typeof item !== "object") {
    throw new Error("Item pekerjaan harus berupa objek");
  }
  pastikanTeksTidakKosong("Uraian pekerjaan", item.uraian);
  pastikanTeksTidakKosong("Satuan", item.satuan);
  pastikanNonNegatif("Volume", item.volume);
  pastikanNonNegatif("Harga satuan", item.hargaSatuan);
  if (item.seksi !== undefined) {
    pastikanTeksTidakKosong("Seksi", item.seksi);
  }
}

// ---------------------------------------------------------------------------
// Perhitungan
// ---------------------------------------------------------------------------

/**
 * Menghitung satu item pekerjaan: mengembalikan salinan item dengan
 * seksi efektif dan `jumlah = volume × hargaSatuan`.
 * Melempar Error (Bahasa Indonesia) bila item tidak valid.
 */
export function hitungItem(item: ItemPekerjaan): ItemTerhitung {
  validasiItem(item);
  return {
    ...item,
    seksi: item.seksi ?? SEKSI_UMUM,
    jumlah: item.volume * item.hargaSatuan,
  };
}

/**
 * Menghitung seluruh RAB: jumlah per item, subtotal per seksi
 * (urutan seksi mengikuti kemunculan pertama), total sebelum pajak,
 * nominal pajak, dan grand total.
 *
 * Perhitungan memakai presisi penuh; tidak ada pembulatan di tengah.
 * Daftar item kosong menghasilkan semua total 0.
 */
export function hitungRAB(items: ItemPekerjaan[], opsi: OpsiRAB = {}): HasilRAB {
  if (!Array.isArray(items)) {
    throw new Error("Daftar item RAB harus berupa array");
  }
  const ppnPersen = opsi.ppnPersen ?? 11;
  pastikanNonNegatif("Persentase pajak ppnPersen", ppnPersen);

  const perItem = items.map((item) => hitungItem(item));

  const urutanSeksi: string[] = [];
  const subtotalPerSeksi = new Map<string, number>();
  for (const item of perItem) {
    if (!subtotalPerSeksi.has(item.seksi)) {
      urutanSeksi.push(item.seksi);
      subtotalPerSeksi.set(item.seksi, 0);
    }
    subtotalPerSeksi.set(item.seksi, (subtotalPerSeksi.get(item.seksi) ?? 0) + item.jumlah);
  }
  const perSeksi: SubtotalSeksi[] = urutanSeksi.map((seksi) => ({
    seksi,
    subtotal: subtotalPerSeksi.get(seksi) ?? 0,
  }));

  const totalSebelumPajak = perItem.reduce((acc, item) => acc + item.jumlah, 0);
  const ppn = (totalSebelumPajak * ppnPersen) / 100;
  const grandTotal = totalSebelumPajak + ppn;

  return { perItem, perSeksi, totalSebelumPajak, ppnPersen, ppn, grandTotal };
}

/** Membulatkan nilai uang ke rupiah bulat terdekat (setengah ke atas). */
export function bulatRupiah(x: number): number {
  if (typeof x !== "number" || !Number.isFinite(x)) {
    throw new Error(`Nilai rupiah harus berupa bilangan hingga, diterima: ${x}`);
  }
  return Math.round(x);
}

// ---------------------------------------------------------------------------
// Ekspor
// ---------------------------------------------------------------------------

/**
 * Loloskan satu sel CSV dengan pemisah ";": sel yang mengandung
 * ";", tanda kutip, atau baris baru dibungkus tanda kutip ganda
 * (tanda kutip di dalam sel digandakan), mengikuti kaidah CSV umum.
 */
function selCSV(nilai: string | number): string {
  const teks = String(nilai);
  if (/[";\n\r]/.test(teks)) {
    return `"${teks.replace(/"/g, '""')}"`;
  }
  return teks;
}

/**
 * Mengekspor hasil RAB sebagai CSV dengan pemisah ";" (agar langsung
 * terbaca benar oleh Excel berbahasa Indonesia). Angka ditulis apa
 * adanya (titik desimal) tanpa pemisah ribuan agar tetap dapat
 * diolah sebagai angka.
 *
 * Susunan: header, satu baris per item, baris subtotal per seksi,
 * lalu baris Total Sebelum Pajak, Pajak, dan Grand Total.
 */
export function eksporCSV(hasil: HasilRAB): string {
  const baris: string[] = [];
  baris.push("Seksi;Uraian;Volume;Satuan;Harga Satuan;Jumlah");
  for (const item of hasil.perItem) {
    baris.push(
      [
        selCSV(item.seksi),
        selCSV(item.uraian),
        selCSV(item.volume),
        selCSV(item.satuan),
        selCSV(item.hargaSatuan),
        selCSV(item.jumlah),
      ].join(";"),
    );
  }
  for (const { seksi, subtotal } of hasil.perSeksi) {
    baris.push(
      ["", selCSV(`Subtotal Seksi ${seksi}`), "", "", "", selCSV(subtotal)].join(";"),
    );
  }
  baris.push(`;;Total Sebelum Pajak;;;${selCSV(hasil.totalSebelumPajak)}`);
  baris.push(`;;Pajak (${hasil.ppnPersen}%);;;${selCSV(hasil.ppn)}`);
  baris.push(`;;Grand Total;;;${selCSV(hasil.grandTotal)}`);
  return baris.join("\n") + "\n";
}

/** Mengekspor hasil RAB sebagai JSON terformat rapi (indentasi 2 spasi). */
export function eksporJSON(hasil: HasilRAB): string {
  if (hasil === null || typeof hasil !== "object") {
    throw new Error("Hasil RAB harus berupa objek dari hitungRAB");
  }
  return JSON.stringify(hasil, null, 2);
}
