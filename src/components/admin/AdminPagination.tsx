import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  currentPage: number;
  totalPages: number;
  baseUrl: string; // e.g. "/admin/orders?status=PENDING"
};

export default function AdminPagination({ currentPage, totalPages, baseUrl }: Props) {
  if (totalPages <= 1) return null;

  const makeUrl = (page: number) => {
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}page=${page}`;
  };

  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("…");
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    )
      pages.push(i);
    if (currentPage < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  const btnBase =
    "h-8 min-w-[32px] flex items-center justify-center rounded-lg text-sm font-medium transition-colors px-2";

  return (
    <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
      <Link
        href={makeUrl(currentPage - 1)}
        aria-disabled={currentPage === 1}
        className={cn(
          btnBase,
          "gap-1 text-muted-foreground hover:text-foreground hover:bg-surface-section",
          currentPage === 1 && "pointer-events-none opacity-40",
        )}
      >
        <ChevronLeft size={14} />
        Prev
      </Link>

      <div className="flex items-center gap-1">
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">
              …
            </span>
          ) : (
            <Link
              key={p}
              href={makeUrl(p)}
              className={cn(
                btnBase,
                p === currentPage
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-section",
              )}
            >
              {p}
            </Link>
          ),
        )}
      </div>

      <Link
        href={makeUrl(currentPage + 1)}
        aria-disabled={currentPage === totalPages}
        className={cn(
          btnBase,
          "gap-1 text-muted-foreground hover:text-foreground hover:bg-surface-section",
          currentPage === totalPages && "pointer-events-none opacity-40",
        )}
      >
        Next
        <ChevronRight size={14} />
      </Link>
    </div>
  );
}
