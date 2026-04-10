import { cookies } from "next/headers";
import { LOCALE_COOKIE_KEY } from "@/lib/ui-preferences-keys";
import { parseLocale } from "@/lib/i18n/locale";
import { getMessages } from "@/lib/i18n/messages";
import { X } from "lucide-react";
import CheckoutStatusHero from "@/components/checkout-page/CheckoutStatusHero";

export default async function CheckoutCancelPage() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_KEY)?.value;
  const locale = parseLocale(cookieLocale) || "en";
  const t = getMessages(locale);

  return (
    <CheckoutStatusHero
      title={t("checkout.cancel.title")}
      description={t("checkout.cancel.description")}
      ctaLabel={t("checkout.cancel.backToCart")}
      ctaHref="/cart"
      tone="cancel"
      Icon={X}
    />
  );
}
