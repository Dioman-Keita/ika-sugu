export const DRESS_STYLE_OPTIONS = [
  "casual",
  "formal",
  "party",
  "gym",
  "street",
  "business",
] as const;

export type DressStyleOption = (typeof DRESS_STYLE_OPTIONS)[number];

export const SHOP_SECTION_OPTIONS = [
  "men-clothes",
  "women-clothes",
  "kids-clothes",
  "bag-shoes",
] as const;

export type ShopSectionOption = (typeof SHOP_SECTION_OPTIONS)[number];

export const SIZE_LABELS = {
  "XX-Small": "XX-Petit",
  "X-Small": "Très petit",
  Small: "Petit",
  Medium: "Moyen",
  Large: "Grand",
  "X-Large": "Très grand",
  "XX-Large": "Très très grand",
  "3X-Large": "3X-Grand",
  "4X-Large": "4X-Grand",
  Unique: "Taille unique",
} as const;

export const SIZE_OPTIONS = Object.keys(SIZE_LABELS) as Array<keyof typeof SIZE_LABELS>;
export type SizeOption = (typeof SIZE_OPTIONS)[number];

export const CURRENCY_OPTIONS = ["USD", "EUR", "XOF"] as const;

export type CurrencyOption = (typeof CURRENCY_OPTIONS)[number];

export function isDressStyleOption(
  value: string | null | undefined,
): value is DressStyleOption {
  return Boolean(value && DRESS_STYLE_OPTIONS.includes(value as DressStyleOption));
}

export function isShopSectionOption(
  value: string | null | undefined,
): value is ShopSectionOption {
  return Boolean(value && SHOP_SECTION_OPTIONS.includes(value as ShopSectionOption));
}

export function isCurrencyOption(
  value: string | null | undefined,
): value is CurrencyOption {
  return Boolean(value && CURRENCY_OPTIONS.includes(value as CurrencyOption));
}

export function isSizeOption(value: string | null | undefined): value is SizeOption {
  return Boolean(value && SIZE_OPTIONS.includes(value as SizeOption));
}
