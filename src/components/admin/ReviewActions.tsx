"use client";

import { useMemo } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReviewStatus } from "@/generated/prisma/client";
import { useUpdateReviewStatusMutation } from "@/hooks/use-admin";
import { useUiPreferences } from "@/lib/ui-preferences";

type Props = {
  reviewId: string;
  currentStatus: string;
};

export default function ReviewActions({ reviewId, currentStatus }: Props) {
  const { mutate: updateStatus, isPending } = useUpdateReviewStatusMutation();
  const { t } = useUiPreferences();

  const isApproved = currentStatus === "APPROVED";
  const nextStatus = isApproved ? ReviewStatus.REJECTED : ReviewStatus.APPROVED;
  const label = useMemo(
    () =>
      isApproved ? t("admin.reviews.action.reject") : t("admin.reviews.action.approve"),
    [isApproved, t],
  );
  const Icon = isApproved ? XCircle : CheckCircle;
  const color = isApproved
    ? "text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
    : "text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950";

  return (
    <Button
      variant="outline"
      size="sm"
      className={`h-7 px-2 text-xs rounded-lg ${color}`}
      onClick={() => updateStatus({ id: reviewId, status: nextStatus })}
      disabled={isPending}
    >
      {isPending ? <Loader2 size={12} className="animate-spin" /> : <Icon size={12} />}
      <span className="ml-1">{label}</span>
    </Button>
  );
}
