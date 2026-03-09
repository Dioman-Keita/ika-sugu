"use client";

import { cn } from "@/lib/utils";

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
      <span className="text-sm sm:text-base text-muted-foreground mb-4">Choose Size</span>
      <div className="flex items-center flex-wrap lg:space-x-3">
        {sizes.map((size) => (
          <button
            key={size.name}
            type="button"
            disabled={!size.isAvailable}
            className={cn([
              "bg-surface-section text-foreground flex items-center justify-center px-5 lg:px-6 py-2.5 lg:py-3 text-sm lg:text-base rounded-full m-1 lg:m-0 max-h-11.5",
              selectedSize === size.name && "bg-foreground text-background font-medium",
              !size.isAvailable && "opacity-50 cursor-not-allowed",
            ])}
            onClick={() => onSelect(size.name)}
            title={
              size.isAvailable
                ? `${size.name} (${size.stock} in stock)`
                : `${size.name} (Out of stock)`
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
