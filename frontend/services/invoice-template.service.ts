/**
 * Invoice Template Service
 * Frontend service for invoice template management and customization
 */

import api from './api';
import {
  InvoiceTemplate,
  InvoiceTemplateListItem,
  CreateInvoiceTemplateDto,
  UpdateInvoiceTemplateDto,
  DuplicateInvoiceTemplateDto,
} from '@/types/invoice-template.types';

/**
 * Invoice Template Service
 * Handles all invoice template-related API operations
 */
class InvoiceTemplateService {
  /**
   * Get all invoice templates for the current branch
   */
  async getTemplates(): Promise<InvoiceTemplateListItem[]> {
    const response = await api.get<{ data: InvoiceTemplateListItem[] }>(
      '/api/v1/invoice-templates'
    );
    return response.data.data;
  }

  /**
   * Get active invoice template
   */
  async getActiveTemplate(): Promise<InvoiceTemplate | null> {
    try {
      const response = await api.get<{ data: InvoiceTemplate }>(
        '/api/v1/invoice-templates/active'
      );
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get invoice template by ID
   */
  async getTemplateById(id: string): Promise<InvoiceTemplate> {
    const response = await api.get<{ data: InvoiceTemplate }>(
      `/api/v1/invoice-templates/${id}`
    );
    return response.data.data;
  }

  /**
   * Create a new invoice template
   */
  async createTemplate(template: CreateInvoiceTemplateDto): Promise<InvoiceTemplate> {
    const response = await api.post<{ data: InvoiceTemplate }>(
      '/api/v1/invoice-templates',
      template
    );
    return response.data.data;
  }

  /**
   * Update an existing invoice template
   */
  async updateTemplate(
    id: string,
    template: UpdateInvoiceTemplateDto
  ): Promise<InvoiceTemplate> {
    const response = await api.put<{ data: InvoiceTemplate }>(
      `/api/v1/invoice-templates/${id}`,
      template
    );
    return response.data.data;
  }

  /**
   * Delete an invoice template
   */
  async deleteTemplate(id: string): Promise<void> {
    await api.delete(`/api/v1/invoice-templates/${id}`);
  }

  /**
   * Set a template as active
   */
  async setActiveTemplate(id: string): Promise<InvoiceTemplate> {
    const response = await api.post<{ data: InvoiceTemplate }>(
      `/api/v1/invoice-templates/${id}/set-active`
    );
    return response.data.data;
  }

  /**
   * Duplicate an existing template
   */
  async duplicateTemplate(
    id: string,
    dto: DuplicateInvoiceTemplateDto
  ): Promise<InvoiceTemplate> {
    const response = await api.post<{ data: InvoiceTemplate }>(
      `/api/v1/invoice-templates/${id}/duplicate`,
      dto
    );
    return response.data.data;
  }

  /**
   * Preview a template with sample data
   */
  async previewTemplate(template: CreateInvoiceTemplateDto): Promise<string> {
    const response = await api.post<{ data: { html: string } }>(
      '/api/v1/invoice-templates/preview',
      template
    );
    return response.data.data.html;
  }

  /**
   * Generate invoice HTML for a sale
   */
  async generateInvoice(saleId: string): Promise<string> {
    const response = await api.post<{ data: { html: string } }>(
      `/api/v1/invoices/${saleId}/generate`
    );
    return response.data.data.html;
  }
}

// Export singleton instance
const invoiceTemplateService = new InvoiceTemplateService();
export default invoiceTemplateService;
