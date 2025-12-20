"use client";

import useSWR from "swr";
import deliveryService from "@/services/delivery.service";
import { DeliveryOrderDto, DeliveryStatus, DriverDto } from "@/types/api.types";

interface DeliveryParams {
  status?: DeliveryStatus | null;
  search?: string;
  driverId?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface DriverParams {
  isActive?: boolean;
  isAvailable?: boolean;
}

/**
 * Custom SWR hook for fetching delivery orders with filters
 */
export function useDeliveries(params: DeliveryParams = {}) {
  const key = params ? ["deliveries", JSON.stringify(params)] : null;

  const { data, error, isLoading, mutate } = useSWR(
    key,
    async () => {
      const cleanParams: any = {
        status: params.status ?? undefined,
        search: params.search || undefined,
        driverId: params.driverId || undefined,
      };

      // Add date range if specified
      if (params.dateFrom) {
        const fromDate = new Date(params.dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        cleanParams.dateFrom = fromDate.toISOString();
      }
      if (params.dateTo) {
        const toDate = new Date(params.dateTo);
        toDate.setHours(23, 59, 59, 999);
        cleanParams.dateTo = toDate.toISOString();
      }

      const response = await deliveryService.getDeliveryOrders(cleanParams);
      return response.data;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      // Don't use suspense for user-triggered filters - it causes the page to suspend on every filter change
    }
  );

  return {
    deliveries: data as DeliveryOrderDto[] | undefined,
    isLoading,
    error,
    mutate, // For manual revalidation
  };
}

/**
 * Custom SWR hook for fetching a single delivery order
 */
export function useDelivery(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `delivery-${id}` : null,
    async () => {
      if (!id) return null;
      const response = await deliveryService.getDeliveryOrderById(id);
      return response;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    delivery: data as DeliveryOrderDto | null | undefined,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Custom SWR hook for fetching drivers
 */
export function useDrivers(params: DriverParams = {}) {
  const key = ["drivers", JSON.stringify(params)];

  const { data, error, isLoading, mutate } = useSWR(
    key,
    async () => {
      const response = await deliveryService.getDrivers(params);
      return response.data;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000,
      suspense: true, // Enable Suspense integration
    }
  );

  return {
    drivers: data as DriverDto[] | undefined,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Custom SWR hook for fetching delivery status history
 */
export function useDeliveryStatusHistory(deliveryId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    deliveryId ? `delivery-history-${deliveryId}` : null,
    async () => {
      if (!deliveryId) return [];
      // TODO: Implement backend endpoint for status history
      // For now, return empty array
      return [];
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    statusHistory: data as any[] | undefined,
    isLoading,
    error,
    mutate,
  };
}
