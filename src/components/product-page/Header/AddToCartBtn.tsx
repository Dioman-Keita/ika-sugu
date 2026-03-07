"use client";

import { addToCart } from "@/lib/features/carts/cartsSlice";
import { useAppDispatch } from "@/lib/hooks/redux";
import { cn } from "@/lib/utils";
import { Product } from "@/types/product.types";
import React from "react";

const AddToCartBtn = ({
  data,
}: {
  data: Product & {
    quantity: number;
    selectedColor: string;
    selectedSize: string;
    selectedVariantId?: string;
    disabled?: boolean;
  };
}) => {
  const dispatch = useAppDispatch();
  const isDisabled = Boolean(data.disabled);

  return (
    <button
      type="button"
      disabled={isDisabled}
      className={cn(
        "bg-black w-full ml-3 sm:ml-5 rounded-full h-11 md:h-[52px] text-sm sm:text-base text-white hover:bg-black/80 transition-all",
        isDisabled && "bg-black/40 cursor-not-allowed hover:bg-black/40"
      )}
      onClick={() =>
        dispatch(
          addToCart({
            id: data.id,
            slug: data.slug,
            variantId: data.selectedVariantId,
            name: data.title,
            srcUrl: data.srcUrl,
            basePrice: data.basePrice,
            finalPrice: data.finalPrice,
            attributes: [data.selectedSize, data.selectedColor],
            discountPercentage: data.discountPercentage,
            quantity: data.quantity,
          })
        )
      }
    >
      {isDisabled ? "Out of Stock" : "Add to Cart"}
    </button>
  );
};

export default AddToCartBtn;
