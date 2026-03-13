"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUiPreferences } from "@/lib/ui-preferences";
import { mockOrders, type MockOrder, type OrderStatus } from "../_data/mockOrders";
import { cn } from "@/lib/utils";

const statusStyles: Record<OrderStatus, string> = {
  delivered: "bg-green-500/10 text-green-500 border border-green-500/20",
  shipped: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
  processing:
    "bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:text-amber-400",
  cancelled: "bg-red-500/10 text-red-500 border border-red-500/20",
};

const statusKeys: Record<OrderStatus, string> = {
  delivered: "account.orders.status.delivered",
  shipped: "account.orders.status.shipped",
  processing: "account.orders.status.processing",
  cancelled: "account.orders.status.cancelled",
};

function OrderCard({ order }: { order: MockOrder }) {
  const { t, locale } = useUiPreferences();

  const formattedDate = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(order.date));

  const formattedTotal = new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    style: "currency",
    currency: order.currency ?? "USD",
    minimumFractionDigits: 0,
  }).format(order.total);

  const totalQty = order.products.reduce((sum, p) => sum + p.quantity, 0);

  return (
    <div className="border border-border rounded-[20px] bg-surface-card overflow-hidden">
      {/* Order header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 bg-surface-section border-b border-border">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="text-xs font-semibold text-foreground">
            {t("account.orders.orderNumber")} #{order.id}
          </span>
          <span className="text-xs text-muted-foreground">
            {t("account.orders.orderedOn")} {formattedDate}
          </span>
        </div>
        <span
          className={cn(
            "text-xs font-medium px-3 py-1 rounded-full",
            statusStyles[order.status],
          )}
        >
          {t(statusKeys[order.status])}
        </span>
      </div>

      {/* Products */}
      <div className="px-5 py-4 flex items-center gap-3">
        {/* Thumbnails */}
        <div className="flex -space-x-2">
          {order.products.slice(0, 3).map((product) => (
            <div
              key={product.id}
              className="relative w-14 h-14 rounded-xl border-2 border-surface-card overflow-hidden bg-surface-section shrink-0"
            >
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="56px"
              />
            </div>
          ))}
          {order.products.length > 3 && (
            <div className="w-14 h-14 rounded-xl border-2 border-surface-card bg-surface-section shrink-0 flex items-center justify-center">
              <span className="text-xs text-muted-foreground font-medium">
                +{order.products.length - 3}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">
            {totalQty} {t("account.orders.items")}
          </p>
          <p className="text-base font-bold text-foreground">{formattedTotal}</p>
        </div>

        {/* Action */}
        <Button
          variant="outline"
          size="sm"
          className="rounded-full text-xs shrink-0"
          asChild
        >
          <Link href={`/shop`}>{t("account.orders.reorder")}</Link>
        </Button>
      </div>
    </div>
  );
}

export default function AccountOrders() {
  const { t } = useUiPreferences();

  if (mockOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-section flex items-center justify-center mb-4">
          <ShoppingBag size={24} className="text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          {t("account.orders.empty")}
        </h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
          {t("account.orders.emptyDesc")}
        </p>
        <Button asChild className="rounded-full">
          <Link href="/shop">{t("account.orders.startShopping")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-foreground">
        {t("account.orders.title")}
      </h2>
      <div className="space-y-3">
        {mockOrders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}
