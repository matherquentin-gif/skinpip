import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  demoMarketItems,
  demoLiquidityScore,
  CATALOG,
} from "@/lib/demo-data";
import type { SkinCardData } from "@/components/SkinCard";
import { floatParam, intParam, listParam, pipsParam } from "@/lib/query-params";

/**
 * Market listing search.
 *
 * Returns items in the shape the Market grid consumes (`items`), with
 * `pricePips` serialized as a string (JSON can't carry bigint). Falls back to
 * the deterministic demo dataset when the database is empty or unreachable, so
 * the marketplace renders with zero setup and `npm run seed` upgrades it to
 * real data seamlessly.
 */

interface SerializedItem extends Omit<SkinCardData, "pricePips"> {
  pricePips: string;
  liquidity?: number;
}

interface Filters {
  q: string;
  seeds: number[];
  phases: string[];
  wears: string[];
  floatMin?: number;
  floatMax?: number;
  statTrak?: boolean;
  priceMin?: bigint;
  priceMax?: bigint;
  sort: string;
}

function parseFilters(searchParams: URLSearchParams): Filters {
  const statTrakParam = searchParams.get("statTrak");
  return {
    q: (searchParams.get("q") ?? "").trim().slice(0, 100),
    // Paint seeds are integers 0–1000; anything else would make Prisma throw.
    seeds: listParam(searchParams.get("seeds"))
      .map(Number)
      .filter((n) => Number.isInteger(n) && n >= 0 && n <= 1000),
    phases: listParam(searchParams.get("phases")),
    wears: listParam(searchParams.get("wears")),
    floatMin: floatParam(searchParams.get("floatMin"), 0, 1),
    floatMax: floatParam(searchParams.get("floatMax"), 0, 1),
    statTrak: statTrakParam === "true" ? true : statTrakParam === "false" ? false : undefined,
    priceMin: pipsParam(searchParams.get("priceMin")),
    priceMax: pipsParam(searchParams.get("priceMax")),
    sort: searchParams.get("sort") ?? "price_asc",
  };
}

function sortItems(items: SerializedItem[], sort: string): SerializedItem[] {
  const out = [...items];
  switch (sort) {
    case "price_desc":
      return out.sort((a, b) => Number(BigInt(b.pricePips) - BigInt(a.pricePips)));
    case "float_asc":
      return out.sort((a, b) => (a.paintWear ?? 99) - (b.paintWear ?? 99));
    case "float_desc":
      return out.sort((a, b) => (b.paintWear ?? -1) - (a.paintWear ?? -1));
    case "newest":
      return out; // demo: stable order
    case "price_asc":
    default:
      return out.sort((a, b) => Number(BigInt(a.pricePips) - BigInt(b.pricePips)));
  }
}

/** Filter the demo dataset in-memory so offline search behaves like the DB. */
function demoResults(f: Filters): SerializedItem[] {
  const ql = f.q.toLowerCase();
  let items: SerializedItem[] = demoMarketItems().map((it) => ({
    ...it,
    pricePips: it.pricePips.toString(),
    liquidity: demoLiquidityScore(it.id),
  }));

  items = items.filter((it) => {
    if (ql && !(`${it.weaponName} ${it.skinName}`.toLowerCase().includes(ql))) return false;
    if (f.seeds.length && (it.paintSeed == null || !f.seeds.includes(it.paintSeed))) return false;
    if (f.phases.length && (it.phaseLabel == null || !f.phases.includes(it.phaseLabel))) return false;
    if (f.wears.length && (it.wearName == null || !f.wears.includes(it.wearName))) return false;
    if (f.statTrak !== undefined && it.isStatTrak !== f.statTrak) return false;
    if (f.floatMin !== undefined && (it.paintWear == null || it.paintWear < f.floatMin)) return false;
    if (f.floatMax !== undefined && (it.paintWear == null || it.paintWear > f.floatMax)) return false;
    if (f.priceMin !== undefined && BigInt(it.pricePips) < f.priceMin) return false;
    if (f.priceMax !== undefined && BigInt(it.pricePips) > f.priceMax) return false;
    return true;
  });

  return sortItems(items, f.sort);
}

function demoPage(f: Filters, page: number, limit: number) {
  const all = demoResults(f);
  return {
    items: all.slice((page - 1) * limit, page * limit),
    total: all.length,
    page,
    pages: Math.max(1, Math.ceil(all.length / limit)),
    source: "demo" as const,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const f = parseFilters(searchParams);
  const page = intParam(searchParams.get("page"), 1, 1, 10_000);
  const limit = intParam(searchParams.get("limit"), 40, 1, 100);

  // Map active catalog keys → liquidity for DB rows (best-effort).
  const liquidityByMarket = new Map<string, number>(
    CATALOG.map((c) => [`${c.weaponName}|${c.skinName}|${c.wearName ?? ""}`, demoLiquidityScore(c.key)]),
  );

  try {
    const itemWhere: Prisma.ItemWhereInput = {
      ...(f.q
        ? {
            OR: [
              { weaponName: { contains: f.q, mode: "insensitive" } },
              { skinName: { contains: f.q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(f.seeds.length ? { paintSeed: { in: f.seeds } } : {}),
      ...(f.phases.length ? { phaseLabel: { in: f.phases } } : {}),
      ...(f.wears.length ? { wearName: { in: f.wears } } : {}),
      ...(f.statTrak !== undefined ? { isStatTrak: f.statTrak } : {}),
      ...(f.floatMin !== undefined || f.floatMax !== undefined
        ? {
            paintWear: {
              ...(f.floatMin !== undefined ? { gte: f.floatMin } : {}),
              ...(f.floatMax !== undefined ? { lte: f.floatMax } : {}),
            },
          }
        : {}),
    };

    const where: Prisma.ListingWhereInput = {
      status: "ACTIVE",
      item: itemWhere,
      ...(f.priceMin !== undefined || f.priceMax !== undefined
        ? {
            pricePips: {
              ...(f.priceMin !== undefined ? { gte: f.priceMin } : {}),
              ...(f.priceMax !== undefined ? { lte: f.priceMax } : {}),
            },
          }
        : {}),
    };

    const orderBy: Prisma.ListingOrderByWithRelationInput =
      f.sort === "price_asc"
        ? { pricePips: "asc" }
        : f.sort === "price_desc"
          ? { pricePips: "desc" }
          : f.sort === "float_asc"
            ? { item: { paintWear: "asc" } }
            : f.sort === "float_desc"
              ? { item: { paintWear: "desc" } }
              : { createdAt: "desc" };

    const [rawListings, total] = await db.$transaction([
      db.listing.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          item: {
            select: {
              id: true, weaponName: true, skinName: true, wearName: true,
              paintWear: true, paintSeed: true, phaseLabel: true, patternTierLabel: true,
              isStatTrak: true, isSouvenir: true, imageUrl: true,
            },
          },
        },
      }),
      db.listing.count({ where }),
    ]);

    // Empty marketplace → serve the demo dataset so the page is never blank.
    // (Only when nothing is listed at all: a filter that matches nothing on
    // a live DB must return an empty result, not demo items.)
    if (total === 0 && (await db.listing.count({ where: { status: "ACTIVE" } })) === 0) {
      return NextResponse.json(demoPage(f, page, limit));
    }

    const items: SerializedItem[] = rawListings.map((l) => ({
      id: l.item.id,
      skinName: l.item.skinName,
      weaponName: l.item.weaponName,
      wearName: l.item.wearName ?? null,
      imageUrl: l.item.imageUrl ?? null,
      paintWear: l.item.paintWear ?? null,
      paintSeed: l.item.paintSeed ?? null,
      phaseLabel: l.item.phaseLabel ?? null,
      patternTierLabel: l.item.patternTierLabel ?? null,
      isStatTrak: l.item.isStatTrak,
      isSouvenir: l.item.isSouvenir,
      pricePips: l.pricePips.toString(),
      liquidity: liquidityByMarket.get(`${l.item.weaponName}|${l.item.skinName}|${l.item.wearName ?? ""}`),
    }));

    return NextResponse.json({ items, total, page, pages: Math.ceil(total / limit), source: "db" });
  } catch (err) {
    // No DATABASE_URL / unreachable DB → demo fallback keeps the app usable.
    console.warn("[/api/market] DB unavailable, serving demo data:", (err as Error).message);
    return NextResponse.json(demoPage(f, page, limit));
  }
}
