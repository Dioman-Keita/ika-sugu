"use client";

import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  Clock,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminStats, useRecentOrders } from "@/hooks/use-admin";
import RevenueChart from "@/components/admin/RevenueChart";
import StatusBadge from "@/components/admin/StatusBadge";
import { messages } from "@/lib/i18n/messages";
import { Locale } from "@/lib/i18n/locale";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accent?: string;
}) {
  return (
    <div className="border border-border rounded-2xl bg-surface-card p-5 flex items-start gap-4">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent ?? "bg-surface-section"}`}
      >
        <Icon size={18} className="text-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-foreground leading-tight whitespace-nowrap">
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const RECENT_ORDERS_PAGE_SIZE = 6;

export default function AdminOverviewContent({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [ordersPage, setOrdersPage] = useState(1);
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: recentOrders, isLoading: ordersLoading } = useRecentOrders();
  const m = messages[locale];

  if (statsLoading || ordersLoading || !stats || !recentOrders) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        {m["admin.overview.loading"]}
      </div>
    );
  }

  const totalOrderPages = Math.max(
    1,
    Math.ceil(recentOrders.length / RECENT_ORDERS_PAGE_SIZE),
  );
  const currentOrdersPage = Math.min(ordersPage, totalOrderPages);
  const paginatedOrders = recentOrders.slice(
    (currentOrdersPage - 1) * RECENT_ORDERS_PAGE_SIZE,
    currentOrdersPage * RECENT_ORDERS_PAGE_SIZE,
  );

  const revenueChartData = stats.monthlyRevenue.map(({ month, revenue }) => {
    const [year, monthIndex] = month.split("-").map((v) => Number(v));
    const d = new Date(year, monthIndex - 1, 1);
    const label = new Intl.DateTimeFormat(locale, {
      month: "short",
      year: "2-digit",
    }).format(d);
    return { month: label, revenue };
  });

  const formattedRevenue = new Intl.NumberFormat(locale, {
    notation: "compact",
    compactDisplay: "short",
    style: "currency",
    currency: stats.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(stats.totalRevenue);

  const orderStatuses = [
    { label: m["admin.overview.status.PENDING"], key: "PENDING", color: "bg-amber-500" },
    { label: m["admin.overview.status.PAID"], key: "PAID", color: "bg-blue-500" },
    { label: m["admin.overview.status.SHIPPED"], key: "SHIPPED", color: "bg-indigo-500" },
    {
      label: m["admin.overview.status.DELIVERED"],
      key: "DELIVERED",
      color: "bg-green-500",
    },
    { label: m["admin.overview.status.CANCELED"], key: "CANCELED", color: "bg-red-500" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={m["admin.overview.revenue"]}
          value={formattedRevenue}
          sub={m["admin.overview.revenueSub"]}
          icon={DollarSign}
        />
        <StatCard
          label={m["admin.overview.orders"]}
          value={stats.totalOrders.toLocaleString(locale)}
          sub={m["admin.overview.ordersPending"].replace(
            "{count}",
            String(stats.ordersByStatus["PENDING"] ?? 0),
          )}
          icon={ShoppingCart}
        />
        <StatCard
          label={m["admin.overview.users"]}
          value={stats.totalUsers.toLocaleString(locale)}
          icon={Users}
        />
        <StatCard
          label={m["admin.overview.products"]}
          value={stats.totalProducts.toLocaleString(locale)}
          sub={m["admin.overview.reviewsPending"].replace(
            "{count}",
            String(stats.pendingReviews),
          )}
          icon={Package}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue bar chart */}
        <div className="lg:col-span-2 border border-border rounded-2xl bg-surface-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              {m["admin.overview.revenueChart"]}
            </h2>
          </div>
          <RevenueChart
            data={revenueChartData}
            currency={stats.currency}
            locale={locale}
            revenueLabel={m["admin.overview.revenue"]}
          />
        </div>

        {/* Orders by status */}
        <div className="border border-border rounded-2xl bg-surface-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart size={16} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              {m["admin.overview.ordersByStatus"]}
            </h2>
          </div>
          <div className="space-y-3">
            {orderStatuses.map(({ label, key, color }) => {
              const count = stats.ordersByStatus[key] ?? 0;
              const pct = stats.totalOrders > 0 ? (count / stats.totalOrders) * 100 : 0;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="text-xs font-semibold text-foreground">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-section overflow-hidden">
                    <div
                      className={`h-full rounded-full ${color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="border border-border rounded-2xl bg-surface-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Clock size={16} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">
            {m["admin.overview.recentOrders"]}
          </h2>
        </div>
        {recentOrders.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground text-center">
            {m["admin.overview.noOrders"]}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-section">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    {m["admin.overview.table.customer"]}
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    {m["admin.overview.table.items"]}
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    {m["admin.overview.table.total"]}
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    {m["admin.overview.table.status"]}
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    {m["admin.overview.table.date"]}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedOrders.map((order) => (
                  <tr
                    key={order.id}
                    role="link"
                    tabIndex={0}
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/admin/orders/${order.id}`);
                      }
                    }}
                    className="cursor-pointer hover:bg-surface-section/50 transition-colors focus:outline-none focus-visible:bg-surface-section/50"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-foreground">{order.userName}</p>
                      <p className="text-xs text-muted-foreground">{order.userEmail}</p>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{order.itemCount}</td>
                    <td className="px-5 py-3 font-semibold text-foreground">
                      {new Intl.NumberFormat(locale, {
                        style: "currency",
                        currency: order.currency,
                      }).format(order.total)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">
                      {new Intl.DateTimeFormat(locale, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(new Date(order.createdAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalOrderPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-5 py-3">
                <button
                  type="button"
                  onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                  disabled={currentOrdersPage === 1}
                  className="flex items-center gap-1 h-8 px-2 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-surface-section disabled:pointer-events-none disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                  {m["pagination.previous"]}
                </button>
                <span className="text-xs text-muted-foreground">
                  {m["admin.overview.table.pageOf"]
                    .replace("{current}", String(currentOrdersPage))
                    .replace("{total}", String(totalOrderPages))}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setOrdersPage((p) => Math.min(totalOrderPages, p + 1))
                  }
                  disabled={currentOrdersPage === totalOrderPages}
                  className="flex items-center gap-1 h-8 px-2 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-surface-section disabled:pointer-events-none disabled:opacity-40"
                >
                  {m["pagination.next"]}
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
