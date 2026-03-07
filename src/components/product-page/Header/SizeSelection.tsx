"use client";

import { cn } from "@/lib/utils";
import React from "react";

type SizeOption = {
  name: string;
  stock: number;
  isAvailable: boolean;
};

const SizeSelection = ({
  sizes,
  selectedSize,
  onSelect,
}: {
  sizes: SizeOption[];
  selectedSize: string;
  onSelect: (size: string) => void;
}) => {
  return (
    <div className="flex flex-col">
      <span className="text-sm sm:text-base text-black/60 mb-4">
        Choose Size
      </span>
      <div className="flex items-center flex-wrap lg:space-x-3">
        {sizes.map((size) => (
          <button
            key={size.name}
            type="button"
            disabled={!size.isAvailable}
            className={cn([
              "bg-[#F0F0F0] flex items-center justify-center px-5 lg:px-6 py-2.5 lg:py-3 text-sm lg:text-base rounded-full m-1 lg:m-0 max-h-[46px]",
              selectedSize === size.name && "bg-black font-medium text-white",
              !size.isAvailable && "opacity-50 cursor-not-allowed",
            ])}
            onClick={() => onSelect(size.name)}
            title={
              size.isAvailable ? `${size.name} (${size.stock} in stock)` : `${size.name} (Out of stock)`
            }
          >
            {size.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SizeSelection;
