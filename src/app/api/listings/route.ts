import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateListingSchema = z.object({
  itemId: z.string().cuid(),
  pricePips: z.bigint().or(z.string().regex(/^\d+$/).transform(BigInt)),
  minimumOfferPips: z.bigint().or(z.string().regex(/^\d+$/).transform(BigInt)).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CreateListingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // TODO: verify session, verify item ownership + custody, create listing, reserve item
  // const { itemId, pricePips, minimumOfferPips } = parsed.data;
  // const listing = await db.listing.create({
  //   data: { sellerId: userId, itemId, marketId, pricePips, minimumOfferPips, status: "ACTIVE" },
  // });
  // await db.item.update({ where: { id: itemId }, data: { isListed: true } });
  // return NextResponse.json({ listing });

  return NextResponse.json({ error: "Not implemented — connect DB" }, { status: 501 });
}

export async function GET(req: NextRequest) {
  // Delegate to /api/market for public browsing
  return NextResponse.redirect(new URL("/api/market?" + new URL(req.url).searchParams, req.url));
}
