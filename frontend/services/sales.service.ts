/**
 * Sales Service
 * Handles all sales-related API operations
 * Enhanced with Phase 1 offline support (customer dependency tracking)
 */

import api, { apiHelpers } from './api';
import {
  ApiResponse,
  PaginationResponse,
  CreateSaleDto,
  SaleDto,
  VoidSaleDto,
  SalesStatsDto,
  CreateReturnDto,
  ReturnResponseDto,
  CanReturnResponseDto,
} from '@/types/api.types';
import { isTempId } from '@/lib/id-mapper';
import offlineSyncQueue from '@/lib/offline-sync';

/**
 * Query parameters for listing sales
 */
export interface GetSalesParams {
  page?: number;
  pageSize?: number;
  dateFrom?: string;
  dateTo?: string;
  customerId?: string;
  cashierId?: string;
  invoiceType?: number;
  paymentMethod?: number;
  isVoided?: boolean;
  search?: string;
}

/**
 * Query parameters for sales statistics
 */
export interface GetSalesStatsParams {
  dateFrom: string;
  dateTo: string;
  branchId?: string;
}

/**
 * Sales Service - Handles all sales operations
 */
class SalesService {
  private basePath = '/api/v1/sales';

  /**
   * Create a new sale transaction
   * Phase 1: Enhanced with customer dependency tracking for offline support
   * @param saleData - Sale creation data
   * @returns Created sale with calculated totals
   */
  async createSale(saleData: CreateSaleDto): Promise<SaleDto> {
    try {
      // Check if customer is a temp ID (created offline)
      // If so, update the queued transaction to include customer dependency
      if (saleData.customerId) {
        const customerIdStr = saleData.customerId.toString();

        if (isTempId(customerIdStr)) {
          // Customer was created offline - find the CREATE transaction
          const customerCreateTxn = await offlineSyncQueue.findByEntityTempId(customerIdStr);

          if (customerCreateTxn) {
            console.log(
              `Sale references offline customer ${customerIdStr}. ` +
              `Dependency will be tracked during sync.`
            );

            // Note: The actual dependency tracking happens in the offline sync queue
            // when the sale transaction is queued (e.g., from pending orders)
            // This check ensures the customer exists in the offline queue
          }
        }
      }

      const response = await api.post<ApiResponse<SaleDto>>(
        this.basePath,
        saleData
      );
      return response.data.data!;
    } catch (error) {
      const errorMessage = apiHelpers.getErrorMessage(error);
      throw new Error(`Failed to create sale: ${errorMessage}`);
    }
  }

  /**
   * Get a list of sales with optional filtering and pagination
   * @param params - Query parameters for filtering and pagination
   * @returns Paginated list of sales
   */
  async getSales(params?: GetSalesParams): Promise<PaginationResponse<SaleDto>> {
    try {
      const queryString = params ? apiHelpers.buildQueryString(params) : '';
      const url = queryString ? `${this.basePath}?${queryString}` : this.basePath;

      const response = await api.get<PaginationResponse<SaleDto>>(url);
      return response.data;
    } catch (error) {
      const errorMessage = apiHelpers.getErrorMessage(error);
      throw new Error(`Failed to fetch sales: ${errorMessage}`);
    }
  }

  /**
   * Get details of a specific sale by ID
   * @param id - Sale ID
   * @returns Sale details with line items
   */
  async getSaleById(id: string): Promise<SaleDto> {
    try {
      const response = await api.get<ApiResponse<SaleDto>>(
        `${this.basePath}/${id}`
      );
      return response.data.data!;
    } catch (error) {
      const errorMessage = apiHelpers.getErrorMessage(error);
      throw new Error(`Failed to fetch sale: ${errorMessage}`);
    }
  }

  /**
   * Void (cancel) a sale transaction
   * Manager permission required
   * @param id - Sale ID
   * @param voidData - Void reason
   * @returns Voided sale details
   */
  async voidSale(id: string, voidData: VoidSaleDto): Promise<SaleDto> {
    try {
      const response = await api.post<ApiResponse<SaleDto>>(
        `${this.basePath}/${id}/void`,
        voidData
      );
      return response.data.data!;
    } catch (error) {
      const errorMessage = apiHelpers.getErrorMessage(error);
      throw new Error(`Failed to void sale: ${errorMessage}`);
    }
  }

  /**
   * Get printable invoice for a sale
   * @param id - Sale ID
   * @param format - Output format (pdf, html, json)
   * @returns Invoice data or blob (for PDF)
   */
  async getInvoice(
    id: string,
    format: 'pdf' | 'html' | 'json' = 'pdf'
  ): Promise<Blob | string | any> {
    try {
      const url = `${this.basePath}/${id}/invoice?format=${format}`;

      if (format === 'pdf') {
        // Return blob for PDF
        const response = await api.get(url, {
          responseType: 'blob',
        });
        return response.data;
      } else if (format === 'html') {
        // Return HTML string
        const response = await api.get(url, {
          responseType: 'text',
        });
        return response.data;
      } else {
        // Return JSON data
        const response = await api.get<ApiResponse<any>>(url);
        return response.data.data!;
      }
    } catch (error) {
      const errorMessage = apiHelpers.getErrorMessage(error);
      throw new Error(`Failed to get invoice: ${errorMessage}`);
    }
  }

  /**
   * Get sales statistics for dashboard/reports
   * @param params - Date range and optional branch filter
   * @returns Sales statistics
   */
  async getSalesStats(params: GetSalesStatsParams): Promise<SalesStatsDto> {
    try {
      const queryString = apiHelpers.buildQueryString(params);
      const response = await api.get<ApiResponse<SalesStatsDto>>(
        `${this.basePath}/stats?${queryString}`
      );
      return response.data.data!;
    } catch (error: any) {
      console.error('Sales stats error:', error);
      console.error('Sales stats error response:', error.response?.data);
      const errorMessage = apiHelpers.getErrorMessage(error);
      // Re-throw the original error to preserve response data
      if (error.response) {
        throw error;
      }
      throw new Error(`Failed to fetch sales statistics: ${errorMessage}`);
    }
  }

  /**
   * Download invoice as PDF file
   * @param id - Sale ID
   * @param filename - Optional filename (defaults to invoice number)
   */
  async downloadInvoicePdf(id: string, filename?: string): Promise<void> {
    try {
      const blob = await this.getInvoice(id, 'pdf') as Blob;

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `invoice-${id}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const errorMessage = apiHelpers.getErrorMessage(error);
      throw new Error(`Failed to download invoice: ${errorMessage}`);
    }
  }

  /**
   * Print invoice (opens print dialog)
   * @param id - Sale ID
   */
  async printInvoice(id: string): Promise<void> {
    try {
      const html = await this.getInvoice(id, 'html') as string;

      // Open print window with invoice HTML
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();

        // Wait for content to load then print
        printWindow.onload = () => {
          printWindow.print();
        };
      } else {
        throw new Error('Failed to open print window. Please check popup blocker settings.');
      }
    } catch (error) {
      const errorMessage = apiHelpers.getErrorMessage(error);
      throw new Error(`Failed to print invoice: ${errorMessage}`);
    }
  }

  /**
   * Update payment for an existing sale
   * @param saleId - Sale ID
   * @param paymentData - Payment update data
   * @returns Updated sale
   */
  async updateSalePayment(saleId: string, paymentData: {
    paymentMethod: number;
    amountPaid: number;
    changeReturned?: number;
    discountType?: number;
    discountValue?: number;
  }): Promise<SaleDto> {
    try {
      const response = await api.put<ApiResponse<SaleDto>>(
        `${this.basePath}/${saleId}/payment`,
        paymentData
      );
      return response.data.data!;
    } catch (error) {
      const errorMessage = apiHelpers.getErrorMessage(error);
      throw new Error(`Failed to update payment: ${errorMessage}`);
    }
  }

  /**
   * Process a return (full or partial) for a sale
   * Requires Manager or Admin role
   * @param returnData - Return request data
   * @returns Return response with refund details
   */
  async processReturn(returnData: CreateReturnDto): Promise<ReturnResponseDto> {
    try {
      const response = await api.post<ApiResponse<ReturnResponseDto>>(
        `${this.basePath}/return`,
        returnData
      );
      return response.data.data!;
    } catch (error) {
      const errorMessage = apiHelpers.getErrorMessage(error);
      throw new Error(`Failed to process return: ${errorMessage}`);
    }
  }

  /**
   * Get all returns for a specific sale
   * @param saleId - Original sale ID
   * @returns List of return sales
   */
  async getReturnsForSale(saleId: string): Promise<SaleDto[]> {
    try {
      const response = await api.get<ApiResponse<SaleDto[]>>(
        `${this.basePath}/${saleId}/returns`
      );
      return response.data.data!;
    } catch (error) {
      const errorMessage = apiHelpers.getErrorMessage(error);
      throw new Error(`Failed to fetch returns: ${errorMessage}`);
    }
  }

  /**
   * Check if a sale can be returned
   * @param saleId - Sale ID to check
   * @returns Whether the sale can be returned
   */
  async canReturnSale(saleId: string): Promise<CanReturnResponseDto> {
    try {
      const response = await api.get<ApiResponse<CanReturnResponseDto>>(
        `${this.basePath}/${saleId}/can-return`
      );
      return response.data.data!;
    } catch (error) {
      const errorMessage = apiHelpers.getErrorMessage(error);
      throw new Error(`Failed to check return status: ${errorMessage}`);
    }
  }
}

// Export singleton instance
const salesService = new SalesService();
export default salesService;
