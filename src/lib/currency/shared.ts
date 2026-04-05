import type { Locale } from "@/lib/i18n/locale";
import {
  CURRENCY_OPTIONS,
  type CurrencyOption,
  isCurrencyOption,
} from "@/lib/catalog-options";

export const DEFAULT_TARGET_CURRENCY: CurrencyOption = "USD";
export const FCFA_CURRENCY_CODE: CurrencyOption = "XOF";
export const DEFAULT_RATES_PROVIDER = "currencyapi";

const CURRENCY_FRACTION_DIGITS: Record<CurrencyOption, number> = {
  USD: 2,
  EUR: 2,
  XOF: 0,
};

export function normalizeCurrencyCode(
  value: string | null | undefined,
): CurrencyOption | null {
  if (!value) return null;
  const normalized = value.toUpperCase();
  return isCurrencyOption(normalized) ? normalized : null;
}

export function getCurrencyFractionDigits(currency: CurrencyOption): number {
  return CURRENCY_FRACTION_DIGITS[currency];
}

export function roundMoney(amount: number, currency: CurrencyOption): number {
  const digits = getCurrencyFractionDigits(currency);
  return Number(amount.toFixed(digits));
}

export function formatMoney(
  amount: number,
  currency: string | null | undefined,
  locale: Locale = "en",
): string {
  const normalized = normalizeCurrencyCode(currency) ?? DEFAULT_TARGET_CURRENCY;
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    style: "currency",
    currency: normalized,
    minimumFractionDigits: getCurrencyFractionDigits(normalized),
    maximumFractionDigits: getCurrencyFractionDigits(normalized),
  }).format(roundMoney(amount, normalized));
}

export type ConvertedMoney = {
  amount: number;
  currency: CurrencyOption;
  sourceCurrency: CurrencyOption;
  rate: number | null;
  converted: boolean;
};

export const SUPPORTED_CURRENCIES = CURRENCY_OPTIONS;
