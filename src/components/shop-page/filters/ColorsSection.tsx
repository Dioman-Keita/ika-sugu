"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { IoMdCheckmark } from "react-icons/io";
import { cn } from "@/lib/utils";
import { useUiPreferences } from "@/lib/ui-preferences";
import { translateAttribute } from "@/lib/i18n/messages";
import { useShopQuery } from "./useShopQuery";

const ColorsSection = () => {
  const { t, locale } = useUiPreferences();
  const { searchParams, setParams } = useShopQuery();
  const selectedColor = searchParams.get("color");

  const colors: Array<{ name: string; hex: string }> = [
    { name: "Green", hex: "#16A34A" },
    { name: "Red", hex: "#DC2626" },
    { name: "Yellow", hex: "#FACC15" },
    { name: "Orange", hex: "#EA580C" },
    { name: "Cyan", hex: "#22D3EE" },
    { name: "Blue", hex: "#2563EB" },
    { name: "Purple", hex: "#9333EA" },
    { name: "Pink", hex: "#DB2777" },
    { name: "White", hex: "#F5F5F5" },
    { name: "Black", hex: "#1F1F1F" },
  ];

  return (
    <Accordion type="single" collapsible defaultValue="filter-colors">
      <AccordionItem value="filter-colors" className="border-none">
        <AccordionTrigger className="text-foreground font-bold text-xl hover:no-underline p-0 py-0.5">
          {t("cart.color").replace(":", "")}
        </AccordionTrigger>
        <AccordionContent className="pt-4 pb-0">
          <div className="flex space-2.5 flex-wrap md:grid grid-cols-5 gap-2.5">
            {colors.map((color) => (
              <button
                key={color.name}
                type="button"
                className={cn([
                  "rounded-full w-9 sm:w-10 h-9 sm:h-10 flex items-center justify-center border border-border",
                ])}
                style={{ backgroundColor: color.hex }}
                onClick={() =>
                  setParams({ color: selectedColor === color.name ? null : color.name })
                }
                title={translateAttribute(color.name, locale)}
              >
                {selectedColor === color.name && (
                  <IoMdCheckmark className="text-base text-white" />
                )}
              </button>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default ColorsSection;
