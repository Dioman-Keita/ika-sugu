import Link from "next/link";
import { Package } from "lucide-react";
import { getAdminProducts } from "@/app/actions/admin";
import AdminPagination from "@/components/admin/AdminPagination";
import { cookies } from "next/headers";
import { LOCALE_COOKIE_KEY } from "@/lib/ui-preferences-keys";
import { Locale, parseLocale } from "@/lib/i18n/locale";
import { messages } from "@/lib/i18n/messages";
import { Button } from "@/components/ui/button";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function AdminProductsPage({ searchParams }: Props) {
  const cookieStore = await cookies();
  const locale: Locale = parseLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value);
  const m = messages[locale];

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const { products, total, totalPages, currentPage } = await getAdminProducts({ page });

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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-10 text-center text-muted-foreground"
                    >
                      {m["admin.products.noProducts"]}
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
                          href={`/shop/product/${product.slug}`}
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
                      <td className="px-5 py-3 text-right font-semibold text-foreground">
                        {new Intl.NumberFormat(locale, {
                          style: "currency",
                          currency: "USD",
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
                          Edit
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
                baseUrl="/admin/products"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
