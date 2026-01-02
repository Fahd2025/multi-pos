"use client";

import useSWR from "swr";
import deliveryService from "@/services/delivery.service";
import { DeliveryOrderDto } from "@/types/api.types";

/**
 * Custom SWR hook for fetching unassigned deliveries
 * Auto-refreshes every 10 seconds for real-time dispatch updates
 */
export function useUnassignedDeliveries() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/v1/delivery-orders/unassigned",
    () => deliveryService.getUnassignedDeliveries(),
    {
      refreshInterval: 10000, // 10-second refresh for real-time updates
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // Prevent duplicate requests within 5 seconds
    }
  );

  return {
    deliveries: data as DeliveryOrderDto[] | undefined,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Custom SWR hook for fetching active deliveries assigned to a specific driver
 * Auto-refreshes every 10 seconds for real-time tracking
 */
export function useActiveDeliveriesByDriver(driverId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    driverId ? `/api/v1/delivery-orders/driver/${driverId}/active` : null,
    () => (driverId ? deliveryService.getActiveDeliveriesByDriver(driverId) : null),
    {
      refreshInterval: 10000, // 10-second refresh for real-time updates
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    deliveries: data as DeliveryOrderDto[] | undefined,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Custom SWR hook for fetching all delivery orders with filters
 * Used for general delivery list views
 */
export function useDeliveryOrders(params?: {
  status?: number;
  driverId?: string;
  customerId?: string;
  page?: number;
  pageSize?: number;
}) {
  const key = params ? ["delivery-orders", JSON.stringify(params)] : "delivery-orders";

  const { data, error, isLoading, mutate } = useSWR(
    key,
    async () => {
      const response = await deliveryService.getDeliveryOrders(params);
      return response;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  return {
    deliveries: data?.data as DeliveryOrderDto[] | undefined,
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Custom SWR hook for fetching a single delivery order by ID
 */
export function useDeliveryOrder(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/v1/delivery-orders/${id}` : null,
    () => (id ? deliveryService.getDeliveryOrderById(id) : null),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    delivery: data as DeliveryOrderDto | undefined,
    isLoading,
    isError: error,
    mutate,
  };
}
