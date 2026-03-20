"use client";

import { useState } from "react";
import { Eye, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  productName: string;
  userName: string;
  content: string;
  rating: number;
  verified?: boolean;
  labels: {
    view: string;
    verified: string;
    close: string;
  };
};

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        size={14}
        className={cn(
          "transition-colors",
          s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30",
        )}
      />
    ))}
  </div>
);

export default function ReviewContentCell({
  productName,
  userName,
  content,
  rating,
  verified,
  labels,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border border-border text-foreground bg-surface-section hover:bg-surface-card transition-colors"
        aria-label={labels.view}
        title={labels.view}
      >
        <Eye size={14} />
        {labels.view}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-surface-card border border-border rounded-2xl shadow-xl text-left p-6 gap-5 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">
              {productName}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {userName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <StarRating rating={rating} />
            {verified && (
              <span className="text-xs font-medium text-green-600">
                ✓ {labels.verified}
              </span>
            )}
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
              {content}
            </p>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">
              {labels.close}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
