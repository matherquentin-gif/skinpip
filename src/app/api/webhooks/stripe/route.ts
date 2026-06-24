import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  // TODO: verify webhook signature, then handle events idempotently
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  //
  // switch (event.type) {
  //   case "payment_intent.succeeded": {
  //     const intent = event.data.object as Stripe.PaymentIntent;
  //     await db.$transaction(async (tx) => {
  //       const pi = await tx.paymentIntent.findUnique({ where: { stripeId: intent.id } });
  //       if (!pi || pi.status === "SUCCEEDED") return; // idempotent
  //       await tx.paymentIntent.update({ where: { id: pi.id }, data: { status: "SUCCEEDED" } });
  //       await postLedgerEntry(tx, pi.userId, pi.amountPips, "FIAT_DEPOSIT", pi.id, "PaymentIntent");
  //     });
  //     break;
  //   }
  //   case "payment_intent.payment_failed": { ... break; }
  // }

  return NextResponse.json({ received: true });
}
