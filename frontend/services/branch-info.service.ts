/**
 * Branch Info Service
 * Frontend service for branch information retrieval
 */

import api from './api';

export interface BranchInfo {
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
  language: string;
  currency: string;
  timeZone: string;
  dateFormat: string;
  numberFormat: string;
  taxRate: number;
  enableTax: boolean;
  priceIncludesTax: boolean;
}

/**
 * Branch Info Service
 * Handles all branch information-related API operations
 */
class BranchInfoService {
  /**
   * Get branch information for the current branch
   */
  async getBranchInfo(): Promise<BranchInfo | null> {
    try {
      const response = await api.get<{ data: BranchInfo }>('/api/v1/branch-info');
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }
}

// Export singleton instance
const branchInfoService = new BranchInfoService();
export default branchInfoService;
