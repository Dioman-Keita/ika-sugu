import type { Locale } from "./locale";

export function toIntlLocale(locale: Locale): string {
  return locale === "fr" ? "fr-FR" : "en-US";
}

export function formatMonthYear(
  date: Date | string | null | undefined,
  locale: Locale,
): string | null {
  if (!date) return null;
  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return null;

  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    month: "long",
    year: "numeric",
  }).format(value);
}
