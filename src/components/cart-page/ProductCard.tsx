"use client";

import { useTransition } from "react";
import { PiTrashFill } from "react-icons/pi";
import Image from "next/image";
import Link from "next/link";
import CartCounter from "@/components/ui/CartCounter";
import { Button } from "../ui/button";
import { useUiPreferences } from "@/lib/ui-preferences";
import { translateAttribute } from "@/lib/i18n/messages";
import { removeFromCartAction, updateCartQuantityAction } from "@/app/actions/cart";
import { cn } from "@/lib/utils";

type ProductCardProps = {
  data: {
    id: string; // CartItem ID
    quantity: number;
    variantId: string;
    variant: {
      id: string;
      colorName: string;
      size: string;
      images: string[];
      price: { toNumber: () => number };
      compareAtPrice: { toNumber: () => number } | null;
      product: {
        id: string;
        slug: string;
        name: string;
        translations: Array<{ locale: string; name: string }>;
      };
    };
  };
};

const ProductCard = ({ data }: ProductCardProps) => {
  const [isPending, startTransition] = useTransition();
  const { t, locale } = useUiPreferences();

  const productTranslation = data.variant.product.translations.find(
    (tr) => tr.locale === locale,
  );
  const productName = productTranslation?.name ?? data.variant.product.name;
  const productSlug = data.variant.product.slug;

  const finalPrice = data.variant.price.toNumber();
  const basePrice = data.variant.compareAtPrice?.toNumber() ?? finalPrice;
  const discountPercentage =
    basePrice > finalPrice ? Math.round(((basePrice - finalPrice) / basePrice) * 100) : 0;

  const handleRemove = () => {
    startTransition(async () => {
      await removeFromCartAction(data.id);
    });
  };

  const handleUpdateQuantity = (newQty: number) => {
    startTransition(async () => {
      await updateCartQuantityAction(data.id, newQty);
    });
  };

  return (
    <div
      className={cn(
        "flex items-start space-x-4 transition-opacity",
        isPending && "opacity-50 pointer-events-none",
      )}
    >
      <Link
        href={`/shop/product/${data.variant.product.id}/${productSlug}`}
        className="bg-surface-product rounded-lg w-full min-w-[100px] max-w-[100px] sm:max-w-[124px] aspect-square overflow-hidden"
      >
        <Image
          src={data.variant.images[0] ?? "/images/pic1.png"}
          width={124}
          height={124}
          className="rounded-md w-full h-full object-cover hover:scale-110 transition-all duration-500"
          alt={productName}
          priority
        />
      </Link>
      <div className="flex w-full self-stretch flex-col">
        <div className="flex items-center justify-between">
          <Link
            href={`/shop/product/${data.variant.product.id}/${productSlug}`}
            className="text-foreground font-bold text-base xl:text-xl"
          >
            {productName}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 md:h-9 md:w-9"
            onClick={handleRemove}
            disabled={isPending}
          >
            <PiTrashFill className="text-xl md:text-2xl text-red-500" />
          </Button>
        </div>
        <div className="-mt-1">
          <span className="text-foreground text-xs md:text-sm mr-1">
            {t("cart.size")}
          </span>
          <span className="text-muted-foreground text-xs md:text-sm">
            {translateAttribute(data.variant.size, locale)}
          </span>
        </div>
        <div className="mb-auto -mt-1.5">
          <span className="text-foreground text-xs md:text-sm mr-1">
            {t("cart.color")}
          </span>
          <span className="text-muted-foreground text-xs md:text-sm">
            {translateAttribute(data.variant.colorName, locale)}
          </span>
        </div>
        <div className="flex items-center flex-wrap justify-between">
          <div className="flex items-center space-x-[5px] xl:space-x-2.5">
            <span className="font-bold text-foreground text-xl xl:text-2xl">
              ${finalPrice}
            </span>
            {discountPercentage > 0 && (
              <span className="font-bold text-foreground/40 line-through text-xl xl:text-2xl">
                ${basePrice}
              </span>
            )}
            {discountPercentage > 0 && (
              <span className="font-medium text-[10px] xl:text-xs py-1.5 px-3.5 rounded-full bg-[#FF3333]/10 text-[#FF3333]">
                {`-${discountPercentage}%`}
              </span>
            )}
          </div>
          <CartCounter
            initialValue={data.quantity}
            onAdd={() => handleUpdateQuantity(data.quantity + 1)}
            onRemove={() => handleUpdateQuantity(data.quantity - 1)}
            isZeroDelete
            className="px-5 py-3 max-h-8 md:max-h-10 min-w-[105px] max-w-[105px] sm:max-w-32"
          />
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
