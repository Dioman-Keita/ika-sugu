"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { integralCF } from "@/styles/fonts";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import ShippingForm from "@/components/checkout-page/ShippingForm";
import OrderSummary, {
  type OrderSummaryLine,
} from "@/components/checkout-page/OrderSummary";

import { useCartQuery } from "@/hooks/use-cart";
import { useUiPreferences } from "@/lib/ui-preferences";
import { TbBasketExclamation } from "react-icons/tb";
import { Button } from "@/components/ui/button";

export default function CheckoutContainer() {
  const { t } = useUiPreferences();
  const { data: cart, isLoading } = useCartQuery();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const cartItems = (cart?.items ?? []) as OrderSummaryLine[];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground" />
      </div>
    );
  }

  if (cartItems.length === 0 && !orderPlaced) {
    return (
      <div className="flex items-center flex-col text-muted-foreground mt-32 space-y-4 text-center">
        <TbBasketExclamation strokeWidth={1} className="text-6xl" />
        <span>{t("cart.empty")}</span>
        <Button className="rounded-full w-24" asChild>
          <Link href="/shop">{t("cart.shop")}</Link>
        </Button>
      </div>
    );
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate order processing
    await new Promise((res) => setTimeout(res, 1200));
    setIsSubmitting(false);
    setOrderPlaced(true);
  };

  if (orderPlaced) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-surface-section flex items-center justify-center text-4xl">
          ✓
        </div>
        <h2
          className={cn(
            integralCF.className,
            "text-[32px] md:text-[40px] text-foreground uppercase",
          )}
        >
          {t("checkout.orderConfirmed")}
        </h2>
        <p className="text-muted-foreground max-w-sm">{t("checkout.thankYou")}</p>
        <Link
          href="/shop"
          className="mt-4 inline-flex items-center justify-center bg-foreground text-background rounded-full px-10 py-3 font-medium text-sm hover:opacity-90 transition-opacity"
        >
          {t("checkout.continueShopping")}
        </Link>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb className="mb-2 sm:mb-6 pt-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/cart">Cart</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Checkout</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h2
        className={cn(
          integralCF.className,
          "font-bold text-[32px] md:text-[40px] text-foreground uppercase mb-5 md:mb-6",
        )}
      >
        {t("checkout.title")}
      </h2>

      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Left — shipping form */}
        <div className="w-full">
          <ShippingForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </div>

        {/* Right — order summary */}
        <OrderSummary items={cartItems} isSubmitting={isSubmitting} />
      </div>
    </>
  );
}
