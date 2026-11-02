import { formatAngkaID } from "@zonasipil/engineering-core";

/** Format angka hasil hitung untuk tampilan; nilai tak berhingga -> "—" (tidak pernah NaN/undefined). */
export function formatHasil(value: number, decimals = 3): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return formatAngkaID(value, decimals);
}

/** Format rupiah bulat: "Rp1.234.567". Nilai tak berhingga -> "—". */
export function formatRupiah(value: number): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return `Rp${formatAngkaID(Math.round(value), 0)}`;
}
