export const DRESS_STYLE_OPTIONS = ["casual", "formal", "party", "gym"] as const;

export type DressStyleOption = (typeof DRESS_STYLE_OPTIONS)[number];

export const SIZE_OPTIONS = [
  "XX-Small",
  "X-Small",
  "Small",
  "Medium",
  "Large",
  "X-Large",
  "XX-Large",
  "3X-Large",
  "4X-Large",
  "Unique",
] as const;

export type SizeOption = (typeof SIZE_OPTIONS)[number];

export const CURRENCY_OPTIONS = ["USD", "EUR", "XOF"] as const;

export type CurrencyOption = (typeof CURRENCY_OPTIONS)[number];

export function isDressStyleOption(value: string | null | undefined): value is DressStyleOption {
  return Boolean(value && DRESS_STYLE_OPTIONS.includes(value as DressStyleOption));
}

export function isCurrencyOption(value: string | null | undefined): value is CurrencyOption {
  return Boolean(value && CURRENCY_OPTIONS.includes(value as CurrencyOption));
}

export function isSizeOption(value: string | null | undefined): value is SizeOption {
  return Boolean(value && SIZE_OPTIONS.includes(value as SizeOption));
}
