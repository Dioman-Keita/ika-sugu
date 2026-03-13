"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { useUiPreferences } from "@/lib/ui-preferences";
import { useShopQuery } from "./useShopQuery";

const PriceSection = () => {
  const { t } = useUiPreferences();
  const { searchParams, setParams } = useShopQuery();

  const min = 0;
  const max = 250;
  const fallback: [number, number] = [50, 200];

  const minPriceRaw = searchParams.get("minPrice");
  const maxPriceRaw = searchParams.get("maxPrice");
  const minPriceParam =
    typeof minPriceRaw === "string" && minPriceRaw.trim() !== ""
      ? Number(minPriceRaw)
      : Number.NaN;
  const maxPriceParam =
    typeof maxPriceRaw === "string" && maxPriceRaw.trim() !== ""
      ? Number(maxPriceRaw)
      : Number.NaN;

  const defaultValue: [number, number] =
    Number.isFinite(minPriceParam) && Number.isFinite(maxPriceParam)
      ? [
          Math.max(min, Math.min(max, Math.floor(minPriceParam))),
          Math.max(min, Math.min(max, Math.floor(maxPriceParam))),
        ]
      : fallback;

  return (
    <Accordion type="single" collapsible defaultValue="filter-price">
      <AccordionItem value="filter-price" className="border-none">
        <AccordionTrigger className="text-foreground font-bold text-xl hover:no-underline p-0 py-0.5">
          {t("shop.price")}
        </AccordionTrigger>
        <AccordionContent className="pt-4" contentClassName="overflow-visible">
          <Slider
            defaultValue={defaultValue}
            min={min}
            max={max}
            step={1}
            label="$"
            onValueCommit={(values) =>
              setParams({ minPrice: String(values[0]), maxPrice: String(values[1]) })
            }
          />
          <div className="mb-3" />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default PriceSection;
