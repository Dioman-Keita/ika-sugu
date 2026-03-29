import React from "react";
import { getCartAction } from "@/app/actions/cart";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { CART_QUERY_KEY } from "@/hooks/query-keys";
import CheckoutContainer from "./CheckoutContainer";

export default async function CheckoutPage() {
  const queryClient = new QueryClient();

  // Prefetch cart data on the server
  await queryClient.prefetchQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: () => getCartAction(),
  });

  return (
    <main className="pb-20">
      <div className="max-w-frame mx-auto px-4 xl:px-0">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <CheckoutContainer />
        </HydrationBoundary>
      </div>
    </main>
  );
}
