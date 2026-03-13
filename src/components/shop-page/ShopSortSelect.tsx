"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Locale, messages } from "@/lib/i18n/messages";
import { useShopQuery } from "@/components/shop-page/filters/useShopQuery";

export default function ShopSortSelect({ locale = "en" }: { locale?: Locale }) {
  const { searchParams, setParams } = useShopQuery();
  const current =
    searchParams.get("sort") ??
    "most-popular";

  return (
    <div className="flex items-center">
      {messages[locale]["shop.sortBy"]}
      <Select
        value={current}
        onValueChange={(value) => setParams({ sort: value })}
      >
        <SelectTrigger className="font-medium text-sm px-1.5 sm:text-base w-fit text-foreground bg-transparent shadow-none border-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="most-popular">{messages[locale]["shop.mostPopular"]}</SelectItem>
          <SelectItem value="low-price">{messages[locale]["shop.lowPrice"]}</SelectItem>
          <SelectItem value="high-price">{messages[locale]["shop.highPrice"]}</SelectItem>
          <SelectItem value="newest">{messages[locale]["nav.newArrivals"]}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

