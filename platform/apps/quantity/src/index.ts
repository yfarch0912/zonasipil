/**
 * Zona Quantity — inti logika take-off (hitung kebutuhan material)
 * ZonaSipil. Semua rumus bersifat geometris/teoritis dan tertulis
 * eksplisit di README.md app ini beserta batas dukungannya.
 *
 * Isi:
 * - volumeBetonElemen  : volume beton prisma persegi per jenis elemen.
 * - beratTulanganElemen: berat tulangan per kelompok batang sejenis.
 * - kebutuhanBataPerM2 / kebutuhanBata: bata dinding setengah bata.
 * - volumeMortarPlester: volume plesteran = luas × tebal.
 * - luasAcian          : acian dihitung per m² luas permukaan.
 * - rekapMaterial      : total beton & tulangan dari daftar elemen.
 */
export const APP_SLUG = "quantity";

export * from "./validasi.ts";
export * from "./elemen-beton.ts";
export * from "./tulangan.ts";
export * from "./pasangan.ts";
export * from "./rekap.ts";
