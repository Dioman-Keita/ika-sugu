import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { getAdminOrders } from "@/app/actions/admin";
import { OrderStatus } from "@/generated/prisma/client";
import AdminPagination from "@/components/admin/AdminPagination";
import StatusBadge from "@/components/admin/StatusBadge";
import { cn } from "@/lib/utils";
import { cookies } from "next/headers";
import { LOCALE_COOKIE_KEY } from "@/lib/ui-preferences-keys";
import { Locale, parseLocale } from "@/lib/i18n/locale";
import { messages } from "@/lib/i18n/messages";

type Props = {
  searchParams: Promise<{ page?: string; status?: string }>;
};

export default async function AdminOrdersPage({ searchParams }: Props) {
  const cookieStore = await cookies();
  const locale: Locale = parseLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value);
  const m = messages[locale];

  const STATUS_TABS: { label: string; value: OrderStatus | "ALL" }[] = [
    { label: m["admin.orders.tabs.all"], value: "ALL" },
    { label: m["admin.orders.tabs.pending"], value: OrderStatus.PENDING },
    { label: m["admin.orders.tabs.paid"], value: OrderStatus.PAID },
    { label: m["admin.orders.tabs.shipped"], value: OrderStatus.SHIPPED },
    { label: m["admin.orders.tabs.delivered"], value: OrderStatus.DELIVERED },
    { label: m["admin.orders.tabs.canceled"], value: OrderStatus.CANCELED },
  ];

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const rawStatus = params.status?.toUpperCase();
  const status =
    rawStatus && rawStatus !== "ALL" ? (rawStatus as OrderStatus) : undefined;

  const { orders, total, totalPages, currentPage } = await getAdminOrders({
    page,
    status,
  });

  const baseUrl = status ? `/admin/orders?status=${status}` : "/admin/orders";

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-surface-card sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <ShoppingCart size={18} className="text-muted-foreground" />
          <h1 className="text-lg font-bold text-foreground">{m["admin.orders.title"]}</h1>
          <span className="ml-2 text-xs font-medium bg-surface-section px-2 py-0.5 rounded-full text-muted-foreground">
            {total}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Status filter tabs */}
        <div className="flex gap-1 border-b border-border overflow-x-auto [scrollbar-width:none] pb-0">
          {STATUS_TABS.map(({ label, value }) => {
            const isActive = (value === "ALL" && !status) || value === (status ?? "ALL");
            const href =
              value === "ALL" ? "/admin/orders" : `/admin/orders?status=${value}`;
            return (
              <Link
                key={value}
                href={href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors",
                  isActive
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Table */}
        <div className="border border-border rounded-2xl bg-surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-section">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    {m["admin.orders.table.orderId"]}
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    {m["admin.orders.table.customer"]}
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">
                    {m["admin.orders.table.items"]}
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">
                    {m["admin.orders.table.total"]}
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    {m["admin.orders.table.status"]}
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    {m["admin.orders.table.date"]}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-muted-foreground"
                    >
                      {m["admin.orders.noOrders"]}
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-surface-section/50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <span className="font-mono text-xs text-muted-foreground">
                          #{order.id.slice(-8).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-foreground">{order.userName}</p>
                        <p className="text-xs text-muted-foreground">{order.userEmail}</p>
                      </td>
                      <td className="px-5 py-3 text-right text-muted-foreground">
                        {order.itemCount}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-foreground">
                        {new Intl.NumberFormat(locale, {
                          style: "currency",
                          currency: "USD",
                        }).format(order.total)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {new Intl.DateTimeFormat(locale, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }).format(new Date(order.createdAt))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-5">
              <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                baseUrl={baseUrl}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
