"use client";

import { cn } from "@/lib/utils";
import { useUiPreferences } from "@/lib/ui-preferences";
import { translateAttribute } from "@/lib/i18n/messages";

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
  const { t, locale } = useUiPreferences();

  return (
    <div className="flex flex-col">
      <span className="text-sm sm:text-base text-muted-foreground mb-4">
        {t("product.chooseSize")}
      </span>
      <div className="flex items-center flex-wrap gap-2 lg:gap-3">
        {sizes.map((size) => (
          <button
            key={size.name}
            type="button"
            disabled={!size.isAvailable}
            className={cn([
              "bg-surface-section text-foreground flex items-center justify-center px-5 lg:px-6 py-2.5 lg:py-3 text-sm lg:text-base rounded-full max-h-11.5",
              selectedSize === size.name && "bg-foreground text-background font-medium",
              !size.isAvailable && "opacity-50 cursor-not-allowed",
            ])}
            onClick={() => onSelect(size.name)}
            title={
              size.isAvailable
                ? `${translateAttribute(size.name, locale)} (${t("product.inStock").replace("{count}", String(size.stock))})`
                : `${translateAttribute(size.name, locale)} (${t("product.outOfStock")})`
            }
          >
            {translateAttribute(size.name, locale)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SizeSelection;
