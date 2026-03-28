"use client";

import { useShopProducts } from "@/hooks/use-products";
import ProductCard from "@/components/common/ProductCard";
import { useUiPreferences } from "@/lib/ui-preferences";
import { messages } from "@/lib/i18n/messages";
import { Locale } from "@/lib/i18n/locale";

type ShopProductGridProps = {
  filters: Parameters<typeof useShopProducts>[0];
  locale: Locale;
};

export default function ShopProductGrid({ filters, locale }: ShopProductGridProps) {
  const { data, isLoading } = useShopProducts(filters);
  const products = data?.products ?? [];

  if (isLoading) {
    return (
      <div className="w-full grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="aspect-[3/4] bg-surface-section rounded-[20px]" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="w-full py-10 text-center border border-border rounded-[20px]">
        <p className="text-muted-foreground text-sm sm:text-base">
          {messages[locale]["shop.noProducts"]}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
      {products.map((product) => (
        <ProductCard key={product.id} data={product} />
      ))}
    </div>
  );
}
