"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { AUTH_QUERY_KEY } from "./query-keys";

export function useSessionQuery() {
  return useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await authClient.getSession();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes fresh
  });
}

/**
 * Re-exposes the better-auth logic but synchronized with 
 * TanStack Query's invalidation system if needed.
 */
export function useAuth() {
  const { data: session, isLoading, error } = useSessionQuery();
  
  return {
    session,
    user: session?.user,
    isLoading,
    error,
    isAuthenticated: !!session?.user,
  };
}

export function useSignOutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await authClient.signOut();
    },
    onSuccess: () => {
      // Clear the session from cache
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      queryClient.invalidateQueries();
    },
  });
}
