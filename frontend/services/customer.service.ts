/**
 * Customer Service
 * Frontend service for customer management and CRM operations
 * Enhanced with Phase 1 offline support (CREATE/UPDATE/DELETE)
 */

import api from './api';
import { CustomerDto, CreateCustomerDto, UpdateCustomerDto, SaleDto, PaginationResponse, ApiResponse } from '@/types/api.types';
import { isOfflineFeatureEnabled } from '@/lib/feature-flags';
import { generateTempId, isTempId } from '@/lib/id-mapper';
import offlineSyncQueue from '@/lib/offline-sync';

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
    const response = await api.get<{ data: CustomerDto }>(`/api/v1/customers/${id}`);
    return response.data.data;
  }

  /**
   * Create a new customer
   * Phase 1: Supports offline creation with temp ID generation
   */
  async createCustomer(customer: CreateCustomerDto): Promise<CustomerDto> {
    const isOnline = navigator.onLine;

    // Offline mode with feature flag enabled
    if (!isOnline && isOfflineFeatureEnabled('CUSTOMER_CREATE')) {
      const tempId = generateTempId('customer');
      const branchId = localStorage.getItem('branchId') || '';
      const userId = localStorage.getItem('userId') || '';

      // Queue transaction for offline sync
      await offlineSyncQueue.add({
        type: 'customer_create',
        timestamp: new Date(),
        branchId,
        userId,
        data: { ...customer, tempId },
        dependencies: [], // No dependencies for CREATE
        entityTempId: tempId, // Track temp ID for later mapping
      });

      // Return optimistic response with temp ID
      return {
        id: tempId,
        ...customer,
        totalPurchases: 0,
        visitCount: 0,
        lastVisitAt: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: userId,
        sales: [],
        deliveryOrders: [],
      } as CustomerDto;
    }

    // Online mode or feature disabled - normal API call
    if (!isOnline) {
      throw new Error('Customer creation requires internet connection (offline feature disabled)');
    }

    const response = await api.post<{ data: CustomerDto }>('/api/v1/customers', customer);
    return response.data.data;
  }

  /**
   * Update an existing customer
   * Phase 1: Supports offline updates with dependency tracking
   */
  async updateCustomer(id: string, customer: UpdateCustomerDto): Promise<CustomerDto> {
    const isOnline = navigator.onLine;
    const isTemporary = isTempId(id);

    // Offline mode with feature flag enabled
    if (!isOnline && isOfflineFeatureEnabled('CUSTOMER_UPDATE')) {
      const branchId = localStorage.getItem('branchId') || '';
      const userId = localStorage.getItem('userId') || '';
      let dependencies: string[] = [];

      // If temp ID, find the CREATE transaction and add as dependency
      if (isTemporary) {
        const createTxn = await offlineSyncQueue.findByEntityTempId(id);
        if (createTxn) {
          dependencies = [createTxn.id];
        }
      }

      // Queue UPDATE transaction
      await offlineSyncQueue.add({
        type: 'customer_update',
        timestamp: new Date(),
        branchId,
        userId,
        data: { id, ...customer },
        dependencies, // Depends on CREATE if temp ID
        entityId: id, // Track entity ID for conflict detection
      });

      // Return optimistic response (merge with existing data from cache/local storage)
      const existing = await this.getCustomerById(id).catch(() => null);
      if (existing) {
        return { ...existing, ...customer, updatedAt: new Date().toISOString() };
      }

      // Fallback: return partial response
      return {
        id,
        ...customer,
        updatedAt: new Date().toISOString(),
      } as CustomerDto;
    }

    // Online mode or feature disabled - normal API call
    if (!isOnline) {
      throw new Error('Customer update requires internet connection (offline feature disabled)');
    }

    const response = await api.put<{ data: CustomerDto }>(`/api/v1/customers/${id}`, customer);
    return response.data.data;
  }

  /**
   * Delete a customer (soft delete)
   * Phase 1: Supports offline deletion with CREATE cancellation
   */
  async deleteCustomer(id: string): Promise<void> {
    const isOnline = navigator.onLine;
    const isTemporary = isTempId(id);

    // Offline mode with feature flag enabled
    if (!isOnline && isOfflineFeatureEnabled('CUSTOMER_DELETE')) {
      const branchId = localStorage.getItem('branchId') || '';
      const userId = localStorage.getItem('userId') || '';

      // If temp ID (created offline), cancel the CREATE transaction
      if (isTemporary) {
        const createTxn = await offlineSyncQueue.findByEntityTempId(id);
        if (createTxn) {
          await offlineSyncQueue.cancel(createTxn.id);
          // Remove from local optimistic state (handled by caller)
          return;
        }
      }

      // Real ID - queue DELETE transaction
      await offlineSyncQueue.add({
        type: 'customer_delete',
        timestamp: new Date(),
        branchId,
        userId,
        data: { id },
        dependencies: [],
        entityId: id,
      });

      return;
    }

    // Online mode or feature disabled - normal API call
    if (!isOnline) {
      throw new Error('Customer deletion requires internet connection (offline feature disabled)');
    }

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
