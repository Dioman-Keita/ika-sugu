import { NextResponse } from "next/server";
import db from "@/lib/db";
import { OrderStatus } from "@/generated/prisma/client";
import { fromStripeMinorAmount } from "@/lib/payments/stripe-money";
import { vatAmountFromNetPrice } from "@/lib/pricing/vat";
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
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
      );
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
      const metadata = session.metadata;
      const userId = metadata?.userId;

      if (!userId) {
        return NextResponse.json({ error: "No userId" }, { status: 400 });
      }

      // 1. Idempotency check: prevent duplicate order creation
      const existingOrder = await db.order.findUnique({
        where: { stripeSessionId: session.id },
      });

      if (existingOrder) {
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // 2. Retrieve detailed line items (expand to get pricing and metadata)
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ["data.price.product"],
      });

      // 3. Atomic Transaction: Order + Items + Stock + Cart
      await db.$transaction(
        async (tx) => {
          const itemsData = lineItems.data.map((li) => {
            const product = li.price?.product as Stripe.Product;
            const prodMetadata = product.metadata;
            const quantity = li.quantity || 1;
            const unitPrice = Number(prodMetadata.unitPrice || 0);
            const vatRate = Number(prodMetadata.vatRate || 0);
            const totalPrice = unitPrice * quantity;
            const vatAmount = vatAmountFromNetPrice(totalPrice, vatRate);
            const sourceUnitGrossPrice = Number(prodMetadata.sourceUnitGrossPrice || 0);

            return {
              productId: prodMetadata.productId,
              variantId: prodMetadata.variantId,
              quantity,
              unitPrice,
              totalPrice,
              vatRate,
              vatAmount,
              sourceCurrency: prodMetadata.sourceCurrency || "USD",
              targetCurrency: session.currency?.toUpperCase() || "USD",
              sourceUnitGrossPrice,
              sourceTotalGrossPrice: sourceUnitGrossPrice * quantity,
            };
          });

          // Create the order
          await tx.order.create({
            data: {
              userId,
              stripeSessionId: session.id,
              status: OrderStatus.PAID,
              currency: session.currency?.toUpperCase() || "USD",
              customerEmail: metadata?.email || session.customer_details?.email,
              customerPhone: metadata?.phone || session.customer_details?.phone || null,
              shippingAddress: {
                firstName: metadata?.firstName || "",
                lastName: metadata?.lastName || "",
                address: metadata?.address || "",
                city: metadata?.city || "",
                country: metadata?.country || "",
                zip: metadata?.zip || "",
              },
              subtotal: itemsData.reduce((acc, i) => acc + i.totalPrice, 0),
              taxTotal: itemsData.reduce((acc, i) => acc + i.vatAmount, 0),
              total: fromStripeMinorAmount(
                session.amount_total,
                session.currency,
              ),
              items: { create: itemsData },
            },
          });

          // Update inventory levels
          for (const item of itemsData) {
            if (item.variantId) {
              const updateResult = await tx.productVariant.updateMany({
                where: {
                  id: item.variantId,
                  stock: { gte: item.quantity },
                },
                data: { stock: { decrement: item.quantity } },
              });

              if (updateResult.count !== 1) {
                throw new Error(
                  `Insufficient stock for variant ${item.variantId} during Stripe fulfillment`,
                );
              }
            }
          }

          // Clear user's cart
          if (metadata?.cartId) {
            const purchasedVariantIds = itemsData
              .map((item) => item.variantId)
              .filter((variantId): variantId is string => Boolean(variantId));

            await tx.cartItem.deleteMany({
              where: {
                cartId: metadata.cartId,
                ...(purchasedVariantIds.length > 0
                  ? { variantId: { in: purchasedVariantIds } }
                  : {}),
              },
            });
          }
        },
        { timeout: 30000 },
      );

      console.log(`✅ [STRIPE WEBHOOK] Order fulfilled for session: ${session.id}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`💥 [STRIPE WEBHOOK] Global Error: ${message}`);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
