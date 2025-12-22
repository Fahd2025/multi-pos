/**
 * Table Service
 * Frontend service for restaurant table management operations
 */

import api from './api';
import { API_ROUTES } from '@/lib/constants';
import {
  TableDto,
  TableWithStatusDto,
  CreateTableDto,
  UpdateTableDto,
  TransferTableDto,
  AssignTableDto,
} from '@/types/api.types';

/**
 * Table Service
 * Handles all table-related API operations
 */
class TableService {
  /**
   * Get all tables (optionally filtered by zone)
   */
  async getTables(zoneId?: number): Promise<TableDto[]> {
    const params = new URLSearchParams();
    if (zoneId !== undefined) {
      params.append('zoneId', zoneId.toString());
    }

    const url = zoneId
      ? `${API_ROUTES.TABLES.BASE}?${params.toString()}`
      : API_ROUTES.TABLES.BASE;

    const response = await api.get<TableDto[]>(url);
    return response.data;
  }

  /**
   * Get tables with current order status (optionally filtered by zone)
   */
  async getTablesWithStatus(zoneId?: number): Promise<TableWithStatusDto[]> {
    const params = new URLSearchParams();
    if (zoneId !== undefined) {
      params.append('zoneId', zoneId.toString());
    }

    const url = zoneId
      ? `${API_ROUTES.TABLES.STATUS}?${params.toString()}`
      : API_ROUTES.TABLES.STATUS;

    const response = await api.get<TableWithStatusDto[]>(url);
    return response.data;
  }

  /**
   * Get table by ID
   */
  async getTableById(id: number): Promise<TableDto> {
    const response = await api.get<TableDto>(API_ROUTES.TABLES.BY_ID(id));
    return response.data;
  }

  /**
   * Get table by number
   */
  async getTableByNumber(number: number): Promise<TableDto> {
    const response = await api.get<TableDto>(API_ROUTES.TABLES.BY_NUMBER(number));
    return response.data;
  }

  /**
   * Create a new table
   */
  async createTable(table: CreateTableDto): Promise<TableDto> {
    const response = await api.post<TableDto>(API_ROUTES.TABLES.BASE, table);
    return response.data;
  }

  /**
   * Update an existing table
   */
  async updateTable(id: number, table: UpdateTableDto): Promise<TableDto> {
    const response = await api.put<TableDto>(API_ROUTES.TABLES.BY_ID(id), table);
    return response.data;
  }

  /**
   * Delete a table (soft delete)
   */
  async deleteTable(id: number): Promise<void> {
    await api.delete(API_ROUTES.TABLES.BY_ID(id));
  }

  /**
   * Transfer order from one table to another
   */
  async transferOrder(transferData: TransferTableDto): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(
      API_ROUTES.TABLES.TRANSFER,
      transferData
    );
    return response.data;
  }

  /**
   * Clear/complete table
   */
  async clearTable(tableNumber: number): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(
      API_ROUTES.TABLES.CLEAR(tableNumber),
      {}
    );
    return response.data;
  }

  /**
   * Assign table to existing sale
   */
  async assignTable(
    saleId: string,
    assignData: AssignTableDto
  ): Promise<{ tableId: number; message: string }> {
    const response = await api.post<{ tableId: number; message: string }>(
      API_ROUTES.TABLES.ASSIGN(saleId),
      assignData
    );
    return response.data;
  }

  /**
   * Get available tables (helper method)
   */
  async getAvailableTables(zoneId?: number): Promise<TableWithStatusDto[]> {
    const tables = await this.getTablesWithStatus(zoneId);
    return tables.filter(table => table.status === 'available');
  }

  /**
   * Get occupied tables (helper method)
   */
  async getOccupiedTables(zoneId?: number): Promise<TableWithStatusDto[]> {
    const tables = await this.getTablesWithStatus(zoneId);
    return tables.filter(table => table.status === 'occupied');
  }
}

// Export singleton instance
const tableService = new TableService();
export default tableService;
