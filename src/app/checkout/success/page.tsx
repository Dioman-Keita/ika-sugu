import { cookies } from "next/headers";
import { LOCALE_COOKIE_KEY } from "@/lib/ui-preferences-keys";
import { parseLocale } from "@/lib/i18n/locale";
import { getMessages } from "@/lib/i18n/messages";
import CheckoutStatusHero from "@/components/checkout-page/CheckoutStatusHero";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  // Safety net: if the Stripe webhook is delayed or was never delivered, fulfill
  // the order here too. fulfillCheckoutSession is idempotent — it no-ops when the
  // order already exists and swallows the unique-constraint race with the webhook.
  // Any failure here must never break the success page, so it is fully isolated.
  if (sessionId) {
    try {
      const { getStripeInstance } = await import("@/lib/stripe");
      const { fulfillCheckoutSession } = await import("@/lib/payments/fulfillment");
      await fulfillCheckoutSession(getStripeInstance(), sessionId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`💥 [CHECKOUT SUCCESS] Fallback fulfillment failed: ${message}`);
    }
  }

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_KEY)?.value;
  const locale = parseLocale(cookieLocale) || "en";
  const t = getMessages(locale);

  return (
    <CheckoutStatusHero
      title={t("checkout.success.title")}
      description={t("checkout.success.description")}
      ctaLabel={t("checkout.continueShopping")}
      ctaHref="/shop"
      tone="success"
    />
  );
}
