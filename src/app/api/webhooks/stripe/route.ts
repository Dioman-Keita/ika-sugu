import { NextResponse } from "next/server";
import { fulfillCheckoutSession } from "@/lib/payments/fulfillment";
import type Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature || !body) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // Use shared configuration via dynamic import to prevent Turbopack/Bun chunk loading errors
    const { getStripeInstance, getStripeWebhookSecret } = await import("@/lib/stripe");
    const stripe = getStripeInstance();
    const webhookSecret = getStripeWebhookSecret();

    let event: Stripe.Event;
    try {
      // Async validation is required when using createFetchHttpClient (SubtleCrypto)
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`❌ [STRIPE WEBHOOK] Signature Error: ${message}`);
      return NextResponse.json(
        { error: "Signature Verification Failed" },
        { status: 400 },
      );
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const result = await fulfillCheckoutSession(stripe, session.id);
      console.log(
        `✅ [STRIPE WEBHOOK] Fulfillment ${result.status} for session: ${session.id}`,
      );
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`💥 [STRIPE WEBHOOK] Global Error: ${message}`);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
