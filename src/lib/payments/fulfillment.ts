import type Stripe from "stripe";
import db from "@/lib/db";
import { OrderStatus, Prisma } from "@/generated/prisma/client";
import {
  DEFAULT_TARGET_CURRENCY,
  normalizeCurrencyCode,
  roundMoney,
} from "@/lib/currency/shared";
import { fromStripeMinorAmount } from "@/lib/payments/stripe-money";
import { vatAmountFromNetPrice } from "@/lib/pricing/vat";

export type FulfillmentResult =
  | { status: "fulfilled" }
  | { status: "alreadyFulfilled" }
  | { status: "skipped"; reason: string };

/** Require a non-empty string snapshot field; throw (fail closed) otherwise. */
function requireStringMetadata(
  raw: string | undefined,
  field: string,
  lineId: string,
): string {
  if (raw == null || raw.trim() === "") {
    throw new Error(`Missing ${field} on Stripe line item ${lineId} during fulfillment`);
  }
  return raw;
}

/** Require a finite numeric snapshot field; throw (fail closed) otherwise. */
function requireMoneyMetadata(
  raw: string | undefined,
  field: string,
  lineId: string,
): number {
  const value = Number(requireStringMetadata(raw, field, lineId));
  if (!Number.isFinite(value)) {
    throw new Error(
      `Invalid ${field}="${raw}" on Stripe line item ${lineId} during fulfillment`,
    );
  }
  return value;
}

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

  const targetCurrency =
    normalizeCurrencyCode(session.currency) ?? DEFAULT_TARGET_CURRENCY;

  // 2. Collect ALL line items. listLineItems is paginated, so auto-page through
  // every result; otherwise larger carts (>100 lines) would be truncated and
  // fulfillment, stock, and cart cleanup would run against an incomplete set.
  const lineItems: Stripe.LineItem[] = [];
  for await (const lineItem of stripe.checkout.sessions.listLineItems(sessionId, {
    expand: ["data.price.product"],
  })) {
    lineItems.push(lineItem);
  }

  // 3. Build the priced snapshot, failing closed on missing/invalid metadata so
  // we never persist zero-priced or drifting amounts, and rounding every
  // persisted value with the shared money helpers.
  const itemsData = lineItems.map((li) => {
    const product = li.price?.product;
    const prodMetadata =
      product && typeof product === "object" && !("deleted" in product)
        ? product.metadata
        : null;
    if (!prodMetadata) {
      throw new Error(
        `Missing product metadata on Stripe line item ${li.id} during fulfillment`,
      );
    }

    const productId = requireStringMetadata(prodMetadata.productId, "productId", li.id);
    const variantId = requireStringMetadata(prodMetadata.variantId, "variantId", li.id);
    const quantity = li.quantity || 1;
    const unitPrice = requireMoneyMetadata(prodMetadata.unitPrice, "unitPrice", li.id);
    const vatRate = requireMoneyMetadata(prodMetadata.vatRate, "vatRate", li.id);
    const sourceUnitGrossPrice = requireMoneyMetadata(
      prodMetadata.sourceUnitGrossPrice,
      "sourceUnitGrossPrice",
      li.id,
    );
    const sourceCurrency =
      normalizeCurrencyCode(prodMetadata.sourceCurrency) ?? DEFAULT_TARGET_CURRENCY;

    const totalPrice = roundMoney(unitPrice * quantity, targetCurrency);
    const vatAmount = vatAmountFromNetPrice(totalPrice, vatRate);

    return {
      productId,
      variantId,
      quantity,
      unitPrice,
      totalPrice,
      vatRate,
      vatAmount,
      sourceCurrency,
      targetCurrency,
      sourceUnitGrossPrice,
      sourceTotalGrossPrice: roundMoney(sourceUnitGrossPrice * quantity, sourceCurrency),
    };
  });

  const subtotal = roundMoney(
    itemsData.reduce((acc, i) => acc + i.totalPrice, 0),
    targetCurrency,
  );
  const taxTotal = roundMoney(
    itemsData.reduce((acc, i) => acc + i.vatAmount, 0),
    targetCurrency,
  );

  // 4. Atomic Transaction: Order + Items + Stock + Cart.
  try {
    await db.$transaction(
      async (tx) => {
        await tx.order.create({
          data: {
            userId,
            stripeSessionId: session.id,
            status: OrderStatus.PAID,
            currency: targetCurrency,
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
            subtotal,
            taxTotal,
            total: fromStripeMinorAmount(session.amount_total, session.currency),
            items: { create: itemsData },
          },
        });

        // Update inventory levels. variantId is guaranteed present (validated above).
        for (const item of itemsData) {
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

        // Clear ONLY the purchased lines from the user's cart — never collapse to
        // a cartId-only predicate that would wipe unpurchased items.
        if (metadata?.cartId) {
          const purchasedVariantIds = itemsData.map((item) => item.variantId);
          await tx.cartItem.deleteMany({
            where: {
              cartId: metadata.cartId,
              variantId: { in: purchasedVariantIds },
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
