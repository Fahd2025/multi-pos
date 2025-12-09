/**
 * Company Info Service
 * Frontend service for company information management
 */

import api from './api';
import { CompanyInfo, UpdateCompanyInfoDto } from '@/types/invoice-template.types';

/**
 * Company Info Service
 * Handles all company information-related API operations
 */
class CompanyInfoService {
  /**
   * Get company information for the current branch
   */
  async getCompanyInfo(): Promise<CompanyInfo | null> {
    try {
      const response = await api.get<{ data: CompanyInfo }>('/api/v1/company-info');
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Create or update company information
   */
  async upsertCompanyInfo(companyInfo: UpdateCompanyInfoDto): Promise<CompanyInfo> {
    const response = await api.put<{ data: CompanyInfo }>(
      '/api/v1/company-info',
      companyInfo
    );
    return response.data.data;
  }
}

// Export singleton instance
const companyInfoService = new CompanyInfoService();
export default companyInfoService;
