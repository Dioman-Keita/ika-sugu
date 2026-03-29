"use client";

import React, { useMemo, useOptimistic, useTransition } from "react";
import PhotoSection from "./PhotoSection";
import { Product } from "@/types/product.types";
import { integralCF } from "@/styles/fonts";
import { cn } from "@/lib/utils";
import Rating from "@/components/ui/Rating";
import ColorSelection from "./ColorSelection";
import SizeSelection from "./SizeSelection";
import AddToCardSection from "./AddToCardSection";
import { useUiPreferences } from "@/lib/ui-preferences";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const Header = ({ data }: { data: Product }) => {
  const { t } = useUiPreferences();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Active variants available
  const activeVariants = useMemo(
    () => data.variants.filter((variant) => variant.isActive),
    [data.variants],
  );

  // Derive Color Options
  const colorOptions = useMemo(() => {
    const map = new Map<string, { name: string; hex?: string | null; stock: number }>();

    activeVariants.forEach((variant) => {
      const existing = map.get(variant.colorName);
      if (!existing) {
        map.set(variant.colorName, {
          name: variant.colorName,
          hex: variant.colorHex,
          stock: Math.max(0, variant.stock),
        });
        return;
      }

      map.set(variant.colorName, {
        ...existing,
        stock: existing.stock + Math.max(0, variant.stock),
        hex: existing.hex ?? variant.colorHex,
      });
    });

    return Array.from(map.values()).map((entry) => ({
      name: entry.name,
      hex: entry.hex,
      isAvailable: entry.stock > 0,
    }));
  }, [activeVariants]);

  const defaultColor =
    colorOptions.find((color) => color.isAvailable)?.name ?? colorOptions[0]?.name ?? "";

  const urlColor = searchParams.get("color") ?? defaultColor;
  const initialResolvedColor =
    urlColor && colorOptions.some((color) => color.name === urlColor)
      ? urlColor
      : defaultColor;

  // React 19: useOptimistic for instant UI switching while URL updates
  const [optimisticColor, setOptimisticColor] = useOptimistic(initialResolvedColor);

  // Derive Size Options based on optimistically selected color
  const sizeOptions = useMemo(() => {
    const map = new Map<string, number>();
    activeVariants
      .filter((variant) => variant.colorName === optimisticColor)
      .forEach((variant) => {
        map.set(variant.size, (map.get(variant.size) ?? 0) + Math.max(0, variant.stock));
      });

    return Array.from(map.entries()).map(([name, stock]) => ({
      name,
      stock,
      isAvailable: stock > 0,
    }));
  }, [activeVariants, optimisticColor]);

  const fallbackSize =
    sizeOptions.find((size) => size.isAvailable)?.name ?? sizeOptions[0]?.name ?? "";

  const urlSize = searchParams.get("size") ?? fallbackSize;
  const initialResolvedSize =
    urlSize && sizeOptions.some((size) => size.name === urlSize) ? urlSize : fallbackSize;

  const [optimisticSize, setOptimisticSize] = useOptimistic(initialResolvedSize);
  const [, startTransition] = useTransition();

  const selectedVariant = useMemo(
    () =>
      activeVariants.find(
        (variant) =>
          variant.colorName === optimisticColor && variant.size === optimisticSize,
      ) ??
      activeVariants.find((variant) => variant.colorName === optimisticColor) ??
      activeVariants[0],
    [activeVariants, optimisticColor, optimisticSize],
  );

  const photos =
    selectedVariant?.images && selectedVariant.images.length > 0
      ? selectedVariant.images
      : data.gallery && data.gallery.length > 0
        ? data.gallery
        : [data.srcUrl];
  const selectedVariantStock = selectedVariant?.stock ?? 0;
  const selectedVariantPrice = selectedVariant?.price ?? data.finalPrice;
  const selectedVariantCompareAtPrice = selectedVariant?.compareAtPrice ?? null;
  const selectedVariantDiscountPercentage =
    selectedVariantCompareAtPrice &&
    selectedVariantCompareAtPrice > 0 &&
    selectedVariantCompareAtPrice > selectedVariantPrice
      ? Math.round(
          ((selectedVariantCompareAtPrice - selectedVariantPrice) /
            selectedVariantCompareAtPrice) *
            100,
        )
      : 0;

  const handleSizeSelect = (size: string) => {
    startTransition(() => {
      setOptimisticSize(size);
      const params = new URLSearchParams(searchParams.toString());
      params.set("size", size);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const handleColorSelect = (colorName: string) => {
    startTransition(() => {
      setOptimisticColor(colorName);

      const nextSize =
        activeVariants.find((v) => v.colorName === colorName && v.stock > 0)?.size ??
        activeVariants.find((v) => v.colorName === colorName)?.size;

      if (nextSize) {
        setOptimisticSize(nextSize);
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set("color", colorName);
      if (nextSize) params.set("size", nextSize);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <PhotoSection
            key={`${selectedVariant?.id ?? data.id}-photos`}
            data={data}
            photos={photos}
          />
        </div>
        <div>
          <h1
            className={cn([
              integralCF.className,
              "text-2xl md:text-[40px] md:leading-[40px] mb-3 md:mb-3.5 capitalize",
            ])}
          >
            {data.title}
          </h1>
          <div className="flex items-center mb-3 sm:mb-3.5">
            <Rating
              initialValue={data.rating}
              allowFraction
              SVGclassName="inline-block"
              emptyClassName="fill-foreground/10"
              size={25}
              readonly
            />
            <span className="text-foreground text-xs sm:text-sm ml-[11px] sm:ml-[13px] pb-0.5 sm:pb-0">
              {data.rating.toFixed(1)}
              <span className="text-foreground/60">/5</span>
            </span>
          </div>
          <div className="flex items-center space-x-2.5 sm:space-x-3 mb-5">
            <span className="font-bold text-foreground text-2xl sm:text-[32px]">
              ${selectedVariantPrice}
            </span>
            {selectedVariantDiscountPercentage > 0 &&
              selectedVariantCompareAtPrice !== null && (
                <span className="font-bold text-foreground/40 line-through text-2xl sm:text-[32px]">
                  ${selectedVariantCompareAtPrice}
                </span>
              )}
            {selectedVariantDiscountPercentage > 0 && (
              <span className="font-medium text-[10px] sm:text-xs py-1.5 px-3.5 rounded-full bg-[#FF3333]/10 text-[#FF3333]">
                {`-${selectedVariantDiscountPercentage}%`}
              </span>
            )}
          </div>
          <p className="text-sm sm:text-base text-muted-foreground mb-5">
            {data.description}
          </p>
          <hr className="h-px border-t-border mb-5" />
          <ColorSelection
            colors={colorOptions}
            selectedColor={optimisticColor}
            onSelect={handleColorSelect}
          />
          <hr className="h-px border-t-border my-5" />
          <SizeSelection
            sizes={sizeOptions}
            selectedSize={optimisticSize}
            onSelect={handleSizeSelect}
          />
          {selectedVariantStock <= 0 && (
            <p className="text-sm text-[#FF3333] mt-3">
              {t("product.variantOutOfStock")}
            </p>
          )}
          <hr className="hidden md:block h-px border-t-border my-5" />
          <AddToCardSection
            key={`${selectedVariant?.id ?? data.id}-cart`}
            data={{
              ...data,
              srcUrl: photos[0] ?? data.srcUrl,
              basePrice:
                selectedVariantCompareAtPrice && selectedVariantCompareAtPrice > 0
                  ? selectedVariantCompareAtPrice
                  : selectedVariantPrice,
              finalPrice: selectedVariantPrice,
              discountPercentage: selectedVariantDiscountPercentage,
            }}
            selectedColor={optimisticColor}
            selectedSize={optimisticSize}
            selectedVariantId={selectedVariant?.id}
            maxQuantity={selectedVariantStock}
          />
        </div>
      </div>
    </>
  );
};

export default Header;
