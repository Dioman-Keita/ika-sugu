"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import ProductDetailsContent from "./ProductDetailsContent";
import { useUiPreferences } from "@/lib/ui-preferences";
import ReviewsContent from "./ReviewsContent";
import FaqContent from "./FaqContent";
import { Review } from "@/types/review.types";
import type { SpecItem } from "./ProductDetails";

type TabBtn = {
  id: number;
  label: string;
};

const Tabs = ({ reviews, specs }: { reviews: Review[]; specs?: SpecItem[] }) => {
  const [active, setActive] = useState<number>(1);
  const { t } = useUiPreferences();

  const tabBtnData: TabBtn[] = [
    {
      id: 1,
      label: t("product.tabs.details"),
    },
    {
      id: 2,
      label: t("product.tabs.reviews"),
    },
    {
      id: 3,
      label: t("product.tabs.faq"),
    },
  ];

  return (
    <div>
      <div className="flex items-center mb-6 sm:mb-8 overflow-x-auto">
        {tabBtnData.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            type="button"
            className={cn([
              active === tab.id
                ? "border-foreground border-b-2 font-medium"
                : "border-b border-border text-muted-foreground font-normal",
              "p-5 sm:p-6 rounded-none flex-1",
            ])}
            onClick={() => setActive(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>
      <div className="mb-12 sm:mb-16">
        {active === 1 && <ProductDetailsContent specs={specs} />}
        {active === 2 && <ReviewsContent reviews={reviews} />}
        {active === 3 && <FaqContent />}
      </div>
    </div>
  );
};

export default Tabs;
