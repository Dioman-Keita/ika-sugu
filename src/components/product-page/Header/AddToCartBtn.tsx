"use client";

import { useAddToCartMutation } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";
import { Product } from "@/types/product.types";
import { useUiPreferences } from "@/lib/ui-preferences";

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
  const { mutate, isPending } = useAddToCartMutation();
  const { t } = useUiPreferences();
  const isDisabled = Boolean(data.disabled) || isPending;

  const handleAddToCart = () => {
    if (!data.selectedVariantId) return;

    mutate({
      variantId: data.selectedVariantId,
      quantity: data.quantity,
    });
  };

  return (
    <button
      type="button"
      disabled={isDisabled}
      className={cn(
        "bg-foreground text-background w-full ml-3 sm:ml-5 rounded-full h-11 md:h-[52px] text-sm sm:text-base hover:bg-foreground/80 transition-all flex items-center justify-center",
        isDisabled && "bg-foreground/40 cursor-not-allowed hover:bg-foreground/40",
      )}
      onClick={handleAddToCart}
    >
      {isPending ? (
        <span className="flex items-center gap-2">
          {t("product.addingToCart")}...
        </span>
      ) : isDisabled ? (
        t("product.outOfStock")
      ) : (
        t("product.addToCart")
      )}
    </button>
  );
};

export default AddToCartBtn;
