"use client";

import { useTransition, useMemo } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateReviewStatusAction } from "@/app/actions/admin";
import { ReviewStatus } from "@/generated/prisma/client";

type Props = {
  reviewId: string;
  currentStatus: string;
};

export default function ReviewActions({ reviewId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();

  const isApproved = currentStatus === "APPROVED";
  const nextStatus = isApproved ? ReviewStatus.REJECTED : ReviewStatus.APPROVED;
  const label = useMemo(() => (isApproved ? "Reject" : "Approve"), [isApproved]);
  const Icon = isApproved ? XCircle : CheckCircle;
  const color =
    isApproved
      ? "text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
      : "text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950";

  return (
    <Button
      variant="outline"
      size="sm"
      className={`h-7 px-2 text-xs rounded-lg ${color}`}
      onClick={() => startTransition(() => updateReviewStatusAction(reviewId, nextStatus))}
      disabled={isPending}
    >
      {isPending ? <Loader2 size={12} className="animate-spin" /> : <Icon size={12} />}
      <span className="ml-1">{label}</span>
    </Button>
  );
}
