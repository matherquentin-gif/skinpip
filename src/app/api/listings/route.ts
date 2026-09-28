import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

const pipsString = z.string().regex(/^\d{1,18}$/).transform(BigInt);

const CreateListingSchema = z
  .object({
    itemId: z.string().cuid(),
    pricePips: pipsString,
    minimumOfferPips: pipsString.optional(),
  })
  .refine((v) => v.minimumOfferPips == null || v.minimumOfferPips <= v.pricePips, {
    message: "minimumOfferPips cannot exceed pricePips",
    path: ["minimumOfferPips"],
  });

export async function POST(req: NextRequest) {
  // Auth
  let user;
  try {
    user = await requireUser(req);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }

  // Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CreateListingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { itemId, pricePips, minimumOfferPips } = parsed.data;

  // Sub-cent pricing is the product: the floor is a single pip ($0.00001).
  if (pricePips < 1n) {
    return NextResponse.json(
      { error: "pricePips must be at least 1 (minimum $0.00001)" },
      { status: 422 }
    );
  }

  // Look up the item
  const item = await db.item.findUnique({
    where: { id: itemId },
    include: { auctionItem: { select: { status: true } } },
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  // Item must be owned by the authenticated user
  if (item.ownerId !== user.id) {
    return NextResponse.json({ error: "You do not own this item" }, { status: 403 });
  }

  // Item must already be in custody (BOT_CUSTODY or P2P_DIRECT)
  if (
    item.settlementType !== "BOT_CUSTODY" &&
    item.settlementType !== "P2P_DIRECT"
  ) {
    return NextResponse.json(
      { error: "Item must be in BOT_CUSTODY or P2P_DIRECT to be listed" },
      { status: 422 }
    );
  }

  // Item must not already be listed or in an auction that hasn't settled
  // (an ENDED auction still owes the item to its winner).
  const auctionStatus = item.auctionItem?.status;
  if (item.isListed || auctionStatus === "ACTIVE" || auctionStatus === "ENDED") {
    return NextResponse.json(
      { error: "Item is already listed" },
      { status: 409 }
    );
  }

  try {
    const listing = await db.$transaction(async (tx) => {
      // Find or create a MarketDefinition for this weapon+skin combo
      // findFirst handles nullable wearName/paintIndex correctly (upsert with null keys fails in Prisma)
      let market = await tx.marketDefinition.findFirst({
        where: {
          weaponName: item.weaponName,
          skinName: item.skinName,
          wearName: item.wearName,
          paintIndex: item.paintIndex,
        },
      });
      if (!market) {
        market = await tx.marketDefinition.create({
          data: {
            skinName: item.skinName,
            weaponName: item.weaponName,
            wearName: item.wearName ?? null,
            paintIndex: item.paintIndex ?? null,
            isActive: true,
          },
        });
      }

      // Create the listing
      const newListing = await tx.listing.create({
        data: {
          sellerId: user.id,
          itemId: item.id,
          marketId: market.id,
          pricePips,
          minimumOfferPips: minimumOfferPips ?? null,
          status: "ACTIVE",
        },
      });

      // Mark the item as listed
      await tx.item.update({
        where: { id: item.id },
        data: { isListed: true },
      });

      return newListing;
    });

    return NextResponse.json({
      listing: {
        id: listing.id,
        pricePips: listing.pricePips.toString(),
        minimumOfferPips: listing.minimumOfferPips?.toString() ?? null,
        status: listing.status,
        itemId: listing.itemId,
        createdAt: listing.createdAt,
      },
    });
  } catch (err) {
    console.error("[POST /api/listings]", err);
    return NextResponse.json(
      { error: "Failed to create listing" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Delegate to /api/market for public browsing
  return NextResponse.redirect(
    new URL("/api/market?" + new URL(req.url).searchParams, req.url)
  );
}
