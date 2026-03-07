"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { IoMdCheckmark } from "react-icons/io";

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
  return (
    <div className="flex flex-col">
      <span className="text-sm sm:text-base text-black/60 mb-4">
        Select Colors
      </span>
      <div className="flex items-center flex-wrap space-x-3 sm:space-x-4">
        {colors.map((color) => (
          <button
            key={color.name}
            type="button"
            disabled={!color.isAvailable}
            className={cn([
              "rounded-full w-9 sm:w-10 h-9 sm:h-10 flex items-center justify-center border border-black/10",
              !color.isAvailable && "opacity-40 cursor-not-allowed",
            ])}
            style={{ backgroundColor: color.hex ?? "#9CA3AF" }}
            onClick={() => onSelect(color.name)}
            title={
              color.isAvailable ? color.name : `${color.name} (Out of stock)`
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
