import { ArrowLeft, Package, MapPin, Receipt } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderDetail } from "@/app/actions/orders";
import { cookies } from "next/headers";
import { LOCALE_COOKIE_KEY } from "@/lib/ui-preferences-keys";
import { Locale, parseLocale } from "@/lib/i18n/locale";
import { messages } from "@/lib/i18n/messages";
import Image from "next/image";
import { translateAttribute } from "@/lib/i18n/messages";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const cookieStore = await cookies();
  const locale: Locale = parseLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value);
  const m = messages[locale];

  const order = await getOrderDetail(id);

  if (!order) {
    notFound();
  }

  // NOTE: CustomerOrder doesn't currently include shipping address in its type.
  // We might need to extend it if we want to show it on the customer side too.
  // For now, let's focus on items and totals as defined in CustomerOrder.

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <Link
          href="/account"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          {m["account.orders.detail.back"]}
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-foreground">
            {m["account.orders.orderNumber"]} #{order.id.slice(-8).toUpperCase()}
          </h1>
          <div className="flex items-center gap-3">
            <StatusBadge status={order.rawStatus} />
            <div className="px-3 py-1 rounded-full text-xs font-medium bg-surface-section border border-border">
              {new Intl.DateTimeFormat(locale, {
                dateStyle: "long",
              }).format(new Date(order.date))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-border rounded-[20px] bg-surface-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center gap-2 bg-surface-section/50">
              <Package size={18} className="text-muted-foreground" />
              <h2 className="font-semibold">{m["account.orders.detail.orderInfo"]}</h2>
            </div>
            <div className="divide-y divide-border">
              {order.products.map((item) => (
                <div key={item.id} className="p-6 flex gap-4">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-border bg-surface-section shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {item.name}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {item.color && (
                        <span>
                          {m["cart.color"]} {translateAttribute(item.color, locale)}
                        </span>
                      )}
                      {item.size && (
                        <span>
                          {m["cart.size"]} {translateAttribute(item.size, locale)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm font-medium">
                      x{item.quantity}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-foreground">
                      {new Intl.NumberFormat(locale, {
                        style: "currency",
                        currency: order.currency,
                      }).format(item.price * item.quantity)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Intl.NumberFormat(locale, {
                        style: "currency",
                        currency: order.currency,
                      }).format(item.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Summary */}
        <div className="space-y-6">
          <div className="border border-border rounded-[20px] bg-surface-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center gap-2 bg-surface-section/50">
              <Receipt size={18} className="text-muted-foreground" />
              <h2 className="font-semibold">{m["account.orders.detail.summary"]}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{m["account.orders.detail.subtotal"]}</span>
                <span className="font-medium">
                  {new Intl.NumberFormat(locale, {
                    style: "currency",
                    currency: order.currency,
                  }).format(order.total)}
                </span>
              </div>
              <div className="pt-4 border-t border-border flex justify-between items-center">
                <span className="font-bold text-lg">{m["account.orders.detail.total"]}</span>
                <span className="font-black text-2xl">
                  {new Intl.NumberFormat(locale, {
                    style: "currency",
                    currency: order.currency,
                  }).format(order.total)}
                </span>
              </div>
            </div>
          </div>

          <Link
            href="/shop"
            className="block w-full py-4 text-center rounded-full bg-foreground text-background font-semibold hover:opacity-90 transition-opacity"
          >
            {m["account.orders.startShopping"]}
          </Link>
        </div>
      </div>
    </div>
  );
}
