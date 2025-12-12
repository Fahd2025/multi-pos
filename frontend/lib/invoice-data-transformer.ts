/**
 * Invoice Data Transformer
 * Shared utility to transform sale data to invoice data format
 * Ensures consistency between POS and Sales pages
 */

import { SaleDto } from "@/types/api.types";
import { BranchInfo } from "@/services/branch-info.service";

interface InvoiceData {
  branchName?: string;
  branchNameAr?: string;
  logoUrl?: string;
  vatNumber?: string;
  commercialRegNumber?: string;
  address?: string;
  phone?: string;
  email?: string;
  invoiceNumber: string;
  invoiceDate: string;
  cashierName?: string;
  customerName?: string;
  customerVatNumber?: string;
  customerPhone?: string;
  isSimplified: boolean;
  items: Array<{
    name: string;
    barcode?: string;
    unit?: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    notes?: string;
  }>;
  subtotal: number;
  discount: number;
  vatAmount: number;
  total: number;
  zatcaQrCode?: string;
}

/**
 * Parse address from JSON if needed
 */
function parseAddress(addressEn?: string): string {
  if (!addressEn) return "";

  if (typeof addressEn === "string" && addressEn.startsWith("{")) {
    try {
      const addr = JSON.parse(addressEn);
      return addr.ShortAddress || addr.Street || addressEn;
    } catch {
      return addressEn;
    }
  }

  return addressEn;
}

/**
 * Transform sale data to invoice data format
 * Single source of truth for invoice data transformation
 */
export function transformSaleToInvoiceData(
  sale: SaleDto,
  branchInfo: BranchInfo | null
): InvoiceData {
  return {
    // Branch Info
    branchName: branchInfo?.nameEn || "",
    branchNameAr: branchInfo?.nameAr || "",
    logoUrl: branchInfo?.logoPath || undefined,
    vatNumber: branchInfo?.taxNumber || "",
    commercialRegNumber: branchInfo?.crn || "",
    address: parseAddress(branchInfo?.addressEn),
    phone: branchInfo?.phone || "",
    email: branchInfo?.email || "",

    // Invoice Info - Use data from backend response
    invoiceNumber: sale.invoiceNumber || sale.transactionId,
    invoiceDate: new Date(sale.saleDate).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }),
    cashierName: sale.cashierName,

    // Customer Info - Use data from backend response
    customerName: sale.customerName || "Walk-in Customer",
    customerVatNumber: undefined, // Not available in current sale data
    customerPhone: undefined, // Not available in current sale data

    // Invoice Type - Use data from backend response
    // Touch (0) = Simplified, Standard (1) = Not simplified
    isSimplified: sale.invoiceType === 0,

    // Line Items - Use data from backend response
    items: sale.lineItems.map((item) => ({
      name: item.productName,
      barcode: item.barcode || undefined,
      unit: item.unit || undefined,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      notes: item.notes || undefined,
    })),

    // Totals - Use data from backend response (ensures consistency)
    subtotal: sale.subtotal,
    discount: sale.totalDiscount,
    vatAmount: sale.taxAmount,
    total: sale.total,

    // ZATCA QR Code - Generate simple text-based QR for now
    // Backend should eventually provide proper ZATCA-compliant TLV-encoded QR
    zatcaQrCode: branchInfo?.taxNumber
      ? `Seller: ${branchInfo.nameEn}\nVAT: ${branchInfo.taxNumber}\nInvoice: ${sale.invoiceNumber || sale.transactionId}\nTotal: $${sale.total.toFixed(2)}\nVAT: $${sale.taxAmount.toFixed(2)}`
      : undefined,
  };
}
