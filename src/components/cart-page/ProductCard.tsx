"use client";

import React from "react";
import { PiTrashFill } from "react-icons/pi";
import Image from "next/image";
import Link from "next/link";
import CartCounter from "@/components/ui/CartCounter";
import { Button } from "../ui/button";
import {
  addToCart,
  CartItem,
  remove,
  removeCartItem,
} from "@/lib/features/carts/cartsSlice";
import { useAppDispatch } from "@/lib/hooks/redux";
import { useUiPreferences } from "@/lib/ui-preferences";
import { translateAttribute } from "@/lib/i18n/messages";

type ProductCardProps = {
  data: CartItem & {
    price?: number;
    discount?: {
      percentage?: number;
    };
  };
};

const ProductCard = ({ data }: ProductCardProps) => {
  const dispatch = useAppDispatch();
  const { t, locale } = useUiPreferences();
  const productSlug = data.slug ?? data.name.trim().toLowerCase().replace(/\s+/g, "-");
  const basePrice = data.basePrice ?? data.price ?? 0;
  const finalPrice =
    typeof data.finalPrice === "number"
      ? data.finalPrice
      : Math.round(
          basePrice -
            (basePrice * (data.discountPercentage ?? data.discount?.percentage ?? 0)) /
              100,
        );
  const discountPercentage = data.discountPercentage ?? data.discount?.percentage ?? 0;

  return (
    <div className="flex items-start space-x-4">
      <Link
        href={`/shop/product/${data.id}/${productSlug}`}
        className="bg-surface-product rounded-lg w-full min-w-[100px] max-w-[100px] sm:max-w-[124px] aspect-square overflow-hidden"
      >
        <Image
          src={data.srcUrl}
          width={124}
          height={124}
          className="rounded-md w-full h-full object-cover hover:scale-110 transition-all duration-500"
          alt={data.name}
          priority
        />
      </Link>
      <div className="flex w-full self-stretch flex-col">
        <div className="flex items-center justify-between">
          <Link
            href={`/shop/product/${data.id}/${productSlug}`}
            className="text-foreground font-bold text-base xl:text-xl"
          >
            {data.name}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 md:h-9 md:w-9"
            onClick={() =>
              dispatch(
                remove({
                  id: data.id,
                  attributes: data.attributes,
                  quantity: data.quantity,
                }),
              )
            }
          >
            <PiTrashFill className="text-xl md:text-2xl text-red-500" />
          </Button>
        </div>
        <div className="-mt-1">
          <span className="text-foreground text-xs md:text-sm mr-1">
            {t("cart.size")}
          </span>
          <span className="text-muted-foreground text-xs md:text-sm">
            {translateAttribute(data.attributes[0], locale)}
          </span>
        </div>
        <div className="mb-auto -mt-1.5">
          <span className="text-foreground text-xs md:text-sm mr-1">
            {t("cart.color")}
          </span>
          <span className="text-muted-foreground text-xs md:text-sm">
            {translateAttribute(data.attributes[1], locale)}
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
            onAdd={() => dispatch(addToCart({ ...data, quantity: 1 }))}
            onRemove={() =>
              data.quantity === 1
                ? dispatch(
                    remove({
                      id: data.id,
                      attributes: data.attributes,
                      quantity: data.quantity,
                    }),
                  )
                : dispatch(removeCartItem({ id: data.id, attributes: data.attributes }))
            }
            isZeroDelete
            className="px-5 py-3 max-h-8 md:max-h-10 min-w-[105px] max-w-[105px] sm:max-w-32"
          />
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
