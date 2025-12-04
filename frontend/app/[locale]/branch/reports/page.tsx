"use client";

import React, { useState } from "react";
import ReportViewer from "@/components/branch/reports/ReportViewer";
import reportService, {
  SalesReport,
  InventoryReport,
  FinancialReport,
  ExportReportRequest,
} from "@/services/report.service";

type ReportType = "sales" | "inventory" | "financial";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("sales");
  const [reportData, setReportData] = useState<
    SalesReport | InventoryReport | FinancialReport | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [negativeStockOnly, setNegativeStockOnly] = useState(false);
  const [includeMovements, setIncludeMovements] = useState(false);

  const handleGenerateReport = async () => {
    setLoading(true);
    setError(null);

    try {
      let data: SalesReport | InventoryReport | FinancialReport;

      switch (reportType) {
        case "sales":
          data = await reportService.generateSalesReport({
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            paymentMethod: paymentMethod || undefined,
            groupBy,
          });
          break;

        case "inventory":
          data = await reportService.generateInventoryReport({
            lowStockOnly,
            negativeStockOnly,
            includeMovements,
            startDate: includeMovements && startDate ? startDate : undefined,
            endDate: includeMovements && endDate ? endDate : undefined,
          });
          break;

        case "financial":
          data = await reportService.generateFinancialReport({
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            groupBy,
          });
          break;

        default:
          throw new Error("Invalid report type");
      }

      setReportData(data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to generate report");
      console.error("Report generation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: "pdf" | "excel" | "csv") => {
    try {
      setLoading(true);
      const exportRequest: ExportReportRequest = {
        reportType,
        format,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        filters: {
          paymentMethod: reportType === "sales" && paymentMethod ? paymentMethod : undefined,
          lowStockOnly: reportType === "inventory" ? lowStockOnly : undefined,
          negativeStockOnly: reportType === "inventory" ? negativeStockOnly : undefined,
          groupBy: reportType !== "inventory" ? groupBy : undefined,
        },
        options: {
          includeCharts: true,
          includeDetails: true,
          pageOrientation: "landscape",
        },
      };

      const blob = await reportService.exportReport(exportRequest);
      const fileName = `${reportType}-report-${new Date().toISOString().split("T")[0]}.${
        format === "excel" ? "xlsx" : format
      }`;
      reportService.downloadReport(blob, fileName);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Failed to export report");
      console.error("Report export error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Reports & Analytics
        </h1>
        <p className="text-gray-600 mt-2">
          Generate comprehensive reports for sales, inventory, and financial data
        </p>
      </div>

      {/* Report Type Selection */}
      <div className="bg-white dark:bg-gray-800  rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Report Type</h2>
        <div className="flex gap-4">
          <button
            onClick={() => {
              setReportType("sales");
              setReportData(null);
            }}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              reportType === "sales"
                ? "bg-blue-600 dark:bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Sales Report
          </button>
          <button
            onClick={() => {
              setReportType("inventory");
              setReportData(null);
            }}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              reportType === "inventory"
                ? "bg-blue-600 dark:bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Inventory Report
          </button>
          <button
            onClick={() => {
              setReportType("financial");
              setReportData(null);
            }}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              reportType === "financial"
                ? "bg-blue-600 dark:bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Financial Report
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800  rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range (for all reports) */}
          {reportType !== "inventory" || includeMovements ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800  dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800  dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                />
              </div>
            </>
          ) : null}

          {/* Sales-specific filters */}
          {reportType === "sales" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800  dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="">All</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Both">Both</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Group By
                </label>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as "day" | "week" | "month")}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800  dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                </select>
              </div>
            </>
          )}

          {/* Inventory-specific filters */}
          {reportType === "inventory" && (
            <>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="lowStockOnly"
                  checked={lowStockOnly}
                  onChange={(e) => setLowStockOnly(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="lowStockOnly" className="ml-2 text-sm text-gray-700">
                  Low Stock Only
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="negativeStockOnly"
                  checked={negativeStockOnly}
                  onChange={(e) => setNegativeStockOnly(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="negativeStockOnly" className="ml-2 text-sm text-gray-700">
                  Negative Stock Only
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeMovements"
                  checked={includeMovements}
                  onChange={(e) => setIncludeMovements(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="includeMovements" className="ml-2 text-sm text-gray-700">
                  Include Movements
                </label>
              </div>
            </>
          )}

          {/* Financial-specific filters */}
          {reportType === "financial" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Group By</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as "day" | "week" | "month")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </div>
          )}
        </div>

        <div className="mt-6">
          <button
            onClick={handleGenerateReport}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Generating..." : "Generate Report"}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Report Viewer */}
      <ReportViewer
        reportType={reportType}
        reportData={reportData}
        loading={loading}
        onExport={handleExport}
      />
    </div>
  );
}
