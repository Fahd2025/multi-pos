/**
 * Paper size types for invoice templates
 */
export enum PaperSize {
  Thermal58mm = 0,
  Thermal80mm = 1,
  A4 = 2,
  Custom = 3,
}

/**
 * Helper function to get display name for PaperSize
 */
export const getPaperSizeName = (size: PaperSize): string => {
  switch (size) {
    case PaperSize.Thermal58mm:
      return "58mm Thermal";
    case PaperSize.Thermal80mm:
      return "80mm Thermal";
    case PaperSize.A4:
      return "A4 Paper";
    case PaperSize.Custom:
      return "Custom Size";
    default:
      return "Unknown";
  }
};

/**
 * Helper function to get paper width in mm
 */
export const getPaperWidth = (size: PaperSize, customWidth?: number): number => {
  switch (size) {
    case PaperSize.Thermal58mm:
      return 58;
    case PaperSize.Thermal80mm:
      return 80;
    case PaperSize.A4:
      return 210;
    case PaperSize.Custom:
      return customWidth ?? 80;
    default:
      return 80;
  }
};

/**
 * Invoice template DTO
 */
export interface InvoiceTemplate {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  paperSize: PaperSize;
  paperSizeName: string;
  customWidth?: number;
  customHeight?: number;
  schema: string; // JSON string
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

/**
 * Invoice template list item DTO
 */
export interface InvoiceTemplateListItem {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  paperSize: PaperSize;
  paperSizeName: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create invoice template DTO
 */
export interface CreateInvoiceTemplateDto {
  name: string;
  description?: string;
  paperSize: PaperSize;
  customWidth?: number;
  customHeight?: number;
  schema: string;
  setAsActive?: boolean;
}

/**
 * Update invoice template DTO
 */
export interface UpdateInvoiceTemplateDto {
  name: string;
  description?: string;
  paperSize: PaperSize;
  customWidth?: number;
  customHeight?: number;
  schema: string;
}

/**
 * Duplicate invoice template DTO
 */
export interface DuplicateInvoiceTemplateDto {
  newName: string;
}

/**
 * Invoice schema section type
 */
export type SectionType =
  | "header"
  | "title"
  | "customer"
  | "metadata"
  | "items"
  | "summary"
  | "footer"
  | "custom";

/**
 * Invoice schema section
 */
export interface InvoiceSchemaSection {
  id: string;
  type: SectionType;
  order: number;
  visible: boolean;
  config?: Record<string, any>;
}

/**
 * Invoice schema styling
 */
export interface InvoiceStyling {
  fontFamily?: string;
  fontSize?: {
    header?: string;
    title?: string;
    body?: string;
    footer?: string;
  };
  spacing?: {
    sectionGap?: string;
    lineHeight?: string;
    padding?: string;
  };
  colors?: {
    text?: string;
    background?: string;
    border?: string;
    highlight?: string;
  };
  borders?: {
    style?: string;
    width?: string;
    radius?: string;
  };
}

/**
 * Complete invoice schema
 */
export interface InvoiceSchema {
  version: string;
  paperSize: string;
  priceIncludesVat: boolean;
  sections: InvoiceSchemaSection[];
  styling?: InvoiceStyling;
}

/**
 * Default invoice schema
 */
export const DEFAULT_INVOICE_SCHEMA: InvoiceSchema = {
  version: "1.0",
  paperSize: "Thermal80mm",
  priceIncludesVat: true,
  sections: [
    {
      id: "header",
      type: "header",
      order: 1,
      visible: true,
      config: {
        showLogo: true,
        showBranchName: true,
        branchNameLabel: "Branch Name",
        showAddress: true,
        addressLabel: "Address",
        showPhone: true,
        phoneLabel: "Phone",
        showVatNumber: true,
        vatNumberLabel: "VAT Number",
        showCRN: true,
        crnLabel: "CR Number",
        alignment: "center",
      },
    },
    {
      id: "invoice-title",
      type: "title",
      order: 2,
      visible: true,
      config: {
        dynamicTitle: true,
        standardTitle: "Standard Tax Invoice",
        simplifiedTitle: "Simplified Tax Invoice",
      },
    },
    {
      id: "customer-info",
      type: "customer",
      order: 3,
      visible: true,
      config: {
        fields: [
          { key: "name", label: "Customer Name", visible: true },
          { key: "vatNumber", label: "VAT Number", visible: true },
          { key: "phone", label: "Phone", visible: true },
        ],
      },
    },
    {
      id: "invoice-meta",
      type: "metadata",
      order: 4,
      visible: true,
      config: {
        fields: [
          { key: "invoiceNumber", label: "Invoice #", visible: true },
          { key: "orderNumber", label: "Order #", visible: false },
          { key: "date", label: "Date", visible: true },
          { key: "cashier", label: "Cashier", visible: true },
          { key: "priceVATLabel", label: "Price includes VAT (15%)", visible: false },
        ],
      },
    },
    {
      id: "items-table",
      type: "items",
      order: 5,
      visible: true,
      config: {
        columns: [
          { key: "name", label: "Item", visible: true, width: "30%" },
          { key: "barcode", label: "Barcode", visible: false, width: "15%" },
          { key: "unit", label: "Unit", visible: false, width: "10%" },
          { key: "quantity", label: "Qty", visible: true, width: "10%" },
          { key: "price", label: "Price", visible: true, width: "12%" },
          { key: "discount", label: "Discount", visible: false, width: "10%" },
          { key: "vat", label: "VAT", visible: false, width: "8%" },
          { key: "total", label: "Total", visible: true, width: "15%" },
          { key: "notes", label: "Notes", visible: false, width: "0%" },
        ],
      },
    },
    {
      id: "summary",
      type: "summary",
      order: 6,
      visible: true,
      config: {
        fields: [
          { key: "subtotal", label: "Subtotal", visible: true },
          { key: "discount", label: "Discount", visible: true },
          { key: "vatAmount", label: "VAT (15%)", visible: true },
          { key: "total", label: "Total", visible: true, highlight: true },
          { key: "paid", label: "Paid", visible: false },
          { key: "change", label: "Change", visible: false },
        ],
      },
    },
    {
      id: "footer",
      type: "footer",
      order: 7,
      visible: true,
      config: {
        showBarcode: false,
        barcodeLabel: "Invoice Number",
        barcodeFormat: "CODE128",
        barcodeWidth: 2,
        barcodeHeight: 50,
        showBarcodeValue: true,
        showZatcaQR: true,
        zatcaQRLabel: "Scan for e-Invoice",
        showOrderType: false,
        orderTypeLabel: "Order Type",
        showPaymentMethod: false,
        paymentMethodLabel: "Payment Method",
        showNotes: true,
        notesLabel: "Notes",
        notesText: "Thank you for your business!",
        showPoweredBy: false,
        poweredByText: "",
      },
    },
  ],
  styling: {
    fontFamily: "Arial, sans-serif",
    fontSize: {
      header: "14px",
      title: "16px",
      body: "12px",
      footer: "10px",
    },
    spacing: {
      sectionGap: "15px",
      lineHeight: "1.5",
      padding: "10px",
    },
  },
};

/**
 * Section palette item for drag and drop
 */
export interface SectionPaletteItem {
  type: SectionType;
  label: string;
  icon: string;
  description: string;
}

/**
 * Available section types for the palette
 */
export const SECTION_PALETTE: SectionPaletteItem[] = [
  {
    type: "header",
    label: "Header",
    icon: "📄",
    description: "Company logo, name, and contact information",
  },
  {
    type: "title",
    label: "Invoice Title",
    icon: "📌",
    description: "Dynamic invoice title (Standard/Simplified)",
  },
  {
    type: "customer",
    label: "Customer Info",
    icon: "👤",
    description: "Customer details and contact information",
  },
  {
    type: "metadata",
    label: "Invoice Details",
    icon: "ℹ️",
    description: "Invoice number, date, and other metadata",
  },
  {
    type: "items",
    label: "Items Table",
    icon: "📊",
    description: "Line items with quantities and prices",
  },
  {
    type: "summary",
    label: "Summary",
    icon: "💰",
    description: "Totals, discounts, and VAT amounts",
  },
  {
    type: "footer",
    label: "Footer",
    icon: "📋",
    description: "QR code, notes, and additional information",
  },
  {
    type: "custom",
    label: "Custom Section",
    icon: "✏️",
    description: "Add your own custom content",
  },
];
