"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminStats,
  getRecentOrders,
  getAdminProducts,
  getAdminOrders,
  getAdminUsers,
  getAdminReviews,
  createAdminProduct,
  updateAdminProduct,
  updateOrderStatusAction,
  updateReviewStatusAction,
} from "@/app/actions/admin";
import { OrderStatus, ProductStatus, ReviewStatus } from "@/generated/prisma/client";
import { PRODUCT_QUERY_KEYS, ADMIN_QUERY_KEYS } from "./query-keys";
import { toast } from "sonner";
import { useUiPreferences } from "@/lib/ui-preferences";

type CreateProductInput = Parameters<typeof createAdminProduct>[0];
type UpdateProductInput = Parameters<typeof updateAdminProduct>[0];
type UpdateProductResult = Awaited<ReturnType<typeof updateAdminProduct>>;

type AdminOrdersCache = {
  orders: Array<{ id: string; status: OrderStatus } & Record<string, unknown>>;
} & Record<string, unknown>;

type AdminReviewsCache = {
  reviews: Array<{ id: string; status: ReviewStatus } & Record<string, unknown>>;
} & Record<string, unknown>;

function isAdminOrdersCache(data: unknown): data is AdminOrdersCache {
  return (
    typeof data === "object" &&
    data !== null &&
    "orders" in data &&
    Array.isArray((data as AdminOrdersCache).orders)
  );
}

function isAdminReviewsCache(data: unknown): data is AdminReviewsCache {
  return (
    typeof data === "object" &&
    data !== null &&
    "reviews" in data &&
    Array.isArray((data as AdminReviewsCache).reviews)
  );
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useAdminStats() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.stats,
    queryFn: () => getAdminStats(),
  });
}

export function useRecentOrders() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.recentOrders,
    queryFn: () => getRecentOrders(),
  });
}

export function useAdminProducts(page: number = 1, status?: ProductStatus) {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.products(page), status ?? "ALL"],
    queryFn: () => getAdminProducts({ page, status }),
  });
}

export function useAdminOrders(page: number = 1, status?: OrderStatus) {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.orders(page, status),
    queryFn: () => getAdminOrders({ page, status }),
  });
}

export function useAdminUsers(page: number = 1) {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.users(page),
    queryFn: () => getAdminUsers({ page }),
  });
}

export function useAdminReviews(page: number = 1, status?: ReviewStatus) {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.reviews(page, status),
    queryFn: () => getAdminReviews({ page, status }),
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateProductMutation() {
  const queryClient = useQueryClient();
  const { t } = useUiPreferences();
  return useMutation({
    mutationFn: (data: CreateProductInput) => createAdminProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.home });
      toast.success(t("toast.success.createProduct"));
    },
    onError: () => {
      toast.error(t("toast.error.createProduct"));
    },
  });
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient();
  const { t } = useUiPreferences();
  return useMutation({
    mutationFn: (data: UpdateProductInput) => updateAdminProduct(data),
    onSuccess: (data: UpdateProductResult) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.details(data.id) });
      toast.success(t("toast.success.updateProduct"));
    },
    onError: () => {
      toast.error(t("toast.error.updateProduct"));
    },
  });
}

/**
 * Update order status — optimistically updates the status badge in the table.
 */
export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient();
  const { t } = useUiPreferences();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      updateOrderStatusAction(id, status),

    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "orders"] });

      const previousQueries = queryClient.getQueriesData({
        queryKey: ["admin", "orders"],
      });

      queryClient.setQueriesData({ queryKey: ["admin", "orders"] }, (old) => {
        if (!isAdminOrdersCache(old)) return old;
        return {
          ...old,
          orders: old.orders.map((o) => (o.id === id ? { ...o, status } : o)),
        };
      });

      return { previousQueries };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error(t("toast.error.updateOrderStatus"));
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.stats });
    },
  });
}

/**
 * Update review status — optimistically toggles Approved/Rejected badge.
 * Like WhatsApp reactions: instant visual feedback, silent rollback on failure.
 */
export function useUpdateReviewStatusMutation() {
  const queryClient = useQueryClient();
  const { t } = useUiPreferences();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReviewStatus }) =>
      updateReviewStatusAction(id, status),

    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "reviews"] });

      const previousQueries = queryClient.getQueriesData({
        queryKey: ["admin", "reviews"],
      });

      queryClient.setQueriesData({ queryKey: ["admin", "reviews"] }, (old) => {
        if (!isAdminReviewsCache(old)) return old;
        return {
          ...old,
          reviews: old.reviews.map((r) => (r.id === id ? { ...r, status } : r)),
        };
      });

      return { previousQueries };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error(t("toast.error.updateReviewStatus"));
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.stats });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
