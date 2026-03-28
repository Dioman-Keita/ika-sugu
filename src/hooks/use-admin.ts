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
  updateReviewStatusAction
} from "@/app/actions/admin";
import { PRODUCT_QUERY_KEYS, ADMIN_QUERY_KEYS } from "./query-keys";

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

// Mutations
export function useCreateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createAdminProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.home });
    },
  });
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => updateAdminProduct(data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.details(data.id) });
    },
  });
}

export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: any }) => updateOrderStatusAction(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.stats });
    },
  });
}

export function useUpdateReviewStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: any }) => updateReviewStatusAction(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.stats });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
