import Link from "next/link";
import { Package } from "lucide-react";
import { getAdminProducts } from "@/app/actions/admin";
import AdminPagination from "@/components/admin/AdminPagination";
import StatusBadge from "@/components/admin/StatusBadge";
import { cookies } from "next/headers";
import { LOCALE_COOKIE_KEY } from "@/lib/ui-preferences-keys";
import { Locale, parseLocale } from "@/lib/i18n/locale";
import { messages } from "@/lib/i18n/messages";
import { Button } from "@/components/ui/button";
import { ProductStatus } from "@/generated/prisma/client";

type Props = {
  searchParams: Promise<{ page?: string; status?: string }>;
};

export default async function AdminProductsPage({ searchParams }: Props) {
  const cookieStore = await cookies();
  const locale: Locale = parseLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value);
  const m = messages[locale];

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const rawStatus = params.status;
  const status =
    rawStatus === ProductStatus.DRAFT ||
    rawStatus === ProductStatus.PUBLISHED ||
    rawStatus === ProductStatus.ARCHIVED
      ? rawStatus
      : undefined;
  const tabs = [
    { label: m["admin.products.tabs.all"], value: "ALL" },
    { label: m["admin.product.status.draft"], value: ProductStatus.DRAFT },
    { label: m["admin.product.status.published"], value: ProductStatus.PUBLISHED },
    { label: m["admin.product.status.archived"], value: ProductStatus.ARCHIVED },
  ] as const;
  const { products, total, totalPages, currentPage } = await getAdminProducts({
    page,
    status,
  });

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-surface-card sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package size={18} className="text-muted-foreground" />
          <h1 className="text-lg font-bold text-foreground">
            {m["admin.products.title"]}
          </h1>
          <span className="ml-2 text-xs font-medium bg-surface-section px-2 py-0.5 rounded-full text-muted-foreground">
            {total}
          </span>
        </div>
        <Button asChild className="rounded-full h-10 px-4 text-sm">
          <Link href="/admin/products/new">{m["admin.product.form.action.create"]}</Link>
        </Button>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-2 mb-4 overflow-x-auto">
          {tabs.map(({ label, value }) => {
            const isActive = (value === "ALL" && !status) || value === (status ?? "ALL");
            const href =
              value === "ALL" ? "/admin/products" : `/admin/products?status=${value}`;

            return (
              <Link
                key={value}
                href={href}
                className={[
                  "px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-foreground text-background"
                    : "bg-surface-section text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <div className="border border-border rounded-2xl bg-surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-section">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    {m["admin.products.table.product"]}
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    {m["admin.products.table.category"]}
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    {m["admin.products.table.status"]}
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">
                    {m["admin.products.table.price"]}
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">
                    {m["admin.products.table.discount"]}
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">
                    {m["admin.products.table.variants"]}
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">
                    {m["admin.products.table.stock"]}
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    {m["admin.products.table.added"]}
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">
                    {m["common.actions"]}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-5 py-10 text-center text-muted-foreground"
                    >
                      <div className="mx-auto max-w-md space-y-3">
                        <p className="text-base font-semibold text-foreground">
                          {m["admin.products.empty.title"]}
                        </p>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {m["admin.products.empty.description"]}
                        </p>
                        <Button asChild className="rounded-full h-10 px-4 text-sm">
                          <Link href="/admin/products/new">
                            {m["admin.products.empty.cta"]}
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-surface-section/50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={`/shop/product/${product.id}/${product.slug}`}
                          className="font-medium text-foreground hover:underline truncate block max-w-[200px]"
                          target="_blank"
                        >
                          {product.name}
                        </Link>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          {product.id.slice(-8)}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {product.category}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={product.status} type="product" />
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-foreground">
                        {new Intl.NumberFormat(locale, {
                          style: "currency",
                          currency: product.currency,
                        }).format(product.finalPrice)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {product.discountPercentage > 0 ? (
                          <span className="text-green-600 font-medium">
                            -{product.discountPercentage}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right text-muted-foreground">
                        {product.activeVariants}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className={
                            product.totalStock === 0
                              ? "text-red-500 font-semibold"
                              : product.totalStock < 5
                                ? "text-amber-600 font-semibold"
                                : "text-foreground"
                          }
                        >
                          {product.totalStock}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground text-xs">
                        {new Intl.DateTimeFormat(locale, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }).format(new Date(product.createdAt))}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="text-primary hover:underline text-xs font-medium"
                        >
                          {m["common.edit"]}
                        </Link>
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
                baseUrl={status ? `/admin/products?status=${status}` : "/admin/products"}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
