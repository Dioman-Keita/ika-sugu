import { Star } from "lucide-react";
import Link from "next/link";
import { getAdminReviews } from "@/app/actions/admin";
import { ReviewStatus } from "@/generated/prisma/client";
import AdminPagination from "@/components/admin/AdminPagination";
import StatusBadge from "@/components/admin/StatusBadge";
import ReviewActions from "@/components/admin/ReviewActions";
import { cn } from "@/lib/utils";
import { cookies } from "next/headers";
import { LOCALE_COOKIE_KEY } from "@/lib/ui-preferences-keys";
import { Locale, parseLocale } from "@/lib/i18n/locale";
import { messages } from "@/lib/i18n/messages";
import ReviewContentCell from "@/components/admin/ReviewContentCell";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={11}
          className={
            s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
          }
        />
      ))}
    </div>
  );
}

type Props = {
  searchParams: Promise<{ page?: string; status?: string }>;
};

export default async function AdminReviewsPage({ searchParams }: Props) {
  const cookieStore = await cookies();
  const locale: Locale = parseLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value);
  const m = messages[locale];

  const STATUS_TABS: { label: string; value: ReviewStatus | "ALL" }[] = [
    { label: m["admin.reviews.tabs.all"], value: "ALL" },
    { label: m["admin.reviews.tabs.pending"], value: ReviewStatus.PENDING },
    { label: m["admin.reviews.tabs.approved"], value: ReviewStatus.APPROVED },
    { label: m["admin.reviews.tabs.rejected"], value: ReviewStatus.REJECTED },
  ];

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const rawStatus = params.status?.toUpperCase();
  const status =
    rawStatus && rawStatus !== "ALL" ? (rawStatus as ReviewStatus) : undefined;

  const { reviews, total, totalPages, currentPage } = await getAdminReviews({
    page,
    status,
  });

  const baseUrl = status ? `/admin/reviews?status=${status}` : "/admin/reviews";

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-surface-card sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Star size={18} className="text-muted-foreground" />
          <h1 className="text-lg font-bold text-foreground">
            {m["admin.reviews.title"]}
          </h1>
          <span className="ml-2 text-xs font-medium bg-surface-section px-2 py-0.5 rounded-full text-muted-foreground">
            {total}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Status tabs */}
        <div className="flex gap-1 border-b border-border overflow-x-auto [scrollbar-width:none] pb-0">
          {STATUS_TABS.map(({ label, value }) => {
            const isActive = (value === "ALL" && !status) || value === (status ?? "ALL");
            const href =
              value === "ALL" ? "/admin/reviews" : `/admin/reviews?status=${value}`;
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
                    {m["admin.reviews.table.user"]}
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    {m["admin.reviews.table.product"]}
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    {m["admin.reviews.table.rating"]}
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    {m["admin.reviews.table.review"]}
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    {m["admin.reviews.table.status"]}
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    {m["admin.reviews.table.date"]}
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">
                    {m["admin.reviews.table.actions"]}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reviews.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-10 text-center text-muted-foreground"
                    >
                      {m["admin.reviews.noReviews"]}
                    </td>
                  </tr>
                ) : (
                  reviews.map((review) => (
                    <tr
                      key={review.id}
                      className="hover:bg-surface-section/50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <p className="font-medium text-foreground">{review.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          {review.userEmail}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <p
                          className="text-foreground max-w-[160px] truncate"
                          title={review.productName}
                        >
                          {review.productName}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <StarRating rating={review.rating} />
                      </td>
                      <td className="px-5 py-3">
                        <ReviewContentCell
                          productName={review.productName}
                          userName={review.userName}
                          content={review.content}
                          rating={review.rating}
                          verified={review.verifiedPurchase}
                          labels={{
                            view: m["admin.reviews.view"],
                            verified: m["admin.reviews.verifiedPurchase"],
                            close: m["common.close"] ?? "Close",
                          }}
                        />
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={review.status} type="review" />
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {new Intl.DateTimeFormat(locale, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }).format(new Date(review.createdAt))}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <ReviewActions
                          reviewId={review.id}
                          currentStatus={review.status}
                        />
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
