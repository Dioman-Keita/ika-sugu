"use client";

import { Button } from "@/components/ui/button";
import React from "react";
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

const ReviewsContent = ({ reviews }: { reviews: Review[] }) => {
  const { t } = useUiPreferences();

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
          >
            {t("product.reviews.writeReview")}
          </Button>
        </div>
      </div>
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
    </section>
  );
};

export default ReviewsContent;
