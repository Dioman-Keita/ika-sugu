import { headers } from "next/headers";
import { NextResponse } from "next/server";
const Stripe = require("stripe");
import { stripe } from "@/lib/stripe";
import db from "@/lib/db";
import { OrderStatus } from "@/generated/prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

console.log("🚀 Webhook Route File Loaded");

export async function POST(req: Request) {
  console.log("📥 [WEBHOOK] Request received");

  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("Stripe-Signature");

    if (!signature) {
      console.error("❌ [WEBHOOK] No signature");
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    // [PLAN B] Utiliser le WebCryptoProvider pour éviter node:crypto
    const cryptoProvider = Stripe.createWebCryptoProvider();
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!,
        undefined,
        cryptoProvider
      );
    } catch (err: any) {
      console.error(`❌ [WEBHOOK] Validation Error: ${err.message}`);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    console.log(`🔔 [WEBHOOK] Event Type: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      const orderId = session.metadata?.orderId;
      console.log(`📦 [WEBHOOK] Processing Order ID: ${orderId}`);

      if (orderId) {
        await db.$transaction(async (tx) => {
          const order = await tx.order.findUnique({
            where: { id: orderId },
            include: { items: true },
          });

          if (!order) {
            console.error(`❌ [WEBHOOK] Order ${orderId} not found`);
            return;
          }

          if (order.status === OrderStatus.PAID) {
            console.log(`ℹ️ [WEBHOOK] Order ${orderId} already PAID`);
            return;
          }

          // 1. Mark order as PAID
          await tx.order.update({
            where: { id: orderId },
            data: { status: OrderStatus.PAID },
          });
          console.log(`✅ [WEBHOOK] Order ${orderId} marked as PAID`);

          // 2. Decrement stock
          for (const item of order.items) {
            if (item.variantId) {
              await tx.productVariant.update({
                where: { id: item.variantId },
                data: { stock: { decrement: item.quantity } },
              });
              console.log(`📉 [WEBHOOK] Stock reduced for variant ${item.variantId}`);
            }
          }
        });
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (globalErr: any) {
    console.error("💥 [WEBHOOK] CRITICAL ERROR:", globalErr);
    return NextResponse.json(
      { error: "Internal Server Error", message: globalErr.message },
      { status: 500 }
    );
  }
}
