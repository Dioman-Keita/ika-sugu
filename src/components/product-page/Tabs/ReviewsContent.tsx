"use client";

import { Button } from "@/components/ui/button";
import React, { useMemo, useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ReviewCard from "@/components/common/ReviewCard";
import { Review } from "@/types/review.types";
import Link from "next/link";
import { useUiPreferences } from "@/lib/ui-preferences";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Rating from "@/components/ui/Rating";
import { Label } from "@/components/ui/label";
import { createProductReviewAction } from "@/app/actions/reviews";
import { authClient } from "@/lib/auth-client";
import { ReviewSubmissionErrorCode } from "@/lib/errors/review-errors";
import { REVIEW_MAX_CHARACTERS, REVIEW_MIN_CHARACTERS } from "@/lib/review-config";

const ReviewsContent = ({ reviews, productId }: { reviews: Review[]; productId: string }) => {
  const { t } = useUiPreferences();
  const { data: session, isPending: isSessionPending } = authClient.useSession();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [didSubmit, setDidSubmit] = useState(false);
  const [isSubmitting, startTransition] = useTransition();

  const canSubmit = useMemo(() => {
    if (!session?.user?.id) return false;
    if (isSubmitting) return false;
    return content.trim().length >= REVIEW_MIN_CHARACTERS && rating >= 1 && rating <= 5;
  }, [content, isSubmitting, rating, session?.user?.id]);

  const submitReview = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await createProductReviewAction({
          productId,
          rating,
          content,
        });
        if (!result.ok) {
          switch (result.errorCode) {
            case ReviewSubmissionErrorCode.Unauthorized:
              setError(t("product.reviews.error.unauthorized"));
              break;
            case ReviewSubmissionErrorCode.DuplicateReview:
              setError(t("product.reviews.error.duplicate"));
              break;
            case ReviewSubmissionErrorCode.ReviewTooShort:
              setError(t("product.reviews.error.tooShort"));
              break;
            default:
              setError(t("product.reviews.error.generic"));
          }
          return;
        }

        setDidSubmit(true);
        setIsDialogOpen(false);
        setContent("");
        setRating(5);
      } catch {
        setError(t("product.reviews.error.generic"));
      }
    });
  };

  return (
    <section>
      <div className="flex items-center justify-between flex-col sm:flex-row mb-5 sm:mb-6">
        <div className="flex items-center mb-4 sm:mb-0">
          <h3 className="text-xl sm:text-2xl font-bold text-foreground mr-2">
            {t("product.reviews.allReviews")}
          </h3>
          <span className="text-sm sm:text-base text-muted-foreground">
            ({reviews.length})
          </span>
        </div>
        <div className="flex items-center space-x-2.5">
          <Select defaultValue="latest">
            <SelectTrigger className="min-w-[120px] font-medium text-xs sm:text-base px-4 py-3 sm:px-5 sm:py-4 text-foreground bg-muted border-none rounded-full h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">{t("product.reviews.sort.latest")}</SelectItem>
              <SelectItem value="most-relevant">
                {t("product.reviews.sort.mostRelevant")}
              </SelectItem>
              <SelectItem value="oldest">{t("product.reviews.sort.oldest")}</SelectItem>
            </SelectContent>
          </Select>

          <Button
            type="button"
            className="sm:min-w-[166px] px-4 py-3 sm:px-5 sm:py-4 rounded-full bg-foreground text-background font-medium text-xs sm:text-base h-12"
            onClick={() => {
              setDidSubmit(false);
              setError(null);
              setIsDialogOpen(true);
            }}
          >
            {t("product.reviews.writeReview")}
          </Button>
        </div>
      </div>
      {didSubmit && (
        <div className="w-full mb-5 rounded-[20px] border border-border bg-muted px-4 py-3 text-sm sm:text-base text-foreground">
          {t("product.reviews.submitted")}
        </div>
      )}
      {reviews.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5 sm:mb-9">
            {reviews.map((review) => (
              <ReviewCard key={review.id} data={review} isAction isDate />
            ))}
          </div>
          <div className="w-full px-4 sm:px-0 text-center">
            <Link
              href="#"
              className="inline-block w-[230px] px-11 py-4 border rounded-full hover:bg-foreground hover:text-background text-foreground transition-all font-medium text-sm sm:text-base border-border"
            >
              {t("product.reviews.loadMore")}
            </Link>
          </div>
        </>
      ) : (
        <div className="w-full py-10 text-center border border-border rounded-[20px]">
          <p className="text-muted-foreground text-sm sm:text-base">
            {t("product.reviews.empty")}
          </p>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("product.reviews.dialog.title")}</DialogTitle>
            <DialogDescription>{t("product.reviews.dialog.description")}</DialogDescription>
          </DialogHeader>

          {!isSessionPending && !session?.user?.id ? (
            <div className="text-sm text-muted-foreground">
              {t("product.reviews.dialog.loginRequired")}{" "}
              <Link href="/login" className="underline text-foreground">
                {t("product.reviews.dialog.loginCta")}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">{t("product.reviews.form.rating")}</Label>
                <div className="flex items-center gap-3">
                  <Rating
                    initialValue={rating}
                    onClick={(value) => setRating(Math.max(1, Math.min(5, Math.round(value))))}
                    allowFraction={false}
                    size={28}
                    SVGclassName="inline-block"
                  />
                  <span className="text-sm text-muted-foreground">{rating}/5</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="review-content" className="text-sm">
                  {t("product.reviews.form.comment")}
                </Label>
                <textarea
                  id="review-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t("product.reviews.form.commentPlaceholder")}
                  className="min-h-28 w-full rounded-[14px] border border-border bg-background px-4 py-3 text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
                <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                  <span>{t("product.reviews.form.minChars")}</span>
                  <span>
                    {Math.min(content.trim().length, REVIEW_MAX_CHARACTERS)}/{REVIEW_MAX_CHARACTERS}
                  </span>
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            >
              {t("product.reviews.dialog.cancel")}
            </Button>
            <Button
              type="button"
              onClick={submitReview}
              disabled={!canSubmit}
              className="bg-foreground text-background"
            >
              {isSubmitting ? t("product.reviews.dialog.submitting") : t("product.reviews.dialog.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default ReviewsContent;
