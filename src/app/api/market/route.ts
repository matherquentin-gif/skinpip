import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q") ?? "";
  const seeds =
    searchParams
      .get("seeds")
      ?.split(",")
      .map(Number)
      .filter((n) => !isNaN(n)) ?? [];
  const phases = searchParams.get("phases")?.split(",").filter(Boolean) ?? [];
  const wears = searchParams.get("wears")?.split(",").filter(Boolean) ?? [];
  const floatMin = searchParams.get("floatMin")
    ? parseFloat(searchParams.get("floatMin")!)
    : undefined;
  const floatMax = searchParams.get("floatMax")
    ? parseFloat(searchParams.get("floatMax")!)
    : undefined;
  const sort = searchParams.get("sort") ?? "price_asc";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(
    Math.max(1, parseInt(searchParams.get("limit") ?? "40", 10)),
    100
  );
  const statTrakParam = searchParams.get("statTrak");
  const statTrak =
    statTrakParam === "true"
      ? true
      : statTrakParam === "false"
        ? false
        : undefined;

  // Build item filter
  const itemWhere: Prisma.ItemWhereInput = {
    ...(q
      ? {
          OR: [
            { weaponName: { contains: q, mode: "insensitive" } },
            { skinName: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(seeds.length ? { paintSeed: { in: seeds } } : {}),
    ...(phases.length ? { phaseLabel: { in: phases } } : {}),
    ...(wears.length ? { wearName: { in: wears } } : {}),
    ...(statTrak !== undefined ? { isStatTrak: statTrak } : {}),
    ...((floatMin !== undefined || floatMax !== undefined)
      ? {
          paintWear: {
            ...(floatMin !== undefined ? { gte: floatMin } : {}),
            ...(floatMax !== undefined ? { lte: floatMax } : {}),
          },
        }
      : {}),
  };

  const where: Prisma.ListingWhereInput = {
    status: "ACTIVE",
    item: itemWhere,
  };

  // Build orderBy
  type ListingOrderBy = Prisma.ListingOrderByWithRelationInput;
  const orderBy: ListingOrderBy =
    sort === "price_asc"
      ? { pricePips: "asc" }
      : sort === "price_desc"
        ? { pricePips: "desc" }
        : sort === "float_asc"
          ? { item: { paintWear: "asc" } }
          : sort === "float_desc"
            ? { item: { paintWear: "desc" } }
            : { createdAt: "desc" }; // newest

  const skip = (page - 1) * limit;

  const [rawListings, total] = await db.$transaction([
    db.listing.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        item: {
          select: {
            id: true,
            weaponName: true,
            skinName: true,
            wearName: true,
            paintWear: true,
            paintSeed: true,
            phaseLabel: true,
            isStatTrak: true,
            rarity: true,
            stickers: true,
            imageUrl: true,
          },
        },
      },
    }),
    db.listing.count({ where }),
  ]);

  const listings = rawListings.map((l) => ({
    id: l.id,
    pricePips: l.pricePips.toString(),
    minimumOfferPips: l.minimumOfferPips?.toString() ?? null,
    item: {
      id: l.item.id,
      weaponName: l.item.weaponName,
      skinName: l.item.skinName,
      wearName: l.item.wearName ?? null,
      paintWear: l.item.paintWear ?? null,
      paintSeed: l.item.paintSeed ?? null,
      phaseLabel: l.item.phaseLabel ?? null,
      isStatTrak: l.item.isStatTrak,
      rarity: l.item.rarity ?? null,
      stickers: l.item.stickers ?? [],
      imageUrl: l.item.imageUrl ?? null,
    },
  }));

  return NextResponse.json({
    listings,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}
