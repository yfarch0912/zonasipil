import type { UnitKind } from "@zonasipil/engineering-core";

/** Daftar satuan per kategori — persis tabel satuan @zonasipil/engineering-core. */
export const UNIT_OPTIONS: Record<UnitKind, readonly string[]> = {
  length: ["mm", "cm", "m", "km", "inch", "ft"],
  area: ["mm2", "cm2", "m2", "ha"],
  volume: ["mm3", "cm3", "m3", "liter"],
  mass: ["g", "kg", "ton"],
  force: ["N", "kN", "tf"],
  moment: ["Nm", "kNm", "kgfm"],
  pressure: ["Pa", "kPa", "MPa", "kgfcm2"],
};

export const UNIT_KIND_LABELS: Record<UnitKind, string> = {
  length: "Panjang",
  area: "Luas",
  volume: "Volume",
  mass: "Massa",
  force: "Gaya",
  moment: "Momen",
  pressure: "Tekanan / Tegangan",
};

export const UNIT_KINDS = Object.keys(UNIT_OPTIONS) as UnitKind[];
