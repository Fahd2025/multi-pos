/**
 * Pending Orders Service
 * Handles all pending orders-related API operations
 */

import api, { apiHelpers } from './api';
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
   * @param orderData - Pending order creation data
   * @returns Created pending order
   */
  async createPendingOrder(
    orderData: CreatePendingOrderDto
  ): Promise<PendingOrderDto> {
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
