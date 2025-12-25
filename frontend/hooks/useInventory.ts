"use client";

import useSWR from "swr";
import inventoryService from "@/services/inventory.service";
import { CategoryDto, ProductDto } from "@/types/api.types";

interface ProductParams {
  categoryId?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Custom SWR hook for fetching categories
 */
export function useCategories() {
  const { data, error, isLoading, mutate } = useSWR(
    "categories",
    async () => {
      const response = await inventoryService.getCategories();
      return response;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // Categories change infrequently
    }
  );

  return {
    categories: data as CategoryDto[] | undefined,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Custom SWR hook for fetching products with filters
 */
export function useProducts(params: ProductParams = {}) {
  const key = ["products", JSON.stringify(params)];

  const { data, error, isLoading, mutate } = useSWR(
    key,
    async () => {
      const response = await inventoryService.getProducts(params);
      return response.data;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000,
    }
  );

  return {
    products: data as ProductDto[] | undefined,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Custom SWR hook for product search
 * Returns undefined when search query is empty
 */
export function useProductSearch(searchQuery: string) {
  const trimmedQuery = searchQuery.trim();
  const key = trimmedQuery ? ["product-search", trimmedQuery] : null;

  const { data, error, isLoading } = useSWR(
    key,
    async () => {
      const response = await inventoryService.getProducts({
        search: trimmedQuery,
        isActive: true,
        pageSize: 50,
      });
      return response.data;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 5000,
      // Keep previous data while loading to prevent flickering
      keepPreviousData: true,
    }
  );

  return {
    searchResults: data as ProductDto[] | undefined,
    isSearching: isLoading,
    error,
  };
}

/**
 * Custom SWR hook for fetching a single product by ID
 */
export function useProduct(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `product-${id}` : null,
    async () => {
      if (!id) return null;
      const response = await inventoryService.getProductById(id);
      return response;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    product: data as ProductDto | null | undefined,
    isLoading,
    error,
    mutate,
  };
}

/**
 * Custom SWR hook for fetching a single category by ID
 */
export function useCategory(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `category-${id}` : null,
    async () => {
      if (!id) return null;
      const response = await inventoryService.getCategoryById(id);
      return response;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    category: data as CategoryDto | null | undefined,
    isLoading,
    error,
    mutate,
  };
}
