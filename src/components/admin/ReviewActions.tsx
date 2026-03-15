"use client";

import { useTransition } from "react";
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

  const handleApprove = () => {
    startTransition(() => updateReviewStatusAction(reviewId, ReviewStatus.APPROVED));
  };

  const handleReject = () => {
    startTransition(() => updateReviewStatusAction(reviewId, ReviewStatus.REJECTED));
  };

  if (currentStatus === "APPROVED") {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2 text-xs rounded-lg text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
        onClick={handleReject}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <XCircle size={12} />
        )}
        <span className="ml-1">Reject</span>
      </Button>
    );
  }

  if (currentStatus === "REJECTED") {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2 text-xs rounded-lg text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950"
        onClick={handleApprove}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <CheckCircle size={12} />
        )}
        <span className="ml-1">Approve</span>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2 text-xs rounded-lg text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950"
        onClick={handleApprove}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <CheckCircle size={12} />
        )}
        <span className="ml-1">Approve</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2 text-xs rounded-lg text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
        onClick={handleReject}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <XCircle size={12} />
        )}
        <span className="ml-1">Reject</span>
      </Button>
    </div>
  );
}
