import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { reservePips, releasePips } from "@/lib/ledger";

const BidSchema = z.object({
  bidPips: z.string().regex(/^\d+$/).transform(BigInt),
});

/** How long before auction end triggers anti-snipe extension, in ms */
const ANTI_SNIPE_WINDOW_MS = 2 * 60 * 1000; // 2 minutes
/** How long to extend the auction on an anti-snipe trigger, in ms */
const ANTI_SNIPE_EXTENSION_MS = 2 * 60 * 1000; // 2 minutes

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth
  let user;
  try {
    user = await requireUser(req);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }

  const { id: auctionId } = await params;

  // Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = BidSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { bidPips } = parsed.data;

  // Quick pre-flight: check auction exists + is active before entering transaction
  const auctionCheck = await db.auction.findUnique({
    where: { id: auctionId },
  });

  if (!auctionCheck) {
    return NextResponse.json({ error: "Auction not found" }, { status: 404 });
  }
  if (auctionCheck.status !== "ACTIVE") {
    return NextResponse.json({ error: "Auction is not active" }, { status: 409 });
  }
  if (new Date() >= auctionCheck.endsAt) {
    return NextResponse.json({ error: "Auction has ended" }, { status: 409 });
  }

  try {
    const result = await db.$transaction(async (tx) => {
      // Re-read inside transaction for race-condition safety
      const auction = await tx.auction.findUnique({
        where: { id: auctionId },
      });

      if (!auction) {
        throw Object.assign(new Error("Auction not found"), { status: 404 });
      }
      if (auction.status !== "ACTIVE") {
        throw Object.assign(new Error("Auction is not active"), { status: 409 });
      }

      const now = new Date();
      if (now >= auction.endsAt) {
        throw Object.assign(new Error("Auction has ended"), { status: 409 });
      }

      // Derive current high bid: currentBidPips from auction, or startPricePips as the floor
      const currentHighBid = auction.currentBidPips ?? auction.startPricePips;

      // Minimum bid: strictly greater than currentHighBid + 100 pips (the minimum increment)
      // (The task says bidPips > currentHighBid + 100n)
      const minRequired = currentHighBid + 100n;
      if (bidPips <= currentHighBid || bidPips < minRequired) {
        throw Object.assign(
          new Error(
            `Bid must be at least ${minRequired.toString()} pips (current high: ${currentHighBid.toString()})`
          ),
          {
            status: 422,
            extra: {
              currentHighBid: currentHighBid.toString(),
              minRequired: minRequired.toString(),
            },
          }
        );
      }

      // Anti-snipe: if bid is within 2 minutes of endsAt, extend by 2 minutes
      const msLeft = auction.endsAt.getTime() - now.getTime();
      const antiSnipeExtended = msLeft < ANTI_SNIPE_WINDOW_MS;
      const newEndsAt = antiSnipeExtended
        ? new Date(now.getTime() + ANTI_SNIPE_EXTENSION_MS)
        : auction.endsAt;

      // Find the previous highest bid to release their reservation
      const prevBid = await tx.bid.findFirst({
        where: { auctionId },
        orderBy: { amountPips: "desc" },
      });

      if (prevBid) {
        if (prevBid.bidderId !== user.id) {
          // Release previous high bidder's reservation (they were outbid)
          await releasePips(
            tx,
            prevBid.bidderId,
            prevBid.amountPips,
            "AUCTION_OUTBID",
            auctionId,
            "Auction"
          );
        } else {
          // Same bidder raising their own bid — release old reservation first
          await releasePips(
            tx,
            user.id,
            prevBid.amountPips,
            "AUCTION_BID_RAISE",
            auctionId,
            "Auction"
          );
        }
      }

      // Reserve the new bid amount
      await reservePips(
        tx,
        user.id,
        bidPips,
        "AUCTION_BID",
        auctionId,
        "Auction"
      );

      // Create bid record
      const bid = await tx.bid.create({
        data: {
          auctionId,
          bidderId: user.id,
          amountPips: bidPips,
        },
      });

      // Update auction state
      await tx.auction.update({
        where: { id: auctionId },
        data: {
          currentBidPips: bidPips,
          endsAt: newEndsAt,
        },
      });

      return { bid, antiSnipeExtended };
    });

    return NextResponse.json(
      {
        bid: {
          id: result.bid.id,
          bidPips: result.bid.amountPips.toString(),
          auctionId: result.bid.auctionId,
        },
        antiSnipeExtended: result.antiSnipeExtended,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    // Re-throw NextResponse (auth errors propagated as thrown responses)
    if (err instanceof NextResponse) return err;

    // Structured errors thrown inside the transaction
    const e = err as { message?: string; status?: number; extra?: object };
    if (e.status) {
      return NextResponse.json(
        { error: e.message ?? "Bad request", ...(e.extra ?? {}) },
        { status: e.status }
      );
    }

    console.error("[POST /api/auctions/[id]/bid]", err);
    return NextResponse.json(
      { error: "Failed to place bid" },
      { status: 500 }
    );
  }
}
