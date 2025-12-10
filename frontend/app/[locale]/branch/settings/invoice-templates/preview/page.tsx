"use client";

/**
 * Invoice Template Preview Page
 *
 * Preview active template with sample data
 */

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import invoiceTemplateService from "@/services/invoice-template.service";
import branchInfoService from "@/services/branch-info.service";
import { InvoiceSchema } from "@/types/invoice-template.types";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { UserRole } from "@/types/enums";
import { Button } from "@/components/shared/Button";
import InvoicePrintDialog from "@/components/invoice/InvoicePrintDialog";
import { BRANCH_ROUTES } from "@/lib/routes";

export default function InvoicePreviewPage() {
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [schema, setSchema] = useState<InvoiceSchema | null>(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);

  // Sample invoice data
  const [invoiceData, setInvoiceData] = useState<any>(null);

  useEffect(() => {
    loadTemplateAndData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTemplateAndData = async () => {
    try {
      setIsLoading(true);
      setError("");

      // Load active template
      const template = await invoiceTemplateService.getActiveTemplate();
      if (!template) {
        setError("No active template found. Please create and activate a template first.");
        return;
      }

      const parsedSchema = JSON.parse(template.schema) as InvoiceSchema;
      setSchema(parsedSchema);

      // Load branch info
      const branchInfo = await branchInfoService.getBranchInfo();

      // Generate sample data
      const sampleData = {
        // Branch Info
        branchName: branchInfo?.nameEn || "Sample Branch",
        branchNameAr: branchInfo?.nameAr || "شركة عينة",
        logoUrl: branchInfo?.logoPath || undefined,
        vatNumber: branchInfo?.taxNumber || "123456789012345",
        commercialRegNumber: branchInfo?.crn || "1234567890",
        address: branchInfo?.addressEn || "123 Main Street, Riyadh 12345",
        phone: branchInfo?.phone || "+966 50 123 4567",
        email: branchInfo?.email || "info@branch.com",

        // Invoice Info
        invoiceNumber: "INV-2025-001",
        invoiceDate: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        cashierName: "John Doe",

        // Customer Info
        customerName: "Ahmed Al-Saud",
        customerVatNumber: "987654321098765",
        customerPhone: "+966 55 987 6543",

        // Invoice Type
        isSimplified: false,

        // Line Items
        items: [
          {
            name: "Product A - High Quality Widget",
            quantity: 2,
            unitPrice: 50.0,
            lineTotal: 100.0,
          },
          {
            name: "Product B - Premium Service",
            quantity: 1,
            unitPrice: 75.5,
            lineTotal: 75.5,
          },
          {
            name: "Product C - Standard Item",
            quantity: 3,
            unitPrice: 25.0,
            lineTotal: 75.0,
          },
        ],

        // Totals
        subtotal: 250.5,
        discount: 25.05,
        vatAmount: 33.82,
        total: 259.27,

        // ZATCA QR (sample Base64 string)
        zatcaQrCode:
          "ARVTYW1wbGUgQ29tcGFueSBOYW1lAg8xMjM0NTY3ODkwMTIzNDUDFDIwMjUtMDEtMDlUMTI6MDA6MDBaBAYyNTkuMjcFBTMzLjgy",
      };

      setInvoiceData(sampleData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load template");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
          role="status"
          aria-label="Loading"
        ></div>
      </div>
    );
  }

  if (error || !schema || !invoiceData) {
    return (
      <RoleGuard requireRole={UserRole.Manager}>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-6xl">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {error || "Template Not Available"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
            {error || "Unable to load template for preview."}
          </p>
          <Button onClick={() => router.push(BRANCH_ROUTES.SETTINGS_INVOICE_TEMPLATES(locale))}>
            Back to Templates
          </Button>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard
      requireRole={UserRole.Manager}
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-6xl">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to access this page.
          </p>
          <Button onClick={() => router.push(`/${locale}/branch`)}>Go to Dashboard</Button>
        </div>
      }
    >
      <div>
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Invoice Template Preview
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Preview how your active template looks with sample data
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.push(BRANCH_ROUTES.SETTINGS_INVOICE_TEMPLATES(locale))}
              className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
            >
              Back to Templates
            </Button>
            <Button
              onClick={() => setIsPrintDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Print Preview
            </Button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                Preview with Sample Data
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-400">
                This preview uses sample data to show how your invoice template will look. Actual
                invoices will use real customer and sale data.
              </p>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <InvoicePrintDialog
            isOpen={isPrintDialogOpen}
            onClose={() => setIsPrintDialogOpen(false)}
            schema={schema}
            data={invoiceData}
          />

          {/* Inline preview (non-printable) */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-white p-6 border border-gray-200 rounded-lg">
              {/* This is a simplified inline preview */}
              <div className="text-center mb-4 pb-4 border-b border-gray-300">
                {invoiceData.branchName && (
                  <h1 className="text-xl font-bold mb-1">{invoiceData.branchName}</h1>
                )}
                {invoiceData.address && (
                  <p className="text-sm text-gray-700">{invoiceData.address}</p>
                )}
                {invoiceData.vatNumber && (
                  <p className="text-sm text-gray-700">VAT: {invoiceData.vatNumber}</p>
                )}
              </div>

              <div className="text-center mb-4">
                <h2 className="text-lg font-bold uppercase">
                  {invoiceData.isSimplified ? "Simplified Tax Invoice" : "Standard Tax Invoice"}
                </h2>
              </div>

              <div className="mb-4 text-sm">
                <p>
                  <strong>Invoice #:</strong> {invoiceData.invoiceNumber}
                </p>
                <p>
                  <strong>Date:</strong> {invoiceData.invoiceDate}
                </p>
                <p>
                  <strong>Customer:</strong> {invoiceData.customerName}
                </p>
              </div>

              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-2">Item</th>
                    <th className="text-center py-2">Qty</th>
                    <th className="text-right py-2">Price</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.items.map((item: any, index: number) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-2">{item.name}</td>
                      <td className="text-center py-2">{item.quantity}</td>
                      <td className="text-right py-2">{item.unitPrice.toFixed(2)}</td>
                      <td className="text-right py-2">{item.lineTotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-3 border-t-2 border-gray-300 text-sm">
                <div className="flex justify-between mb-1">
                  <span>Subtotal:</span>
                  <span>{invoiceData.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Discount:</span>
                  <span>{invoiceData.discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>VAT (15%):</span>
                  <span>{invoiceData.vatAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-2 mt-2">
                  <span>Total:</span>
                  <span>{invoiceData.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-300 text-center">
                <p className="text-sm text-gray-600">Thank you for your business!</p>
              </div>
            </div>
          </div>

          {/* Action Hint */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Click "Print Preview" above to see the full template preview and print options
            </p>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
