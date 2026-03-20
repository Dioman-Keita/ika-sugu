"use client";

import { Moon, Sun } from "lucide-react";
import { useUiPreferences } from "@/lib/ui-preferences";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/locale";

export default function AccountSettings() {
  const { t, theme, setTheme, locale, setLocale } = useUiPreferences();

  const languages: { value: Locale; labelKey: string }[] = [
    { value: "en", labelKey: "account.settings.languageEn" },
    { value: "fr", labelKey: "account.settings.languageFr" },
  ];

  // Admin CTA removed from client to avoid exposing admin list publicly.
  const isAdmin = false;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-foreground">
        {t("account.settings.title")}
      </h2>

      <div className="border border-border rounded-[20px] bg-surface-card divide-y divide-border overflow-hidden">
        {/* Language */}
        <div className="px-5 py-5">
          <p className="text-xs text-muted-foreground mb-3">
            {t("account.settings.language")}
          </p>
          <div className="flex gap-2">
            {languages.map(({ value, labelKey }) => (
              <button
                key={value}
                onClick={() => setLocale(value)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium border transition-colors",
                  locale === value
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-foreground border-border hover:bg-surface-section",
                )}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div className="px-5 py-5">
          <p className="text-xs text-muted-foreground mb-3">
            {t("account.settings.theme")}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme("light")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors",
                theme === "light"
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent text-foreground border-border hover:bg-surface-section",
              )}
            >
              <Sun size={14} />
              {t("account.settings.themeLight")}
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors",
                theme === "dark"
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent text-foreground border-border hover:bg-surface-section",
              )}
            >
              <Moon size={14} />
              {t("account.settings.themeDark")}
            </button>
          </div>
        </div>

        {isAdmin && null}
      </div>
    </div>
  );
}
