"use client";

import React from "react";
import { UiPreferencesProvider } from "@/lib/ui-preferences";
import { Locale } from "@/lib/i18n/messages";
import QueryProvider from "@/components/providers/query-provider";

type Props = {
  children: React.ReactNode;
  initialLocale?: Locale;
};

const Providers = ({ children, initialLocale }: Props) => {
  return (
    <QueryProvider>
      <UiPreferencesProvider initialLocale={initialLocale}>
        {children}
      </UiPreferencesProvider>
    </QueryProvider>
  );
};

export default Providers;
