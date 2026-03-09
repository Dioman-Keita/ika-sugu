"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Locale, messages } from "./i18n/messages";

type ThemeMode = "light" | "dark";

type UiPreferencesContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  t: (key: string) => string;
};

const UiPreferencesContext = createContext<UiPreferencesContextValue | null>(null);

const LOCALE_STORAGE_KEY = "ui-locale";
const THEME_STORAGE_KEY = "ui-theme";

const getInitialLocale = (): Locale => {
  if (typeof window === "undefined") return "en";
  const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
  return savedLocale === "fr" ? "fr" : "en";
};

const getInitialTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "light";
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const UiPreferencesProvider = ({ children }: { children: React.ReactNode }) => {
  const [locale, setLocale] = useState<Locale>(getInitialLocale);
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

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
