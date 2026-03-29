"use client";

import React from "react";
import { UiPreferencesProvider } from "@/lib/ui-preferences";
import { Locale } from "@/lib/i18n/messages";
import QueryProvider from "@/components/providers/query-provider";
import { Toaster } from "sonner";

type Props = {
  children: React.ReactNode;
  initialLocale?: Locale;
};

const Providers = ({ children, initialLocale }: Props) => {
  return (
    <QueryProvider>
      <UiPreferencesProvider initialLocale={initialLocale}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: "!bg-surface-card !text-foreground !border-border !shadow-lg",
          }}
          richColors
          closeButton
        />
      </UiPreferencesProvider>
    </QueryProvider>
  );
};


export default Providers;
