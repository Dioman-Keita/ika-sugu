"use client";

import BreadcrumbCart from "@/components/cart-page/BreadcrumbCart";
import ProductCard from "@/components/cart-page/ProductCard";
import { Button } from "@/components/ui/button";
import InputGroup from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { integralCF } from "@/styles/fonts";
import { FaArrowRight } from "react-icons/fa6";
import { MdOutlineLocalOffer } from "react-icons/md";
import { TbBasketExclamation } from "react-icons/tb";
import React from "react";
import { RootState } from "@/lib/store";
import { useAppSelector } from "@/lib/hooks/redux";
import { useUiPreferences } from "@/lib/ui-preferences";
import Link from "next/link";
import { CartItem } from "@/lib/features/carts/cartsSlice";

type LegacyCartItem = CartItem & {
  price?: number;
  discount?: {
    percentage?: number;
  };
};

const getBasePrice = (item: LegacyCartItem): number => item.basePrice ?? item.price ?? 0;

const getFinalPrice = (item: LegacyCartItem): number => {
  if (typeof item.finalPrice === "number") return item.finalPrice;
  const basePrice = getBasePrice(item);
  const discountPercentage = item.discountPercentage ?? item.discount?.percentage ?? 0;
  return Math.round(basePrice - (basePrice * discountPercentage) / 100);
};

export default function CartPage() {
  const { cart } = useAppSelector((state: RootState) => state.carts);
  const { t } = useUiPreferences();
  const items = (cart?.items ?? []) as LegacyCartItem[];
  const totalBasePrice = items.reduce(
    (sum, item) => sum + getBasePrice(item) * item.quantity,
    0,
  );
  const totalFinalPrice = items.reduce(
    (sum, item) => sum + getFinalPrice(item) * item.quantity,
    0,
  );
  const discountAmount = Math.max(0, Math.round(totalBasePrice - totalFinalPrice));
  const discountPercentage =
    totalBasePrice > 0 ? Math.round((discountAmount / totalBasePrice) * 100) : 0;

  return (
    <main className="pb-20">
      <div className="max-w-frame mx-auto px-4 xl:px-0">
        {cart && cart.items.length > 0 ? (
          <>
            <BreadcrumbCart />
            <h2
              className={cn([
                integralCF.className,
                "font-bold text-[32px] md:text-[40px] text-foreground uppercase mb-5 md:mb-6",
              ])}
            >
              {t("cart.title")}
            </h2>
            <div className="flex flex-col lg:flex-row space-y-5 lg:space-y-0 lg:space-x-5 items-start">
              {/* Cart items */}
              <div className="w-full p-3.5 md:px-6 flex-col space-y-4 md:space-y-6 rounded-[20px] border border-border">
                {cart?.items.map((product: CartItem, idx: number, arr: CartItem[]) => (
                  <React.Fragment key={idx}>
                    <ProductCard data={product} />
                    {arr.length - 1 !== idx && <hr className="border-t-border" />}
                  </React.Fragment>
                ))}
              </div>

              {/* Order Summary */}
              <div className="w-full lg:max-w-[505px] p-5 md:px-6 flex-col space-y-4 md:space-y-6 rounded-[20px] border border-border">
                <h6 className="text-xl md:text-2xl font-bold text-foreground">
                  {t("checkout.orderSummary")}
                </h6>
                <div className="flex flex-col space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="md:text-xl text-muted-foreground">
                      {t("checkout.subtotal")}
                    </span>
                    <span className="md:text-xl font-bold text-foreground">
                      ${totalBasePrice ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="md:text-xl text-muted-foreground">
                      {t("checkout.discount")} (-{discountPercentage}%)
                    </span>
                    <span className="md:text-xl font-bold text-red-500">
                      -${discountAmount ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="md:text-xl text-muted-foreground">
                      {t("checkout.delivery")}
                    </span>
                    <span className="md:text-xl font-bold text-foreground">
                      {t("checkout.free")}
                    </span>
                  </div>
                  <hr className="border-t-border" />
                  <div className="flex items-center justify-between">
                    <span className="md:text-xl text-foreground">
                      {t("checkout.total")}
                    </span>
                    <span className="text-xl md:text-2xl font-bold text-foreground">
                      ${Math.round(totalFinalPrice ?? 0)}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <InputGroup className="bg-surface-section">
                    <InputGroup.Text>
                      <MdOutlineLocalOffer className="text-foreground/40 text-2xl" />
                    </InputGroup.Text>
                    <InputGroup.Input
                      type="text"
                      name="code"
                      placeholder={t("cart.promoCodePlaceholder")}
                      className="bg-transparent placeholder:text-foreground/40 text-foreground"
                    />
                  </InputGroup>
                  <Button
                    type="button"
                    className="bg-foreground text-background rounded-full w-full max-w-[119px] h-[48px]"
                  >
                    {t("cart.apply")}
                  </Button>
                </div>
                <Button
                  type="button"
                  className="text-sm md:text-base font-medium bg-foreground text-background rounded-full w-full py-4 h-[54px] md:h-[60px] group"
                  asChild
                >
                  <Link href="/checkout">
                    {t("cart.goToCheckout")}{" "}
                    <FaArrowRight className="text-xl ml-2 group-hover:translate-x-1 transition-all" />
                  </Link>
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center flex-col text-muted-foreground mt-32">
            <TbBasketExclamation strokeWidth={1} className="text-6xl" />
            <span className="block mb-4">{t("cart.empty")}</span>
            <Button className="rounded-full w-24" asChild>
              <Link href="/shop">{t("cart.shop")}</Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
