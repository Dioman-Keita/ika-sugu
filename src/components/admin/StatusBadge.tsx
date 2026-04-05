"use client";

import { cn } from "@/lib/utils";
import { ProductStatus } from "@/generated/prisma/client";
import { useUiPreferences } from "@/lib/ui-preferences";

const orderStatusStyles: Record<string, string> = {
  PENDING:
    "bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:text-amber-400",
  PAID: "bg-blue-500/10 text-blue-600 border border-blue-500/20",
  SHIPPED: "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20",
  DELIVERED: "bg-green-500/10 text-green-600 border border-green-500/20",
  CANCELED: "bg-red-500/10 text-red-500 border border-red-500/20",
};

const reviewStatusStyles: Record<string, string> = {
  PENDING:
    "bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:text-amber-400",
  APPROVED: "bg-green-500/10 text-green-600 border border-green-500/20",
  REJECTED: "bg-red-500/10 text-red-500 border border-red-500/20",
};

const productStatusStyles: Record<string, string> = {
  [ProductStatus.DRAFT]:
    "bg-slate-500/10 text-slate-600 border border-slate-500/20 dark:text-slate-300",
  [ProductStatus.PUBLISHED]: "bg-green-500/10 text-green-600 border border-green-500/20",
  [ProductStatus.ARCHIVED]:
    "bg-zinc-500/10 text-zinc-600 border border-zinc-500/20 dark:text-zinc-300",
};

type Props = {
  status: string;
  type?: "order" | "review" | "product";
  className?: string;
};

export default function StatusBadge({ status, type = "order", className }: Props) {
  const { t } = useUiPreferences();
  const styles =
    type === "review"
      ? reviewStatusStyles
      : type === "product"
        ? productStatusStyles
        : orderStatusStyles;

  const labelKey =
    type === "review"
      ? `admin.reviews.tabs.${status.toLowerCase()}`
      : type === "product"
        ? `admin.product.status.${status.toLowerCase()}`
        : `admin.orders.tabs.${status.toLowerCase()}`;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold",
        styles[status] ?? "bg-muted text-muted-foreground border border-border",
        className,
      )}
    >
      {t(labelKey) ?? (status.charAt(0) + status.slice(1).toLowerCase())}
    </span>
  );
}
