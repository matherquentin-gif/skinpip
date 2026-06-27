import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { centsToPips } from "@/lib/pips";

const DepositSchema = z.object({
  // Whole-cent USD amounts only — otherwise the cents charged via Stripe and the
  // pips credited could round apart. `finite` rejects NaN/Infinity.
  amountUsd: z
    .number()
    .finite()
    .min(5)
    .max(10000)
    .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-9, {
      message: "amountUsd must have at most 2 decimal places",
    }),
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

  const parsed = DepositSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { amountUsd } = parsed.data;

  // Validate range (belt-and-suspenders — zod already checks this)
  if (amountUsd < 5 || amountUsd > 10000) {
    return NextResponse.json(
      { error: "amountUsd must be between 5 and 10000" },
      { status: 422 }
    );
  }

  // Cents for Stripe (1 USD = 100 cents); pips derive from cents so the two can
  // never disagree.
  const amountCents = Math.round(amountUsd * 100);
  const amountPips = centsToPips(amountCents);

  try {
    // TODO: When Stripe is connected, create a real Stripe PaymentIntent here:
    //   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    //   const intent = await stripe.paymentIntents.create({
    //     amount: amountCents,
    //     currency: "usd",
    //     metadata: { userId: user.id, amountPips: amountPips.toString() },
    //   });
    //   Then replace stripeId below with intent.id and clientSecret with intent.client_secret.

    // Stub: use a placeholder stripeId until Stripe is wired up
    const stubStripeId = `pi_stub_${Date.now()}_${user.id}`;
    const idempotencyKey = `deposit_${user.id}_${Date.now()}`;

    const paymentIntent = await db.paymentIntent.create({
      data: {
        userId: user.id,
        stripeId: stubStripeId,
        amountCents,
        amountPips,
        currency: "usd",
        status: "PENDING",
        idempotencyKey,
      },
    });

    return NextResponse.json({
      // TODO: replace with real Stripe clientSecret once Stripe is connected
      clientSecret: "pending",
      paymentIntentId: paymentIntent.id,
      amountPips: paymentIntent.amountPips.toString(),
    });
  } catch (err) {
    console.error("[POST /api/wallet/deposit]", err);
    return NextResponse.json(
      { error: "Failed to create deposit" },
      { status: 500 }
    );
  }
}
