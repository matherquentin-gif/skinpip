/**
 * Data for the /market/[id] item page.
 *
 * Ids come from two places: the demo catalog (stable keys like
 * "karambit-fade-fn") and the database (cuids, once `npm run seed` or real
 * listings exist). Demo keys resolve from the deterministic demo dataset; any
 * other id is looked up in Postgres. Unknown ids return null → 404.
 */

import { cache } from "react";
import { db } from "@/lib/db";
import {
  CATALOG,
  catalogByKey,
  demoCandlesForKey,
  demoLiquidityScore,
  demoOrderBook,
  demoRecentSales,
  imageForKey,
  type CatalogEntry,
} from "@/lib/demo-data";
import type { CandleData } from "@/components/PriceChart";
import type { OrderBookEntry } from "@/components/OrderBook";

export interface ItemSale {
  daysAgo: number;
  pricePips: bigint;
  float: number | null;
}

export interface ItemDetail {
  id: string;
  weaponName: string;
  skinName: string;
  wearName: string | null;
  imageUrl: string | null;
  paintWear: number | null;
  paintSeed: number | null;
  phaseLabel: string | null;
  patternTierLabel: string | null;
  isStatTrak: boolean;
  isSouvenir: boolean;
  rarity: string | null;
  collection: string | null;
  stickers: { name: string }[];
  /** Asking price of this exact item, or null when it isn't listed. */
  listingPricePips: bigint | null;
  /** Market order book, best price first on each side. */
  asks: OrderBookEntry[];
  bids: OrderBookEntry[];
  lastTradePips: bigint | null;
  candles: CandleData[];
  recentSales: ItemSale[];
  /** 0–100, or null when we have no liquidity signal for this market. */
  liquidity: number | null;
  source: "db" | "demo";
}

const BOOK_DEPTH = 6;
const DAY_MS = 86_400_000;

/** "AK-47 | Redline (Field-Tested)" */
export function itemTitle(item: Pick<ItemDetail, "weaponName" | "skinName" | "wearName" | "isStatTrak">): string {
  const st = item.isStatTrak ? "StatTrak™ " : "";
  return `${st}${item.weaponName} | ${item.skinName}${item.wearName ? ` (${item.wearName})` : ""}`;
}

function liquidityFor(weaponName: string, skinName: string, wearName: string | null): number | null {
  const entry = CATALOG.find(
    (c) => c.weaponName === weaponName && c.skinName === skinName && c.wearName === wearName,
  );
  return entry ? demoLiquidityScore(entry.key) : null;
}

function demoDetail(entry: CatalogEntry): ItemDetail {
  const ob = demoOrderBook(entry.basePips, entry.key);
  // The listed item itself is the best ask, so the card price and the page agree.
  const listing: OrderBookEntry = { pricePips: entry.basePips, quantity: 1, totalPips: entry.basePips };
  return {
    id: entry.key,
    weaponName: entry.weaponName,
    skinName: entry.skinName,
    wearName: entry.wearName,
    imageUrl: imageForKey(entry.key),
    paintWear: entry.paintWear,
    paintSeed: entry.paintSeed,
    phaseLabel: entry.phaseLabel,
    patternTierLabel: entry.patternTierLabel,
    isStatTrak: entry.isStatTrak,
    isSouvenir: entry.isSouvenir,
    rarity: entry.rarity,
    collection: entry.collection,
    stickers: entry.stickers ?? [],
    listingPricePips: entry.basePips,
    asks: [listing, ...ob.asks].slice(0, BOOK_DEPTH),
    bids: ob.bids.slice(0, BOOK_DEPTH),
    lastTradePips: ob.lastTradePips,
    candles: demoCandlesForKey(entry.key),
    recentSales: demoRecentSales(entry.key, 5).map((s) => ({
      daysAgo: s.daysAgo,
      pricePips: s.pricePips,
      float: entry.paintWear != null ? s.float : null,
    })),
    liquidity: demoLiquidityScore(entry.key),
    source: "demo",
  };
}

/** Collapse individual orders into price levels, best first. */
function toLevels(rows: { pricePips: bigint; quantity: number }[], side: "ask" | "bid"): OrderBookEntry[] {
  const levels = new Map<bigint, number>();
  for (const r of rows) {
    if (r.quantity > 0) levels.set(r.pricePips, (levels.get(r.pricePips) ?? 0) + r.quantity);
  }
  return [...levels.entries()]
    .sort(([a], [b]) => (side === "ask" ? (a < b ? -1 : a > b ? 1 : 0) : a > b ? -1 : a < b ? 1 : 0))
    .slice(0, BOOK_DEPTH)
    .map(([pricePips, quantity]) => ({ pricePips, quantity, totalPips: pricePips * BigInt(quantity) }));
}

function parseStickers(raw: unknown): { name: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s): s is { name: string } => typeof s === "object" && s !== null && typeof (s as { name?: unknown }).name === "string")
    .map((s) => ({ name: s.name }));
}

async function dbDetail(id: string): Promise<ItemDetail | null> {
  const item = await db.item.findUnique({ where: { id }, include: { listing: true } });
  if (!item) return null;

  const marketId =
    item.listing?.marketId ??
    (
      await db.marketDefinition.findFirst({
        where: {
          weaponName: item.weaponName,
          skinName: item.skinName,
          wearName: item.wearName,
          paintIndex: item.paintIndex,
        },
        select: { id: true },
      })
    )?.id ??
    null;

  const openStatus = { in: ["OPEN" as const, "PARTIAL" as const] };
  const [askOrders, bidOrders, marketListings, candles, trades] = marketId
    ? await Promise.all([
        db.order.findMany({
          where: { marketId, side: "ASK", status: openStatus },
          orderBy: { pricePips: "asc" },
          take: 200,
          select: { pricePips: true, quantity: true, filledQuantity: true },
        }),
        db.order.findMany({
          where: { marketId, side: "BID", status: openStatus },
          orderBy: { pricePips: "desc" },
          take: 200,
          select: { pricePips: true, quantity: true, filledQuantity: true },
        }),
        db.listing.findMany({
          where: { marketId, status: "ACTIVE" },
          orderBy: { pricePips: "asc" },
          take: 200,
          select: { pricePips: true },
        }),
        db.priceCandle.findMany({
          where: { marketId, interval: "1d" },
          orderBy: { timestamp: "desc" },
          take: 365,
        }),
        db.trade.findMany({
          // Same variant only: paintIndex separates Doppler phases, and
          // StatTrak/Souvenir copies trade at different prices.
          where: {
            item: {
              weaponName: item.weaponName,
              skinName: item.skinName,
              wearName: item.wearName,
              paintIndex: item.paintIndex,
              isStatTrak: item.isStatTrak,
              isSouvenir: item.isSouvenir,
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { pricePips: true, createdAt: true, item: { select: { paintWear: true } } },
        }),
      ])
    : [[], [], [], [], []];

  const remaining = (o: { pricePips: bigint; quantity: number; filledQuantity: number }) => ({
    pricePips: o.pricePips,
    quantity: o.quantity - o.filledQuantity,
  });

  const now = Date.now();
  const listingPricePips = item.listing?.status === "ACTIVE" ? item.listing.pricePips : null;

  return {
    id: item.id,
    weaponName: item.weaponName,
    skinName: item.skinName,
    wearName: item.wearName,
    imageUrl: item.imageUrl,
    paintWear: item.paintWear,
    paintSeed: item.paintSeed,
    phaseLabel: item.phaseLabel,
    patternTierLabel: item.patternTierLabel,
    isStatTrak: item.isStatTrak,
    isSouvenir: item.isSouvenir,
    rarity: item.rarity,
    collection: item.collection,
    stickers: parseStickers(item.stickers),
    listingPricePips,
    // Active listings are asks too: each is one unit for sale at its price.
    asks: toLevels([...askOrders.map(remaining), ...marketListings.map((l) => ({ pricePips: l.pricePips, quantity: 1 }))], "ask"),
    bids: toLevels(bidOrders.map(remaining), "bid"),
    lastTradePips: trades[0]?.pricePips ?? null,
    // The chart works in dollars; this is display-only, so float is fine here.
    candles: candles.reverse().map((c) => ({
      time: Math.floor(c.timestamp.getTime() / 1000),
      open: Number(c.openPips) / 100_000,
      high: Number(c.highPips) / 100_000,
      low: Number(c.lowPips) / 100_000,
      close: Number(c.closePips) / 100_000,
      volume: c.volume,
    })),
    recentSales: trades.map((t) => ({
      daysAgo: Math.max(0, Math.floor((now - t.createdAt.getTime()) / DAY_MS)),
      pricePips: t.pricePips,
      float: t.item.paintWear,
    })),
    liquidity: liquidityFor(item.weaponName, item.skinName, item.wearName),
    source: "db",
  };
}

/** Prisma cuids: skip the DB round-trip for ids that can't possibly match. */
const CUID_PATTERN = /^c[a-z0-9]{20,31}$/;

/**
 * Resolve an item page id. Wrapped in React `cache` so generateMetadata and
 * the page share one lookup per request.
 */
export const getItemDetail = cache(async (id: string): Promise<ItemDetail | null> => {
  const entry = catalogByKey(id);
  if (entry) return demoDetail(entry);
  if (!CUID_PATTERN.test(id)) return null;
  // DB errors propagate to the error boundary rather than masquerading as 404.
  return dbDetail(id);
});
