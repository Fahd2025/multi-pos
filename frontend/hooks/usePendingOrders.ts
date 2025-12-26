"use client";

import useSWR from "swr";
import pendingOrdersService, {
  GetPendingOrdersParams,
} from "@/services/pending-orders.service";
import {
  PendingOrderDto,
  PendingOrderStatsDto,
  PendingOrderStatus,
} from "@/types/api.types";

/**
 * Custom SWR hook for fetching pending orders with filters
 */
export function usePendingOrders(params: GetPendingOrdersParams = {}) {
  const key = ["pending-orders", JSON.stringify(params)];

  const { data, error, isLoading, mutate } = useSWR(
    key,
    async () => {
      console.log("🔄 Fetching pending orders with params:", params);
      const response = await pendingOrdersService.getPendingOrders(params);
      console.log("✅ Pending orders response:", response);
      console.log("📦 Pending orders data array:", response.data);
      return response;
    },
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 10000, // Auto-refresh every 10 seconds for real-time updates
      dedupingInterval: 5000,
    }
  );

  console.log("🎯 usePendingOrders hook result:", {
    hasData: !!data,
    pendingOrdersCount: (data?.data as any)?.items?.length,
    isLoading,
    hasError: !!error,
  });

  // Extract items array from paginated response
  const items = (data?.data as any)?.items as PendingOrderDto[] | undefined;
  const pagination = data?.data ? {
    page: (data.data as any).page,
    pageSize: (data.data as any).pageSize,
    totalItems: (data.data as any).totalCount,
    totalPages: (data.data as any).totalPages,
    hasNextPage: (data.data as any).hasNextPage,
    hasPreviousPage: (data.data as any).hasPreviousPage,
  } : undefined;

  return {
    pendingOrders: items,
    pagination,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Custom SWR hook for fetching a single pending order by ID
 */
export function usePendingOrder(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `pending-order-${id}` : null,
    async () => {
      if (!id) return null;
      const response = await pendingOrdersService.getPendingOrderById(id);
      return response;
    },
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    pendingOrder: data as PendingOrderDto | null | undefined,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Custom SWR hook for fetching pending orders statistics
 * Manager only
 */
export function usePendingOrderStats() {
  const { data, error, isLoading, mutate } = useSWR(
    "pending-orders-stats",
    async () => {
      const response = await pendingOrdersService.getStats();
      return response;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  );

  return {
    stats: data as PendingOrderStatsDto | undefined,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Custom SWR hook for searching pending orders
 * Returns undefined when search query is empty
 */
export function usePendingOrderSearch(searchQuery: string) {
  const trimmedQuery = searchQuery.trim();
  const key = trimmedQuery ? ["pending-order-search", trimmedQuery] : null;

  const { data, error, isLoading } = useSWR(
    key,
    async () => {
      const response = await pendingOrdersService.getPendingOrders({
        search: trimmedQuery,
        pageSize: 50,
      });
      // Backend returns data in format: { data: { items: [], ... } }
      return (response.data as any)?.items as PendingOrderDto[];
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 3000,
      keepPreviousData: true,
    }
  );

  return {
    searchResults: data as PendingOrderDto[] | undefined,
    isSearching: isLoading,
    error,
  };
}

/**
 * Custom SWR hook for fetching pending orders count (for badge)
 */
export function usePendingOrdersCount(status?: PendingOrderStatus) {
  const params = status !== undefined ? { status, pageSize: 1 } : { pageSize: 1 };
  const key = ["pending-orders-count", JSON.stringify(params)];

  const { data, error, isLoading, mutate } = useSWR(
    key,
    async () => {
      const response = await pendingOrdersService.getPendingOrders(params);
      // Backend returns data in format: { data: { items: [], totalCount: N, ... } }
      return (response.data as any)?.totalCount as number;
    },
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 10000, // Auto-refresh every 10 seconds
      dedupingInterval: 5000,
    }
  );

  return {
    count: data as number | undefined,
    isLoading,
    error,
    mutate,
  };
}
