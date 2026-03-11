"use client";

import React from "react";
import { useUiPreferences } from "@/lib/ui-preferences";

export type SpecItem = {
  labelKey: string;
  value: string;
};

const fallbackSpecs: SpecItem[] = [
  { labelKey: "product.specs.material", value: "100% Cotton" },
  { labelKey: "product.specs.care", value: "Machine wash warm, tumble dry" },
  { labelKey: "product.specs.fit", value: "Classic Fit" },
  { labelKey: "product.specs.pattern", value: "Solid" },
];

const ProductDetails = ({ specs }: { specs?: SpecItem[] }) => {
  const { t } = useUiPreferences();
  const data = specs && specs.length > 0 ? specs : fallbackSpecs;
  return (
    <>
      {data.map((item, i) => (
        <div className="grid grid-cols-3" key={i}>
          <div>
            <p className="text-sm py-3 w-full leading-7 lg:py-4 pr-2 text-muted-foreground">
              {t(item.labelKey)}
            </p>
          </div>
          <div className="col-span-2 py-3 lg:py-4 border-b">
            <p className="text-sm w-full leading-7 text-foreground font-medium">
              {item.value}
            </p>
          </div>
        </div>
      ))}
    </>
  );
};

export default ProductDetails;
