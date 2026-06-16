"use client";

import CartCounter from "@/components/ui/CartCounter";
import { useState } from "react";
import AddToCartBtn from "./AddToCartBtn";
import { Product } from "@/types/product.types";

const AddToCardSection = ({
  data,
  selectedColor,
  selectedSize,
  selectedVariantId,
  maxQuantity,
}: {
  data: Product;
  selectedColor: string;
  selectedSize: string;
  selectedVariantId?: string;
  maxQuantity: number;
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const isOutOfStock = maxQuantity <= 0;

  return (
    <div className="fixed md:relative w-full bg-background border-t md:border-none border-border/50 bottom-0 left-0 p-4 md:p-0 z-10 flex items-center gap-3 sm:gap-5">
      <CartCounter
        key={`${selectedVariantId ?? "variant"}-${selectedColor}-${selectedSize}`}
        onAdd={setQuantity}
        onRemove={setQuantity}
        initialValue={1}
        maxValue={maxQuantity > 0 ? maxQuantity : undefined}
        disabled={isOutOfStock}
      />
      <AddToCartBtn
        data={{
          ...data,
          srcUrl: data.srcUrl,
          quantity: maxQuantity > 0 ? Math.min(quantity, maxQuantity) : 1,
          selectedColor,
          selectedSize,
          selectedVariantId,
          disabled: isOutOfStock,
        }}
      />
    </div>
  );
};

export default AddToCardSection;
