"use client";

import { cn } from "@/lib/utils";
import { IoMdCheckmark } from "react-icons/io";
import { useUiPreferences } from "@/lib/ui-preferences";
import { translateAttribute } from "@/lib/i18n/messages";

type ColorOption = {
  name: string;
  hex?: string | null;
  isAvailable: boolean;
};

const ColorSelection = ({
  colors,
  selectedColor,
  onSelect,
}: {
  colors: ColorOption[];
  selectedColor: string;
  onSelect: (colorName: string) => void;
}) => {
  const { t, locale } = useUiPreferences();

  return (
    <div className="flex flex-col">
      <span className="text-sm sm:text-base text-muted-foreground mb-4">
        {t("product.selectColors")}
      </span>
      <div className="flex items-center flex-wrap space-x-3 sm:space-x-4">
        {colors.map((color) => (
          <button
            key={color.name}
            type="button"
            disabled={!color.isAvailable}
            className={cn([
              "rounded-full w-9 sm:w-10 h-9 sm:h-10 flex items-center justify-center border border-border",
              !color.isAvailable && "opacity-40 cursor-not-allowed",
            ])}
            style={{ backgroundColor: color.hex ?? "#9CA3AF" }}
            onClick={() => onSelect(color.name)}
            title={
              color.isAvailable
                ? translateAttribute(color.name, locale)
                : `${translateAttribute(color.name, locale)} (${t("product.outOfStock")})`
            }
          >
            {selectedColor === color.name && (
              <IoMdCheckmark className="text-base text-white" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ColorSelection;
