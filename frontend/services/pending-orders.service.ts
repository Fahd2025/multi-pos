/**
 * Pending Orders Service
 * Handles all pending orders-related API operations
 */

import api, { apiHelpers } from './api';
import offlineSyncQueue from '@/lib/offline-sync';
import {
  ApiResponse,
  PaginationResponse,
  CreatePendingOrderDto,
  UpdatePendingOrderDto,
  PendingOrderDto,
  RetrievePendingOrderDto,
  PendingOrderStatsDto,
  PendingOrderStatus,
} from '@/types/api.types';

/**
 * Query parameters for listing pending orders
 */
export interface GetPendingOrdersParams {
  page?: number;
  pageSize?: number;
  status?: PendingOrderStatus;
  createdBy?: string;
  orderType?: number;
  tableNumber?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Pending Orders Service - Handles all pending orders operations
 */
class PendingOrdersService {
  private basePath = '/api/v1/pending-orders';

  /**
   * Create a new pending order
   * Supports offline mode by queuing transaction for sync when back online
   * @param orderData - Pending order creation data
   * @returns Created pending order (or optimistic response if offline)
   */
  async createPendingOrder(
    orderData: CreatePendingOrderDto
  ): Promise<PendingOrderDto> {
    // Check if online
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    // If offline, queue transaction for sync
    if (!isOnline) {
      try {
        // Get branch and user context from local storage or session
        const branchId = localStorage.getItem('branchId') || '';
        const userId = localStorage.getItem('userId') || '';

        // Queue transaction for offline sync
        const transactionId = await offlineSyncQueue.add({
          type: 'pending_order',
          timestamp: new Date(),
          branchId,
          userId,
          data: orderData,
        });

        // Return optimistic response
        const optimisticResponse: PendingOrderDto = {
          id: transactionId, // Use transaction ID as temporary ID
          orderNumber: `PO-OFFLINE-${Date.now()}`, // Temporary order number
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          customerId: orderData.customerId,
          tableId: orderData.tableId,
          tableNumber: orderData.tableNumber?.toString(),
          guestCount: orderData.guestCount,
          items: orderData.items,
          subtotal: orderData.subtotal,
          taxAmount: orderData.taxAmount,
          discountAmount: orderData.discountAmount,
          totalAmount: orderData.totalAmount,
          notes: orderData.notes,
          orderType: orderData.orderType,
          status: orderData.status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdByUserId: userId,
          createdByUsername: localStorage.getItem('username') || 'Unknown',
          retrievedAt: undefined,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        };

        return optimisticResponse;
      } catch (error) {
        const errorMessage = apiHelpers.getErrorMessage(error);
        throw new Error(`Failed to queue pending order for offline sync: ${errorMessage}`);
      }
    }

    // Online - create pending order normally
    try {
      const response = await api.post<ApiResponse<PendingOrderDto>>(
        this.basePath,
        orderData
      );
      return response.data.data!;
    } catch (error) {
      const errorMessage = apiHelpers.getErrorMessage(error);
      throw new Error(`Failed to create pending order: ${errorMessage}`);
    }
  }

  /**
   * Get a list of pending orders with optional filtering and pagination
   * @param params - Query parameters for filtering and pagination
   * @returns Paginated list of pending orders
   */
  async getPendingOrders(
    params?: GetPendingOrdersParams
  ): Promise<ApiResponse<any>> {
    try {
      const queryString = params ? apiHelpers.buildQueryString(params) : '';
      const url = queryString ? `${this.basePath}?${queryString}` : this.basePath;

      // Backend returns ApiResponse with nested paginated data structure
      const response = await api.get<ApiResponse<any>>(url);
      return response.data;
    } catch (error) {
      const errorMessage = apiHelpers.getErrorMessage(error);
      throw new Error(`Failed to fetch pending orders: ${errorMessage}`);
    }
  }

  /**
   * Get a pending order by ID
   * @param id - Pending order ID
   * @returns Pending order details
   */
  async getPendingOrderById(id: string): Promise<PendingOrderDto> {
    try {
      const response = await api.get<ApiResponse<PendingOrderDto>>(
        `${this.basePath}/${id}`
      );
      return response.data.data!;
    } catch (error) {
      const errorMessage = apiHelpers.getErrorMessage(error);
      throw new Error(`Failed to fetch pending order: ${errorMessage}`);
    }
  }

  /**
   * Update a pending order
   * @param id - Pending order ID
   * @param orderData - Updated pending order data
   * @returns Updated pending order
   */
  async updatePendingOrder(
    id: string,
    orderData: UpdatePendingOrderDto
  ): Promise<PendingOrderDto> {
    try {
      const response = await api.put<ApiResponse<PendingOrderDto>>(
        `${this.basePath}/${id}`,
        orderData
      );
      return response.data.data!;
    } catch (error) {
      const errorMessage = apiHelpers.getErrorMessage(error);
      throw new Error(`Failed to update pending order: ${errorMessage}`);
    }
  }

  /**
   * Delete a pending order
   * @param id - Pending order ID
   * @returns Success response
   */
  async deletePendingOrder(id: string): Promise<void> {
    try {
      await api.delete(`${this.basePath}/${id}`);
    } catch (error) {
      const errorMessage = apiHelpers.getErrorMessage(error);
      throw new Error(`Failed to delete pending order: ${errorMessage}`);
    }
  }

  /**
   * Retrieve a pending order (marks it as Retrieved)
   * @param id - Pending order ID
   * @returns Retrieved pending order
   */
  async retrievePendingOrder(id: string): Promise<RetrievePendingOrderDto> {
    try {
      const response = await api.post<ApiResponse<RetrievePendingOrderDto>>(
        `${this.basePath}/${id}/retrieve`
      );
      return response.data.data!;
    } catch (error) {
      const errorMessage = apiHelpers.getErrorMessage(error);
      throw new Error(`Failed to retrieve pending order: ${errorMessage}`);
    }
  }

  /**
   * Convert a pending order to a completed sale
   * @param id - Pending order ID
   * @returns Created sale
   */
  async convertToSale(id: string): Promise<any> {
    try {
      const response = await api.post<ApiResponse<any>>(
        `${this.basePath}/${id}/convert-to-sale`
      );
      return response.data.data!;
    } catch (error) {
      const errorMessage = apiHelpers.getErrorMessage(error);
      throw new Error(`Failed to convert pending order to sale: ${errorMessage}`);
    }
  }

  /**
   * Get pending orders statistics (Manager only)
   * @returns Statistics about pending orders
   */
  async getStats(): Promise<PendingOrderStatsDto> {
    try {
      const response = await api.get<ApiResponse<PendingOrderStatsDto>>(
        `${this.basePath}/stats`
      );
      return response.data.data!;
    } catch (error) {
      const errorMessage = apiHelpers.getErrorMessage(error);
      throw new Error(`Failed to fetch pending orders stats: ${errorMessage}`);
    }
  }
}

// Export singleton instance
const pendingOrdersService = new PendingOrdersService();
export default pendingOrdersService;
