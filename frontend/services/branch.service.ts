/**
 * Branch Service
 * Frontend service for branch management (head office admin only)
 */

import api from "./api";
import { ApiResponse, PaginationResponse } from "@/types/api.types";

/**
 * Branch DTO - Response from API
 */
export interface BranchDto {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  addressEn?: string;
  addressAr?: string;
  email?: string;
  phone?: string;
  website?: string;
  crn?: string;
  taxNumber?: string;
  nationalAddress?: string;
  logoPath?: string;
  databaseProvider: string;
  dbServer: string;
  dbName: string;
  dbPort: number;
  dbUsername?: string;
  dbAdditionalParams?: string;
  trustServerCertificate: boolean;
  sslMode: string;
  language: string;
  currency: string;
  timeZone: string;
  dateFormat: string;
  numberFormat: string;
  taxRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  userCount: number;
}

/**
 * Simplified branch DTO for lookup purposes
 */
export interface BranchLookupDto {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
}

/**
 * Create Branch DTO
 */
export interface CreateBranchDto {
  code: string;
  nameEn: string;
  nameAr: string;
  addressEn?: string;
  addressAr?: string;
  email?: string;
  phone?: string;
  website?: string;
  crn?: string;
  taxNumber?: string;
  nationalAddress?: string;
  databaseProvider: number; // 0=SQLite, 1=MSSQL, 2=PostgreSQL, 3=MySQL
  dbServer: string;
  dbName: string;
  dbPort: number;
  dbUsername?: string;
  dbPassword?: string;
  dbAdditionalParams?: string;
  trustServerCertificate?: boolean;
  sslMode?: number; // 0=Disable, 1=Require, 2=VerifyCA, 3=VerifyFull
  language?: string;
  currency?: string;
  timeZone?: string;
  dateFormat?: string;
  numberFormat?: string;
  taxRate?: number;
  isActive?: boolean;
}

/**
 * Update Branch DTO
 */
export interface UpdateBranchDto {
  nameEn?: string;
  nameAr?: string;
  addressEn?: string;
  addressAr?: string;
  email?: string;
  phone?: string;
  website?: string;
  crn?: string;
  taxNumber?: string;
  nationalAddress?: string;
  databaseProvider?: number;
  dbServer?: string;
  dbName?: string;
  dbPort?: number;
  dbUsername?: string;
  dbPassword?: string;
  dbAdditionalParams?: string;
  trustServerCertificate?: boolean;
  sslMode?: number;
  language?: string;
  currency?: string;
  timeZone?: string;
  dateFormat?: string;
  numberFormat?: string;
  taxRate?: number;
  isActive?: boolean;
  logoPath?: string;
}

/**
 * Branch Settings DTO
 */
export interface BranchSettingsDto {
  language: string;
  currency: string;
  timeZone: string;
  dateFormat: string;
  numberFormat: string;
  taxRate: number;
}

/**
 * Branch filter parameters
 */
export interface BranchFilters {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
  search?: string;
}

/**
 * Test Connection Response
 */
export interface TestConnectionResponse {
  success: boolean;
  message: string;
}

/**
 * Branch Service
 * Handles all branch-related API operations
 */
class BranchService {
  // ==================== BRANCHES ====================

  /**
   * Get active branches for login dropdown (public endpoint)
   */
  async getBranchLookup(): Promise<BranchLookupDto[]> {
    const response = await api.get<{ success: boolean; data: BranchLookupDto[] }>(
      "/api/v1/branches/lookup"
    );

    return response.data.data;
  }

  /**
   * Get branches with filtering and pagination
   */
  async getBranches(filters: BranchFilters = {}): Promise<PaginationResponse<BranchDto>> {
    const params = new URLSearchParams();

    if (filters.page) params.append("page", filters.page.toString());
    if (filters.pageSize) params.append("pageSize", filters.pageSize.toString());
    if (filters.isActive !== undefined) params.append("isActive", filters.isActive.toString());
    if (filters.search) params.append("search", filters.search);

    const response = await api.get<PaginationResponse<BranchDto>>(
      `/api/v1/branches?${params.toString()}`
    );

    return response.data;
  }

  /**
   * Get branch by ID
   */
  async getBranchById(id: string): Promise<BranchDto> {
    const response = await api.get<{ success: boolean; data: BranchDto }>(`/api/v1/branches/${id}`);
    return response.data.data;
  }

  /**
   * Create a new branch
   */
  async createBranch(branch: CreateBranchDto): Promise<BranchDto> {
    const response = await api.post<{ data: BranchDto }>("/api/v1/branches", branch);
    return response.data.data;
  }

  /**
   * Update an existing branch
   */
  async updateBranch(id: string, branch: UpdateBranchDto): Promise<BranchDto> {
    const response = await api.put<{ data: BranchDto }>(`/api/v1/branches/${id}`, branch);
    return response.data.data;
  }

  /**
   * Delete a branch (soft delete)
   */
  async deleteBranch(id: string): Promise<void> {
    await api.delete(`/api/v1/branches/${id}`);
  }

  // ==================== BRANCH SETTINGS ====================

  /**
   * Get branch settings
   */
  async getBranchSettings(id: string): Promise<BranchSettingsDto> {
    const response = await api.get<{ success: boolean; data: BranchSettingsDto }>(`/api/v1/branches/${id}/settings`);
    return response.data.data;
  }

  /**
   * Update branch settings
   */
  async updateBranchSettings(id: string, settings: BranchSettingsDto): Promise<BranchSettingsDto> {
    const response = await api.put<{ success: boolean; data: BranchSettingsDto }>(`/api/v1/branches/${id}/settings`, settings);
    return response.data.data;
  }

  // ==================== DATABASE OPERATIONS ====================

  /**
   * Test database connection for a branch
   */
  async testConnection(id: string): Promise<TestConnectionResponse> {
    const response = await api.post<TestConnectionResponse>(
      `/api/v1/branches/${id}/test-connection`,
      {}
    );
    return response.data;
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get database provider name from enum value
   */
  getDatabaseProviderName(provider: number | string): string {
    const providerMap: Record<string | number, string> = {
      0: "SQLite",
      1: "MSSQL",
      2: "PostgreSQL",
      3: "MySQL",
      SQLite: "SQLite",
      MSSQL: "MSSQL",
      PostgreSQL: "PostgreSQL",
      MySQL: "MySQL",
    };

    return providerMap[provider] || "Unknown";
  }

  /**
   * Get database provider options for dropdowns
   */
  getDatabaseProviderOptions(): Array<{ value: number; label: string }> {
    return [
      { value: 0, label: "SQLite" },
      { value: 1, label: "MSSQL" },
      { value: 2, label: "PostgreSQL" },
      { value: 3, label: "MySQL" },
    ];
  }

  /**
   * Get default port for database provider
   */
  getDefaultPort(provider: number): number {
    const portMap: Record<number, number> = {
      0: 0, // SQLite doesn't use a port
      1: 1433, // MSSQL
      2: 5432, // PostgreSQL
      3: 3306, // MySQL
    };

    return portMap[provider] || 0;
  }
}

// Export singleton instance
const branchService = new BranchService();
export default branchService;
