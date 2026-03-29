import type { getShopProductsAction } from "@/app/actions/catalog";
import type { OrderStatus, ReviewStatus } from "@/generated/prisma/client";

export type ShopCatalogParams = Parameters<typeof getShopProductsAction>[0];

export const PRODUCT_QUERY_KEYS = {
  home: ["products", "home"] as const,
  shop: (filters: ShopCatalogParams) => ["products", "shop", filters] as const,
  details: (id: string) => ["products", "details", id] as const,
  categories: ["categories"] as const,
};

export const CART_QUERY_KEY = ["cart"] as const;

export const AUTH_QUERY_KEY = ["session"] as const;

export const ADMIN_QUERY_KEYS = {
  stats: ["admin", "stats"] as const,
  recentOrders: ["admin", "recent-orders"] as const,
  products: (page: number) => ["admin", "products", page] as const,
  orders: (page: number, status?: OrderStatus) =>
    ["admin", "orders", page, status] as const,
  users: (page: number) => ["admin", "users", page] as const,
  reviews: (page: number, status?: ReviewStatus) =>
    ["admin", "reviews", page, status] as const,
};
