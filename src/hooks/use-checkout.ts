"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { placeOrderAction, type CheckoutInput } from "@/app/actions/checkout";
import { CART_QUERY_KEY } from "./query-keys";
import { useUiPreferences } from "@/lib/ui-preferences";

export function usePlaceOrderMutation() {
  const queryClient = useQueryClient();
  const { t } = useUiPreferences();

  return useMutation({
    mutationFn: (input: CheckoutInput) => placeOrderAction(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      toast(t("toast.info.placeOrderRedirect"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("toast.error.placeOrder"));
    },
  });
}
