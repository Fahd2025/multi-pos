import axios from './api';

// ============================================
// Report Types
// ============================================

export interface SalesReportRequest {
  startDate?: string;
  endDate?: string;
  branchId?: string;
  cashierId?: string;
  customerId?: string;
  paymentMethod?: string;
  groupBy?: 'day' | 'week' | 'month';
}

export interface InventoryReportRequest {
  branchId?: string;
  categoryId?: string;
  lowStockOnly?: boolean;
  negativeStockOnly?: boolean;
  includeMovements?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface FinancialReportRequest {
  startDate?: string;
  endDate?: string;
  branchId?: string;
  groupBy?: 'day' | 'week' | 'month';
}

export interface ExportReportRequest {
  reportType: 'sales' | 'inventory' | 'financial';
  format: 'pdf' | 'excel' | 'csv';
  startDate?: string;
  endDate?: string;
  filters?: Record<string, any>;
  options?: ExportOptions;
}

export interface ExportOptions {
  includeCharts?: boolean;
  includeDetails?: boolean;
  pageOrientation?: 'portrait' | 'landscape';
  delimiter?: string;
  includeHeaders?: boolean;
  sheetNames?: string[];
}

// ============================================
// Report Response Types
// ============================================

export interface SalesReport {
  reportType: string;
  generatedAt: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  filters: {
    branchId?: string;
    branchName?: string;
    paymentMethod?: string;
    cashierId?: string;
    cashierName?: string;
    customerId?: string;
    customerName?: string;
  };
  summary: {
    totalSales: number;
    totalRevenue: number;
    totalTax: number;
    totalDiscount: number;
    averageSaleValue: number;
    topPaymentMethod: string;
    salesByPaymentMethod: Record<string, { count: number; amount: number }>;
  };
  timeSeriesData: Array<{
    period: string;
    salesCount: number;
    totalRevenue: number;
    totalTax: number;
    averageSaleValue: number;
  }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantitySold: number;
    totalRevenue: number;
  }>;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    purchaseCount: number;
    totalSpent: number;
  }>;
}

export interface InventoryReport {
  reportType: string;
  generatedAt: string;
  filters: {
    branchId?: string;
    branchName?: string;
    categoryId?: string;
    categoryName?: string;
    lowStockOnly: boolean;
    negativeStockOnly: boolean;
  };
  summary: {
    totalProducts: number;
    totalCategories: number;
    totalStockValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    negativeStockCount: number;
    averageStockValue: number;
  };
  products: Array<{
    productId: string;
    sku: string;
    productName: string;
    categoryName?: string;
    currentStock: number;
    minStockThreshold: number;
    unitPrice: number;
    stockValue: number;
    status: string;
    lastRestockedAt?: string;
    discrepancyFlag: boolean;
  }>;
  stockMovements: Array<{
    date: string;
    productId: string;
    productName: string;
    type: string;
    quantityChange: number;
    referenceId?: string;
    notes?: string;
  }>;
}

export interface FinancialReport {
  reportType: string;
  generatedAt: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  filters: {
    branchId?: string;
    branchName?: string;
  };
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    grossProfit: number;
    profitMargin: number;
    netProfit: number;
    taxCollected: number;
    averageDailyRevenue: number;
  };
  revenueBreakdown: {
    sales: number;
    other: number;
  };
  expenseBreakdown: Array<{
    categoryName: string;
    totalAmount: number;
    percentage: number;
  }>;
  timeSeriesData: Array<{
    period: string;
    revenue: number;
    expenses: number;
    profit: number;
    profitMargin: number;
  }>;
}

// ============================================
// Report Service
// ============================================

class ReportService {
  /**
   * Generate a sales report
   */
  async generateSalesReport(params: SalesReportRequest): Promise<SalesReport> {
    const response = await axios.get('/api/v1/reports/sales', { params });
    return response.data.data;
  }

  /**
   * Generate an inventory report
   */
  async generateInventoryReport(params: InventoryReportRequest): Promise<InventoryReport> {
    const response = await axios.get('/api/v1/reports/inventory', { params });
    return response.data.data;
  }

  /**
   * Generate a financial report
   */
  async generateFinancialReport(params: FinancialReportRequest): Promise<FinancialReport> {
    const response = await axios.get('/api/v1/reports/financial', { params });
    return response.data.data;
  }

  /**
   * Export a report to PDF, Excel, or CSV
   */
  async exportReport(request: ExportReportRequest): Promise<Blob> {
    const response = await axios.post('/api/v1/reports/export', request, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Download an exported report
   */
  downloadReport(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const reportService = new ReportService();
export default reportService;
