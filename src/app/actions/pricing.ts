"use server";

export async function applyDiscountPercentage(
  basePrice: number,
  discountPercentage: number
): Promise<number> {
  const safePercentage = Math.min(Math.max(discountPercentage, 0), 100);
  return Math.round(basePrice - (basePrice * safePercentage) / 100);
}
