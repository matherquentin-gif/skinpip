// Pip = $0.00001 USD. All monetary values are BIGINT pips — never floats.
// Formatting below uses integer math only, so a price always renders exactly.

export type Pips = bigint;

export const PIPS_PER_DOLLAR = 100_000n;
export const PIPS_PER_CENT = 1_000n;
/** Number of decimal places one pip occupies in a USD amount. */
const PIP_DECIMALS = 5;

export function dollarsToPips(dollars: number): Pips {
  return BigInt(Math.round(dollars * 100_000));
}

export function centsToPips(cents: number): Pips {
  return BigInt(cents) * PIPS_PER_CENT;
}

export function pipsToNumber(pips: Pips): number {
  return Number(pips) / 100_000;
}

/**
 * Parse a user-typed USD amount ("12", "0.00045", "$1,234.5") into pips.
 * Returns null for anything that isn't a non-negative amount representable in
 * whole pips (more than 5 decimal places is rejected rather than rounded).
 */
export function parseUsdToPips(input: string): Pips | null {
  const s = input.trim().replace(/^\$/, "");
  // Commas only as real thousands separators ("1,234.5"), never "1,2,3".
  const m = /^(\d{1,3}(?:,\d{3})+|\d*)(?:\.(\d*))?$/.exec(s);
  if (!m || (m[1] === "" && !m[2])) return null;
  const frac = m[2] ?? "";
  if (frac.length > PIP_DECIMALS) return null;
  const whole = m[1] === "" ? 0n : BigInt(m[1].replace(/,/g, ""));
  return whole * PIPS_PER_DOLLAR + BigInt(frac.padEnd(PIP_DECIMALS, "0"));
}

/**
 * Exact fixed-point rendering of a pip amount with `decimals` places
 * (0–5), rounding half away from zero. The whole part is comma-grouped.
 */
function formatFixed(pips: Pips, decimals: number): { sign: string; whole: string; frac: string } {
  const neg = pips < 0n;
  let abs = neg ? -pips : pips;
  const drop = 10n ** BigInt(PIP_DECIMALS - decimals);
  if (drop > 1n) abs = (abs + drop / 2n) / drop;
  const unit = 10n ** BigInt(decimals);
  const whole = abs / unit;
  const frac = decimals > 0 ? (abs % unit).toString().padStart(decimals, "0") : "";
  return { sign: neg && abs !== 0n ? "-" : "", whole: whole.toLocaleString("en-US"), frac };
}

/** Decimals to show: every pip below $0.01, 4 places below $1, cents above. */
function displayDecimals(pips: Pips): number {
  const abs = pips < 0n ? -pips : pips;
  if (abs < PIPS_PER_CENT) return 5;
  // 99,995+ pips round to $1.0000 at 4 places, so they get the $1+ format.
  if (abs < PIPS_PER_DOLLAR - 5n) return 4;
  return 2;
}

/** "1,247.55", "0.4500", "0.00045" — no currency symbol. */
export function pipsToDisplay(pips: Pips): string {
  const { sign, whole, frac } = formatFixed(pips, displayDecimals(pips));
  return `${sign}${whole}${frac ? `.${frac}` : ""}`;
}

/** "$1,247.55", "$0.4500", "$0.00045". */
export function pipsToUSD(pips: Pips): string {
  const { sign, whole, frac } = formatFixed(pips, displayDecimals(pips));
  return `${sign}$${whole}${frac ? `.${frac}` : ""}`;
}

/**
 * Exact amount for form hints and validation messages, in a form the user can
 * type back: no grouping, full pip precision, at least 2 decimals
 * ("1180.001", "0.00045", "12.50").
 */
export function pipsToExact(pips: Pips): string {
  const { sign, frac } = formatFixed(pips, PIP_DECIMALS);
  const whole = (pips < 0n ? -pips : pips) / PIPS_PER_DOLLAR;
  return `${sign}${whole}.${frac.replace(/0{1,3}$/, "")}`;
}

/**
 * Split for the two-tone price display: `whole` = "$1,247." and `sub` = the
 * decimals. Always exact, never rounded (it also shows wallet balances, which
 * must never read higher than they are): 4 decimals when that's lossless,
 * otherwise all 5, and always 5 below $0.01.
 */
export function pipsToSplit(pips: Pips): { whole: string; sub: string } {
  const abs = pips < 0n ? -pips : pips;
  const lossless4 = abs % 10n === 0n;
  const { sign, whole, frac } = formatFixed(pips, abs < PIPS_PER_CENT || !lossless4 ? 5 : 4);
  return { whole: `${sign}$${whole}.`, sub: frac };
}

export function feeFromPips(pips: Pips, feeBps: number): Pips {
  return (pips * BigInt(feeBps)) / 10_000n;
}

export const FEE_BPS_FLAT = 200;
export const FEE_BPS_MAKER = 100;
export const FEE_BPS_TAKER = 200;

/** What the seller nets after the marketplace fee. */
export function sellerNetPips(pricePips: Pips, feeBps: number = FEE_BPS_FLAT): Pips {
  return pricePips - feeFromPips(pricePips, feeBps);
}

/** Net-of-fee USD string, e.g. "$1,222.46". */
export function sellerNetUSD(pricePips: Pips, feeBps: number = FEE_BPS_FLAT): string {
  return pipsToUSD(sellerNetPips(pricePips, feeBps));
}
