"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { messages } from "./i18n/messages";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE_KEY, THEME_COOKIE_KEY } from "./ui-preferences-keys";
import { Locale, parseLocale } from "./i18n/locale";

export type ThemeMode = "light" | "dark";

export type UiPreferencesContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  t: (key: string) => string;
};

const UiPreferencesContext = createContext<UiPreferencesContextValue | null>(null);

const getInitialLocale = (): Locale => {
  if (typeof window === "undefined") return "en";
  const savedLocale =
    Cookies.get(LOCALE_COOKIE_KEY) || localStorage.getItem(LOCALE_COOKIE_KEY);
  return parseLocale(savedLocale);
};

const getInitialTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "light";
  const savedTheme = Cookies.get(THEME_COOKIE_KEY) || localStorage.getItem(THEME_COOKIE_KEY);
  if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const UiPreferencesProvider = ({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) => {
  const [locale, setLocaleState] = useState<Locale>(
    () => initialLocale ?? getInitialLocale(),
  );
  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme);
  const router = useRouter();

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_COOKIE_KEY, newLocale);
    Cookies.set(LOCALE_COOKIE_KEY, newLocale, { expires: 365, path: "/" });
    document.documentElement.lang = newLocale;
    router.refresh();
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_COOKIE_KEY, newTheme);
    Cookies.set(THEME_COOKIE_KEY, newTheme, { expires: 365, path: "/" });
  };

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    if (initialLocale) return;
    if (Cookies.get(LOCALE_COOKIE_KEY)) return;
    if (locale !== "fr") return;
    Cookies.set(LOCALE_COOKIE_KEY, locale, { expires: 365, path: "/" });
    router.refresh();
  }, [initialLocale, locale, router]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const value = useMemo<UiPreferencesContextValue>(
    () => ({
      locale,
      setLocale,
      theme,
      setTheme,
      t: (key: string) => (messages[locale] as any)[key] ?? key,
    }),
    [locale, theme, router]
  );

  return (
    <UiPreferencesContext.Provider value={value}>
      {children}
    </UiPreferencesContext.Provider>
  );
};

export const useUiPreferences = () => {
  const context = useContext(UiPreferencesContext);
  if (!context) {
    throw new Error("useUiPreferences must be used within UiPreferencesProvider");
  }
  return context;
};
