import {
  DEFAULT_TARGET_CURRENCY,
  getCurrencyFractionDigits,
  normalizeCurrencyCode,
  roundMoney,
} from "@/lib/currency/shared";

const getStripeScaleFactor = (currency: string | null | undefined) => {
  const normalized = normalizeCurrencyCode(currency) ?? DEFAULT_TARGET_CURRENCY;
  return {
    currency: normalized,
    factor: 10 ** getCurrencyFractionDigits(normalized),
  };
};

export const toStripeMinorAmount = (
  amount: number,
  currency: string | null | undefined,
) => {
  const { factor } = getStripeScaleFactor(currency);
  return Math.round(roundMoney(amount, normalizeCurrencyCode(currency) ?? DEFAULT_TARGET_CURRENCY) * factor);
};

export const fromStripeMinorAmount = (
  amount: number | null | undefined,
  currency: string | null | undefined,
) => {
  const numericAmount = Number(amount ?? 0);
  const { currency: normalized, factor } = getStripeScaleFactor(currency);
  return roundMoney(numericAmount / factor, normalized);
};
