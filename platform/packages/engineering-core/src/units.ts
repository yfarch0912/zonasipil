/**
 * Generic SI-based unit conversion.
 *
 * Every unit is defined by its factor to the SI base unit of its kind
 * (m, m², m³, kg, N, N·m, Pa). Conversion is value × factor(from) / factor(to).
 *
 * Exact definitions used:
 * - 1 inch = 25.4 mm, 1 ft = 304.8 mm
 * - 1 tf = 9806.65 N, 1 kgf = 9.80665 N
 * - 1 kgf/cm² = 98066.5 Pa
 * - 1 liter = 0.001 m³, 1 ha = 10 000 m², 1 ton = 1000 kg
 */

export type UnitKind =
  | "length"
  | "area"
  | "volume"
  | "mass"
  | "force"
  | "moment"
  | "pressure";

export type LengthUnit = "mm" | "cm" | "m" | "km" | "inch" | "ft";
export type AreaUnit = "mm2" | "cm2" | "m2" | "ha";
export type VolumeUnit = "mm3" | "cm3" | "m3" | "liter";
export type MassUnit = "g" | "kg" | "ton";
export type ForceUnit = "N" | "kN" | "tf";
export type MomentUnit = "Nm" | "kNm" | "kgfm";
export type PressureUnit = "Pa" | "kPa" | "MPa" | "kgfcm2";

const LENGTH: Record<string, number> = {
  mm: 0.001,
  cm: 0.01,
  m: 1,
  km: 1000,
  inch: 0.0254,
  in: 0.0254,
  ft: 0.3048,
};

const AREA: Record<string, number> = {
  mm2: 1e-6,
  cm2: 1e-4,
  m2: 1,
  ha: 10000,
};

const VOLUME: Record<string, number> = {
  mm3: 1e-9,
  cm3: 1e-6,
  m3: 1,
  liter: 0.001,
  L: 0.001,
  l: 0.001,
};

const MASS: Record<string, number> = {
  g: 0.001,
  kg: 1,
  ton: 1000,
};

const FORCE: Record<string, number> = {
  N: 1,
  kN: 1000,
  tf: 9806.65,
};

const MOMENT: Record<string, number> = {
  Nm: 1,
  kNm: 1000,
  kgfm: 9.80665,
};

const PRESSURE: Record<string, number> = {
  Pa: 1,
  kPa: 1000,
  MPa: 1e6,
  kgfcm2: 98066.5,
};

const TABLES: Record<UnitKind, Record<string, number>> = {
  length: LENGTH,
  area: AREA,
  volume: VOLUME,
  mass: MASS,
  force: FORCE,
  moment: MOMENT,
  pressure: PRESSURE,
};

/** Aliases for the pressure kind (stress is the same dimension). */
const KIND_ALIASES: Record<string, UnitKind> = {
  stress: "pressure",
  tegangan: "pressure",
  tekanan: "pressure",
};

function resolveKind(kind: string): UnitKind {
  if (kind in TABLES) return kind as UnitKind;
  const alias = KIND_ALIASES[kind];
  if (alias) return alias;
  throw new Error(`Jenis satuan tidak dikenal: ${kind}`);
}

function factor(table: Record<string, number>, unit: string, kind: UnitKind): number {
  const f = table[unit];
  if (f === undefined) {
    throw new Error(`Satuan tidak dikenal untuk ${kind}: ${unit}`);
  }
  return f;
}

/**
 * Convert a value between two units of the same kind.
 * Throws Error on non-finite value, unknown kind, or unknown unit.
 */
export function convert(
  value: number,
  from: string,
  to: string,
  kind: UnitKind | string,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Nilai tidak valid: ${value}`);
  }
  const resolved = resolveKind(kind);
  const table = TABLES[resolved];
  return (value * factor(table, from, resolved)) / factor(table, to, resolved);
}

export function convertLength(value: number, from: LengthUnit, to: LengthUnit): number {
  return convert(value, from, to, "length");
}

export function convertArea(value: number, from: AreaUnit, to: AreaUnit): number {
  return convert(value, from, to, "area");
}

export function convertVolume(value: number, from: VolumeUnit, to: VolumeUnit): number {
  return convert(value, from, to, "volume");
}

export function convertMass(value: number, from: MassUnit, to: MassUnit): number {
  return convert(value, from, to, "mass");
}

export function convertForce(value: number, from: ForceUnit, to: ForceUnit): number {
  return convert(value, from, to, "force");
}

export function convertMoment(value: number, from: MomentUnit, to: MomentUnit): number {
  return convert(value, from, to, "moment");
}

export function convertPressure(
  value: number,
  from: PressureUnit,
  to: PressureUnit,
): number {
  return convert(value, from, to, "pressure");
}

/** Stress is dimensionally identical to pressure. */
export const convertStress = convertPressure;
