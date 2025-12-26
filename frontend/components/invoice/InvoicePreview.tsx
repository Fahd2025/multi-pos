"use client";

/**
 * Invoice Preview Component
 *
 * Renders an invoice based on the provided schema and data
 * Supports printing via react-to-print
 */

import React, { forwardRef } from "react";
import { InvoiceSchema, InvoiceSchemaSection } from "@/types/invoice-template.types";
import QRCodeDisplay from "./QRCodeDisplay";
import BarcodeDisplay from "./BarcodeDisplay";
import { API_BASE_URL } from "@/lib/constants";

interface InvoiceData {
  // Branch Info
  branchName?: string;
  branchNameAr?: string;
  logoUrl?: string;
  vatNumber?: string;
  commercialRegNumber?: string;
  address?: string;
  phone?: string;
  email?: string;

  // Invoice Info
  invoiceNumber: string;
  orderNumber?: string;
  invoiceDate: string;
  cashierName?: string;

  // Customer Info
  customerName?: string;
  customerVatNumber?: string;
  customerPhone?: string;
  customerBuildingNumber?: string;
  customerStreetName?: string;
  customerDistrict?: string;
  customerCity?: string;
  customerPostalCode?: string;
  customerAdditionalNumber?: string;
  customerUnitNumber?: string;

  // Invoice Type
  isSimplified: boolean;

  // Line Items
  items: Array<{
    name: string;
    barcode?: string;
    unit?: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    vat?: number;
    lineTotal: number;
    notes?: string;
  }>;

  // Totals
  subtotal: number;
  discount: number;
  vatAmount: number;
  total: number;
  amountPaid?: number;
  changeReturned?: number;

  // Footer info
  orderType?: string;
  paymentMethod?: string;

  // ZATCA QR
  zatcaQrCode?: string;

  // Pending Order Fields (optional)
  isPendingOrder?: boolean;
  pendingOrderStatus?: string;
  tableNumber?: string;
  guestCount?: number;
  notes?: string;
}

interface InvoicePreviewProps {
  schema: InvoiceSchema;
  data: InvoiceData;
}

const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(({ schema, data }, ref) => {
  // RTL Detection: Check if Arabic content is present
  const hasArabicContent = (text?: string): boolean => {
    if (!text || text.trim() === "") return false;
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
    return arabicRegex.test(text);
  };

  // Detect if invoice should use RTL layout
  // Priority:
  // 1. Explicit schema.rtl setting (if defined)
  // 2. Otherwise, default to LTR (false) - user must explicitly enable RTL
  // Note: Auto-detection is disabled by default to prevent unwanted RTL layout
  const isRTL = schema.rtl ?? false;

  // Format address from JSON string or plain text
  const formatAddress = (address?: string): string => {
    if (!address || address.trim() === "") return "";

    // Try to parse as JSON object
    try {
      const addressObj = JSON.parse(address);

      // Extract address components
      const parts = [
        addressObj.BuildingNumber || addressObj.buildingNumber,
        addressObj.Street || addressObj.street,
        addressObj.District || addressObj.district,
        addressObj.City || addressObj.city,
        addressObj.PostalCode || addressObj.postalCode,
      ].filter(Boolean); // Remove null/undefined/empty values

      // If we have components, use them
      if (parts.length > 0) {
        return parts.join(", ");
      }

      // Otherwise, fall back to ShortAddress
      if (addressObj.ShortAddress || addressObj.shortAddress) {
        return addressObj.ShortAddress || addressObj.shortAddress;
      }

      return "";
    } catch {
      // If parsing fails, it's a plain string - return as-is
      return address;
    }
  };

  const renderHeader = (section: InvoiceSchemaSection) => {
    if (!section.visible) return null;
    const config = section.config || {};

    // Ensure the logo URL is absolute if it's a relative path
    const getAbsoluteLogoUrl = (logoUrl: string) => {
      if (!logoUrl) return logoUrl;
      if (logoUrl.startsWith("http://") || logoUrl.startsWith("https://")) {
        return logoUrl;
      }
      if (logoUrl.startsWith("/")) {
        return `${API_BASE_URL}${logoUrl}`;
      }
      return logoUrl;
    };

    const absoluteLogoUrl = data.logoUrl ? getAbsoluteLogoUrl(data.logoUrl) : undefined;

    return (
      <div className="invoice-header text-center mb-4 pb-4 border-b border-gray-300">
        {config.showLogo && absoluteLogoUrl && (
          <div className="mb-3">
            <img
              src={absoluteLogoUrl}
              alt="Branch Logo"
              className="mx-auto max-h-16 object-contain"
            />
          </div>
        )}
        {(config.showBranchName || config.showBranchName) && data.branchName && (
          <h1 className="text-xl font-bold mb-1">{data.branchName}</h1>
        )}
        {(config.showBranchName || config.showBranchName) && data.branchNameAr && (
          <h2 className="text-lg mb-2" dir="rtl">
            {data.branchNameAr}
          </h2>
        )}
        {config.showAddress && data.address && (
          <p className="text-sm text-gray-700 break-words">
            {config.addressLabel || "Address"}: {formatAddress(data.address)}
          </p>
        )}
        {config.showPhone && data.phone && (
          <p className="text-sm text-gray-700">
            {config.phoneLabel || "Phone"}: {data.phone}
          </p>
        )}
        {config.showVatNumber && data.vatNumber && (
          <p className="text-sm text-gray-700">
            {config.vatNumberLabel || "VAT Number"}: {data.vatNumber}
          </p>
        )}
        {config.showCRN && data.commercialRegNumber && (
          <p className="text-sm text-gray-700">
            {config.crnLabel || "CR Number"}: {data.commercialRegNumber}
          </p>
        )}
      </div>
    );
  };

  const renderTitle = (section: InvoiceSchemaSection) => {
    if (!section.visible) return null;
    const config = section.config || {};

    let title: string;

    // Check if invoice has no VAT (VAT amount is zero) - use nonVatTitle
    if (data.vatAmount === 0) {
      title = config.nonVatTitle || "Invoice";
    } else {
      title = data.isSimplified
        ? config.simplifiedTitle || "Simplified Tax Invoice"
        : config.standardTitle || "Standard Tax Invoice";
    }

    return (
      <div className="invoice-title text-center mb-4">
        <h2 className="text-lg font-bold uppercase">{title}</h2>
      </div>
    );
  };

  const renderCustomer = (section: InvoiceSchemaSection) => {
    if (!section.visible) return null;

    // Hide the ENTIRE customer section if phone is blank
    if (!data.customerPhone || data.customerPhone.trim() === "") {
      return null;
    }

    const fields = section.config?.fields || [];

    const fieldMap: Record<string, any> = {
      name: data.customerName,
      vatNumber: data.customerVatNumber,
      phone: data.customerPhone,
      buildingNumber: data.customerBuildingNumber,
      streetName: data.customerStreetName,
      district: data.customerDistrict,
      city: data.customerCity,
      postalCode: data.customerPostalCode,
      additionalNumber: data.customerAdditionalNumber,
      unitNumber: data.customerUnitNumber,
    };

    const visibleFields = fields.filter((f: any) => f.visible && fieldMap[f.key]);

    if (visibleFields.length === 0) return null;

    return (
      <div className="invoice-customer mb-4 pb-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold mb-2">Customer Information</h3>
        {visibleFields.map((field: any, index: number) => (
          <div key={index} className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">{field.label}:</span>
            <span className="font-medium">{fieldMap[field.key]}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderMetadata = (section: InvoiceSchemaSection) => {
    if (!section.visible) return null;
    const fields = section.config?.fields || [];

    const fieldMap: Record<string, any> = {
      invoiceNumber: data.invoiceNumber,
      orderNumber: data.orderNumber,
      date: data.invoiceDate,
      cashier: data.cashierName,
      priceVATLabel: schema.priceIncludesVat ? "Price includes VAT (15%)" : "Price excludes VAT",
      status: data.pendingOrderStatus,
      orderType: data.orderType,
      tableNumber: data.tableNumber ? `${data.tableNumber}${data.guestCount ? ` • ${data.guestCount} guest${data.guestCount > 1 ? 's' : ''}` : ''}` : undefined,
    };

    const visibleFields = fields.filter((f: any) => f.visible && fieldMap[f.key]);

    if (visibleFields.length === 0) return null;

    return (
      <div className="invoice-metadata mb-4 pb-3 border-b border-gray-200">
        {/* Pending Order Header */}
        {data.isPendingOrder && (
          <div className="text-center mb-3 pb-3 border-b-2 border-dashed border-gray-400">
            <div className="text-lg font-bold uppercase tracking-wide">PENDING ORDER</div>
            {data.pendingOrderStatus && (
              <div className="text-sm mt-1 px-3 py-1 inline-block border border-gray-500 rounded">
                Status: {data.pendingOrderStatus}
              </div>
            )}
          </div>
        )}
        {visibleFields.map((field: any, index: number) => (
          <div key={index} className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">{field.label}:</span>
            <span className="font-medium">{fieldMap[field.key]}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderItems = (section: InvoiceSchemaSection) => {
    if (!section.visible) return null;
    const columns = section.config?.columns || [];

    const columnMap: Record<string, (item: any) => string> = {
      name: (item) => item.name,
      barcode: (item) => item.barcode || "-",
      unit: (item) => item.unit || "-",
      quantity: (item) => item.quantity.toString(),
      price: (item) => item.unitPrice.toFixed(2),
      discount: (item) => (item.discount ? item.discount.toFixed(2) : "0.00"),
      vat: (item) => (item.vat ? item.vat.toFixed(2) : "0.00"),
      total: (item) => item.lineTotal.toFixed(2),
    };

    // Filter out notes column - notes will be shown as detail rows instead
    const visibleColumns = columns.filter((c: any) => c.visible && c.key !== "notes");

    if (visibleColumns.length === 0) return null;

    return (
      <div className="invoice-items mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-300">
              {visibleColumns.map((column: any, index: number) => (
                <th
                  key={index}
                  className={`${isRTL ? "text-right" : "text-left"} py-2 px-1 font-semibold`}
                  style={{ width: column.width }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, itemIndex) => (
              <React.Fragment key={itemIndex}>
                {/* Main item row */}
                <tr className="border-b border-gray-200">
                  {visibleColumns.map((column: any, colIndex: number) => (
                    <td
                      key={colIndex}
                      className={`${isRTL ? "text-right" : "text-left"} py-2 px-1`}
                    >
                      {columnMap[column.key]?.(item) || "-"}
                    </td>
                  ))}
                </tr>
                {/* Details row for notes (only if notes exist) */}
                {item.notes && item.notes.trim() !== "" && (
                  <tr className="item-details bg-gray-50">
                    <td
                      colSpan={visibleColumns.length}
                      className={`${isRTL ? "text-right" : "text-left"} py-2 px-1 pl-4 text-xs`}
                    >
                      <span className="font-semibold">Details:</span> {item.notes}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSummary = (section: InvoiceSchemaSection) => {
    if (!section.visible) return null;
    const fields = section.config?.fields || [];

    // Calculate total excluding VAT (subtotal after discount)
    const totalExclVat = data.subtotal - data.discount;

    const fieldMap: Record<string, any> = {
      subtotal: data.subtotal.toFixed(2),
      discount: data.discount.toFixed(2),
      totalExclVat: totalExclVat.toFixed(2),
      vatAmount: data.vatAmount.toFixed(2),
      total: data.total.toFixed(2),
      paid: data.amountPaid ? data.amountPaid.toFixed(2) : undefined,
      change: data.changeReturned ? data.changeReturned.toFixed(2) : undefined,
    };

    // Filter fields based on visibility and conditional logic
    const visibleFields = fields.filter((f: any) => {
      // Hide discount if it equals zero
      if (f.key === "discount" && data.discount <= 0) {
        return false;
      }
      // Hide totalExclVat if there's no discount
      if (f.key === "totalExclVat" && data.discount <= 0) {
        return false;
      }
      // Hide VAT if it equals zero
      if (f.key === "vatAmount" && data.vatAmount <= 0) {
        return false;
      }
      return f.visible;
    });

    if (visibleFields.length === 0) return null;

    return (
      <div className="invoice-summary mb-4 pt-3 border-t-2 border-gray-300">
        {visibleFields.map((field: any, index: number) => (
          <div
            key={index}
            className={`flex justify-between text-sm mb-1 ${
              field.highlight ? "font-bold text-lg border-t border-gray-300 pt-2 mt-2" : ""
            }`}
          >
            <span>{field.label}:</span>
            <span>{fieldMap[field.key]}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderFooter = (section: InvoiceSchemaSection) => {
    if (!section.visible) return null;
    const config = section.config || {};

    return (
      <div className="invoice-footer mt-4 pt-4 border-t border-gray-300 text-center">
        {config.showOrderType && data.orderType && (
          <div className="mb-2 text-sm">
            <span className="font-semibold text-gray-700">
              {config.orderTypeLabel || "Order Type"}:
            </span>{" "}
            <span className="text-gray-600">{data.orderType}</span>
          </div>
        )}
        {config.showPaymentMethod && data.paymentMethod && (
          <div className="mb-2 text-sm">
            <span className="font-semibold text-gray-700">
              {config.paymentMethodLabel || "Payment Method"}:
            </span>{" "}
            <span className="text-gray-600">{data.paymentMethod}</span>
          </div>
        )}
        {config.showBarcode && data.invoiceNumber && (
          <div className="mb-3">
            {config.barcodeLabel && (
              <p className="text-xs text-gray-600 mb-1">{config.barcodeLabel}</p>
            )}
            <BarcodeDisplay
              value={data.invoiceNumber}
              format={(config.barcodeFormat as any) || "CODE128"}
              width={config.barcodeWidth || 2}
              height={config.barcodeHeight || 50}
              displayValue={config.showBarcodeValue ?? true}
            />
          </div>
        )}
        {config.showZatcaQR && data.zatcaQrCode && (
          <div className="mb-3">
            {config.zatcaQRLabel && (
              <p className="text-xs text-gray-600 mb-1">{config.zatcaQRLabel}</p>
            )}
            <QRCodeDisplay value={data.zatcaQrCode} size={128} />
          </div>
        )}
        {config.showNotes && config.notesText && (
          <div className="mb-2">
            {config.notesLabel && (
              <p className="text-xs font-semibold text-gray-700 mb-1">{config.notesLabel}</p>
            )}
            <p className="text-sm text-gray-600">{config.notesText}</p>
          </div>
        )}
        {/* Pending Order Notes */}
        {data.isPendingOrder && data.notes && (
          <div className="mb-3 p-2 bg-gray-100 border border-gray-300 rounded">
            <p className="text-xs font-semibold text-gray-700 mb-1">Order Notes:</p>
            <p className="text-sm text-gray-600">{data.notes}</p>
          </div>
        )}
        {/* Pending Order Disclaimer */}
        {data.isPendingOrder && (
          <div className="mt-4 pt-3 border-t-2 border-dashed border-gray-400">
            <p className="text-xs font-bold text-gray-700 uppercase">⚠️ PENDING ORDER SLIP</p>
            <p className="text-xs text-gray-600 mt-1">Not a valid receipt for payment</p>
            <p className="text-xs text-gray-500 mt-2">Printed: {new Date().toLocaleString()}</p>
          </div>
        )}
      </div>
    );
  };

  const renderSection = (section: InvoiceSchemaSection) => {
    switch (section.type) {
      case "header":
        return renderHeader(section);
      case "title":
        return renderTitle(section);
      case "customer":
        return renderCustomer(section);
      case "metadata":
        return renderMetadata(section);
      case "items":
        return renderItems(section);
      case "summary":
        return renderSummary(section);
      case "footer":
        return renderFooter(section);
      default:
        return null;
    }
  };

  // Sort sections by order
  const sortedSections = [...schema.sections].sort((a, b) => a.order - b.order);

  // Get paper width for print styles
  const getPaperWidth = (paperSize: string): string => {
    switch (paperSize) {
      case "Thermal58mm":
        return "58mm";
      case "Thermal80mm":
        return "80mm";
      case "A4":
        return "210mm";
      default:
        return "80mm";
    }
  };

  const paperWidth = getPaperWidth(schema.paperSize);
  //console.log(schema);

  return (
    <div ref={ref} className="invoice-preview bg-white p-6 mx-auto" dir={isRTL ? "rtl" : "ltr"}>
      <style jsx>{`
        /* Define page size for printing */
        @page {
          size: ${paperWidth} auto;
          margin: 0;
        }

        /* Base invoice preview styles */
        .invoice-preview {
          max-width: ${paperWidth};
          box-sizing: border-box;
        }

        /* Print-specific styles */
        @media print {
          /* Reset body for print - top-left alignment for thermal printers */
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Force invoice to exact width with top-left alignment */
          .invoice-preview {
            width: ${paperWidth} !important;
            max-width: ${paperWidth} !important;
            min-width: ${paperWidth} !important;
            padding: 5mm !important;
            margin: 0 !important;
            page-break-inside: avoid;
            box-shadow: none !important;
            background: white !important;
          }

          /* Override any global print styles */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }

        /* Screen preview styles */
        @media screen {
          .invoice-preview {
            max-width: ${paperWidth};
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
        }
      `}</style>
      {sortedSections.map((section) => (
        <React.Fragment key={section.id}> {renderSection(section)}</React.Fragment>
      ))}
    </div>
  );
});

InvoicePreview.displayName = "InvoicePreview";

export default InvoicePreview;
