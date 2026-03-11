export const SUPPORTED_LOCALES = ["en", "fr"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

const localeSet = new Set<string>(SUPPORTED_LOCALES);

export const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && localeSet.has(value);

export const parseLocale = (value: unknown, fallback: Locale = DEFAULT_LOCALE): Locale =>
  isLocale(value) ? value : fallback;
