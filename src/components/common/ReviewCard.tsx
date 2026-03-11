"use client";
import React from "react";
import Rating from "../ui/Rating";
import { IoEllipsisHorizontal } from "react-icons/io5";
import { Button } from "../ui/button";
import { IoIosCheckmarkCircle } from "react-icons/io";
import { Review } from "@/types/review.types";
import { cn } from "@/lib/utils";
import { useUiPreferences } from "@/lib/ui-preferences";

type ReviewCardProps = {
  blurChild?: React.ReactNode;
  isAction?: boolean;
  isDate?: boolean;
  data: Review;
  className?: string;
};

const ReviewCard = ({
  blurChild,
  isAction = false,
  isDate = false,
  data,
  className,
}: ReviewCardProps) => {
  const { t } = useUiPreferences();

  return (
    <div
      className={cn([
        "relative bg-surface-card flex flex-col items-start aspect-auto border border-border rounded-[20px] p-6 sm:px-8 sm:py-7 overflow-hidden",
        className,
      ])}
    >
      {blurChild && blurChild}
      <div className="w-full flex items-center justify-between mb-3 sm:mb-4">
        <Rating
          initialValue={data.rating}
          allowFraction
          SVGclassName="inline-block"
          size={23}
          readonly
        />
        {isAction && (
          <Button variant="ghost" size="icon">
            <IoEllipsisHorizontal className="text-foreground/40 text-2xl" />
          </Button>
        )}
      </div>
      <div className="flex items-center mb-2 sm:mb-3">
        <strong className="text-foreground sm:text-xl mr-1">{data.user}</strong>
        <IoIosCheckmarkCircle className="text-[#01AB31] text-xl sm:text-2xl" />
      </div>
      <p className="text-sm sm:text-base text-muted-foreground">{data.content}</p>
      {isDate && (
        <p className="text-muted-foreground text-sm font-medium mt-4 sm:mt-6">
          {t("product.reviews.postedOn")} {data.date}
        </p>
      )}
    </div>
  );
};

export default ReviewCard;
