/**
 * Customer Service
 * Frontend service for customer management and CRM operations
 */

import api from './api';
import { CustomerDto, CreateCustomerDto, UpdateCustomerDto, SaleDto, PaginationResponse, ApiResponse } from '@/types/api.types';

/**
 * Customer filter parameters
 */
export interface CustomerFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
}

/**
 * Customer purchase history filter parameters
 */
export interface CustomerHistoryFilters {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}

/**
 * Customer Service
 * Handles all customer-related API operations
 */
class CustomerService {
  /**
   * Get customers with filtering and pagination
   */
  async getCustomers(filters: CustomerFilters = {}): Promise<PaginationResponse<CustomerDto>> {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());

    const response = await api.get<PaginationResponse<CustomerDto>>(
      `/api/v1/customers?${params.toString()}`
    );

    return response.data;
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(id: string): Promise<CustomerDto> {
    const response = await api.get<CustomerDto>(`/api/v1/customers/${id}`);
    return response.data;
  }

  /**
   * Create a new customer
   */
  async createCustomer(customer: CreateCustomerDto): Promise<CustomerDto> {
    const response = await api.post<{ data: CustomerDto }>('/api/v1/customers', customer);
    return response.data.data;
  }

  /**
   * Update an existing customer
   */
  async updateCustomer(id: string, customer: UpdateCustomerDto): Promise<CustomerDto> {
    const response = await api.put<{ data: CustomerDto }>(`/api/v1/customers/${id}`, customer);
    return response.data.data;
  }

  /**
   * Delete a customer (soft delete)
   */
  async deleteCustomer(id: string): Promise<void> {
    await api.delete(`/api/v1/customers/${id}`);
  }

  /**
   * Get customer purchase history
   */
  async getCustomerPurchaseHistory(
    id: string,
    filters: CustomerHistoryFilters = {}
  ): Promise<PaginationResponse<SaleDto>> {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await api.get<PaginationResponse<SaleDto>>(
      `/api/v1/customers/${id}/history?${params.toString()}`
    );

    return response.data;
  }

  /**
   * Search customers by name, email, or phone
   * Convenience method for quick customer lookup
   */
  async searchCustomers(searchTerm: string, limit: number = 10): Promise<CustomerDto[]> {
    const response = await this.getCustomers({
      search: searchTerm,
      pageSize: limit,
      isActive: true,
    });

    return response.data;
  }
}

// Export singleton instance
const customerService = new CustomerService();
export default customerService;
