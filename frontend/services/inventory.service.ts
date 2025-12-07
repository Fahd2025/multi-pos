/**
 * Inventory Service
 * Frontend service for inventory management (products, categories, stock)
 */

import api from './api';
import {
  ProductDto,
  CreateProductDto,
  UpdateProductDto,
  CategoryDto,
  StockAdjustmentDto,
  PaginationResponse,
  PurchaseDto,
  CreatePurchaseDto,
  SupplierDto,
  CreateSupplierDto,
  ApiResponse,
} from '@/types/api.types';

/**
 * Product filter parameters
 */
export interface ProductFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  lowStock?: boolean;
  outOfStock?: boolean;
}

/**
 * Purchase filter parameters
 */
export interface PurchaseFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  supplierName?: string;
  status?: 'received' | 'pending';
  paymentStatus?: 'paid' | 'partial' | 'unpaid';
}

/**
 * Inventory Service
 * Handles all inventory-related API operations
 */
class InventoryService {
  // ==================== PRODUCTS ====================

  /**
   * Get products with filtering and pagination
   */
  async getProducts(filters: ProductFilters = {}): Promise<PaginationResponse<ProductDto>> {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters.lowStock) params.append('lowStock', filters.lowStock.toString());
    if (filters.outOfStock) params.append('outOfStock', filters.outOfStock.toString());

    const response = await api.get<PaginationResponse<ProductDto>>(
      `/api/v1/products?${params.toString()}`
    );

    return response.data;
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string): Promise<ProductDto> {
    const response = await api.get<ProductDto>(`/api/v1/products/${id}`);
    return response.data;
  }

  /**
   * Create a new product
   */
  async createProduct(product: CreateProductDto): Promise<ProductDto> {
    const response = await api.post<{ data: ProductDto }>('/api/v1/products', product);
    return response.data.data;
  }

  /**
   * Update an existing product
   */
  async updateProduct(id: string, product: UpdateProductDto): Promise<ProductDto> {
    const response = await api.put<{ data: ProductDto }>(`/api/v1/products/${id}`, product);
    return response.data.data;
  }

  /**
   * Delete a product
   */
  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/api/v1/products/${id}`);
  }

  /**
   * Adjust product stock
   */
  async adjustStock(id: string, adjustment: StockAdjustmentDto): Promise<ProductDto> {
    const response = await api.post<{ data: ProductDto }>(
      `/api/v1/products/${id}/adjust-stock`,
      adjustment
    );
    return response.data.data;
  }

  // ==================== CATEGORIES ====================

  /**
   * Get all categories
   */
  async getCategories(): Promise<CategoryDto[]> {
    const response = await api.get<ApiResponse<CategoryDto[]>>('/api/v1/categories');
    return response.data.data || [];
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string): Promise<CategoryDto> {
    const response = await api.get<ApiResponse<CategoryDto>>(`/api/v1/categories/${id}`);
    return response.data.data!;
  }

  /**
   * Create a new category
   */
  async createCategory(category: {
    code: string;
    nameEn: string;
    nameAr: string;
    descriptionEn?: string;
    descriptionAr?: string;
    parentCategoryId?: string;
    displayOrder: number;
  }): Promise<CategoryDto> {
    const response = await api.post<ApiResponse<CategoryDto>>('/api/v1/categories', category);
    return response.data.data!;
  }

  /**
   * Update an existing category
   */
  async updateCategory(
    id: string,
    category: {
      code: string;
      nameEn: string;
      nameAr: string;
      descriptionEn?: string;
      descriptionAr?: string;
      parentCategoryId?: string;
      displayOrder: number;
    }
  ): Promise<CategoryDto> {
    const response = await api.put<ApiResponse<CategoryDto>>(`/api/v1/categories/${id}`, category);
    return response.data.data!;
  }

  /**
   * Delete a category
   */
  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/api/v1/categories/${id}`);
  }

  // ==================== PURCHASES ====================

  /**
   * Get purchases with filtering and pagination
   */
  async getPurchases(filters: PurchaseFilters = {}): Promise<PaginationResponse<PurchaseDto>> {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.supplierName) params.append('supplierName', filters.supplierName);
    if (filters.status) params.append('status', filters.status);

    // Map payment status string to enum value
    if (filters.paymentStatus) {
      let paymentStatusValue: number;
      switch (filters.paymentStatus) {
        case 'unpaid':
          paymentStatusValue = 0; // Pending
          break;
        case 'partial':
          paymentStatusValue = 1; // Partial
          break;
        case 'paid':
          paymentStatusValue = 2; // Paid
          break;
        default:
          paymentStatusValue = 0;
      }
      params.append('paymentStatus', paymentStatusValue.toString());
    }

    const response = await api.get<PaginationResponse<PurchaseDto>>(
      `/api/v1/purchases?${params.toString()}`
    );

    return response.data;
  }

  /**
   * Create a new purchase
   */
  async createPurchase(purchase: CreatePurchaseDto): Promise<ApiResponse<PurchaseDto>> {
    const response = await api.post('/api/v1/purchases', purchase);
    return response.data;
  }

  /**
   * Mark purchase as received
   */
  async receivePurchase(id: string): Promise<ApiResponse<PurchaseDto>> {
    const response = await api.post(`/api/v1/purchases/${id}/receive`);
    return response.data;
  }

  // ==================== SUPPLIERS ====================

  /**
   * Get suppliers
   */
  async getSuppliers(): Promise<SupplierDto[]> {
    const response = await api.get('/api/v1/suppliers');
    return response.data.data;
  }

  /**
   * Create a new supplier
   */
  async createSupplier(supplier: CreateSupplierDto): Promise<ApiResponse<SupplierDto>> {
    const response = await api.post('/api/v1/suppliers', supplier);
    return response.data;
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get low stock products count
   */
  async getLowStockCount(): Promise<number> {
    const response = await this.getProducts({ lowStock: true, pageSize: 1 });
    return response.pagination.totalItems;
  }

  /**
   * Get out of stock products count
   */
  async getOutOfStockCount(): Promise<number> {
    const response = await this.getProducts({ outOfStock: true, pageSize: 1 });
    return response.pagination.totalItems;
  }

  /**
   * Get total products count
   */
  async getTotalProductsCount(): Promise<number> {
    const response = await this.getProducts({ pageSize: 1 });
    return response.pagination.totalItems;
  }

  /**
   * Get total categories count
   */
  async getTotalCategoriesCount(): Promise<number> {
    const categories = await this.getCategories();
    return categories.length;
  }
}

// Export singleton instance
const inventoryService = new InventoryService();
export default inventoryService;
