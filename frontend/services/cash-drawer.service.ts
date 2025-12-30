import {
  CashDrawer,
  OpenDrawerDto,
  CloseDrawerDto,
  CreateCashTransactionDto,
  ReconciliationReport,
} from '@/types/cash-drawer.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:5001';

export class CashDrawerService {
  /**
   * Open a new cash drawer
   */
  static async openDrawer(dto: OpenDrawerDto, token: string): Promise<CashDrawer> {
    const response = await fetch(`${API_BASE_URL}/api/v1/cash-drawer/open`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to open cash drawer');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Close a cash drawer
   */
  static async closeDrawer(
    drawerId: string,
    dto: CloseDrawerDto,
    token: string
  ): Promise<CashDrawer> {
    const response = await fetch(`${API_BASE_URL}/api/v1/cash-drawer/${drawerId}/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to close cash drawer');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Get the current open cash drawer
   */
  static async getCurrentDrawer(token: string): Promise<CashDrawer | null> {
    const response = await fetch(`${API_BASE_URL}/api/v1/cash-drawer/current`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to get current cash drawer');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Get cash drawer by ID
   */
  static async getDrawerById(drawerId: string, token: string): Promise<CashDrawer> {
    const response = await fetch(`${API_BASE_URL}/api/v1/cash-drawer/${drawerId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to get cash drawer');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Add a transaction to a cash drawer
   */
  static async addTransaction(
    drawerId: string,
    dto: CreateCashTransactionDto,
    token: string
  ): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/cash-drawer/${drawerId}/transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to add transaction');
    }
  }

  /**
   * Get cash drawer history
   */
  static async getDrawerHistory(
    token: string,
    params?: {
      startDate?: string;
      endDate?: string;
      page?: number;
      pageSize?: number;
    }
  ): Promise<CashDrawer[]> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());

    const response = await fetch(
      `${API_BASE_URL}/api/v1/cash-drawer/history?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to get drawer history');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Get reconciliation report
   */
  static async getReconciliationReport(
    drawerId: string,
    token: string
  ): Promise<ReconciliationReport> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/cash-drawer/${drawerId}/reconciliation`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to get reconciliation report');
    }

    const result = await response.json();
    return result.data;
  }
}
