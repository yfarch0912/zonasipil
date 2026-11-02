/**
 * Helper validasi input bersama untuk app quantity (take-off material).
 *
 * Aturan umum: besaran yang dipakai rumus (dimensi, luas, diameter,
 * jumlah) wajib berupa angka berhingga dan lebih dari 0; jumlah yang
 * bersifat cacahan (batang, elemen) wajib bilangan bulat >= 1. Input
 * yang tidak memenuhi aturan melempar Error dengan pesan Bahasa
 * Indonesia yang menyebut nama besaran dan nilai yang diterima.
 */

/** Pastikan nilai adalah angka berhingga dan > 0. */
export function pastikanPositif(nilai: number, namaBesaran: string): number {
  if (typeof nilai !== "number" || !Number.isFinite(nilai) || nilai <= 0) {
    throw new Error(
      `${namaBesaran} harus berupa angka berhingga yang lebih dari 0, diterima: ${nilai}`,
    );
  }
  return nilai;
}

/** Pastikan nilai adalah angka berhingga dan >= 0. */
export function pastikanTidakNegatif(
  nilai: number,
  namaBesaran: string,
): number {
  if (typeof nilai !== "number" || !Number.isFinite(nilai) || nilai < 0) {
    throw new Error(
      `${namaBesaran} harus berupa angka berhingga minimal 0, diterima: ${nilai}`,
    );
  }
  return nilai;
}

/** Pastikan nilai adalah bilangan bulat >= nilai minimum. */
export function pastikanBulatMinimal(
  nilai: number,
  namaBesaran: string,
  minimum: number,
): number {
  if (
    typeof nilai !== "number" ||
    !Number.isFinite(nilai) ||
    !Number.isInteger(nilai) ||
    nilai < minimum
  ) {
    throw new Error(
      `${namaBesaran} harus berupa bilangan bulat minimal ${minimum}, diterima: ${nilai}`,
    );
  }
  return nilai;
}

/** Pastikan nilai adalah angka berhingga dalam rentang 0–100 (persen). */
export function pastikanPersen(nilai: number, namaBesaran: string): number {
  if (
    typeof nilai !== "number" ||
    !Number.isFinite(nilai) ||
    nilai < 0 ||
    nilai > 100
  ) {
    throw new Error(
      `${namaBesaran} harus berupa angka berhingga antara 0 dan 100, diterima: ${nilai}`,
    );
  }
  return nilai;
}
