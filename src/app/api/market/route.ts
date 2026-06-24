import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q") ?? "";
  const seeds = searchParams.get("seeds")?.split(",").map(Number).filter((n) => !isNaN(n)) ?? [];
  const phases = searchParams.get("phases")?.split(",").filter(Boolean) ?? [];
  const floatMin = searchParams.get("floatMin") ? parseFloat(searchParams.get("floatMin")!) : undefined;
  const floatMax = searchParams.get("floatMax") ? parseFloat(searchParams.get("floatMax")!) : undefined;
  const sort = searchParams.get("sort") ?? "price_asc";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "48", 10), 100);

  // TODO: replace with real Prisma query when DB is connected
  // Prisma query shape (for implementation reference):
  // const where: Prisma.ListingWhereInput = {
  //   status: "ACTIVE",
  //   item: {
  //     ...(q && { skinName: { contains: q, mode: "insensitive" } }),
  //     ...(seeds.length && { paintSeed: { in: seeds } }),
  //     ...(phases.length && { phaseLabel: { in: phases } }),
  //     ...(floatMin !== undefined && { paintWear: { gte: floatMin } }),
  //     ...(floatMax !== undefined && { paintWear: { lte: floatMax } }),
  //   },
  // };
  // const orderBy = sort === "price_asc" ? { pricePips: "asc" } : sort === "price_desc" ? { pricePips: "desc" } : { createdAt: "desc" };
  // const [items, total] = await db.$transaction([
  //   db.listing.findMany({ where, include: { item: true }, orderBy, skip: (page - 1) * limit, take: limit }),
  //   db.listing.count({ where }),
  // ]);

  return NextResponse.json({
    items: [],
    total: 0,
    page,
    limit,
    filters: { q, seeds, phases, floatMin, floatMax, sort },
  });
}
