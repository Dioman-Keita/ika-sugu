"use client";

import Link from "next/link";
import { toast } from "sonner";
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
import { usePlaceOrderMutation } from "@/hooks/use-checkout";
import { useUiPreferences } from "@/lib/ui-preferences";
import { TbBasketExclamation } from "react-icons/tb";
import { Button } from "@/components/ui/button";

export default function CheckoutContainer() {
  const { t } = useUiPreferences();
  const { data: cart, isLoading } = useCartQuery();
  const { mutateAsync: placeOrder, isPending: isSubmitting } = usePlaceOrderMutation();

  const cartItems = (cart?.items ?? []) as OrderSummaryLine[];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground" />
      </div>
    );
  }

  if (cartItems.length === 0) {
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

  const handleSubmit = async (formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    zip: string;
  }) => {
    const response = await placeOrder(formData);
    if (response?.url) {
      window.location.href = response.url;
      return;
    }
    toast.error(t("checkout.error.redirectUnavailable"));
  };

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
        <div className="w-full">
          <ShippingForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </div>

        <OrderSummary items={cartItems} isSubmitting={isSubmitting} />
      </div>
    </>
  );
}
