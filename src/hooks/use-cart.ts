"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCartAction,
  addToCartAction,
  updateCartQuantityAction,
  removeFromCartAction,
  syncCartAction,
} from "@/app/actions/cart";
import type { CartDTO, CartMutationError } from "@/app/actions/cart";
import type { ProductCardProps } from "@/components/cart-page/ProductCard";
import { CART_QUERY_KEY } from "./query-keys";
import { toast } from "sonner";
import { useUiPreferences } from "@/lib/ui-preferences";

// ─── Types ────────────────────────────────────────────────────────────────────
export type CartLine = ProductCardProps["data"];

/**
 * Thrown client-side when a cart action returns an expected failure, so the
 * mutation's `onError` rollback + toast flow runs with a controlled, localized
 * message. (The action *returns* the reason rather than throwing it, because
 * Next.js strips thrown Server Action messages in production.)
 */
class CartMutationException extends Error {
  constructor(public readonly detail: CartMutationError) {
    super(detail.code);
    this.name = "CartMutationException";
  }
}

/** Maps a cart action failure to a friendly localized toast message. */
function resolveCartErrorMessage(
  error: unknown,
  fallback: string,
  t: (key: string) => string,
): string {
  if (error instanceof CartMutationException) {
    switch (error.detail.code) {
      case "outOfStock":
        return t("cart.error.outOfStock");
      case "stockExceeded":
        return t("cart.error.stockExceeded").replace(
          "{stock}",
          String(error.detail.stock),
        );
    }
  }
  return fallback;
}

export type AppCart = Omit<CartDTO, "items"> & {
  items: CartLine[];
};

type Cart = AppCart;

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useCartQuery() {
  return useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: () => getCartAction() as Promise<AppCart>,
  });
}

/**
 * Optimized hook for the navbar cart count.
 * Leverages the existing cart query cache.
 */
export function useCartCount() {
  const { data: cart } = useCartQuery();
  return (
    (cart as Cart | undefined)?.items.reduce(
      (sum: number, item: CartLine) => sum + item.quantity,
      0,
    ) ?? 0
  );
}

// ─── Optimistic Mutations ─────────────────────────────────────────────────────

/**
 * Add to cart — optimistically bumps the item count in cache
 * so the navbar badge updates instantly (WhatsApp-style).
 */
export function useAddToCartMutation() {
  const queryClient = useQueryClient();
  const { t } = useUiPreferences();

  return useMutation({
    mutationFn: async ({
      variantId,
      quantity,
    }: {
      variantId: string;
      quantity: number;
    }) => {
      const result = await addToCartAction(variantId, quantity);
      if (!result.success) throw new CartMutationException(result.error);
      return result;
    },

    onMutate: async ({ variantId, quantity }) => {
      // 1. Cancel any in-flight cart fetches so they don't overwrite our optimistic data
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });

      // 2. Snapshot the current cache
      const previousCart = queryClient.getQueryData<Cart>(CART_QUERY_KEY);

      // 3. Optimistically update the cache
      if (previousCart) {
        const existingItem = previousCart.items.find(
          (i: CartLine) => i.variantId === variantId,
        );
        const updatedItems = existingItem
          ? previousCart.items.map((i: CartLine) =>
              i.variantId === variantId ? { ...i, quantity: i.quantity + quantity } : i,
            )
          : [
              ...previousCart.items,
              {
                id: `temp-${Date.now()}`,
                variantId,
                quantity,
                variant: {
                  id: variantId,
                  colorName: "",
                  size: "",
                  images: [] as string[],
                  price: 0,
                  compareAtPrice: null as number | null,
                  product: {
                    id: "",
                    slug: "",
                    name: t("account.loading"),
                    translations: [] as { locale: string; name: string }[],
                  },
                },
              },
            ];

        queryClient.setQueryData<Cart>(CART_QUERY_KEY, {
          ...previousCart,
          items: updatedItems,
        });
      }

      return { previousCart };
    },

    onError: (error, _vars, context) => {
      // Rollback to snapshot on error
      if (context?.previousCart) {
        queryClient.setQueryData(CART_QUERY_KEY, context.previousCart);
      }
      toast.error(resolveCartErrorMessage(error, t("toast.error.addToCart"), t));
    },

    onSettled: () => {
      // Always refetch for server truth after mutation settles
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });
}

/**
 * Update quantity — instantly shows the new quantity in the cart.
 * The total recalculates client-side immediately.
 */
export function useUpdateQuantityMutation() {
  const queryClient = useQueryClient();
  const { t } = useUiPreferences();

  return useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const result = await updateCartQuantityAction(itemId, quantity);
      if (!result.success) throw new CartMutationException(result.error);
      return result;
    },

    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previousCart = queryClient.getQueryData<Cart>(CART_QUERY_KEY);

      if (previousCart) {
        queryClient.setQueryData<Cart>(CART_QUERY_KEY, {
          ...previousCart,
          items: previousCart.items.map((i: CartLine) =>
            i.id === itemId ? { ...i, quantity } : i,
          ),
        });
      }

      return { previousCart };
    },

    onError: (error, _vars, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(CART_QUERY_KEY, context.previousCart);
      }
      toast.error(resolveCartErrorMessage(error, t("toast.error.updateQuantity"), t));
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });
}

/**
 * Remove item — instantly removes the item from the list.
 * If the server fails, the item snaps back with an error toast.
 */
export function useRemoveItemMutation() {
  const queryClient = useQueryClient();
  const { t } = useUiPreferences();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const result = await removeFromCartAction(itemId);
      if (!result.success) throw new CartMutationException(result.error);
      return result;
    },

    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previousCart = queryClient.getQueryData<Cart>(CART_QUERY_KEY);

      if (previousCart) {
        queryClient.setQueryData<Cart>(CART_QUERY_KEY, {
          ...previousCart,
          items: previousCart.items.filter((i: CartLine) => i.id !== itemId),
        });
      }

      return { previousCart };
    },

    onError: (error, _vars, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(CART_QUERY_KEY, context.previousCart);
      }
      toast.error(resolveCartErrorMessage(error, t("toast.error.removeItem"), t));
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });
}

/**
 * Sync cart — merges guest cart into user cart after login.
 * Optimistic: keeps the current cache visible while syncing and cancels in-flight fetches
 * so a parallel refetch cannot briefly replace guest lines with an empty user cart.
 */
export function useSyncCartMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => syncCartAction(),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previousCart = queryClient.getQueryData<Cart>(CART_QUERY_KEY);
      return { previousCart };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousCart !== undefined) {
        queryClient.setQueryData(CART_QUERY_KEY, context.previousCart);
      }
    },

    onSettled: () => {
      // Always reconcile after auth: item ids must match the server user cart even when no merge ran.
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });
}
