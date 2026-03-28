import React from "react";
import Link from "next/link";
import { getCartAction } from "@/app/actions/cart";
import { cookies } from "next/headers";
import { LOCALE_COOKIE_KEY } from "@/lib/ui-preferences-keys";
import { parseLocale } from "@/lib/i18n/locale";
import { getMessages } from "@/lib/i18n/messages";
import { TbBasketExclamation } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import CheckoutContainer from "./CheckoutContainer";

export default async function CheckoutPage() {
  const cart = await getCartAction();
  const items = cart?.items ?? [];

  const cookieStore = await cookies();
  const locale = parseLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value);
  const t = await getMessages(locale);

  if (items.length === 0) {
    return (
      <main className="pb-20">
        <div className="max-w-frame mx-auto px-4 xl:px-0">
          <div className="flex items-center flex-col text-muted-foreground mt-32 space-y-4">
            <TbBasketExclamation strokeWidth={1} className="text-6xl" />
            <span>{t("cart.empty")}</span>
            <Button className="rounded-full w-24" asChild>
              <Link href="/shop">{t("cart.shop")}</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pb-20">
      <div className="max-w-frame mx-auto px-4 xl:px-0">
        <CheckoutContainer cartItems={items} t={t} />
      </div>
    </main>
  );
}
