import db from "@/lib/db";
import {
  CURRENCY_OPTIONS,
  type CurrencyOption,
} from "@/lib/catalog-options";
import {
  DEFAULT_RATES_PROVIDER,
  DEFAULT_TARGET_CURRENCY,
  type ConvertedMoney,
  normalizeCurrencyCode,
  roundMoney,
} from "./shared";

const FALLBACK_SITE_SETTINGS_ID = "global";
const FALLBACK_REFRESH_WINDOW_MS = 6 * 60 * 60 * 1000;

const GLOBAL_SITE_SETTINGS_ID =
  process.env.SITE_SETTINGS_ID?.trim() || FALLBACK_SITE_SETTINGS_ID;

function parseRefreshWindowMs(value: string | undefined) {
  if (!value) return FALLBACK_REFRESH_WINDOW_MS;

  const parsedValue = Number(value);
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return FALLBACK_REFRESH_WINDOW_MS;
  }

  return parsedValue;
}

const DEFAULT_REFRESH_WINDOW_MS = parseRefreshWindowMs(
  process.env.EXCHANGE_RATES_REFRESH_WINDOW_MS,
);

type CurrencyApiLatestResponse = {
  meta?: { last_updated_at?: string };
  data?: Record<string, { code?: string; value?: number }>;
};

export async function getOrCreateSiteSettings() {
  return db.siteSettings.upsert({
    where: { id: GLOBAL_SITE_SETTINGS_ID },
    update: {},
    create: {
      id: GLOBAL_SITE_SETTINGS_ID,
      targetCurrency: DEFAULT_TARGET_CURRENCY,
      ratesProvider: DEFAULT_RATES_PROVIDER,
    },
  });
}

export async function getSiteCurrencySettings() {
  const settings = await getOrCreateSiteSettings();
  return {
    ...settings,
    targetCurrency:
      normalizeCurrencyCode(settings.targetCurrency) ?? DEFAULT_TARGET_CURRENCY,
  };
}

export async function updateSiteCurrencySettings(targetCurrency: CurrencyOption) {
  return db.siteSettings.upsert({
    where: { id: GLOBAL_SITE_SETTINGS_ID },
    update: { targetCurrency },
    create: {
      id: GLOBAL_SITE_SETTINGS_ID,
      targetCurrency,
      ratesProvider: DEFAULT_RATES_PROVIDER,
    },
  });
}

export async function getCurrentTargetCurrency(): Promise<CurrencyOption> {
  const settings = await getSiteCurrencySettings();
  return settings.targetCurrency;
}

async function getLatestStoredRate(
  baseCurrency: CurrencyOption,
  quoteCurrency: CurrencyOption,
) {
  return db.exchangeRate.findFirst({
    where: { baseCurrency, quoteCurrency },
    orderBy: [{ fetchedAt: "desc" }, { createdAt: "desc" }],
  });
}

export async function convertMoney({
  amount,
  sourceCurrency,
  targetCurrency,
}: {
  amount: number;
  sourceCurrency: string | null | undefined;
  targetCurrency: string | null | undefined;
}): Promise<ConvertedMoney> {
  const normalizedSource =
    normalizeCurrencyCode(sourceCurrency) ?? DEFAULT_TARGET_CURRENCY;
  const normalizedTarget =
    normalizeCurrencyCode(targetCurrency) ?? DEFAULT_TARGET_CURRENCY;

  if (!Number.isFinite(amount)) {
    return {
      amount: 0,
      currency: normalizedTarget,
      sourceCurrency: normalizedSource,
      rate: null,
      converted: false,
    };
  }

  if (normalizedSource === normalizedTarget) {
    return {
      amount: roundMoney(amount, normalizedTarget),
      currency: normalizedTarget,
      sourceCurrency: normalizedSource,
      rate: 1,
      converted: false,
    };
  }

  const directRate = await getLatestStoredRate(normalizedSource, normalizedTarget);
  if (directRate) {
    const rate = Number(directRate.rate);
    return {
      amount: roundMoney(amount * rate, normalizedTarget),
      currency: normalizedTarget,
      sourceCurrency: normalizedSource,
      rate,
      converted: true,
    };
  }

  const inverseRate = await getLatestStoredRate(normalizedTarget, normalizedSource);
  if (inverseRate) {
    const rate = Number(inverseRate.rate);
    if (rate > 0) {
      return {
        amount: roundMoney(amount / rate, normalizedTarget),
        currency: normalizedTarget,
        sourceCurrency: normalizedSource,
        rate: 1 / rate,
        converted: true,
      };
    }
  }

  return {
    amount: roundMoney(amount, normalizedSource),
    currency: normalizedSource,
    sourceCurrency: normalizedSource,
    rate: null,
    converted: false,
  };
}

export async function syncExchangeRates(options?: {
  baseCurrencies?: CurrencyOption[];
  quoteCurrencies?: CurrencyOption[];
}) {
  const apiKey = process.env.CURRENCY_API_KEY;
  if (!apiKey) {
    throw new Error("CURRENCY_API_KEY is required to sync exchange rates.");
  }

  const baseCurrencies = options?.baseCurrencies ?? [...CURRENCY_OPTIONS];
  const quoteCurrencies = options?.quoteCurrencies ?? [...CURRENCY_OPTIONS];
  const provider = DEFAULT_RATES_PROVIDER;
  let latestFetchedAt: Date | null = null;
  let syncedCount = 0;

  for (const baseCurrency of baseCurrencies) {
    const requestedQuotes = quoteCurrencies.filter((currency) => currency !== baseCurrency);
    if (requestedQuotes.length === 0) continue;

    const url = new URL("https://api.currencyapi.com/v3/latest");
    url.searchParams.set("apikey", apiKey);
    url.searchParams.set("base_currency", baseCurrency);
    url.searchParams.set("currencies", requestedQuotes.join(","));

    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Currency sync failed for ${baseCurrency}: ${response.status}`);
    }

    const payload = (await response.json()) as CurrencyApiLatestResponse;
    const fetchedAt = payload.meta?.last_updated_at
      ? new Date(payload.meta.last_updated_at)
      : new Date();

    if (!payload.data || Object.keys(payload.data).length === 0) {
      continue;
    }

    latestFetchedAt = fetchedAt;

    for (const quoteCurrency of requestedQuotes) {
      const row = payload.data[quoteCurrency];
      const rateValue = row?.value;
      if (typeof rateValue !== "number" || !Number.isFinite(rateValue) || rateValue <= 0) {
        continue;
      }

      await db.exchangeRate.create({
        data: {
          baseCurrency,
          quoteCurrency,
          rate: rateValue,
          provider,
          fetchedAt,
        },
      });
      syncedCount += 1;
    }
  }

  if (latestFetchedAt) {
    await db.siteSettings.upsert({
      where: { id: GLOBAL_SITE_SETTINGS_ID },
      update: {
        exchangeRatesUpdatedAt: latestFetchedAt,
        ratesProvider: provider,
      },
      create: {
        id: GLOBAL_SITE_SETTINGS_ID,
        targetCurrency: DEFAULT_TARGET_CURRENCY,
        ratesProvider: provider,
        exchangeRatesUpdatedAt: latestFetchedAt,
      },
    });
  }

  return {
    provider,
    syncedCount,
    fetchedAt: latestFetchedAt,
  };
}

export async function ensureFreshExchangeRates() {
  const settings = await getOrCreateSiteSettings();
  const lastUpdatedAt = settings.exchangeRatesUpdatedAt?.getTime() ?? 0;
  const isFresh = Date.now() - lastUpdatedAt < DEFAULT_REFRESH_WINDOW_MS;

  if (isFresh) {
    return {
      refreshed: false,
      fetchedAt: settings.exchangeRatesUpdatedAt ?? null,
    };
  }

  try {
    const result = await syncExchangeRates();
    return {
      refreshed: true,
      fetchedAt: result.fetchedAt,
    };
  } catch {
    return {
      refreshed: false,
      fetchedAt: settings.exchangeRatesUpdatedAt ?? null,
    };
  }
}
