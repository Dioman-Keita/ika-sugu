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
        await db.$transaction(async (tx) => {
          const order = await tx.order.findUnique({
            where: { id: orderId },
            include: { items: true },
          });

          if (!order || order.status === OrderStatus.PAID) {
            return;
          }

          // 1. Mark order as PAID
          await tx.order.update({
            where: { id: orderId },
            data: { status: OrderStatus.PAID },
          });

          // 2. Decrement stock for each variant in the order
          for (const item of order.items) {
            if (item.variantId) {
              await tx.productVariant.update({
                where: { id: item.variantId },
                data: {
                  stock: {
                    decrement: item.quantity,
                  },
                },
              });
            }
          }
        });
      } catch (err) {
        console.error("Error processing webook payment confirmation:", err);
        return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
