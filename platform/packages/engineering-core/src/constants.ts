/**
 * Material & physical constants shared across ZonaSipil engineering apps.
 * Sources are first-principles / SI definitions — no invented standard values.
 */

/** Density of reinforced concrete, kg/m³. */
export const RHO_BETON_BERTULANG = 2400;

/** Density of steel, kg/m³. */
export const RHO_BAJA = 7850;

/**
 * Steel bar weight factor: kg per metre of bar per mm² of diameter squared.
 * Derived from steel density: (π/4) × 7850 kg/m³ × 1e-6 m²/mm² ≈ 0.006165.
 * Weight per metre for diameter d (mm): w = FAKTOR_BERAT_BESI × d².
 */
export const FAKTOR_BERAT_BESI = 0.006165;

/** Standard gravity, m/s² (exact SI definition). */
export const GRAVITASI = 9.80665;

/** Weight of one steel bar per metre, kg/m, for diameter in mm. */
export function beratBesiPerMeter(diameterMm: number): number {
  if (!Number.isFinite(diameterMm)) {
    throw new Error(`Diameter tidak valid: ${diameterMm}`);
  }
  return FAKTOR_BERAT_BESI * diameterMm * diameterMm;
}
