"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useUiPreferences } from "@/lib/ui-preferences";
import { translateAttribute } from "@/lib/i18n/messages";
import { useShopQuery } from "./useShopQuery";

const SizeSection = () => {
  const { t, locale } = useUiPreferences();
  const { searchParams, setParams } = useShopQuery();
  const selectedSize = searchParams.get("size");

  const sizes = [
    "XX-Small",
    "X-Small",
    "Small",
    "Medium",
    "Large",
    "X-Large",
    "XX-Large",
    "3X-Large",
    "4X-Large",
  ];

  return (
    <Accordion type="single" collapsible defaultValue="filter-size">
      <AccordionItem value="filter-size" className="border-none">
        <AccordionTrigger className="text-foreground font-bold text-xl hover:no-underline p-0 py-0.5">
          {t("cart.size").replace(":", "")}
        </AccordionTrigger>
        <AccordionContent className="pt-4 pb-0">
          <div className="flex items-center flex-wrap">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                className={cn([
                  "bg-surface-section text-foreground m-1 flex items-center justify-center px-5 py-2.5 text-sm rounded-full max-h-9.75",
                  selectedSize === size && "bg-foreground text-background font-medium",
                ])}
                onClick={() => setParams({ size: selectedSize === size ? null : size })}
              >
                {translateAttribute(size, locale)}
              </button>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default SizeSection;
