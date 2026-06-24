import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const DepositSchema = z.object({
  amountCents: z.number().int().min(100).max(1_000_000),
  idempotencyKey: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = DepositSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { amountCents, idempotencyKey } = parsed.data;

  // TODO: verify session, create Stripe PaymentIntent, record pending in DB
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // const intent = await stripe.paymentIntents.create({
  //   amount: amountCents,
  //   currency: "usd",
  //   idempotencyKey,
  //   metadata: { userId, amountPips: String(centsToPips(amountCents)) },
  // });
  // await db.paymentIntent.create({
  //   data: { userId, stripeId: intent.id, amountCents, amountPips: centsToPips(amountCents), idempotencyKey },
  // });
  // return NextResponse.json({ clientSecret: intent.client_secret });

  return NextResponse.json({ error: "Not implemented — connect Stripe and DB" }, { status: 501 });
}
