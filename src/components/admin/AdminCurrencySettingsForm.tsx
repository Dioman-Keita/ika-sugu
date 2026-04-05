"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  syncAdminExchangeRatesAction,
  updateAdminCurrencySettingsAction,
} from "@/app/actions/admin";
import { CURRENCY_OPTIONS, type CurrencyOption } from "@/lib/catalog-options";

type LatestRate = {
  id: string;
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  provider: string;
  fetchedAt: string;
};

type Props = {
  initialTargetCurrency: CurrencyOption;
  ratesProvider: string;
  exchangeRatesUpdatedAt: string | null;
  latestRates: LatestRate[];
  locale: "fr" | "en";
  labels: Record<string, string>;
};

export default function AdminCurrencySettingsForm({
  initialTargetCurrency,
  ratesProvider,
  exchangeRatesUpdatedAt,
  latestRates,
  locale,
  labels,
}: Props) {
  const [targetCurrency, setTargetCurrency] =
    useState<CurrencyOption>(initialTargetCurrency);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(exchangeRatesUpdatedAt);
  const [isSaving, startSaving] = useTransition();
  const [isSyncing, startSyncing] = useTransition();

  const formatDateTime = (value: string | null) => {
    if (!value) return labels["rates.neverSynced"];
    return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  };

  const handleSave = () => {
    startSaving(async () => {
      try {
        await updateAdminCurrencySettingsAction(targetCurrency);
        toast.success(labels["toast.settingsSaved"]);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : labels["toast.settingsError"],
        );
      }
    });
  };

  const handleSync = () => {
    startSyncing(async () => {
      try {
        const result = await syncAdminExchangeRatesAction();
        setLastSyncedAt(result.fetchedAt ? new Date(result.fetchedAt).toISOString() : null);
        toast.success(
          labels["toast.ratesSynced"].replace("{count}", String(result.syncedCount)),
        );
      } catch (error) {
        toast.error(error instanceof Error ? error.message : labels["toast.ratesError"]);
      }
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">{labels["title"]}</h1>
        <p className="text-sm text-muted-foreground">{labels["subtitle"]}</p>
      </div>

      <div className="border border-border rounded-2xl bg-surface-card p-5 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {labels["targetCurrency"]}
          </label>
          <select
            value={targetCurrency}
            onChange={(event) => setTargetCurrency(event.target.value as CurrencyOption)}
            className="w-full rounded-xl border border-border bg-surface-card px-4 py-3 text-sm text-foreground"
          >
            {CURRENCY_OPTIONS.map((currency) => (
              <option key={currency} value={currency}>
                {labels[`currency.${currency.toLowerCase()}`] ?? currency}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">{labels["targetCurrencyHint"]}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="border border-border rounded-2xl bg-surface-section p-4 space-y-1">
            <p className="text-xs text-muted-foreground">{labels["provider"]}</p>
            <p className="text-sm font-medium text-foreground">{ratesProvider}</p>
          </div>
          <div className="border border-border rounded-2xl bg-surface-section p-4 space-y-1">
            <p className="text-xs text-muted-foreground">{labels["lastSync"]}</p>
            <p className="text-sm font-medium text-foreground">
              {formatDateTime(lastSyncedAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={handleSave} disabled={isSaving || isSyncing}>
            {isSaving ? labels["saving"] : labels["save"]}
          </Button>
          <Button
            variant="outline"
            onClick={handleSync}
            disabled={isSaving || isSyncing}
          >
            {isSyncing ? labels["syncing"] : labels["sync"]}
          </Button>
        </div>
      </div>

      <div className="border border-border rounded-2xl bg-surface-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">{labels["recentRates"]}</h2>
          <p className="text-xs text-muted-foreground mt-1">{labels["recentRatesHint"]}</p>
        </div>
        {latestRates.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground text-center">
            {labels["emptyRates"]}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-section">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">
                    {labels["tablePair"]}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">
                    {labels["tableRate"]}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">
                    {labels["tableFetchedAt"]}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {latestRates.map((rate) => (
                  <tr key={rate.id}>
                    <td className="px-5 py-3 text-foreground">
                      {rate.baseCurrency}/{rate.quoteCurrency}
                    </td>
                    <td className="px-5 py-3 text-foreground">{rate.rate}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {formatDateTime(rate.fetchedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
