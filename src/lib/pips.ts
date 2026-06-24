// Pip = $0.00001 USD. All monetary values are BIGINT pips — never floats.

export type Pips = bigint;

export const PIPS_PER_DOLLAR = 100_000n;
export const PIPS_PER_CENT = 1_000n;

export function dollarsToPips(dollars: number): Pips {
  return BigInt(Math.round(dollars * 100_000));
}

export function centsToPips(cents: number): Pips {
  return BigInt(cents) * PIPS_PER_CENT;
}

export function pipsToNumber(pips: Pips): number {
  return Number(pips) / 100_000;
}

export function pipsToUSD(pips: Pips): string {
  const dollars = Number(pips) / 100_000;
  if (dollars < 0.001) {
    return `$${dollars.toFixed(5)}`;
  }
  if (dollars < 1) {
    return `$${dollars.toFixed(4)}`;
  }
  return `$${dollars.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function pipsToDisplay(pips: Pips): string {
  const dollars = Number(pips) / 100_000;
  if (dollars < 0.01) {
    return dollars.toFixed(5);
  }
  if (dollars < 1) {
    return dollars.toFixed(4);
  }
  return dollars.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function pipsToSplit(pips: Pips): { whole: string; sub: string } {
  const dollars = Number(pips) / 100_000;
  const [whole, dec] = dollars.toFixed(4).split(".");
  const display = `${Number(whole).toLocaleString("en-US")}`;
  return { whole: `$${display}.`, sub: dec ?? "0000" };
}

export function feeFromPips(pips: Pips, feeBps: number): Pips {
  return (pips * BigInt(feeBps)) / 10_000n;
}

export const FEE_BPS_FLAT = 200;
export const FEE_BPS_MAKER = 100;
export const FEE_BPS_TAKER = 200;
