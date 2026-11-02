/**
 * Zona Calculator — inti logika kalkulator teknik sipil ZonaSipil.
 *
 * Isi:
 * - volumeBeton  : volume beton prisma persegi + cadangan waste.
 * - beratTulangan: berat baja tulangan dari diameter & panjang total.
 * - Konversi satuan: diekspor ulang apa adanya dari
 *   @zonasipil/engineering-core (sumber tunggal, tidak diduplikasi).
 *
 * Rumus lengkap dan batas dukungan tertulis di README.md app ini.
 */
export const APP_SLUG = "calculator";

export * from "./validasi.ts";
export * from "./volume-beton.ts";
export * from "./berat-tulangan.ts";

// Ekspor ulang konversi satuan dari engineering-core, apa adanya.
export {
  convert,
  convertArea,
  convertForce,
  convertLength,
  convertMass,
  convertMoment,
  convertPressure,
  convertVolume,
} from "@zonasipil/engineering-core";

export type {
  AreaUnit,
  ForceUnit,
  LengthUnit,
  MassUnit,
  MomentUnit,
  PressureUnit,
  UnitKind,
  VolumeUnit,
} from "@zonasipil/engineering-core";
