"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FaMinus, FaPlus } from "react-icons/fa6";
import { cn } from "@/lib/utils";

type CartCounterProps = {
  isZeroDelete?: boolean;
  onAdd?: (value: number) => void;
  onRemove?: (value: number) => void;
  className?: string;
  initialValue?: number;
  maxValue?: number;
  disabled?: boolean;
};

const CartCounter = ({
  isZeroDelete,
  onAdd,
  onRemove,
  className,
  initialValue = 1,
  maxValue,
  disabled = false,
}: CartCounterProps) => {
  const [counter, setCounter] = useState<number>(initialValue);
  const minValue = isZeroDelete ? 0 : 1;
  const isAtMin = counter <= minValue;
  const isAtMax = typeof maxValue === "number" && counter >= maxValue;

  useEffect(() => {
    setCounter(initialValue);
  }, [initialValue]);

  const addToCart = () => {
    if (disabled || isAtMax) return;
    const nextValue = counter + 1;
    onAdd?.(nextValue);
    setCounter(nextValue);
  };

  const remove = () => {
    if (disabled || isAtMin) return;
    const nextValue = counter - 1;
    onRemove?.(nextValue);
    setCounter(Math.max(nextValue, 0));
  };

  return (
    <div
      className={cn(
        "relative z-10 shrink-0 bg-surface-section w-full min-w-[110px] max-w-[110px] sm:max-w-[170px] py-3 md:py-3.5 px-4 sm:px-5 rounded-full flex items-center justify-between",
        disabled && "opacity-50 pointer-events-none",
        className,
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        type="button"
        disabled={disabled || isAtMin}
        className="h-5 w-5 sm:h-6 sm:w-6 text-xl hover:bg-transparent"
        onClick={remove}
        aria-label="Decrease quantity"
      >
        <FaMinus />
      </Button>
      <span className="font-medium text-sm sm:text-base">{counter}</span>
      <Button
        variant="ghost"
        size="icon"
        type="button"
        disabled={disabled || isAtMax}
        className="h-5 w-5 sm:h-6 sm:w-6 text-xl hover:bg-transparent"
        onClick={addToCart}
        aria-label="Increase quantity"
      >
        <FaPlus />
      </Button>
    </div>
  );
};

export default CartCounter;
