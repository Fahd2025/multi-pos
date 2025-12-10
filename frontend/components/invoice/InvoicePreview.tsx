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

interface InvoiceData {
  // Company Info
  companyName?: string;
  companyNameAr?: string;
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
}

interface InvoicePreviewProps {
  schema: InvoiceSchema;
  data: InvoiceData;
}

const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(
  ({ schema, data }, ref) => {
    const renderHeader = (section: InvoiceSchemaSection) => {
      if (!section.visible) return null;
      const config = section.config || {};

      return (
        <div className="invoice-header text-center mb-4 pb-4 border-b border-gray-300">
          {config.showLogo && data.logoUrl && (
            <div className="mb-3">
              <img
                src={data.logoUrl}
                alt="Company Logo"
                className="mx-auto max-h-16 object-contain"
              />
            </div>
          )}
          {(config.showBranchName || config.showCompanyName) && data.companyName && (
            <h1 className="text-xl font-bold mb-1">{data.companyName}</h1>
          )}
          {(config.showBranchName || config.showCompanyName) && data.companyNameAr && (
            <h2 className="text-lg mb-2" dir="rtl">
              {data.companyNameAr}
            </h2>
          )}
          {config.showAddress && data.address && (
            <p className="text-sm text-gray-700">
              {config.addressLabel || "Address"}: {data.address}
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

      const title = data.isSimplified
        ? config.simplifiedTitle || "Simplified Tax Invoice"
        : config.standardTitle || "Standard Tax Invoice";

      return (
        <div className="invoice-title text-center mb-4">
          <h2 className="text-lg font-bold uppercase">{title}</h2>
        </div>
      );
    };

    const renderCustomer = (section: InvoiceSchemaSection) => {
      if (!section.visible) return null;
      const fields = section.config?.fields || [];

      const fieldMap: Record<string, any> = {
        name: data.customerName,
        vatNumber: data.customerVatNumber,
        phone: data.customerPhone,
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
      };

      const visibleFields = fields.filter((f: any) => f.visible && fieldMap[f.key]);

      if (visibleFields.length === 0) return null;

      return (
        <div className="invoice-metadata mb-4 pb-3 border-b border-gray-200">
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
        discount: (item) => item.discount ? item.discount.toFixed(2) : "0.00",
        vat: (item) => item.vat ? item.vat.toFixed(2) : "0.00",
        total: (item) => item.lineTotal.toFixed(2),
        notes: (item) => item.notes || "-",
      };

      const visibleColumns = columns.filter((c: any) => c.visible);

      if (visibleColumns.length === 0) return null;

      return (
        <div className="invoice-items mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300">
                {visibleColumns.map((column: any, index: number) => (
                  <th
                    key={index}
                    className="text-left py-2 px-1 font-semibold"
                    style={{ width: column.width }}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, itemIndex) => (
                <tr key={itemIndex} className="border-b border-gray-200">
                  {visibleColumns.map((column: any, colIndex: number) => (
                    <td key={colIndex} className="py-2 px-1">
                      {columnMap[column.key]?.(item) || "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    };

    const renderSummary = (section: InvoiceSchemaSection) => {
      if (!section.visible) return null;
      const fields = section.config?.fields || [];

      const fieldMap: Record<string, any> = {
        subtotal: data.subtotal.toFixed(2),
        discount: data.discount.toFixed(2),
        vatAmount: data.vatAmount.toFixed(2),
        total: data.total.toFixed(2),
        paid: data.amountPaid ? data.amountPaid.toFixed(2) : undefined,
        change: data.changeReturned ? data.changeReturned.toFixed(2) : undefined,
      };

      const visibleFields = fields.filter((f: any) => f.visible);

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
              <span className="font-semibold text-gray-700">{config.orderTypeLabel || "Order Type"}:</span>{" "}
              <span className="text-gray-600">{data.orderType}</span>
            </div>
          )}
          {config.showPaymentMethod && data.paymentMethod && (
            <div className="mb-2 text-sm">
              <span className="font-semibold text-gray-700">{config.paymentMethodLabel || "Payment Method"}:</span>{" "}
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

    return (
      <div ref={ref} className="invoice-preview bg-white p-6 max-w-3xl mx-auto">
        <style jsx>{`
          @media print {
            .invoice-preview {
              padding: 0;
              max-width: 100%;
            }
          }
        `}</style>
        {sortedSections.map((section) => (
          <React.Fragment key={section.id}>{renderSection(section)}</React.Fragment>
        ))}
      </div>
    );
  }
);

InvoicePreview.displayName = "InvoicePreview";

export default InvoicePreview;
