"use client";

import useSWR from "swr";
import zoneService from "@/services/zone.service";
import { ZoneDto } from "@/types/api.types";

/**
 * Custom SWR hook for fetching all zones
 */
export function useZones() {
  const { data, error, isLoading, mutate } = useSWR(
    "zones",
    async () => {
      const response = await zoneService.getZones();
      return response;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // Zones change infrequently
      suspense: true, // Enable Suspense integration
    }
  );

  return {
    zones: data as ZoneDto[] | undefined,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Custom SWR hook for fetching a single zone by ID
 */
export function useZone(id: number | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id !== null ? `zone-${id}` : null,
    async () => {
      if (id === null) return null;
      const response = await zoneService.getZoneById(id);
      return response;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    zone: data as ZoneDto | null | undefined,
    isLoading,
    error,
    mutate,
  };
}
