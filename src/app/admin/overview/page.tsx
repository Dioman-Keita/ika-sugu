import { getAdminStats, getRecentOrders } from "@/app/actions/admin";
import { cookies } from "next/headers";
import { LOCALE_COOKIE_KEY } from "@/lib/ui-preferences-keys";
import { Locale, parseLocale } from "@/lib/i18n/locale";
import { messages } from "@/lib/i18n/messages";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { ADMIN_QUERY_KEYS } from "@/hooks/query-keys";
import AdminOverviewContent from "@/components/admin/AdminOverviewContent";

export default async function OverviewPage() {
  const cookieStore = await cookies();
  const locale: Locale = parseLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value);
  const m = messages[locale];

  const queryClient = new QueryClient();

  // Prefetch stats and orders
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ADMIN_QUERY_KEYS.stats,
      queryFn: () => getAdminStats(),
    }),
    queryClient.prefetchQuery({
      queryKey: ADMIN_QUERY_KEYS.recentOrders,
      queryFn: () => getRecentOrders(),
    }),
  ]);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-surface-card sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold text-foreground">
            {m["admin.overview.title"]}
          </h1>
          <p className="text-xs text-muted-foreground">
            {new Intl.DateTimeFormat(locale, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            }).format(new Date())}
          </p>
        </div>
      </div>

      <HydrationBoundary state={dehydrate(queryClient)}>
        <AdminOverviewContent locale={locale} />
      </HydrationBoundary>
    </div>
  );
}
