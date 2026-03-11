"use client";

import React from "react";
import ProductDetails from "./ProductDetails";
import { useUiPreferences } from "@/lib/ui-preferences";
import type { SpecItem } from "./ProductDetails";

const ProductDetailsContent = ({ specs }: { specs?: SpecItem[] }) => {
  const { t } = useUiPreferences();
  return (
    <section>
      <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-5 sm:mb-6">
        {t("product.specsTitle")}
      </h3>
      <ProductDetails specs={specs} />
    </section>
  );
};

export default ProductDetailsContent;
