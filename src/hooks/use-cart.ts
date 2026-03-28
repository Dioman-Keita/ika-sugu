"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getCartAction, 
  addToCartAction, 
  updateCartQuantityAction, 
  removeFromCartAction,
  syncCartAction 
} from "@/app/actions/cart";
import { CART_QUERY_KEY } from "./query-keys";

export function useCartQuery() {
  return useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: () => getCartAction(),
  });
}

/**
 * Optimized hook for the navbar cart count.
 * Leverages the existing cart query cache.
 */
export function useCartCount() {
  const { data: cart } = useCartQuery();
  return cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
}

export function useAddToCartMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ variantId, quantity }: { variantId: string; quantity: number }) => 
      addToCartAction(variantId, quantity),
    onSuccess: () => {
      // Invalidate the cart query to refetch the latest data
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });
}

export function useUpdateQuantityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) => 
      updateCartQuantityAction(itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });
}

export function useRemoveItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => removeFromCartAction(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });
}

export function useSyncCartMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => syncCartAction(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });
}
