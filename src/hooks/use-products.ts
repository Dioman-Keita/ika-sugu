"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getHomeCatalogAction,
  getShopProductsAction,
  getProductPageAction,
  getCategoriesAction,
} from "@/app/actions/catalog";
import { Locale } from "@/lib/i18n/messages";
import { PRODUCT_QUERY_KEYS } from "./query-keys";

export function useHomeProducts(locale: Locale = "en") {
  return useQuery({
    queryKey: [...PRODUCT_QUERY_KEYS.home, locale],
    queryFn: () => getHomeCatalogAction(locale),
    staleTime: 5 * 60 * 1000, // 5 minutes fresh
  });
}

export function useShopProducts(params: Parameters<typeof getShopProductsAction>[0]) {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.shop(params),
    queryFn: () => getShopProductsAction(params),
    staleTime: 2 * 60 * 1000, // 2 minutes fresh
  });
}

export function useProductDetails(id: string, locale: Locale = "en") {
  return useQuery({
    queryKey: [...PRODUCT_QUERY_KEYS.details(id), locale],
    queryFn: () => getProductPageAction(id, locale),
    staleTime: 5 * 60 * 1000, // 5 minutes fresh
  });
}

export function useCategories(locale: Locale = "en") {
  return useQuery({
    queryKey: [...PRODUCT_QUERY_KEYS.categories, locale],
    queryFn: () => getCategoriesAction(locale),
    staleTime: 60 * 60 * 1000, // 1 hour fresh
  });
}

// Mutations
import { createProductReviewAction } from "@/app/actions/reviews";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUiPreferences } from "@/lib/ui-preferences";

function isProductDetailsWithReviews(
  data: unknown,
): data is { reviews: unknown[] } & Record<string, unknown> {
  return (
    typeof data === "object" &&
    data !== null &&
    "reviews" in data &&
    Array.isArray((data as { reviews: unknown }).reviews)
  );
}

export function useCreateReviewMutation(productId: string) {
  const queryClient = useQueryClient();
  const { t } = useUiPreferences();
  return useMutation({
    mutationFn: (data: { rating: number; content: string }) =>
      createProductReviewAction({ productId, ...data }),

    onMutate: async (newReview) => {
      // Cancel queries to avoid racing with the optimistic update
      await queryClient.cancelQueries({
        queryKey: PRODUCT_QUERY_KEYS.details(productId),
      });

      // Snapshot the current state
      const previousProductData = queryClient.getQueriesData({
        queryKey: PRODUCT_QUERY_KEYS.details(productId),
      });

      // Optimistically update the UI in all locales for this product
      queryClient.setQueriesData(
        { queryKey: PRODUCT_QUERY_KEYS.details(productId) },
        (old) => {
          if (!isProductDetailsWithReviews(old)) return old;
          const fakeReview = {
            id: `temp-${Date.now()}`,
            rating: newReview.rating,
            content: newReview.content,
            status: "PENDING",
            createdAt: new Date(),
            user: {
              name: "Vous",
            },
          };
          return {
            ...old,
            reviews: [fakeReview, ...old.reviews],
          };
        },
      );

      return { previousProductData };
    },

    onError: (_err, _newReview, context) => {
      // Rollback on error
      if (context?.previousProductData) {
        for (const [key, data] of context.previousProductData) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error(t("toast.error.createReview"));
    },

    onSettled: () => {
      // Refetch after error or success to sync with server state
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.details(productId) });
    },
  });
}
