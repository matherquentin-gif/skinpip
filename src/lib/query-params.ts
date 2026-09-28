// Tolerant parsers for URL query parameters. Bad input falls back to a
// default instead of reaching Prisma as NaN (which throws).

/** Parse an integer in [min, max]; returns `fallback` for missing or invalid input. */
export function intParam(value: string | null, fallback: number, min: number, max: number): number {
  if (value == null || value.trim() === "") return fallback;
  const n = Number(value);
  if (!Number.isInteger(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** Parse a finite float in [min, max]; returns undefined for missing or invalid input. */
export function floatParam(value: string | null, min: number, max: number): number | undefined {
  if (value == null || value.trim() === "") return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(max, Math.max(min, n));
}

/** Parse a non-negative integer pip amount; returns undefined for missing or invalid input. */
export function pipsParam(value: string | null): bigint | undefined {
  if (value == null || !/^\d{1,18}$/.test(value)) return undefined;
  return BigInt(value);
}

/** Split a comma list, dropping empty entries. */
export function listParam(value: string | null): string[] {
  return value?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
}
