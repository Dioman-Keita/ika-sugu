"use client";

import React from "react";
import { Provider } from "react-redux";
import { makeStore } from "../lib/store";
import { PersistGate } from "redux-persist/integration/react";
import SpinnerbLoader from "@/components/ui/SpinnerbLoader";
import { UiPreferencesProvider } from "@/lib/ui-preferences";
import { Locale } from "@/lib/i18n/messages";

type Props = {
  children: React.ReactNode;
  initialLocale?: Locale;
};

const Providers = ({ children, initialLocale }: Props) => {
  const { store, persistor } = makeStore();

  return (
    <UiPreferencesProvider initialLocale={initialLocale}>
      <Provider store={store}>
        <PersistGate
          loading={
            <div className="flex items-center justify-center h-96">
              <SpinnerbLoader className="w-10 border-2 border-gray-300 border-r-gray-600" />
            </div>
          }
          persistor={persistor}
        >
          {children}
        </PersistGate>
      </Provider>
    </UiPreferencesProvider>
  );
};

export default Providers;
