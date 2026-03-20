"use client";

import { Moon, Sun, Shield } from "lucide-react";
import { useUiPreferences } from "@/lib/ui-preferences";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/locale";

type Props = { userEmail: string };

export default function AccountSettings({ userEmail }: Props) {
  const { t, theme, setTheme, locale, setLocale } = useUiPreferences();

  const languages: { value: Locale; labelKey: string }[] = [
    { value: "en", labelKey: "account.settings.languageEn" },
    { value: "fr", labelKey: "account.settings.languageFr" },
  ];

  // On the client we only have access to NEXT_PUBLIC_* variables.
  const adminEmailsEnv = process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "";
  const adminEmails = adminEmailsEnv
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin = adminEmails.includes(userEmail.toLowerCase());

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

        {isAdmin && (
          <div className="px-5 py-5 border-t border-border space-y-3">
            <p className="text-xs text-muted-foreground mb-1">
              {t("account.settings.adminCta")}
            </p>
            <div className="flex gap-2">
              <a
                href="/admin/overview"
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors bg-transparent text-foreground border-border hover:bg-surface-section"
              >
                <Shield size={14} />
                {t("account.settings.adminButton")}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
