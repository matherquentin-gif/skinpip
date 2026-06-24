import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getBalance, reservePips } from "@/lib/ledger";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const ConditionsSchema = z
  .object({
    paintSeeds: z.array(z.number().int().min(0).max(1000)).optional(),
    phases: z.array(z.string()).optional(),
    floatMin: z.number().min(0).max(1).optional(),
    floatMax: z.number().min(0).max(1).optional(),
    stickers: z.array(z.record(z.string(), z.unknown())).optional(),
    charms: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .optional();

const CreateBuyOrderSchema = z.object({
  marketId: z.string().cuid(),
  pricePips: z.string().regex(/^\d+$/).transform(BigInt),
  conditions: ConditionsSchema,
  expiresAt: z.string().datetime().optional(),
});

// ---------------------------------------------------------------------------
// POST /api/buy-orders
// ---------------------------------------------------------------------------

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

  const parsed = CreateBuyOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { marketId, pricePips, conditions, expiresAt } = parsed.data;

  // pricePips must be positive
  if (pricePips <= 0n) {
    return NextResponse.json(
      { error: "pricePips must be greater than 0" },
      { status: 422 }
    );
  }

  // Verify the market exists
  const market = await db.marketDefinition.findUnique({ where: { id: marketId } });
  if (!market) {
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  }

  if (!market.isActive) {
    return NextResponse.json({ error: "Market is not active" }, { status: 422 });
  }

  // Check user has enough available pips
  const balance = await getBalance(user.id);
  if (balance.availablePips < pricePips) {
    return NextResponse.json(
      {
        error: "Insufficient available balance",
        availablePips: balance.availablePips.toString(),
        required: pricePips.toString(),
      },
      { status: 422 }
    );
  }

  try {
    const order = await db.$transaction(async (tx) => {
      // Create the order first so we have an ID for the ledger reserve entry
      const newOrder = await tx.order.create({
        data: {
          userId: user.id,
          marketId,
          side: "BID",
          status: "OPEN",
          pricePips,
          quantity: 1,
          filledQuantity: 0,
          conditions: (conditions ?? {}) as Prisma.InputJsonValue,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
      });

      // Reserve pips — held until order fills, cancels, or expires
      await reservePips(
        tx,
        user.id,
        pricePips,
        "BUY_ORDER_RESERVE",
        newOrder.id,
        "Order"
      );

      return newOrder;
    });

    return NextResponse.json(
      {
        order: {
          id: order.id,
          pricePips: order.pricePips.toString(),
          conditions: order.conditions,
          status: order.status,
          marketId: order.marketId,
          expiresAt: order.expiresAt,
          createdAt: order.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/buy-orders]", err);
    return NextResponse.json(
      { error: "Failed to create buy order" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// GET /api/buy-orders?mine=true
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mine = searchParams.get("mine") === "true";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10))
  );
  const skip = (page - 1) * limit;

  if (mine) {
    // Authenticated user's active buy orders
    let user;
    try {
      user = await requireUser(req);
    } catch (e) {
      if (e instanceof NextResponse) return e;
      throw e;
    }

    const orders = await db.order.findMany({
      where: {
        userId: user.id,
        side: "BID",
        status: { in: ["OPEN", "PARTIAL"] },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    return NextResponse.json({
      orders: orders.map((o) => ({
        id: o.id,
        pricePips: o.pricePips.toString(),
        conditions: o.conditions,
        status: o.status,
        marketId: o.marketId,
        filledQuantity: o.filledQuantity,
        expiresAt: o.expiresAt,
        createdAt: o.createdAt,
      })),
      page,
      limit,
    });
  }

  // Public: recent active buy orders, optionally filtered by marketId
  const marketId = searchParams.get("marketId");

  const orders = await db.order.findMany({
    where: {
      side: "BID",
      status: { in: ["OPEN", "PARTIAL"] },
      ...(marketId ? { marketId } : {}),
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
    select: {
      id: true,
      marketId: true,
      pricePips: true,
      conditions: true,
      status: true,
      filledQuantity: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    orders: orders.map((o) => ({
      ...o,
      pricePips: o.pricePips.toString(),
    })),
    page,
    limit,
  });
}
