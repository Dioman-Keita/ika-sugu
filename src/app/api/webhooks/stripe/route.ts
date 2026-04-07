import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import db from "@/lib/db";
import { OrderStatus } from "@/generated/prisma/client";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error(`Webhook Error: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const session = event.data.object as any;

  if (event.type === "checkout.session.completed") {
    const orderId = session.metadata?.orderId;

    if (orderId) {
      try {
        await db.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.PAID },
        });
      } catch (err) {
        console.error("Error updating order status:", err);
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
