import { cookies } from "next/headers";
import { LOCALE_COOKIE_KEY } from "@/lib/ui-preferences-keys";
import { Locale, parseLocale } from "@/lib/i18n/locale";
import { messages } from "@/lib/i18n/messages";
import { getAdminCurrencySettings } from "@/app/actions/admin";
import AdminCurrencySettingsForm from "@/components/admin/AdminCurrencySettingsForm";

export default async function AdminSettingsPage() {
  const cookieStore = await cookies();
  const locale: Locale = parseLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value);
  const m = messages[locale];
  const settings = await getAdminCurrencySettings();

  return (
    <AdminCurrencySettingsForm
      initialTargetCurrency={settings.targetCurrency}
      ratesProvider={settings.ratesProvider}
      exchangeRatesUpdatedAt={settings.exchangeRatesUpdatedAt?.toISOString() ?? null}
      latestRates={settings.latestRates.map((rate) => ({
        ...rate,
        fetchedAt: rate.fetchedAt.toISOString(),
      }))}
      locale={locale}
      labels={{
        title: m["admin.settings.currency.title"],
        subtitle: m["admin.settings.currency.subtitle"],
        targetCurrency: m["admin.settings.currency.targetCurrency"],
        targetCurrencyHint: m["admin.settings.currency.targetCurrencyHint"],
        provider: m["admin.settings.currency.provider"],
        lastSync: m["admin.settings.currency.lastSync"],
        neverSynced: m["admin.settings.currency.neverSynced"],
        save: m["admin.settings.currency.save"],
        saving: m["admin.settings.currency.saving"],
        sync: m["admin.settings.currency.sync"],
        syncing: m["admin.settings.currency.syncing"],
        recentRates: m["admin.settings.currency.recentRates"],
        recentRatesHint: m["admin.settings.currency.recentRatesHint"],
        emptyRates: m["admin.settings.currency.emptyRates"],
        tablePair: m["admin.settings.currency.table.pair"],
        tableRate: m["admin.settings.currency.table.rate"],
        tableFetchedAt: m["admin.settings.currency.table.fetchedAt"],
        "toast.settingsSaved": m["admin.settings.currency.toast.settingsSaved"],
        "toast.settingsError": m["admin.settings.currency.toast.settingsError"],
        "toast.ratesSynced": m["admin.settings.currency.toast.ratesSynced"],
        "toast.ratesError": m["admin.settings.currency.toast.ratesError"],
        "currency.usd": m["currency.usd"],
        "currency.eur": m["currency.eur"],
        "currency.xof": m["currency.xof"],
      }}
    />
  );
}
