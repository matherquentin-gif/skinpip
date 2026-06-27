/**
 * Deterministic demo dataset for SkinPip.
 *
 * Single source of truth for fake market data used to test the UI, charts,
 * order book, and market analytics WITHOUT a live database or live prices.
 *
 * Everything here is generated from a seeded PRNG so values are stable across
 * server and client renders (no hydration mismatch) and reproducible run to run.
 * The same catalog is reused by `prisma/seed.ts` to populate Postgres, so the
 * demo fallback and a seeded database look identical.
 *
 * Pip = $0.00001 USD. All money is bigint pips.
 */

import type { SkinCardData } from "@/components/SkinCard";
import type { CandleData } from "@/components/PriceChart";
import type { OrderBookEntry } from "@/components/OrderBook";

// ---------------------------------------------------------------------------
// Seeded PRNG (mulberry32) — deterministic, no Math.random in render paths.
// ---------------------------------------------------------------------------

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A small deterministic RNG bound to a string key. */
export function rngFor(key: string) {
  const rand = mulberry32(hashStr(key));
  return {
    next: rand,
    between: (min: number, max: number) => min + rand() * (max - min),
    int: (min: number, max: number) => Math.floor(min + rand() * (max - min + 1)),
    pick: <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)],
  };
}

const DAY = 86_400;
/** UTC-midnight anchor so candle timestamps are stable within a day. */
function todayAnchor(nowMs = Date.now()): number {
  return Math.floor(nowMs / 1000 / DAY) * DAY;
}

// ---------------------------------------------------------------------------
// Catalog — the canonical demo skins. Reused by the DB seed.
// ---------------------------------------------------------------------------

export type Category = "knife" | "glove" | "rifle" | "awp" | "pistol" | "case" | "sticker";

export interface CatalogEntry {
  key: string;            // stable id used everywhere (market id, candle seed)
  weaponName: string;
  skinName: string;
  wearName: string | null;
  category: Category;
  paintIndex: number | null;
  paintSeed: number | null;
  paintWear: number | null;
  phaseLabel: string | null;
  patternTierLabel: string | null;
  isStatTrak: boolean;
  isSouvenir: boolean;
  rarity: string | null;
  collection: string | null;
  basePips: bigint;       // reference price
  /** rough 30d trend bias: >0 up, <0 down */
  trend: number;
  stickers?: { name: string }[];
}

export const CATALOG: CatalogEntry[] = [
  { key: "karambit-gamma-emerald-fn", weaponName: "Karambit", skinName: "Gamma Doppler", wearName: "Factory New", category: "knife", paintIndex: 570, paintSeed: 412, paintWear: 0.00834, phaseLabel: "Emerald", patternTierLabel: null, isStatTrak: false, isSouvenir: false, rarity: "Covert", collection: "Gamma", basePips: 124_755_200n, trend: 0.12 },
  { key: "butterfly-doppler-sapphire-fn", weaponName: "Butterfly Knife", skinName: "Doppler", wearName: "Factory New", category: "knife", paintIndex: 415, paintSeed: 777, paintWear: 0.01245, phaseLabel: "Sapphire", patternTierLabel: null, isStatTrak: true, isSouvenir: false, rarity: "Covert", collection: "Chroma", basePips: 289_500_000n, trend: -0.04 },
  { key: "ak-case-hardened-ft-661", weaponName: "AK-47", skinName: "Case Hardened", wearName: "Field-Tested", category: "rifle", paintIndex: 44, paintSeed: 661, paintWear: 0.2331, phaseLabel: null, patternTierLabel: "Blue Gem Tier 1", isStatTrak: false, isSouvenir: false, rarity: "Classified", collection: "Arms Deal", basePips: 450_000_000n, trend: 0.23 },
  { key: "karambit-fade-fn", weaponName: "Karambit", skinName: "Fade", wearName: "Factory New", category: "knife", paintIndex: 38, paintSeed: 100, paintWear: 0.0043, phaseLabel: null, patternTierLabel: "Full Fade", isStatTrak: false, isSouvenir: false, rarity: "Covert", collection: "Knives", basePips: 172_000_000n, trend: 0.05 },
  { key: "awp-dragon-lore-fn", weaponName: "AWP", skinName: "Dragon Lore", wearName: "Factory New", category: "awp", paintIndex: 344, paintSeed: 500, paintWear: 0.0102, phaseLabel: null, patternTierLabel: null, isStatTrak: false, isSouvenir: false, rarity: "Covert", collection: "Cobblestone", basePips: 1_850_000_000n, trend: 0.08 },
  { key: "awp-asiimov-ft", weaponName: "AWP", skinName: "Asiimov", wearName: "Field-Tested", category: "awp", paintIndex: 279, paintSeed: 320, paintWear: 0.2487, phaseLabel: null, patternTierLabel: null, isStatTrak: false, isSouvenir: false, rarity: "Covert", collection: "Phoenix", basePips: 9_540_000n, trend: 0.02 },
  { key: "m4a4-howl-fn", weaponName: "M4A4", skinName: "Howl", wearName: "Factory New", category: "rifle", paintIndex: 309, paintSeed: 210, paintWear: 0.012, phaseLabel: null, patternTierLabel: null, isStatTrak: false, isSouvenir: false, rarity: "Contraband", collection: "Huntsman", basePips: 620_000_000n, trend: 0.31 },
  { key: "ak-redline-ft", weaponName: "AK-47", skinName: "Redline", wearName: "Field-Tested", category: "rifle", paintIndex: 282, paintSeed: 44, paintWear: 0.182, phaseLabel: null, patternTierLabel: null, isStatTrak: false, isSouvenir: false, rarity: "Classified", collection: "Phoenix", basePips: 1_240_000n, trend: -0.03 },
  { key: "ak-redline-ww", weaponName: "AK-47", skinName: "Redline", wearName: "Well-Worn", category: "rifle", paintIndex: 282, paintSeed: 612, paintWear: 0.412, phaseLabel: null, patternTierLabel: null, isStatTrak: false, isSouvenir: false, rarity: "Classified", collection: "Phoenix", basePips: 980_000n, trend: -0.06 },
  { key: "usp-kill-confirmed-mw", weaponName: "USP-S", skinName: "Kill Confirmed", wearName: "Minimal Wear", category: "pistol", paintIndex: 503, paintSeed: 88, paintWear: 0.103, phaseLabel: null, patternTierLabel: null, isStatTrak: false, isSouvenir: false, rarity: "Covert", collection: "Shadow", basePips: 4_120_000n, trend: 0.01 },
  { key: "deagle-blaze-fn", weaponName: "Desert Eagle", skinName: "Blaze", wearName: "Factory New", category: "pistol", paintIndex: 37, paintSeed: 12, paintWear: 0.018, phaseLabel: null, patternTierLabel: null, isStatTrak: false, isSouvenir: false, rarity: "Restricted", collection: "Dust", basePips: 5_300_000n, trend: 0.09 },
  { key: "sport-gloves-pandora-ft", weaponName: "Sport Gloves", skinName: "Pandora's Box", wearName: "Field-Tested", category: "glove", paintIndex: 10037, paintSeed: 333, paintWear: 0.21, phaseLabel: null, patternTierLabel: null, isStatTrak: false, isSouvenir: false, rarity: "Extraordinary", collection: "Gloves", basePips: 198_000_000n, trend: 0.07 },
  { key: "case-bravo", weaponName: "Case", skinName: "Operation Bravo Case", wearName: null, category: "case", paintIndex: null, paintSeed: null, paintWear: null, phaseLabel: null, patternTierLabel: "Discontinued", isStatTrak: false, isSouvenir: false, rarity: "Base Grade", collection: "Bravo", basePips: 8_900_000n, trend: 0.18 },
  { key: "case-chroma", weaponName: "Case", skinName: "Chroma Case", wearName: null, category: "case", paintIndex: null, paintSeed: null, paintWear: null, phaseLabel: null, patternTierLabel: null, isStatTrak: false, isSouvenir: false, rarity: "Base Grade", collection: "Chroma", basePips: 78_000n, trend: 0.04 },
  // ── Genuinely sub-cent items — the whole reason SkinPip exists ──
  { key: "graffiti-recoil-blue", weaponName: "Sealed Graffiti", skinName: "Recoil (Blue)", wearName: null, category: "sticker", paintIndex: null, paintSeed: null, paintWear: null, phaseLabel: null, patternTierLabel: null, isStatTrak: false, isSouvenir: false, rarity: "Base Grade", collection: "Graffiti", basePips: 700n, trend: 0.02 },
  { key: "sticker-cph2025-glitter", weaponName: "Sticker", skinName: "Copenhagen 2025 (Glitter)", wearName: null, category: "sticker", paintIndex: null, paintSeed: null, paintWear: null, phaseLabel: null, patternTierLabel: null, isStatTrak: false, isSouvenir: false, rarity: "High Grade", collection: "Stickers", basePips: 200n, trend: -0.01 },
  { key: "graffiti-ez-pz", weaponName: "Sealed Graffiti", skinName: "EZ (Tracer Yellow)", wearName: null, category: "sticker", paintIndex: null, paintSeed: null, paintWear: null, phaseLabel: null, patternTierLabel: null, isStatTrak: false, isSouvenir: false, rarity: "Base Grade", collection: "Graffiti", basePips: 450n, trend: 0.05 },
];

export function catalogByKey(key: string): CatalogEntry | undefined {
  return CATALOG.find((c) => c.key === key);
}

// ---------------------------------------------------------------------------
// Derived demo data
// ---------------------------------------------------------------------------

/** Percent change over `days`, derived deterministically from the entry. */
function changePercent(entry: CatalogEntry, days = 7): number {
  const r = rngFor(`${entry.key}:chg:${days}`);
  const noise = r.between(-1, 1) * 4;
  return Math.round((entry.trend * 100 * (days / 30) + noise) * 10) / 10;
}

/** Market grid cards. */
export function demoMarketItems(): SkinCardData[] {
  return CATALOG.map((c) => ({
    id: c.key,
    skinName: c.skinName,
    weaponName: c.weaponName,
    wearName: c.wearName,
    imageUrl: null,
    paintWear: c.paintWear,
    paintSeed: c.paintSeed,
    phaseLabel: c.phaseLabel,
    patternTierLabel: c.patternTierLabel,
    isStatTrak: c.isStatTrak,
    isSouvenir: c.isSouvenir,
    pricePips: c.basePips,
    changePercent: changePercent(c, 7),
    stickers: c.stickers,
  }));
}

/**
 * Deterministic OHLC candles ending today, trending per `trend`.
 * `closeBase` is the final close price in *dollars* (chart works in dollars).
 */
export function demoCandles(seedKey: string, closeBaseDollars: number, days = 90, trend = 0, nowMs = Date.now()): CandleData[] {
  const r = rngFor(`${seedKey}:candles`);
  const anchor = todayAnchor(nowMs);
  // Walk backwards from the final close so the series ends exactly at base.
  const closes: number[] = new Array(days);
  closes[days - 1] = closeBaseDollars;
  const driftPerDay = (trend * closeBaseDollars) / days;
  for (let i = days - 2; i >= 0; i--) {
    const vol = closeBaseDollars * 0.03;
    const step = driftPerDay + (r.next() - 0.5) * vol;
    closes[i] = Math.max(closeBaseDollars * 0.4, closes[i + 1] - step);
  }
  const out: CandleData[] = [];
  for (let i = 0; i < days; i++) {
    const close = closes[i];
    const open = i === 0 ? close * (1 + (r.next() - 0.5) * 0.02) : closes[i - 1];
    const hi = Math.max(open, close) * (1 + r.next() * 0.02);
    const lo = Math.min(open, close) * (1 - r.next() * 0.02);
    const volume = Math.round(r.between(1, 18) * (closeBaseDollars < 1 ? 40 : 1));
    out.push({ time: anchor - (days - 1 - i) * DAY, open, high: hi, low: lo, close, volume });
  }
  return out;
}

/** Candles for a catalog entry, priced in dollars from its basePips. */
export function demoCandlesForKey(key: string, days = 90, nowMs = Date.now()): CandleData[] {
  const c = catalogByKey(key);
  if (!c) return demoCandles(key, 100, days, 0, nowMs);
  return demoCandles(key, Number(c.basePips) / 100_000, days, c.trend, nowMs);
}

/** Synthetic order book around a base price (in pips). */
export function demoOrderBook(basePips: bigint, key = "ob"): {
  asks: OrderBookEntry[];
  bids: OrderBookEntry[];
  spreadPips: bigint;
  lastTradePips: bigint;
} {
  const r = rngFor(`${key}:orderbook`);
  const base = Number(basePips);
  const tick = Math.max(1, Math.round(base * 0.0008)); // ~0.08% ticks (sub-cent on cheap items)

  const asks: OrderBookEntry[] = [];
  let askPrice = base + tick;
  for (let i = 0; i < 6; i++) {
    const qty = r.int(1, 5);
    const pricePips = BigInt(Math.round(askPrice));
    asks.push({ pricePips, quantity: qty, totalPips: pricePips * BigInt(qty) });
    askPrice += tick * r.between(0.8, 2.2);
  }

  const bids: OrderBookEntry[] = [];
  let bidPrice = base - tick;
  for (let i = 0; i < 6; i++) {
    const qty = r.int(1, 6);
    const pricePips = BigInt(Math.max(1, Math.round(bidPrice)));
    bids.push({ pricePips, quantity: qty, totalPips: pricePips * BigInt(qty) });
    bidPrice -= tick * r.between(0.8, 2.2);
  }

  const spreadPips = asks[0].pricePips - bids[0].pricePips;
  const lastTradePips = BigInt(Math.round(base + tick * r.between(-0.5, 0.5)));
  return { asks, bids, spreadPips, lastTradePips };
}

/** Liquidity score 0–100 from a deterministic blend of order-book depth + volume. */
export function demoLiquidityScore(key: string): number {
  const c = catalogByKey(key);
  const r = rngFor(`${key}:liq`);
  // Cheaper / case / sticker items tend to be more liquid; big knives less so.
  const categoryBias =
    c?.category === "case" || c?.category === "sticker" ? 30 :
    c?.category === "awp" && Number(c.basePips) > 1e9 ? -25 :
    c?.category === "knife" ? -10 : 0;
  return Math.max(4, Math.min(99, Math.round(55 + categoryBias + r.between(-15, 25))));
}

// ── Trends dashboard ──────────────────────────────────────────────────────

export interface DemoIndex {
  name: string;
  key: string;
  valuePips: bigint;
  change24h: number;
  change7d: number;
  change30d: number;
  candles: CandleData[];
}

export function demoIndices(nowMs = Date.now()): DemoIndex[] {
  const defs: { name: string; key: string; valueDollars: number; trend: number }[] = [
    { name: "Knives Index", key: "idx-knives", valueDollars: 1894.2, trend: 0.09 },
    { name: "Gloves Index", key: "idx-gloves", valueDollars: 1320.5, trend: 0.06 },
    { name: "Rifle Index", key: "idx-rifle", valueDollars: 86.4, trend: 0.14 },
    { name: "AWP Index", key: "idx-awp", valueDollars: 231.0, trend: -0.03 },
    { name: "Case Index", key: "idx-case", valueDollars: 12.7, trend: 0.21 },
    { name: "Sticker Index", key: "idx-sticker", valueDollars: 0.042, trend: -0.02 },
  ];
  return defs.map((d) => {
    const r = rngFor(`${d.key}:deltas`);
    return {
      name: d.name,
      key: d.key,
      valuePips: BigInt(Math.round(d.valueDollars * 100_000)),
      change24h: Math.round((d.trend * 1.5 + r.between(-1, 1)) * 10) / 10,
      change7d: Math.round((d.trend * 8 + r.between(-2, 2)) * 10) / 10,
      change30d: Math.round((d.trend * 30 + r.between(-3, 3)) * 10) / 10,
      candles: demoCandles(d.key, d.valueDollars, 90, d.trend, nowMs),
    };
  });
}

export interface DemoMover {
  id: string;
  name: string;
  pricePips: bigint;
  change: number;
}

export function demoTopMovers(timeframeDays = 7, limit = 6): { gainers: DemoMover[]; losers: DemoMover[] } {
  const rows: DemoMover[] = CATALOG.map((c) => ({
    id: c.key,
    name: `${c.weaponName} | ${c.skinName}${c.wearName ? ` (${c.wearName})` : ""}`,
    pricePips: c.basePips,
    change: changePercent(c, timeframeDays),
  }));
  const sorted = [...rows].sort((a, b) => b.change - a.change);
  return {
    gainers: sorted.slice(0, limit),
    losers: sorted.slice(-limit).reverse(),
  };
}

export interface DemoMarketCap {
  totalPips: bigint;
  change24h: number;
  change7d: number;
  change30d: number;
  volume24hPips: bigint;
  activeListings: number;
  categories: { name: string; valuePips: bigint; share: number }[];
}

export function demoMarketCap(): DemoMarketCap {
  // Aggregate a believable "total economy" cap with a category split.
  const cats: { name: string; valueDollars: number }[] = [
    { name: "Knives", valueDollars: 2_140_000_000 },
    { name: "Gloves", valueDollars: 690_000_000 },
    { name: "Rifles", valueDollars: 1_380_000_000 },
    { name: "AWPs", valueDollars: 540_000_000 },
    { name: "Pistols", valueDollars: 210_000_000 },
    { name: "Cases", valueDollars: 980_000_000 },
    { name: "Stickers", valueDollars: 760_000_000 },
  ];
  const totalDollars = cats.reduce((s, c) => s + c.valueDollars, 0);
  return {
    totalPips: BigInt(Math.round(totalDollars * 100_000)),
    change24h: 1.3,
    change7d: 4.6,
    change30d: -2.1,
    volume24hPips: BigInt(Math.round(41_900_000 * 100_000)),
    activeListings: 18_742,
    categories: cats
      .map((c) => ({
        name: c.name,
        valuePips: BigInt(Math.round(c.valueDollars * 100_000)),
        share: c.valueDollars / totalDollars,
      }))
      .sort((a, b) => b.share - a.share),
  };
}

// ── Buy orders & auctions ─────────────────────────────────────────────────

export interface DemoBuyOrder {
  id: string;
  skinName: string;
  weapon: string;
  phase: string | null;
  floatMax: number | null;
  seeds: number[];
  pricePips: bigint;
  filled: number;
  status: "OPEN" | "PARTIAL" | "FILLED";
}

export function demoBuyOrders(): DemoBuyOrder[] {
  return [
    { id: "bo-1", skinName: "Gamma Doppler", weapon: "Karambit", phase: "Emerald", floatMax: 0.01, seeds: [412, 189, 712], pricePips: 120_000_000n, filled: 0, status: "OPEN" },
    { id: "bo-2", skinName: "Case Hardened", weapon: "AK-47", phase: null, floatMax: 0.5, seeds: [661, 4, 44, 955, 387], pricePips: 400_000_000n, filled: 0, status: "OPEN" },
    { id: "bo-3", skinName: "Doppler", weapon: "Bayonet", phase: "Sapphire", floatMax: 0.02, seeds: [], pricePips: 75_000_000n, filled: 1, status: "PARTIAL" },
    { id: "bo-4", skinName: "Recoil (Blue)", weapon: "Sealed Graffiti", phase: null, floatMax: null, seeds: [], pricePips: 650n, filled: 12, status: "PARTIAL" },
  ];
}

export interface DemoAuction {
  id: string;
  weapon: string;
  skinName: string;
  phase: string | null;
  wear: string;
  float: number;
  currentBidPips: bigint;
  startPricePips: bigint;
  buyNowPips: bigint | null;
  endsInMs: number;
  bidCount: number;
  isStatTrak: boolean;
}

export function demoAuctions(): DemoAuction[] {
  return [
    { id: "au-1", weapon: "Karambit", skinName: "Gamma Doppler", phase: "Emerald", wear: "FN", float: 0.00834, currentBidPips: 118_000_000n, startPricePips: 100_000_000n, buyNowPips: 140_000_000n, endsInMs: 3 * 3600_000 + 27 * 60_000, bidCount: 7, isStatTrak: false },
    { id: "au-2", weapon: "AWP", skinName: "Dragon Lore", phase: null, wear: "FN", float: 0.0102, currentBidPips: 1_835_000_000n, startPricePips: 1_700_000_000n, buyNowPips: null, endsInMs: 22 * 3600_000, bidCount: 14, isStatTrak: false },
    { id: "au-3", weapon: "Butterfly Knife", skinName: "Doppler", phase: "Sapphire", wear: "FN", float: 0.00211, currentBidPips: 288_000_000n, startPricePips: 250_000_000n, buyNowPips: 320_000_000n, endsInMs: 47 * 60_000, bidCount: 3, isStatTrak: true },
  ];
}

// ── Home page stats ───────────────────────────────────────────────────────

export function demoHomeStats() {
  return [
    { label: "Skins listed", value: "18,742" },
    { label: "Trades today", value: "3,116" },
    { label: "Min price", value: "$0.00001" },
    { label: "Avg fee", value: "2%" },
  ];
}

// ── Item detail ───────────────────────────────────────────────────────────

export interface DemoRecentSale {
  daysAgo: number;
  pricePips: bigint;
  float: number;
}

export function demoRecentSales(key: string, count = 6): DemoRecentSale[] {
  const c = catalogByKey(key);
  const base = c ? Number(c.basePips) : 1_000_000;
  const r = rngFor(`${key}:sales`);
  const out: DemoRecentSale[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      daysAgo: (i + 1) * 2,
      pricePips: BigInt(Math.round(base * r.between(0.93, 1.04))),
      float: c?.paintWear != null ? Math.max(0, c.paintWear + r.between(-0.004, 0.004)) : 0,
    });
  }
  return out;
}
