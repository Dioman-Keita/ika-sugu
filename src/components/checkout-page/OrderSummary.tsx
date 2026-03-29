"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { FaArrowRight } from "react-icons/fa6";
import { Loader2 } from "lucide-react";
import { useUiPreferences } from "@/lib/ui-preferences";
import { translateAttribute } from "@/lib/i18n/messages";

type OrderSummaryProps = {
  items: any[]; // Prisma CartItem with variant and product
  isSubmitting: boolean;
};

const OrderSummary = ({ items, isSubmitting }: OrderSummaryProps) => {
  const { t, locale } = useUiPreferences();

  const totalBasePrice = items.reduce((sum: number, item: any) => {
    const finalPrice = Number(item.variant.price);
    const basePrice = item.variant.compareAtPrice != null ? Number(item.variant.compareAtPrice) : finalPrice;
    return sum + basePrice * item.quantity;
  }, 0);

  const totalFinalPrice = items.reduce((sum: number, item: any) => {
    return sum + Number(item.variant.price) * item.quantity;
  }, 0);

  const discountAmount = Math.max(0, Math.round(totalBasePrice - totalFinalPrice));
  const discountPercentage =
    totalBasePrice > 0 ? Math.round((discountAmount / totalBasePrice) * 100) : 0;

  return (
    <div className="w-full lg:max-w-[505px] border border-border rounded-[20px] p-5 md:p-6 flex flex-col space-y-5 lg:sticky lg:top-24">
      <h3 className="font-bold text-xl md:text-2xl text-foreground">
        {t("checkout.orderSummary")}
      </h3>

      {/* Items */}
      <div className="flex flex-col space-y-4 max-h-80 overflow-y-auto pr-1">
        {items.map((item, idx) => {
          const productTranslation = item.variant.product.translations.find(
            (tr: any) => tr.locale === locale,
          );
          const name = productTranslation?.name ?? item.variant.product.name;
          const finalPrice = Number(item.variant.price);

          return (
            <div key={`${item.id}-${idx}`} className="flex items-center gap-3">
              <div className="relative w-16 h-16 shrink-0 rounded-[10px] overflow-hidden bg-surface-section">
                <Image
                  src={item.variant.images[0] || "/images/pic1.png"}
                  alt={name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {[item.variant.size, item.variant.colorName]
                    .map((attr) => translateAttribute(attr, locale))
                    .join(" · ")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Qty: {item.quantity}</p>
              </div>
              <span className="font-bold text-sm text-foreground shrink-0">
                ${Math.round(finalPrice * item.quantity)}
              </span>
            </div>
          );
        })}
      </div>

      <hr className="border-t-border" />

      {/* Totals */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t("checkout.subtotal")}</span>
          <span className="font-bold text-foreground">${totalBasePrice.toFixed(2)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {t("checkout.discount")} (-{discountPercentage}%)
            </span>
            <span className="font-bold text-red-500">-${discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t("checkout.delivery")}</span>
          <span className="font-bold text-foreground">{t("checkout.free")}</span>
        </div>
        <hr className="border-t-border" />
        <div className="flex items-center justify-between">
          <span className="text-foreground font-medium">{t("checkout.total")}</span>
          <span className="text-xl md:text-2xl font-bold text-foreground">
            ${totalFinalPrice.toFixed(2)}
          </span>
        </div>
      </div>

      <Button
        type="submit"
        form="checkout-form"
        disabled={isSubmitting}
        className="text-sm md:text-base font-medium bg-foreground text-background rounded-full w-full py-4 h-[54px] md:h-[60px] group"
      >
        {isSubmitting ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 size={18} className="animate-spin" />
            {t("checkout.processing")}
          </span>
        ) : (
          <>
            {t("checkout.placeOrder")}
            <FaArrowRight className="text-xl ml-2 group-hover:translate-x-1 transition-all" />
          </>
        )}
      </Button>
    </div>
  );
};

export default OrderSummary;
