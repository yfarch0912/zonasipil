/**
 * Indonesian number formatting, implemented manually and deterministically:
 * thousands separator ".", decimal separator ",". No Intl/ICU dependency.
 *
 * Examples:
 *   formatAngkaID(1234567.891, 2) === "1.234.567,89"
 *   formatAngkaID(3, 2) === "3,00"
 */
export function formatAngkaID(value: number, decimals = 2): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Nilai tidak valid: ${value}`);
  }
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 20) {
    throw new Error(`Jumlah desimal tidak valid: ${decimals}`);
  }

  const fixed = value.toFixed(decimals);
  const isNegative = fixed.startsWith("-");
  const unsigned = isNegative ? fixed.slice(1) : fixed;
  // Drop the sign when the rounded value is exactly zero (avoid "-0,00").
  const sign = isNegative && Number(unsigned) !== 0 ? "-" : "";

  const dotIndex = unsigned.indexOf(".");
  const intPart = dotIndex === -1 ? unsigned : unsigned.slice(0, dotIndex);
  const fracPart = dotIndex === -1 ? "" : unsigned.slice(dotIndex + 1);

  let grouped = "";
  for (let i = 0; i < intPart.length; i++) {
    const remaining = intPart.length - i;
    grouped += intPart[i];
    if (remaining > 1 && remaining % 3 === 1) grouped += ".";
  }

  return decimals === 0 ? `${sign}${grouped}` : `${sign}${grouped},${fracPart}`;
}
