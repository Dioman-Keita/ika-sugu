import { ArrowLeft, Package, User, MapPin, Receipt, CreditCard } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminOrderDetail, updateOrderStatusAction } from "@/app/actions/admin";
import { OrderStatus } from "@/generated/prisma/client";
import StatusBadge from "@/components/admin/StatusBadge";
import { cookies } from "next/headers";
import { LOCALE_COOKIE_KEY } from "@/lib/ui-preferences-keys";
import { Locale, parseLocale } from "@/lib/i18n/locale";
import { messages } from "@/lib/i18n/messages";
import Image from "next/image";
import OrderStatusUpdate from "@/components/admin/OrderStatusUpdate";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const cookieStore = await cookies();
  const locale: Locale = parseLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value);
  const m = messages[locale];

  const order = await getAdminOrderDetail(id);

  if (!order) {
    notFound();
  }

  const shipping = order.shippingAddress as {
    firstName: string;
    lastName: string;
    streetAddress: string;
    city: string;
    zip: string;
    country: string;
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-surface-card sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/orders"
              className="p-2 hover:bg-surface-section rounded-full transition-colors text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-foreground">
                {m["admin.orders.detail.title"].replace(
                  "{id}",
                  order.id.slice(-8).toUpperCase(),
                )}
              </h1>
              <p className="text-xs text-muted-foreground">
                {new Intl.DateTimeFormat(locale, {
                  dateStyle: "full",
                  timeStyle: "short",
                }).format(new Date(order.createdAt))}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <OrderStatusUpdate
              orderId={order.id}
              currentStatus={order.status}
              messages={{
                [OrderStatus.PENDING]: m["admin.orders.tabs.pending"],
                [OrderStatus.PAID]: m["admin.orders.tabs.paid"],
                [OrderStatus.SHIPPED]: m["admin.orders.tabs.shipped"],
                [OrderStatus.DELIVERED]: m["admin.orders.tabs.delivered"],
                [OrderStatus.CANCELED]: m["admin.orders.tabs.canceled"],
              }}
            />
            <StatusBadge status={order.status} />
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Items and Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="border border-border rounded-2xl bg-surface-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-surface-section flex items-center gap-2">
              <Package size={18} className="text-muted-foreground" />
              <h2 className="font-semibold">{m["admin.orders.detail.items"]}</h2>
            </div>
            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <div key={item.id} className="p-5 flex gap-4">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border bg-surface-section shrink-0">
                    <Image
                      src={item.image ?? "/images/pic1.png"}
                      alt={item.productName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {item.productName}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.variantName}</p>
                    {item.sku && (
                      <p className="text-[10px] font-mono text-muted-foreground mt-1">
                        {m["admin.orders.detail.sku"]}: {item.sku}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-foreground">
                      {new Intl.NumberFormat(locale, {
                        style: "currency",
                        currency: order.currency,
                      }).format(item.totalPrice)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} x{" "}
                      {new Intl.NumberFormat(locale, {
                        style: "currency",
                        currency: order.currency,
                      }).format(item.unitPrice)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border border-border rounded-2xl bg-surface-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-surface-section flex items-center gap-2">
              <Receipt size={18} className="text-muted-foreground" />
              <h2 className="font-semibold">{m["admin.orders.detail.orderSummary"]}</h2>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {m["admin.orders.detail.subtotal"]}
                </span>
                <span className="text-foreground">
                  {new Intl.NumberFormat(locale, {
                    style: "currency",
                    currency: order.currency,
                  }).format(order.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {m["admin.orders.detail.vat"]}
                </span>
                <span className="text-foreground">
                  {new Intl.NumberFormat(locale, {
                    style: "currency",
                    currency: order.currency,
                  }).format(order.taxTotal)}
                </span>
              </div>
              <div className="pt-3 border-t border-border flex justify-between">
                <span className="font-bold">{m["admin.orders.detail.total"]}</span>
                <span className="font-bold text-lg">
                  {new Intl.NumberFormat(locale, {
                    style: "currency",
                    currency: order.currency,
                  }).format(order.total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Customer and Shipping */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="border border-border rounded-2xl bg-surface-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-surface-section flex items-center gap-2">
              <User size={18} className="text-muted-foreground" />
              <h2 className="font-semibold">{m["admin.orders.detail.customerInfo"]}</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {m["auth.firstName"]} & {m["auth.lastName"]}
                </p>
                <p className="text-sm font-medium text-foreground">{order.userName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {m["auth.emailLabel"]}
                </p>
                <p className="text-sm font-medium text-foreground">{order.userEmail}</p>
              </div>
              {order.customerPhone && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {m["checkout.phone"]}
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {order.customerPhone}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="border border-border rounded-2xl bg-surface-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-surface-section flex items-center gap-2">
              <MapPin size={18} className="text-muted-foreground" />
              <h2 className="font-semibold">
                {m["admin.orders.detail.shippingAddress"]}
              </h2>
            </div>
            <div className="p-5 text-sm space-y-1">
              {shipping ? (
                <>
                  <p className="font-medium text-foreground">
                    {shipping.firstName} {shipping.lastName}
                  </p>
                  <p className="text-muted-foreground">{shipping.streetAddress}</p>
                  <p className="text-muted-foreground">
                    {shipping.zip} {shipping.city}
                  </p>
                  <p className="text-muted-foreground">{shipping.country}</p>
                </>
              ) : (
                <p className="text-muted-foreground italic">
                  No shipping address provided
                </p>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="border border-border rounded-2xl bg-surface-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-surface-section flex items-center gap-2">
              <CreditCard size={18} className="text-muted-foreground" />
              <h2 className="font-semibold">{m["admin.orders.detail.payment"]}</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {m["admin.orders.detail.stripeId"]}
                </p>
                <p className="text-xs font-mono text-foreground break-all">
                  {order.stripeSessionId ?? "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
