"use client";

import useSWR from "swr";
import deliveryService from "@/services/delivery.service";
import { DriverDto, DriverStatsDto, DriverPerformanceDto } from "@/types/api.types";

interface DriversParams {
  isActive?: boolean;
  isAvailable?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Custom SWR hook for fetching all drivers with filters
 */
export function useDrivers(params: DriversParams = {}) {
  const key = params ? ["drivers", JSON.stringify(params)] : null;

  const { data, error, isLoading, mutate } = useSWR(
    key,
    async () => {
      const response = await deliveryService.getDrivers(params);
      return response.data;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  return {
    drivers: data as DriverDto[] | undefined,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Custom SWR hook for fetching a single driver by ID
 */
export function useDriver(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/v1/drivers/${id}` : null,
    () => (id ? deliveryService.getDriverById(id) : null),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    driver: data as DriverDto | undefined,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Custom SWR hook for fetching available drivers
 */
export function useAvailableDrivers() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/v1/drivers/available",
    () => deliveryService.getAvailableDrivers(),
    {
      refreshInterval: 10000, // Refresh every 10 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    drivers: data as DriverDto[] | undefined,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Custom SWR hook for fetching driver statistics
 */
export function useDriverStats(id: string | null, from?: Date, to?: Date) {
  const key = id
    ? [
        `/api/v1/drivers/${id}/stats`,
        from?.toISOString(),
        to?.toISOString(),
      ]
    : null;

  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => (id ? deliveryService.getDriverStats(id, from, to) : null),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    stats: data as DriverStatsDto | undefined,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Custom SWR hook for fetching driver performance history
 */
export function useDriverPerformanceHistory(
  id: string | null,
  page = 1,
  pageSize = 20
) {
  const key = id
    ? [`/api/v1/drivers/${id}/performance`, page, pageSize]
    : null;

  const { data, error, isLoading, mutate } = useSWR(
    key,
    () =>
      id
        ? deliveryService.getDriverPerformanceHistory(id, page, pageSize)
        : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    performances: data as DriverPerformanceDto[] | undefined,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Custom SWR hook for fetching driver active deliveries count
 */
export function useDriverActiveCount(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/v1/drivers/${id}/active-count` : null,
    () => (id ? deliveryService.getDriverActiveCount(id) : null),
    {
      refreshInterval: 10000, // Refresh every 10 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  return {
    count: data as number | undefined,
    isLoading,
    isError: error,
    mutate,
  };
}
