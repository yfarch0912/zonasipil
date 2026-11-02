/**
 * Parser angka untuk input UI Bahasa Indonesia.
 *
 * Menerima format Indonesia ("1.234,56" — titik ribuan, koma desimal)
 * maupun format titik desimal ("1234.56"). Aturan:
 * - Bila ada koma: titik dianggap pemisah ribuan, koma = desimal.
 * - Bila tidak ada koma dan hanya satu titik: titik = desimal.
 * - Bila tidak ada koma dan banyak titik: hanya diterima sebagai pemisah
 *   ribuan Indonesia bila grup pertama 1–3 digit dan setiap grup
 *   berikutnya tepat 3 digit ("1.200.000"); pola lain ditolak.
 * Hasil tidak pernah NaN: kegagalan selalu berupa pesan error Indonesia.
 */

export type HasilParse =
  | { ok: true; value: number }
  | { ok: false; error: string };

export interface OpsiParse {
  /** Nama field untuk pesan error, mis. "Panjang (m)". */
  label: string;
  /** Bila true, nilai harus > 0. */
  positif?: boolean;
  /** Bila true, nilai harus >= 0. */
  tidakNegatif?: boolean;
  /** Bila true, nilai harus bilangan bulat. */
  bulat?: boolean;
  /** Nilai maksimum inklusif (mis. 100 untuk persen). */
  maksimum?: number;
}

export function parseAngkaID(raw: string): HasilParse {
  const teks = (raw ?? "").trim().replace(/\s+/g, "");
  if (teks === "") return { ok: false, error: "tidak boleh kosong" };
  if (!/^[+-]?[0-9.,]+$/.test(teks)) {
    return { ok: false, error: "harus berupa angka" };
  }
  let ternormalisasi: string;
  if (teks.includes(",")) {
    if (teks.indexOf(",") !== teks.lastIndexOf(",")) {
      return { ok: false, error: "format angka tidak valid (koma desimal ganda)" };
    }
    ternormalisasi = teks.replace(/\./g, "").replace(",", ".");
  } else if (teks.indexOf(".") !== teks.lastIndexOf(".")) {
    // Tanpa koma: banyak titik hanya sah sebagai pemisah ribuan Indonesia.
    const bertanda = teks.startsWith("-") || teks.startsWith("+");
    const grup = (bertanda ? teks.slice(1) : teks).split(".");
    const grupRibuanSah =
      grup[0].length >= 1 && grup[0].length <= 3 && grup.slice(1).every((g) => g.length === 3);
    if (!grupRibuanSah) {
      return { ok: false, error: "format angka tidak valid (titik ganda tanpa koma desimal)" };
    }
    ternormalisasi = teks.replace(/\./g, "");
  } else {
    ternormalisasi = teks;
  }
  const value = Number(ternormalisasi);
  if (!Number.isFinite(value)) return { ok: false, error: "harus berupa angka berhingga" };
  return { ok: true, value };
}

/** Parse + validasi rentang sebuah field; pesan error menyebut nama field. */
export function parseField(raw: string, opsi: OpsiParse): HasilParse {
  const hasil = parseAngkaID(raw);
  if (!hasil.ok) return { ok: false, error: `${opsi.label} ${hasil.error}.` };
  const v = hasil.value;
  if (opsi.positif && v <= 0) {
    return { ok: false, error: `${opsi.label} harus lebih besar dari 0.` };
  }
  if (opsi.tidakNegatif && v < 0) {
    return { ok: false, error: `${opsi.label} tidak boleh negatif.` };
  }
  if (opsi.bulat && !Number.isInteger(v)) {
    return { ok: false, error: `${opsi.label} harus bilangan bulat.` };
  }
  if (opsi.maksimum !== undefined && v > opsi.maksimum) {
    return { ok: false, error: `${opsi.label} tidak boleh lebih dari ${opsi.maksimum}.` };
  }
  return hasil;
}
