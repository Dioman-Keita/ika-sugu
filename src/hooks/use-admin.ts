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
import { PRODUCT_QUERY_KEYS, ADMIN_QUERY_KEYS } from "./query-keys";
import { toast } from "sonner";
import { useUiPreferences } from "@/lib/ui-preferences";

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

export function useAdminProducts(page: number = 1) {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.products(page),
    queryFn: () => getAdminProducts({ page }),
  });
}

export function useAdminOrders(page: number = 1, status?: any) {
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

export function useAdminReviews(page: number = 1, status?: any) {
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
    mutationFn: (data: any) => createAdminProduct(data),
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
    mutationFn: (data: any) => updateAdminProduct(data),
    onSuccess: (data: any) => {
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
    mutationFn: ({ id, status }: { id: string; status: any }) =>
      updateOrderStatusAction(id, status),

    onMutate: async ({ id, status }) => {
      // Cancel all admin order queries
      await queryClient.cancelQueries({ queryKey: ["admin", "orders"] });

      // Snapshot all order caches (we don't know which page/status tab is active)
      const previousQueries = queryClient.getQueriesData({ queryKey: ["admin", "orders"] });

      // Optimistically update the status in every cached page
      queryClient.setQueriesData<any>({ queryKey: ["admin", "orders"] }, (old: any) => {
        if (!old?.orders) return old;
        return {
          ...old,
          orders: old.orders.map((o: any) => (o.id === id ? { ...o, status } : o)),
        };
      });

      return { previousQueries };
    },

    onError: (_err, _vars, context) => {
      // Rollback all order caches
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
    mutationFn: ({ id, status }: { id: string; status: any }) =>
      updateReviewStatusAction(id, status),

    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "reviews"] });

      const previousQueries = queryClient.getQueriesData({ queryKey: ["admin", "reviews"] });

      queryClient.setQueriesData<any>({ queryKey: ["admin", "reviews"] }, (old: any) => {
        if (!old?.reviews) return old;
        return {
          ...old,
          reviews: old.reviews.map((r: any) => (r.id === id ? { ...r, status } : r)),
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
