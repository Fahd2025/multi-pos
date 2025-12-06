/**
 * Supplier Service
 * Frontend service for supplier management operations
 */

import api from './api';
import { SupplierDto, CreateSupplierDto, UpdateSupplierDto, PurchaseDto, PaginationResponse } from '@/types/api.types';

/**
 * Supplier filter parameters
 */
export interface SupplierFilters {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  includeInactive?: boolean;
}

/**
 * Supplier purchase history filter parameters
 */
export interface SupplierHistoryFilters {
  page?: number;
  pageSize?: number;
}

/**
 * Supplier Service
 * Handles all supplier-related API operations
 */
class SupplierService {
  /**
   * Get suppliers with filtering and pagination
   */
  async getSuppliers(filters: SupplierFilters = {}): Promise<PaginationResponse<SupplierDto>> {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
    if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
    if (filters.includeInactive !== undefined) params.append('includeInactive', filters.includeInactive.toString());

    const response = await api.get<PaginationResponse<SupplierDto>>(
      `/api/v1/suppliers?${params.toString()}`
    );

    return response.data;
  }

  /**
   * Get supplier by ID
   */
  async getSupplierById(id: string): Promise<SupplierDto> {
    const response = await api.get<{ data: SupplierDto }>(`/api/v1/suppliers/${id}`);
    return response.data.data;
  }

  /**
   * Create a new supplier
   */
  async createSupplier(supplier: CreateSupplierDto): Promise<SupplierDto> {
    const response = await api.post<{ data: SupplierDto }>('/api/v1/suppliers', supplier);
    return response.data.data;
  }

  /**
   * Update an existing supplier
   */
  async updateSupplier(id: string, supplier: UpdateSupplierDto): Promise<SupplierDto> {
    const response = await api.put<{ data: SupplierDto }>(`/api/v1/suppliers/${id}`, supplier);
    return response.data.data;
  }

  /**
   * Delete a supplier (smart delete - soft if has purchases, hard if not)
   */
  async deleteSupplier(id: string): Promise<void> {
    await api.delete(`/api/v1/suppliers/${id}`);
  }

  /**
   * Get supplier purchase history
   */
  async getSupplierPurchaseHistory(
    id: string,
    filters: SupplierHistoryFilters = {}
  ): Promise<PurchaseDto[]> {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());

    const response = await api.get<{ data: PurchaseDto[] }>(
      `/api/v1/suppliers/${id}/history?${params.toString()}`
    );

    return response.data.data;
  }

  /**
   * Search suppliers by code, name, email, or phone
   * Convenience method for quick supplier lookup
   */
  async searchSuppliers(searchTerm: string, limit: number = 10): Promise<SupplierDto[]> {
    const response = await this.getSuppliers({
      searchTerm,
      pageSize: limit,
      includeInactive: false,
    });

    return response.data;
  }
}

// Export singleton instance
const supplierService = new SupplierService();
export default supplierService;
