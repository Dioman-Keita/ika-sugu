"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { messages } from "./i18n/messages";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE_KEY } from "./ui-preferences-keys";
import { Locale, parseLocale } from "./i18n/locale";

type ThemeMode = "light" | "dark";

type UiPreferencesContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  t: (key: string) => string;
};

const UiPreferencesContext = createContext<UiPreferencesContextValue | null>(null);

const THEME_STORAGE_KEY = "ui-theme";

const getInitialLocale = (): Locale => {
  if (typeof window === "undefined") return "en";
  const savedLocale =
    Cookies.get(LOCALE_COOKIE_KEY) || localStorage.getItem(LOCALE_COOKIE_KEY);
  return parseLocale(savedLocale);
};

const getInitialTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "light";
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
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
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const router = useRouter();

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_COOKIE_KEY, newLocale);
    Cookies.set(LOCALE_COOKIE_KEY, newLocale, { expires: 365, path: "/" });
    document.documentElement.lang = newLocale;
    router.refresh();
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
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const value = useMemo<UiPreferencesContextValue>(
    () => ({
      locale,
      setLocale,
      theme,
      setTheme,
      t: (key) => messages[locale][key] ?? key,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, theme],
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
