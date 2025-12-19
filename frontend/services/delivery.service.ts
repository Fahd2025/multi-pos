/**
 * Delivery Service
 * Handles all delivery-related API operations
 */

import api, { apiHelpers } from './api';
import {
  ApiResponse,
  PaginationResponse,
  DeliveryOrderDto,
  CreateDeliveryOrderDto,
  UpdateDeliveryOrderDto,
  DriverDto,
  CreateDriverDto,
  UpdateDriverDto,
  GetDeliveryOrdersParams,
} from '@/types/api.types';

/**
 * Delivery Service - Handles all delivery and driver operations
 */
class DeliveryService {
  private deliveryBasePath = '/api/v1/delivery-orders';
  private driversBasePath = '/api/v1/drivers';

  // ============================
  // Driver Management Methods
  // ============================

  /**
   * Create a new driver
   * @param driverData - Driver creation data
   * @returns Created driver
   */
  async createDriver(driverData: CreateDriverDto): Promise<DriverDto> {
    try {
      const response = await api.post<ApiResponse<DriverDto>>(
        this.driversBasePath,
        driverData
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to create driver');
      }

      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.errors) {
        // Handle validation errors
        const validationErrors = error.response.data.errors;
        const errorMessages = Object.values(validationErrors).flat().join(', ');
        throw new Error(`Validation failed: ${errorMessages}`);
      }

      const errorMessage = apiHelpers.getErrorMessage(error);
      throw new Error(`Failed to create driver: ${errorMessage}`);
    }
  }

  /**
   * Get a list of drivers with optional filtering
   * @param params - Query parameters for filtering
   * @returns Paginated list of drivers
   */
  async getDrivers(params?: {
    isActive?: boolean;
    isAvailable?: boolean;
    search?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginationResponse<DriverDto>> {
    try {
      const queryString = params ? apiHelpers.buildQueryString(params) : '';
      const url = queryString
        ? `${this.driversBasePath}?${queryString}`
        : this.driversBasePath;

      const response = await api.get<PaginationResponse<DriverDto>>(url);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch drivers');
      }

      return response.data;
    } catch (error: any) {
      if (error.response?.data?.errors) {
        // Handle validation errors
        const validationErrors = error.response.data.errors;
        const errorMessages = Object.values(validationErrors).flat().join(', ');
        throw new Error(`Validation failed: ${errorMessages}`);
      }

      const errorMessage = apiHelpers.getErrorMessage(error);
      throw new Error(`Failed to fetch drivers: ${errorMessage}`);
    }
  }

  /**
   * Get driver details by ID
   * @param id - Driver ID
   * @returns Driver details
   */
  async getDriverById(id: string): Promise<DriverDto> {
    try {
      const response = await api.get<ApiResponse<DriverDto>>(
        `${this.driversBasePath}/${id}`
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || `Driver with ID ${id} not found`);
      }

      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.errors) {
        // Handle validation errors
        const validationErrors = error.response.data.errors;
        const errorMessages = Object.values(validationErrors).flat().join(', ');
        throw new Error(`Validation failed: ${errorMessages}`);
      }

      const errorMessage = apiHelpers.getErrorMessage(error);
      throw new Error(`Failed to fetch driver: ${errorMessage}`);
    }
  }

  /**
   * Update driver details
   * @param id - Driver ID
   * @param driverData - Driver update data
   * @returns Updated driver details
   */
  async updateDriver(id: string, driverData: UpdateDriverDto): Promise<DriverDto> {
    try {
      const response = await api.put<ApiResponse<DriverDto>>(
        `${this.driversBasePath}/${id}`,
        driverData
      );
      return response.data.data!;
    } catch (error) {
      const errorMessage = apiHelpers.getErrorMessage(error);
      throw new Error(`Failed to update driver: ${errorMessage}`);
    }
  }

  /**
   * Delete (deactivate) a driver
   * @param id - Driver ID
   * @returns Success status
   */
  async deleteDriver(id: string): Promise<boolean> {
    try {
      const response = await api.delete<ApiResponse<boolean>>(
        `${this.driversBasePath}/${id}`
      );
      return response.data.success;
    } catch (error) {
      const errorMessage = apiHelpers.getErrorMessage(error);
      throw new Error(`Failed to delete driver: ${errorMessage}`);
    }
  }

  // ============================
  // Delivery Order Management Methods
  // ============================

  /**
   * Create a new delivery order
   * @param deliveryData - Delivery order creation data
   * @returns Created delivery order
   */
  async createDeliveryOrder(deliveryData: CreateDeliveryOrderDto): Promise<DeliveryOrderDto> {
    try {
      const response = await api.post<ApiResponse<DeliveryOrderDto>>(
        this.deliveryBasePath,
        deliveryData
      );
      return response.data.data!;
    } catch (error) {
      const errorMessage = apiHelpers.getErrorMessage(error);
      throw new Error(`Failed to create delivery order: ${errorMessage}`);
    }
  }

  /**
   * Get a list of delivery orders with optional filtering and pagination
   * @param params - Query parameters for filtering and pagination
   * @returns Paginated list of delivery orders
   */
  async getDeliveryOrders(params?: GetDeliveryOrdersParams): Promise<PaginationResponse<DeliveryOrderDto>> {
    try {
      const queryString = params ? apiHelpers.buildQueryString(params) : '';
      const url = queryString 
        ? `${this.deliveryBasePath}?${queryString}` 
        : this.deliveryBasePath;

      const response = await api.get<PaginationResponse<DeliveryOrderDto>>(url);
      return response.data;
    } catch (error) {
      const errorMessage = apiHelpers.getErrorMessage(error);
      throw new Error(`Failed to fetch delivery orders: ${errorMessage}`);
    }
  }

  /**
   * Get delivery order details by ID
   * @param id - Delivery order ID
   * @returns Delivery order details
   */
  async getDeliveryOrderById(id: string): Promise<DeliveryOrderDto> {
    try {
      const response = await api.get<ApiResponse<DeliveryOrderDto>>(
        `${this.deliveryBasePath}/${id}`
      );
      return response.data.data!;
    } catch (error) {
      const errorMessage = apiHelpers.getErrorMessage(error);
      throw new Error(`Failed to fetch delivery order: ${errorMessage}`);
    }
  }

  /**
   * Update delivery order details
   * @param id - Delivery order ID
   * @param deliveryData - Delivery order update data
   * @returns Updated delivery order details
   */
  async updateDeliveryOrder(id: string, deliveryData: UpdateDeliveryOrderDto): Promise<DeliveryOrderDto> {
    try {
      const response = await api.put<ApiResponse<DeliveryOrderDto>>(
        `${this.deliveryBasePath}/${id}`,
        deliveryData
      );
      return response.data.data!;
    } catch (error) {
      const errorMessage = apiHelpers.getErrorMessage(error);
      throw new Error(`Failed to update delivery order: ${errorMessage}`);
    }
  }

  /**
   * Delete a delivery order
   * @param id - Delivery order ID
   * @returns Success status
   */
  async deleteDeliveryOrder(id: string): Promise<boolean> {
    try {
      const response = await api.delete<ApiResponse<boolean>>(
        `${this.deliveryBasePath}/${id}`
      );
      return response.data.success;
    } catch (error) {
      const errorMessage = apiHelpers.getErrorMessage(error);
      throw new Error(`Failed to delete delivery order: ${errorMessage}`);
    }
  }

  /**
   * Assign a driver to a delivery order
   * @param deliveryOrderId - Delivery order ID
   * @param driverId - Driver ID to assign
   * @returns Updated delivery order with assigned driver
   */
  async assignDriverToDeliveryOrder(deliveryOrderId: string, driverId: string): Promise<DeliveryOrderDto> {
    try {
      const response = await api.post<ApiResponse<DeliveryOrderDto>>(
        `${this.deliveryBasePath}/${deliveryOrderId}/assign-driver`,
        { driverId }
      );
      return response.data.data!;
    } catch (error) {
      const errorMessage = apiHelpers.getErrorMessage(error);
      throw new Error(`Failed to assign driver to delivery order: ${errorMessage}`);
    }
  }

  /**
   * Update delivery status
   * @param deliveryOrderId - Delivery order ID
   * @param status - New delivery status
   * @returns Updated delivery order with new status
   */
  async updateDeliveryStatus(deliveryOrderId: string, status: number): Promise<DeliveryOrderDto> {
    try {
      const response = await api.put<ApiResponse<DeliveryOrderDto>>(
        `${this.deliveryBasePath}/${deliveryOrderId}/status`,
        { status }
      );
      return response.data.data!;
    } catch (error) {
      const errorMessage = apiHelpers.getErrorMessage(error);
      throw new Error(`Failed to update delivery status: ${errorMessage}`);
    }
  }
}

// Export singleton instance
const deliveryService = new DeliveryService();
export default deliveryService;