"use client";

import Rating from "../ui/Rating";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types/product.types";
import { useUiPreferences } from "@/lib/ui-preferences";
import { formatMoney } from "@/lib/currency/shared";

type ProductCardProps = {
  data: Product;
};

const ProductCard = ({ data }: ProductCardProps) => {
  const { locale } = useUiPreferences();

  return (
    <Link
      href={`/shop/product/${data.id}/${data.slug}`}
      className="flex flex-col items-start aspect-auto"
    >
      <div className="bg-surface-product rounded-[13px] lg:rounded-[20px] w-full lg:max-w-73.75 aspect-square mb-2.5 xl:mb-4 overflow-hidden">
        <Image
          src={data.srcUrl}
          width={295}
          height={298}
          className="rounded-md w-full h-full object-contain hover:scale-110 transition-all duration-500"
          alt={data.title}
          priority
        />
      </div>
      <strong className="text-foreground xl:text-xl">{data.title}</strong>
      <div className="flex items-end mb-1 xl:mb-2">
        <Rating
          initialValue={data.rating}
          allowFraction
          SVGclassName="inline-block"
          emptyClassName="fill-foreground/10"
          size={19}
          readonly
        />
        <span className="text-foreground text-xs xl:text-sm ml-2.75 xl:ml-3.25 pb-0.5 xl:pb-0">
          {data.rating.toFixed(1)}
          <span className="text-foreground/60">/5</span>
        </span>
      </div>
      <div className="flex flex-col items-start gap-1">
        <span className="font-bold text-foreground text-xl xl:text-2xl">
          {formatMoney(data.finalPrice, data.currency, locale)}
        </span>
        {data.discountPercentage > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 xl:gap-2.5">
            <span className="font-bold text-foreground/40 line-through text-lg xl:text-xl">
              {formatMoney(data.basePrice, data.currency, locale)}
            </span>
            <span className="font-medium text-[10px] xl:text-xs py-1.5 px-3.5 rounded-full bg-[#FF3333]/10 text-[#FF3333]">
              {`-${data.discountPercentage}%`}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
