import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { creditUser } from "@/lib/ledger";

/**
 * Stripe webhook.
 *
 * Security-critical: the body of this request is attacker-controllable, so the
 * Stripe signature MUST be verified before any event is trusted. We fail closed
 * — if the signing secret or API key is not configured, we reject the request
 * rather than silently accepting unsigned events (which would let anyone forge
 * a `payment_intent.succeeded` and mint wallet balance).
 *
 * The raw body is required for signature verification, so this route must not
 * parse JSON first.
 */

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const apiKey = process.env.STRIPE_SECRET_KEY;

  // Fail closed: never accept events we cannot cryptographically verify.
  if (!secret || !apiKey) {
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET / STRIPE_SECRET_KEY not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await req.text();

  const stripe = new Stripe(apiKey);
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, secret);
  } catch (err) {
    // Bad signature, malformed payload, or replayed/expired timestamp.
    console.warn("[stripe webhook] signature verification failed:", (err as Error).message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const intent = event.data.object as Stripe.PaymentIntent;
        await db.$transaction(async (tx) => {
          const pi = await tx.paymentIntent.findUnique({ where: { stripeId: intent.id } });
          // Idempotent: unknown intent, or one we've already credited, is a no-op.
          if (!pi || pi.status === "SUCCEEDED") return;
          await tx.paymentIntent.update({ where: { id: pi.id }, data: { status: "SUCCEEDED" } });
          await creditUser(tx, pi.userId, pi.amountPips, "FIAT_DEPOSIT", pi.id, "PaymentIntent");
        });
        break;
      }
      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        await db.paymentIntent.updateMany({
          where: { stripeId: intent.id, status: "PENDING" },
          data: { status: "FAILED" },
        });
        break;
      }
      default:
        // Unhandled event types are acknowledged so Stripe stops retrying.
        break;
    }
  } catch (err) {
    // Returning 500 makes Stripe retry later (the handler above is idempotent).
    console.error("[stripe webhook] handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
