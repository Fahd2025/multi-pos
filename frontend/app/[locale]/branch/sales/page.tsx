"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SalesStatistics from "@/components/branch/sales/SalesStatistics";
import SalesTable from "@/components/branch/sales/SalesTable";
import InvoiceDialog from "@/components/branch/sales/InvoiceDialog";
import NewInvoiceModal from "@/components/branch/sales/NewInvoiceModal";
import CreateSalesInvoiceForm from "@/components/branch/sales/CreateSalesInvoiceForm";
import ProductGridModal from "@/components/branch/sales/ProductGridModal";
import { ProductDto, SaleDto } from "@/types/api.types";
import { PageHeader, ActionCard, InfoBanner, Button } from "@/components/shared";
import { UI_STRINGS } from "@/lib/constants";

export default function SalesPage({ params }: { params: Promise<{ locale: string }> }) {
  const router = useRouter();

  // View state
  const [viewMode, setViewMode] = useState<"dashboard" | "create-invoice">("dashboard");

  // Modal states
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showProductGridModal, setShowProductGridModal] = useState(false);
  // Keeping NewInvoiceModal for backward compatibility
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);

  // Date filter states
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Refresh trigger for table
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleNewInvoiceSuccess = (sale: SaleDto) => {
    setViewMode("dashboard");
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleGoToPOS = () => {
    router.push("/pos");
  };

  const handleProductSelect = (product: ProductDto) => {
    // When product is selected from grid, go to POS with the product
    router.push("/pos");
  };

  const handleDateFilterChange = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // If in Create Invoice mode, show the form
  if (viewMode === "create-invoice") {
    return (
      <CreateSalesInvoiceForm
        onCancel={() => setViewMode("dashboard")}
        onSuccess={handleNewInvoiceSuccess}
      />
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div>
        <PageHeader
          title={UI_STRINGS.SALES.PAGE_TITLE}
          description={UI_STRINGS.SALES.PAGE_DESCRIPTION}
          actions={
            <>
              <Button
                onClick={handleGoToPOS}
                variant="primary"
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                <span className="mr-2 text-xl">🛒</span>
                Go to Point of Sale
              </Button>
              <Button
                onClick={() => setShowInvoiceDialog(true)}
                variant="primary"
                size="lg"
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              >
                <span className="mr-2 text-xl">📄</span>
                {UI_STRINGS.SALES.NEW_SALE}
              </Button>
            </>
          }
          className="mb-6 md:mb-8"
        />

        {/* Date Range Filter */}
        <div className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 md:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {UI_STRINGS.SALES.FROM_DATE}
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {UI_STRINGS.SALES.TO_DATE}
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>
            </div>
            <button
              onClick={handleDateFilterChange}
              className="px-6 py-2.5 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors w-full sm:w-auto"
            >
              {UI_STRINGS.COMMON.APPLY}
            </button>
          </div>
        </div>

        {/* Sales Statistics */}
        <div className="mb-6 md:mb-8">
          <SalesStatistics
            dateFrom={dateFrom}
            dateTo={dateTo}
            onRefresh={() => setRefreshTrigger((prev) => prev + 1)}
          />
        </div>

        {/* Quick Actions Cards (Mobile Friendly) */}
        <div className="mb-6 md:mb-8 grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <ActionCard
            title={UI_STRINGS.SALES.POS.FULL_POS}
            description={UI_STRINGS.SALES.POS.FULL_POS_DESC}
            icon="🏪"
            layout="vertical"
            hoverBorderColor="border-blue-500"
            onClick={handleGoToPOS}
          />

          <ActionCard
            title={UI_STRINGS.SALES.POS.QUICK_INVOICE}
            description={UI_STRINGS.SALES.POS.QUICK_INVOICE_DESC}
            icon="⚡"
            layout="vertical"
            hoverBorderColor="border-green-500"
            onClick={() => setShowInvoiceDialog(true)}
          />

          <ActionCard
            title="Product Grid"
            description="Visual selection"
            icon="🎯"
            layout="vertical"
            hoverBorderColor="border-purple-500"
            onClick={() => setShowProductGridModal(true)}
          />

          <ActionCard
            title="Reports"
            description="Analytics"
            icon="📊"
            layout="vertical"
            hoverBorderColor="border-orange-500"
            onClick={() => router.push("/branch/reports")}
          />
        </div>

        {/* Sales Transactions Table */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Sales Transactions
            </h2>
            <button
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
              className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm"
            >
              🔄 Refresh
            </button>
          </div>
          <SalesTable refreshTrigger={refreshTrigger} />
        </div>

        {/* Help Section */}
        <InfoBanner variant="info" title="Quick Tips" icon="💡">
          <ul className="space-y-1">
            <li>
              • Use <strong>Go to Point of Sale</strong> for full transaction interface with product
              search
            </li>
            <li>
              • Use <strong>New Invoice</strong> for the detailed invoice creation form
            </li>
            <li>
              • Use <strong>Product Grid</strong> for visual product selection with images
            </li>
            <li>• Click on any transaction in the table to view details</li>
            <li>• Use filters to search by date, payment method, and status</li>
          </ul>
        </InfoBanner>
      </div>

      {/* Modals */}
      {/* Primary invoice dialog with full features */}
      <InvoiceDialog
        isOpen={showInvoiceDialog}
        onClose={() => setShowInvoiceDialog(false)}
        onSuccess={(sale) => {
          setShowInvoiceDialog(false);
          setRefreshTrigger((prev) => prev + 1);
        }}
      />

      {/* Legacy modals kept for backward compatibility */}
      <NewInvoiceModal
        isOpen={showNewInvoiceModal}
        onClose={() => setShowNewInvoiceModal(false)}
        onSuccess={() => {
          setShowNewInvoiceModal(false);
          setRefreshTrigger((prev) => prev + 1);
        }}
      />

      <ProductGridModal
        isOpen={showProductGridModal}
        onClose={() => setShowProductGridModal(false)}
        onProductSelect={handleProductSelect}
      />
    </div>
  );
}
