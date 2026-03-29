"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useSyncCartMutation } from "@/hooks/use-cart";

function CartAuthSyncer() {
  const { data: session } = authClient.useSession();
  const { mutate: syncCart } = useSyncCartMutation();

  useEffect(() => {
    if (session?.user?.id) {
      // The backend action instantly returns if there's no guest cookie,
      // so this is very cheap to execute.
      syncCart();
    }
  }, [session?.user?.id, syncCart]);

  return null;
}

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <CartAuthSyncer />
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
