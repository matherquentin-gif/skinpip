import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { reservePips, releasePips } from "@/lib/ledger";

const BidSchema = z.object({
  bidPips: z.string().regex(/^\d+$/).transform(BigInt),
});

/** Thrown inside the transaction to return a specific HTTP error. */
class BidError extends Error {
  constructor(message: string, readonly status: number, readonly extra?: object) {
    super(message);
  }
}

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

  try {
    const result = await db.$transaction(async (tx) => {
      // Lock the auction row for the rest of the transaction. Without this,
      // two concurrent bids both read the same high bid, both release the
      // previous bidder's reservation (double-releasing it), and the lower
      // bid can overwrite the higher one.
      const locked = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "Auction" WHERE "id" = ${auctionId} FOR UPDATE`;
      if (locked.length === 0) throw new BidError("Auction not found", 404);

      const auction = await tx.auction.findUniqueOrThrow({ where: { id: auctionId } });

      if (auction.status !== "ACTIVE") throw new BidError("Auction is not active", 409);
      if (auction.sellerId === user.id) {
        throw new BidError("You can't bid on your own auction", 403);
      }

      const now = new Date();
      if (now >= auction.endsAt) throw new BidError("Auction has ended", 409);

      // The first bid may equal the start price; later bids must beat the
      // current high bid by at least the auction's minimum increment.
      const minRequired =
        auction.currentBidPips == null
          ? auction.startPricePips
          : auction.currentBidPips + auction.minIncrementPips;
      if (bidPips < minRequired) {
        throw new BidError(`Bid must be at least ${minRequired.toString()} pips`, 422, {
          currentHighBid: (auction.currentBidPips ?? auction.startPricePips).toString(),
          minRequired: minRequired.toString(),
        });
      }

      // Anti-snipe: a bid inside the final window pushes the end out so
      // there is always at least `antiSnipeSeconds` left to respond.
      const antiSnipeMs = auction.antiSnipeSeconds * 1000;
      const msLeft = auction.endsAt.getTime() - now.getTime();
      const antiSnipeExtended = msLeft < antiSnipeMs;
      const newEndsAt = antiSnipeExtended
        ? new Date(now.getTime() + antiSnipeMs)
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
    if (err instanceof BidError) {
      return NextResponse.json(
        { error: err.message, ...(err.extra ?? {}) },
        { status: err.status }
      );
    }
    // The ledger throws when the bidder can't cover the new reservation.
    if (err instanceof Error && err.message.startsWith("ledger.reservePips: insufficient")) {
      return NextResponse.json({ error: "Insufficient available balance" }, { status: 422 });
    }

    console.error("[POST /api/auctions/[id]/bid]", err);
    return NextResponse.json(
      { error: "Failed to place bid" },
      { status: 500 }
    );
  }
}
