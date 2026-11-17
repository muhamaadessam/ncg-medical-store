/**
 * Money helpers for KWD (3 decimal places).
 *
 * All arithmetic MUST happen on integer fils (1 KWD = 1000 fils).
 * Convert to fils as soon as a price enters the app, convert back only for display.
 */

export const FILS_PER_KWD = 1000;

/** Convert a KWD amount (number or numeric string from Postgres) to integer fils. */
export function toFils(kwd: number | string): number {
  const value = typeof kwd === "string" ? Number(kwd.trim()) : kwd;
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid KWD amount: ${String(kwd)}`);
  }
  // Math.round absorbs float noise such as 1.255 * 1000 = 1254.9999999.
  return Math.round(value * FILS_PER_KWD);
}

/** Format integer fils as a KWD string with exactly 3 decimals, e.g. 19500 -> "19.500 KWD". */
export function formatKWD(fils: number): string {
  if (!Number.isInteger(fils)) {
    throw new Error(`formatKWD expects integer fils, got ${fils}`);
  }
  const sign = fils < 0 ? "-" : "";
  const abs = Math.abs(fils);
  const whole = Math.floor(abs / FILS_PER_KWD);
  const fraction = String(abs % FILS_PER_KWD).padStart(3, "0");
  return `${sign}${whole}.${fraction} KWD`;
}
