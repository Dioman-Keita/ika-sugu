"use client";

import { useQuery } from "@tanstack/react-query";
import { 
  getHomeCatalogAction, 
  getShopProductsAction, 
  getProductPageAction, 
  getCategoriesAction 
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

export function useShopProducts(
  params: Parameters<typeof getShopProductsAction>[0]
) {
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
