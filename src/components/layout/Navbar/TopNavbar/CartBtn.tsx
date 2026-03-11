"use client";

import { useAppSelector } from "@/lib/hooks/redux";
import { RootState } from "@/lib/store";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useUiPreferences } from "@/lib/ui-preferences";

const CartBtn = () => {
  const { cart } = useAppSelector((state: RootState) => state.carts);
  const { t } = useUiPreferences();

  return (
    <Link href="/cart" className="relative mr-[14px] p-1">
      <Image
        priority
        src="/icons/cart.svg"
        height={100}
        width={100}
        alt={t("nav.cart")}
        className="max-w-[22px] max-h-[22px] dark:invert"
      />
      {cart && cart.totalQuantities > 0 && (
        <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center leading-none px-1 tabular-nums">
          {cart.totalQuantities}
        </span>
      )}
    </Link>
  );
};

export default CartBtn;
