import type Stripe from "stripe";
import db from "@/lib/db";
import { OrderStatus, Prisma } from "@/generated/prisma/client";
import { fromStripeMinorAmount } from "@/lib/payments/stripe-money";
import { vatAmountFromNetPrice } from "@/lib/pricing/vat";

export type FulfillmentResult =
  | { status: "fulfilled" }
  | { status: "alreadyFulfilled" }
  | { status: "skipped"; reason: string };

/**
 * Idempotently turns a paid Stripe Checkout Session into an Order (+ items),
 * decrements stock, and clears the purchased cart lines — all in one
 * transaction.
 *
 * This is the single source of truth for fulfillment and is safe to call from
 * BOTH the Stripe webhook and the checkout success page. It no-ops when the
 * order already exists, and swallows the unique-constraint race (P2002) that can
 * happen when the webhook and the success page fulfill the same session at the
 * same time.
 */
export async function fulfillCheckoutSession(
  stripe: Stripe,
  sessionId: string,
): Promise<FulfillmentResult> {
  // 1. Idempotency: bail early if this session was already fulfilled.
  const existingOrder = await db.order.findUnique({
    where: { stripeSessionId: sessionId },
  });
  if (existingOrder) {
    return { status: "alreadyFulfilled" };
  }

  // Re-fetch the session from Stripe so we always work from a payload rendered
  // with the SDK's API version (the webhook event may arrive in the endpoint's
  // version, and the success page only has the id).
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    return { status: "skipped", reason: `payment_status=${session.payment_status}` };
  }

  const metadata = session.metadata;
  const userId = metadata?.userId;
  if (!userId) {
    return { status: "skipped", reason: "missing userId metadata" };
  }

  // 2. Retrieve detailed line items (expand to get pricing and metadata).
  const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
    expand: ["data.price.product"],
  });

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

  // 3. Atomic Transaction: Order + Items + Stock + Cart.
  try {
    await db.$transaction(
      async (tx) => {
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
            total: fromStripeMinorAmount(session.amount_total, session.currency),
            items: { create: itemsData },
          },
        });

        // Update inventory levels.
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

        // Clear purchased lines from the user's cart.
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
  } catch (err) {
    // Race condition: the webhook and the success page both reached the
    // transaction. The unique stripeSessionId guarantees only one order is
    // created; treat the loser as already fulfilled.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { status: "alreadyFulfilled" };
    }
    throw err;
  }

  return { status: "fulfilled" };
}
