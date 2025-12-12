/**
 * Invoice Renderer Utility
 * Generates HTML for invoice printing from schema and data
 */

import { InvoiceSchema, InvoiceSchemaSection } from "@/types/invoice-template.types";
import { API_BASE_URL } from "./constants";

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
 * Render invoice to HTML string
 */
export function renderInvoiceToHtml(schema: InvoiceSchema, data: InvoiceData): string {
  const isRTL = schema.rtl || false;
  const paperSize = schema.paperSize || "Thermal80mm";

  // Determine paper width
  let paperWidth = "80mm";
  switch (paperSize) {
    case "Thermal58mm":
      paperWidth = "58mm";
      break;
    case "Thermal80mm":
      paperWidth = "80mm";
      break;
    case "A4":
      paperWidth = "210mm";
      break;
  }

  // Sort sections by order
  const sortedSections = [...schema.sections].sort((a, b) => a.order - b.order);

  // Generate sections HTML
  const sectionsHtml = sortedSections
    .filter((section) => section.visible)
    .map((section) => renderSection(section, data, schema))
    .join("");

  // Generate complete HTML
  return `
<!DOCTYPE html>
<html dir="${isRTL ? "rtl" : "ltr"}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${data.invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: ${schema.styling?.fontFamily || "Arial, sans-serif"};
      font-size: ${schema.styling?.fontSize?.body || "12px"};
      line-height: ${schema.styling?.spacing?.lineHeight || "1.5"};
      color: #000;
      background: #fff;
      padding: ${schema.styling?.spacing?.padding || "10px"};
      max-width: ${paperWidth};
      margin: 0 auto;
    }

    .section {
      margin-bottom: ${schema.styling?.spacing?.sectionGap || "15px"};
    }

    .header {
      text-align: left;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
    }

    .logo {
      max-width: 100px;
      max-height: 60px;
      margin-bottom: 10px;
    }

    .branch-name {
      font-size: ${schema.styling?.fontSize?.header || "14px"};
      font-weight: bold;
      margin-bottom: 5px;
    }

    .title {
      text-align: left;
      font-size: ${schema.styling?.fontSize?.title || "16px"};
      font-weight: bold;
      margin: 10px 0;
      text-transform: uppercase;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      font-size: 11px;
    }

    .info-label {
      font-weight: 600;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }

    .items-table th {
      border-bottom: 1px solid #000;
      padding: 5px 2px;
      text-align: left;
      font-size: 10px;
      font-weight: 600;
    }

    .items-table td {
      padding: 5px 2px;
      border-bottom: 1px dashed #ccc;
      font-size: 11px;
    }

    .text-right {
      text-align: right;
    }

    .summary {
      margin-top: 10px;
      border-top: 1px solid #000;
      padding-top: 10px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }

    .summary-row.total {
      font-weight: bold;
      font-size: 14px;
      border-top: 2px solid #000;
      padding-top: 5px;
      margin-top: 5px;
    }

    .footer {
      margin-top: 15px;
      padding-top: 10px;
      border-top: 1px solid #000;
      text-align: left;
      font-size: ${schema.styling?.fontSize?.footer || "10px"};
    }

    .qr-code {
      margin: 10px 0;
      text-align: left;
    }

    @media print {
      body {
        padding: 0;
      }

      @page {
        size: ${paperWidth} auto;
        margin: 5mm;
      }
    }
  </style>
</head>
<body>
  ${sectionsHtml}
</body>
</html>
  `.trim();
}

/**
 * Render individual section
 */
function renderSection(
  section: InvoiceSchemaSection,
  data: InvoiceData,
  schema: InvoiceSchema
): string {
  switch (section.type) {
    case "header":
      return renderHeader(section, data);
    case "title":
      return renderTitle(section, data);
    case "customer":
      return renderCustomer(section, data);
    case "metadata":
      return renderMetadata(section, data);
    case "items":
      return renderItems(section, data, schema);
    case "summary":
      return renderSummary(section, data);
    case "footer":
      return renderFooter(section, data);
    default:
      return "";
  }
}

/**
 * Render header section
 */
function renderHeader(section: InvoiceSchemaSection, data: InvoiceData): string {
  const config = section.config || {};
  let html = '<div class="section header">';

  if (config.showLogo && data.logoUrl) {
    // Ensure logo URL includes the API base URL
    const logoUrl = data.logoUrl.startsWith("http")
      ? data.logoUrl
      : `${API_BASE_URL}${data.logoUrl.startsWith("/") ? "" : "/"}${data.logoUrl}`;
    html += `<img src="${logoUrl}" alt="Logo" class="logo" crossorigin="anonymous" />`;
  }

  if (config.showBranchName && data.branchName) {
    html += `<div class="branch-name">${data.branchName}</div>`;
    if (data.branchNameAr) {
      html += `<div class="branch-name-ar">${data.branchNameAr}</div>`;
    }
  }

  if (config.showAddress && data.address) {
    html += `<div>${data.address}</div>`;
  }

  if (config.showPhone && data.phone) {
    html += `<div>${config.phoneLabel || "Phone"}: ${data.phone}</div>`;
  }

  if (config.showVatNumber && data.vatNumber) {
    html += `<div>${config.vatNumberLabel || "VAT"}: ${data.vatNumber}</div>`;
  }

  if (config.showCRN && data.commercialRegNumber) {
    html += `<div>${config.crnLabel || "CR"}: ${data.commercialRegNumber}</div>`;
  }

  html += "</div>";
  return html;
}

/**
 * Render title section
 */
function renderTitle(section: InvoiceSchemaSection, data: InvoiceData): string {
  const config = section.config || {};
  let title = "Invoice";

  if (config.dynamicTitle) {
    title = data.isSimplified
      ? config.simplifiedTitle || "Simplified Tax Invoice"
      : config.standardTitle || "Standard Tax Invoice";
  }

  return `<div class="section title">${title}</div>`;
}

/**
 * Render customer section
 */
function renderCustomer(section: InvoiceSchemaSection, data: InvoiceData): string {
  const config = section.config || {};
  const fields = config.fields || [];

  let contentHtml = '';

  fields.forEach((field: any) => {
    if (!field.visible) return;

    let value = "";
    switch (field.key) {
      case "name":
        value = data.customerName || "";
        break;
      case "vatNumber":
        value = data.customerVatNumber || "";
        break;
      case "phone":
        value = data.customerPhone || "";
        break;
    }

    if (value) {
      contentHtml += `<div class="info-row"><span class="info-label">${field.label}:</span> <span>${value}</span></div>`;
    }
  });

  // Only render section if there's actual content
  if (!contentHtml) return '';

  return `<div class="section customer">${contentHtml}</div>`;
}

/**
 * Render metadata section
 */
function renderMetadata(section: InvoiceSchemaSection, data: InvoiceData): string {
  const config = section.config || {};
  const fields = config.fields || [];

  let html = '<div class="section metadata">';

  fields.forEach((field: any) => {
    if (!field.visible) return;

    let value = "";
    switch (field.key) {
      case "invoiceNumber":
        value = data.invoiceNumber;
        break;
      case "date":
        value = data.invoiceDate;
        break;
      case "cashier":
        value = data.cashierName || "";
        break;
    }

    if (value) {
      html += `<div class="info-row"><span class="info-label">${field.label}:</span> <span>${value}</span></div>`;
    }
  });

  html += "</div>";
  return html;
}

/**
 * Render items table section
 */
function renderItems(
  section: InvoiceSchemaSection,
  data: InvoiceData,
  schema: InvoiceSchema
): string {
  const config = section.config || {};
  const columns = (config.columns || []).filter((col: any) => col.visible);

  let html = '<table class="items-table"><thead><tr>';

  // Table headers
  columns.forEach((col: any) => {
    html += `<th class="${col.key === "total" || col.key === "price" || col.key === "quantity" ? "text-right" : ""}">${col.label}</th>`;
  });

  html += "</tr></thead><tbody>";

  // Table rows
  data.items.forEach((item) => {
    html += "<tr>";
    columns.forEach((col: any) => {
      let value = "";
      let className = "";

      switch (col.key) {
        case "name":
          value = item.name;
          break;
        case "quantity":
          value = item.quantity.toString();
          className = "text-right";
          break;
        case "price":
          value = `$${item.unitPrice.toFixed(2)}`;
          className = "text-right";
          break;
        case "total":
          value = `$${item.lineTotal.toFixed(2)}`;
          className = "text-right";
          break;
        case "barcode":
          value = item.barcode || "";
          break;
      }

      html += `<td class="${className}">${value}</td>`;
    });
    html += "</tr>";
  });

  html += "</tbody></table>";
  return html;
}

/**
 * Render summary section
 */
function renderSummary(section: InvoiceSchemaSection, data: InvoiceData): string {
  const config = section.config || {};
  const fields = config.fields || [];

  let html = '<div class="section summary">';

  fields.forEach((field: any) => {
    if (!field.visible) return;

    let value = "";
    let className = field.highlight ? "total" : "";
    let skipField = false;

    switch (field.key) {
      case "subtotal":
        value = `$${data.subtotal.toFixed(2)}`;
        break;
      case "discount":
        // Only show discount if there's an actual discount value
        if (data.discount > 0) {
          value = `-$${data.discount.toFixed(2)}`;
        } else {
          skipField = true; // Don't show $0.00 discount
        }
        break;
      case "totalExclVat":
        value = `$${(data.subtotal - data.discount).toFixed(2)}`;
        break;
      case "vatAmount":
        value = `$${data.vatAmount.toFixed(2)}`;
        break;
      case "total":
        value = `$${data.total.toFixed(2)}`;
        break;
    }

    if (!skipField) {
      html += `<div class="summary-row ${className}"><span>${field.label}:</span> <span>${value}</span></div>`;
    }
  });

  html += "</div>";
  return html;
}

/**
 * Render footer section
 */
function renderFooter(section: InvoiceSchemaSection, data: InvoiceData): string {
  const config = section.config || {};
  let html = '<div class="section footer">';

  if (config.showZatcaQR && data.zatcaQrCode) {
    // Generate QR code using an API or embedded library
    // Using a simple API-based approach that works in print
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(data.zatcaQrCode)}`;
    html += `
      <div class="qr-code">
        <div style="font-size: 10px; margin-bottom: 5px;">${config.zatcaQRLabel || "Scan for e-Invoice"}</div>
        <img src="${qrCodeUrl}" alt="ZATCA QR Code" style="width: 128px; height: 128px;" />
      </div>
    `;
  }

  if (config.showNotes && config.notesText) {
    html += `<div style="margin-top: 10px;">${config.notesText}</div>`;
  }

  html += "</div>";
  return html;
}
