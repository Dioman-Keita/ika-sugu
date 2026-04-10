"use server";

import { Prisma } from "@/generated/prisma/client";
import db from "@/lib/db";
import { auth } from "@/lib/auth";
import { convertMoney, getCurrentTargetCurrency } from "@/lib/currency/server";
import { toStripeMinorAmount } from "@/lib/payments/stripe-money";
import { vatPortionFromGross } from "@/lib/pricing/vat";
import { getCanonicalSiteUrl } from "@/lib/site-url";
import { stripe } from "@/lib/stripe";
import { headers, cookies } from "next/headers";
import { LOCALE_COOKIE_KEY } from "@/lib/ui-preferences-keys";
import { parseLocale } from "@/lib/i18n/locale";
import { getMessages } from "@/lib/i18n/messages";

export type CheckoutInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  zip: string;
};

const toMoney = (value: number) => new Prisma.Decimal(value).toDecimalPlaces(2);
const toRate = (value: number) => new Prisma.Decimal(value).toDecimalPlaces(8);

export async function placeOrderAction(input: CheckoutInput) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_KEY)?.value;
  const locale = parseLocale(cookieLocale) || "en";
  const t = getMessages(locale);

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) throw new Error(t("checkout.error.unauthorized"));

  const requiredFields: Array<keyof CheckoutInput> = [
    "firstName",
    "lastName",
    "email",
    "address",
    "city",
    "country",
    "zip",
  ];

  for (const field of requiredFields) {
    if (!String(input[field] ?? "").trim()) {
      throw new Error(t("checkout.error.fieldRequired", { field }));
    }
  }

  const cart = await db.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  vatRate: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    throw new Error(t("checkout.error.cartEmpty"));
  }

  const targetCurrency = await getCurrentTargetCurrency();

  const lineSnapshots = await Promise.all(
    cart.items.map(async (item) => {
      const sourceUnitGrossPrice = Number(item.variant.price);
      const sourceCurrency = item.variant.currency;
      const converted = await convertMoney({
        amount: sourceUnitGrossPrice,
        sourceCurrency,
        targetCurrency,
      });

      if (converted.currency !== targetCurrency) {
        throw new Error(t("checkout.error.conversionFailed"));
      }

      const quantity = item.quantity;
      const vatRate = new Prisma.Decimal(item.variant.product.vatRate);
      const targetGrossTotalPrice = toMoney(converted.amount * quantity);
      const vatAmount = vatPortionFromGross(targetGrossTotalPrice, vatRate);
      const netTotal = targetGrossTotalPrice.sub(vatAmount).toDecimalPlaces(2);
      const netUnit = netTotal.div(quantity).toDecimalPlaces(2);

      return {
        productId: item.variant.product.id,
        variantId: item.variant.id,
        quantity,
        unitPrice: netUnit,
        totalPrice: netTotal,
        vatRate,
        vatAmount,
        sourceCurrency: converted.sourceCurrency,
        targetCurrency: converted.currency,
        exchangeRate: converted.rate == null ? null : toRate(converted.rate),
        sourceUnitGrossPrice: toMoney(sourceUnitGrossPrice),
        sourceTotalGrossPrice: toMoney(sourceUnitGrossPrice * quantity),
      };
    }),
  );

  const headersList = await headers();
  const requestHost = headersList.get("host") || "localhost:3000";
  const requestProtocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const fallbackBaseUrl = `${requestProtocol}://${requestHost}`;
  const baseUrl = getCanonicalSiteUrl() ?? fallbackBaseUrl;

  // Create Stripe Checkout Session
  const lineItems = cart.items.map((item) => {
    // Determine image URL
    const imageUrl = item.variant.images[0]
      ? item.variant.images[0].startsWith("http")
        ? item.variant.images[0]
        : `${baseUrl}${item.variant.images[0].startsWith("/") ? "" : "/"}${item.variant.images[0]}`
      : undefined;

    // Convert Stripe expects value in the smallest currency unit (e.g. cents)
    const itemSnapshot = lineSnapshots.find((ls) => ls.variantId === item.variant.id);
    const unitPriceValue = itemSnapshot ? Number(itemSnapshot.unitPrice) : 0;
    const vatValue = itemSnapshot ? Number(itemSnapshot.vatAmount) / item.quantity : 0;

    // Total price sent to Stripe
    const grossUnitPrice = unitPriceValue + vatValue;

    return {
      price_data: {
        currency: targetCurrency.toLowerCase(),
        product_data: {
          name: `${item.variant.product.name} - ${item.variant.colorName} (${item.variant.size})`,
          images: imageUrl ? [imageUrl] : [],
          metadata: {
            productId: item.variant.productId,
            variantId: item.variant.id,
            vatRate: String(item.variant.product.vatRate),
            unitPrice: String(unitPriceValue),
            sourceCurrency: itemSnapshot?.sourceCurrency ?? item.variant.currency,
            sourceUnitGrossPrice: String(
              itemSnapshot ? Number(itemSnapshot.sourceUnitGrossPrice) : Number(item.variant.price),
            ),
          },
        },
        unit_amount: toStripeMinorAmount(grossUnitPrice, targetCurrency),
      },
      quantity: item.quantity,
    };
  });

  const stripeSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: lineItems,
    customer_email: input.email.trim(),
    client_reference_id: userId,
    metadata: {
      userId,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email.trim(),
      phone: input.phone.trim() || "",
      address: input.address.trim(),
      city: input.city.trim(),
      country: input.country.trim(),
      zip: input.zip.trim(),
      cartId: cart.id,
      targetCurrency,
    },
    success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/checkout/cancel`,
  });

  return {
    checkoutSessionId: stripeSession.id,
    currency: targetCurrency,
    url: stripeSession.url,
  };
}
