"use client";

import useSWR from "swr";
import tableService from "@/services/table.service";
import { TableDto, TableWithStatusDto } from "@/types/api.types";

/**
 * Custom SWR hook for fetching all tables (optionally filtered by zone)
 */
export function useTables(zoneId?: number) {
  const key = zoneId !== undefined ? ["tables", zoneId] : "tables";

  const { data, error, isLoading, mutate } = useSWR(
    key,
    async () => {
      const response = await tableService.getTables(zoneId);
      return response;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // Tables change infrequently
      fallbackData: [], // Provide fallback for SSR
    }
  );

  return {
    tables: data as TableDto[] | undefined,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Custom SWR hook for fetching tables with real-time status (optionally filtered by zone)
 * This hook polls more frequently to keep status up-to-date
 */
export function useTablesWithStatus(zoneId?: number) {
  const key = zoneId !== undefined ? ["tables-status", zoneId] : "tables-status";

  const { data, error, isLoading, mutate } = useSWR(
    key,
    async () => {
      const response = await tableService.getTablesWithStatus(zoneId);
      return response;
    },
    {
      revalidateOnFocus: true, // Revalidate when user focuses window
      revalidateOnReconnect: true,
      refreshInterval: 10000, // Auto-refresh every 10 seconds for real-time status
      dedupingInterval: 5000,
      fallbackData: [], // Provide fallback for SSR
    }
  );

  return {
    tables: data as TableWithStatusDto[] | undefined,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Custom SWR hook for fetching a single table by ID
 */
export function useTable(id: number | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id !== null ? `table-${id}` : null,
    async () => {
      if (id === null) return null;
      const response = await tableService.getTableById(id);
      return response;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    table: data as TableDto | null | undefined,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Custom SWR hook for fetching a single table by number
 */
export function useTableByNumber(number: number | null) {
  const { data, error, isLoading, mutate } = useSWR(
    number !== null ? `table-number-${number}` : null,
    async () => {
      if (number === null) return null;
      const response = await tableService.getTableByNumber(number);
      return response;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    table: data as TableDto | null | undefined,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Custom SWR hook for fetching available tables (optionally filtered by zone)
 */
export function useAvailableTables(zoneId?: number) {
  const key = zoneId !== undefined ? ["available-tables", zoneId] : "available-tables";

  const { data, error, isLoading, mutate } = useSWR(
    key,
    async () => {
      const response = await tableService.getAvailableTables(zoneId);
      return response;
    },
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 10000, // Auto-refresh every 10 seconds
      dedupingInterval: 5000,
      fallbackData: [], // Provide fallback for SSR
    }
  );

  return {
    availableTables: data as TableWithStatusDto[] | undefined,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Custom SWR hook for fetching occupied tables (optionally filtered by zone)
 */
export function useOccupiedTables(zoneId?: number) {
  const key = zoneId !== undefined ? ["occupied-tables", zoneId] : "occupied-tables";

  const { data, error, isLoading, mutate } = useSWR(
    key,
    async () => {
      const response = await tableService.getOccupiedTables(zoneId);
      return response;
    },
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 10000, // Auto-refresh every 10 seconds
      dedupingInterval: 5000,
      fallbackData: [], // Provide fallback for SSR
    }
  );

  return {
    occupiedTables: data as TableWithStatusDto[] | undefined,
    isLoading,
    error,
    mutate,
  };
}
