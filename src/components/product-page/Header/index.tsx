"use client";

import React, { useMemo, useState } from "react";
import PhotoSection from "./PhotoSection";
import { Product } from "@/types/product.types";
import { integralCF } from "@/styles/fonts";
import { cn } from "@/lib/utils";
import Rating from "@/components/ui/Rating";
import ColorSelection from "./ColorSelection";
import SizeSelection from "./SizeSelection";
import AddToCardSection from "./AddToCardSection";

const Header = ({ data }: { data: Product }) => {
  const activeVariants = useMemo(
    () => data.variants.filter((variant) => variant.isActive),
    [data.variants]
  );

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

  const defaultColor = colorOptions.find((color) => color.isAvailable)?.name ?? colorOptions[0]?.name ?? "";
  const [selectedColor, setSelectedColor] = useState(defaultColor);
  const resolvedColor =
    selectedColor && colorOptions.some((color) => color.name === selectedColor)
      ? selectedColor
      : defaultColor;

  const sizeOptions = useMemo(() => {
    const map = new Map<string, number>();
    activeVariants
      .filter((variant) => variant.colorName === resolvedColor)
      .forEach((variant) => {
        map.set(variant.size, (map.get(variant.size) ?? 0) + Math.max(0, variant.stock));
      });

    return Array.from(map.entries()).map(([name, stock]) => ({
      name,
      stock,
      isAvailable: stock > 0,
    }));
  }, [activeVariants, resolvedColor]);

  const fallbackSize = sizeOptions.find((size) => size.isAvailable)?.name ?? sizeOptions[0]?.name ?? "";
  const [selectedSize, setSelectedSize] = useState(fallbackSize);
  const resolvedSize =
    selectedSize && sizeOptions.some((size) => size.name === selectedSize)
      ? selectedSize
      : fallbackSize;

  const selectedVariant = useMemo(
    () =>
      activeVariants.find(
        (variant) =>
          variant.colorName === resolvedColor && variant.size === resolvedSize
      ) ??
      activeVariants.find((variant) => variant.colorName === resolvedColor) ??
      activeVariants[0],
    [activeVariants, resolvedColor, resolvedSize]
  );

  const photos =
    selectedVariant?.images && selectedVariant.images.length > 0
      ? selectedVariant.images
      : data.gallery && data.gallery.length > 0
        ? data.gallery
        : [data.srcUrl];
  const selectedVariantStock = selectedVariant?.stock ?? 0;

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
              emptyClassName="fill-gray-50"
              size={25}
              readonly
            />
            <span className="text-black text-xs sm:text-sm ml-[11px] sm:ml-[13px] pb-0.5 sm:pb-0">
              {data.rating.toFixed(1)}
              <span className="text-black/60">/5</span>
            </span>
          </div>
          <div className="flex items-center space-x-2.5 sm:space-x-3 mb-5">
            <span className="font-bold text-black text-2xl sm:text-[32px]">
              ${data.finalPrice}
            </span>
            {data.discountPercentage > 0 && (
              <span className="font-bold text-black/40 line-through text-2xl sm:text-[32px]">
                ${data.basePrice}
              </span>
            )}
            {data.discountPercentage > 0 && (
              <span className="font-medium text-[10px] sm:text-xs py-1.5 px-3.5 rounded-full bg-[#FF3333]/10 text-[#FF3333]">
                {`-${data.discountPercentage}%`}
              </span>
            )}
          </div>
          <p className="text-sm sm:text-base text-black/60 mb-5">
            This graphic t-shirt which is perfect for any occasion. Crafted from
            a soft and breathable fabric, it offers superior comfort and style.
          </p>
          <hr className="h-[1px] border-t-black/10 mb-5" />
          <ColorSelection
            colors={colorOptions}
            selectedColor={resolvedColor}
            onSelect={(colorName) => {
              setSelectedColor(colorName);
              const nextSize =
                activeVariants.find(
                  (variant) =>
                    variant.colorName === colorName && variant.stock > 0
                )?.size ??
                activeVariants.find(
                  (variant) => variant.colorName === colorName
                )?.size;
              if (nextSize) setSelectedSize(nextSize);
            }}
          />
          <hr className="h-[1px] border-t-black/10 my-5" />
          <SizeSelection
            sizes={sizeOptions}
            selectedSize={resolvedSize}
            onSelect={setSelectedSize}
          />
          {selectedVariantStock <= 0 && (
            <p className="text-sm text-[#FF3333] mt-3">
              This variant is currently out of stock.
            </p>
          )}
          <hr className="hidden md:block h-[1px] border-t-black/10 my-5" />
          <AddToCardSection
            key={`${selectedVariant?.id ?? data.id}-cart`}
            data={{
              ...data,
              srcUrl: photos[0] ?? data.srcUrl,
            }}
            selectedColor={resolvedColor}
            selectedSize={resolvedSize}
            selectedVariantId={selectedVariant?.id}
            maxQuantity={selectedVariantStock}
          />
        </div>
      </div>
    </>
  );
};

export default Header;
