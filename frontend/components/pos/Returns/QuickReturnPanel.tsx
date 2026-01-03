/**
 * Quick Return Panel for POS
 * Allows cashiers to quickly search and process returns from recent sales
 * Features: Status badges, filters, date range selection
 */

"use client";

import React, { useState, useEffect } from "react";
import { X, Search, RotateCcw, AlertCircle, Calendar, User, Receipt, Filter, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp, Package, Info, Printer } from "lucide-react";
import { SaleDto, ReturnResponseDto } from "@/types/api.types";
import salesService from "@/services/sales.service";
import { formatCurrency, formatDate } from "@/lib/utils";
import ReturnInvoiceDialog from "@/components/branch/sales/ReturnInvoiceDialog";
import { toast } from "sonner";

interface QuickReturnPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onReturnProcessed?: (returnResponse: ReturnResponseDto) => void;
}

type InvoiceStatusFilter = "all" | "active" | "partial" | "returned";
type InvoiceTypeFilter = "all" | "standard" | "simplified";

export const QuickReturnPanel: React.FC<QuickReturnPanelProps> = ({
  isOpen,
  onClose,
  onReturnProcessed,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSales, setRecentSales] = useState<SaleDto[]>([]);
  const [filteredSales, setFilteredSales] = useState<SaleDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleDto | null>(null);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [loadingReturns, setLoadingReturns] = useState<{ [key: string]: boolean }>({});

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<InvoiceTypeFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateRangePreset, setDateRangePreset] = useState<string>("today");

  // Date range presets
  const dateRangePresets = [
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "last7days", label: "Last 7 Days" },
    { value: "last30days", label: "Last 30 Days" },
    { value: "custom", label: "Custom Range" },
  ];

  // Calculate date range based on preset
  const calculateDateRange = (preset: string) => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    switch (preset) {
      case "today":
        setDateFrom(todayStr);
        setDateTo(todayStr);
        break;
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        setDateFrom(yesterdayStr);
        setDateTo(yesterdayStr);
        break;
      case "last7days":
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        setDateFrom(sevenDaysAgo.toISOString().split("T")[0]);
        setDateTo(todayStr);
        break;
      case "last30days":
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        setDateFrom(thirtyDaysAgo.toISOString().split("T")[0]);
        setDateTo(todayStr);
        break;
      case "custom":
        // Don't change dates for custom range
        break;
      default:
        break;
    }
  };

  // Initialize with today's date on mount
  useEffect(() => {
    calculateDateRange("today");
  }, []);

  // Load recent sales when panel opens or filters change
  useEffect(() => {
    if (isOpen && dateFrom && dateTo) {
      loadRecentSales();
    }
  }, [isOpen, dateFrom, dateTo]);

  // Filter sales based on search query and filters
  useEffect(() => {
    let filtered = [...recentSales];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((sale) => {
        return (
          sale.invoiceNumber?.toLowerCase().includes(query) ||
          sale.transactionId?.toLowerCase().includes(query) ||
          sale.customerName?.toLowerCase().includes(query)
        );
      });
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((sale) => {
        if (statusFilter === "returned") {
          return sale.status === "returned";
        } else if (statusFilter === "partial") {
          return sale.status === "partially_returned";
        } else if (statusFilter === "active") {
          return sale.status !== "returned" && sale.status !== "partially_returned";
        }
        return true;
      });
    }

    // Filter by invoice type
    if (typeFilter !== "all") {
      filtered = filtered.filter((sale) => {
        if (typeFilter === "standard") {
          return sale.invoiceType === 0; // Standard invoice
        } else if (typeFilter === "simplified") {
          return sale.invoiceType === 1; // Simplified invoice
        }
        return true;
      });
    }

    setFilteredSales(filtered);
  }, [searchQuery, recentSales, statusFilter, typeFilter]);

  const loadRecentSales = async () => {
    setLoading(true);
    try {
      // Convert date strings to ISO format for API
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);

      const response = await salesService.getSales({
        dateFrom: fromDate.toISOString(),
        dateTo: toDate.toISOString(),
        isVoided: false,
        pageSize: 200,
      });

      // Filter out voided sales and return invoices (isReturn = true)
      // Keep all sales including returned and partially returned for viewing
      const validSales = response.data.filter(
        (sale) => !sale.isVoided && !sale.isReturn
      );

      setRecentSales(validSales);
      setFilteredSales(validSales);
    } catch (error: any) {
      console.error("Failed to load recent sales:", error);
      toast.error("Failed to load recent sales");
    } finally {
      setLoading(false);
    }
  };

  // Get status badge for sale
  const getStatusBadge = (sale: SaleDto) => {
    if (sale.status === "returned") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
          <XCircle className="w-3 h-3" />
          Cancelled
        </span>
      );
    } else if (sale.status === "partially_returned") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-800 rounded-full">
          <AlertTriangle className="w-3 h-3" />
          Partial Return
        </span>
      );
    }
    return null;
  };

  // Get invoice type badge for sale
  const getInvoiceTypeBadge = (sale: SaleDto) => {
    const invoiceType = sale.invoiceType === 0 ? "Standard" : "Simplified";
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
        <CheckCircle className="w-3 h-3" />
        {invoiceType}
      </span>
    );
  };

  const handleSelectSale = async (sale: SaleDto) => {
    // Show notification for fully returned sales instead of opening dialog
    if (sale.status === "returned") {
      toast.info(
        "Fully Returned Invoice",
        {
          description: `Invoice ${sale.invoiceNumber || sale.transactionId} has been fully returned. No further returns can be processed.`,
          duration: 4000,
        }
      );
      return;
    }

    try {
      // Fetch full sale details with line items
      const fullSale = await salesService.getSaleById(sale.id);
      setSelectedSale(fullSale);
      setReturnDialogOpen(true);
    } catch (error: any) {
      console.error("Error loading sale:", error);
      toast.error(error.message || "Failed to load sale details");
    }
  };

  // Toggle expand/collapse for sale card
  const handleToggleExpand = async (saleId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click

    if (expandedSaleId === saleId) {
      setExpandedSaleId(null);
      return;
    }

    setExpandedSaleId(saleId);

    // Load return history if not already loaded
    const sale = filteredSales.find(s => s.id === saleId);
    if (sale && (sale.status === "returned" || sale.status === "partially_returned")) {
      // Fetch returns for this sale if we haven't already
      if (!loadingReturns[saleId]) {
        setLoadingReturns(prev => ({ ...prev, [saleId]: true }));
        try {
          // The return data will be loaded when expanded
          await salesService.getReturnsForSale(saleId);
        } catch (error) {
          console.error("Error loading returns:", error);
        } finally {
          setLoadingReturns(prev => ({ ...prev, [saleId]: false }));
        }
      }
    }
  };

  // Handle print invoice
  const handlePrintInvoice = async (saleId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click

    try {
      await salesService.printInvoice(saleId);
      toast.success("Opening print dialog...");
    } catch (error: any) {
      console.error("Error printing invoice:", error);
      toast.error(error.message || "Failed to print invoice");
    }
  };

  // Calculate item summary for a sale
  const getItemSummary = (sale: SaleDto) => {
    if (!sale.lineItems || sale.lineItems.length === 0) {
      return { totalItems: 0, totalQuantity: 0, returnedQuantity: 0, remainingQuantity: 0 };
    }

    const totalItems = sale.lineItems.length;
    const totalQuantity = sale.lineItems.reduce((sum, item) => sum + item.quantity, 0);
    const returnedQuantity = sale.lineItems.reduce((sum, item) => sum + (item.returnQuantity || 0), 0);
    const remainingQuantity = totalQuantity - returnedQuantity;

    return { totalItems, totalQuantity, returnedQuantity, remainingQuantity };
  };

  const handleReturnSuccess = (returnResponse: ReturnResponseDto) => {
    toast.success(`Return ${returnResponse.returnOrderNumber} processed successfully!`);
    setReturnDialogOpen(false);
    setSelectedSale(null);

    // Refresh sales list
    loadRecentSales();

    // Notify parent
    if (onReturnProcessed) {
      onReturnProcessed(returnResponse);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
    setDateRangePreset("today");
    calculateDateRange("today");
  };

  const handlePresetChange = (preset: string) => {
    setDateRangePreset(preset);
    calculateDateRange(preset);
  };

  const handleDateFromChange = (value: string) => {
    setDateFrom(value);
    setDateRangePreset("custom");
  };

  const handleDateToChange = (value: string) => {
    setDateTo(value);
    setDateRangePreset("custom");
  };

  const handleClose = () => {
    setSearchQuery("");
    setSelectedSale(null);
    setReturnDialogOpen(false);
    setExpandedSaleId(null);
    onClose();
  };

  // Render return details for expanded card
  const renderReturnDetails = (sale: SaleDto) => {
    if (!sale.lineItems || sale.lineItems.length === 0) {
      return (
        <div className="text-sm text-gray-500 text-center py-2">
          No item details available
        </div>
      );
    }

    const hasReturns = sale.lineItems.some(item => (item.returnQuantity || 0) > 0);

    if (!hasReturns) {
      return (
        <div className="flex items-center gap-2 text-sm text-gray-600 py-2">
          <Info className="w-4 h-4" />
          <span>No returns processed yet for this invoice</span>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 pb-2 border-b">
          <Package className="w-4 h-4" />
          <span>Return Details</span>
        </div>
        {sale.lineItems.map((item) => {
          const returnQty = item.returnQuantity || 0;
          const remainingQty = item.quantity - returnQty;

          if (returnQty === 0) return null;

          return (
            <div key={item.id} className="flex items-start justify-between text-sm bg-gray-50 p-2 rounded">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.productName}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                  <span>Original: {item.quantity}</span>
                  <span className="text-red-600 font-medium">Returned: {returnQty}</span>
                  {remainingQty > 0 && (
                    <span className="text-green-600">Remaining: {remainingQty}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-gray-900 font-medium">
                  {formatCurrency(item.unitPrice * returnQty)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatCurrency(item.unitPrice)}/unit
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Count active filters
  const activeFiltersCount =
    (statusFilter !== "all" ? 1 : 0) +
    (typeFilter !== "all" ? 1 : 0) +
    (dateRangePreset !== "today" ? 1 : 0);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full md:w-[500px] lg:w-[600px] bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-red-500 to-red-600 text-white">
          <div className="flex items-center gap-3">
            <RotateCcw className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-semibold">Quick Return</h2>
              <p className="text-sm text-red-100">Process returns for today's sales</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-red-600/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar and Filter Toggle */}
        <div className="p-4 border-b bg-gray-50 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by invoice #, transaction ID, or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                showFilters || activeFiltersCount > 0
                  ? "bg-red-500 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Filter className="w-5 h-5" />
              <span className="hidden sm:inline">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Filters Section */}
          {showFilters && (
            <div className="space-y-3 pt-3 border-t border-gray-200">
              {/* Date Range Preset */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <select
                  value={dateRangePreset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                >
                  {dateRangePresets.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Date Range */}
              {dateRangePreset === "custom" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">From</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => handleDateFromChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">To</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => handleDateToChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Invoice Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as InvoiceStatusFilter)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                >
                  <option value="all">All Invoices</option>
                  <option value="active">Active Only</option>
                  <option value="partial">Partial Returns</option>
                  <option value="returned">Fully Returned</option>
                </select>
              </div>

              {/* Invoice Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as InvoiceTypeFilter)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="standard">Standard Invoice</option>
                  <option value="simplified">Simplified Invoice</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sales List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p>Loading recent sales...</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
              <AlertCircle className="w-16 h-16 mb-4 text-gray-400" />
              <p className="text-lg font-medium">No sales found</p>
              <p className="text-sm text-center mt-2">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "No returnable sales from today yet"}
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {filteredSales.map((sale) => {
                const isExpanded = expandedSaleId === sale.id;
                const hasReturns = sale.status === "returned" || sale.status === "partially_returned";

                return (
                  <div
                    key={sale.id}
                    className={`bg-white border rounded-lg transition-all ${
                      sale.status === "returned"
                        ? "border-red-300 bg-red-50/30"
                        : "border-gray-200 hover:border-red-500 hover:shadow-md"
                    }`}
                  >
                    {/* Main Card - Clickable */}
                    <button
                      onClick={() => handleSelectSale(sale)}
                      className={`w-full p-4 text-left group ${
                        sale.status === "returned" ? "cursor-not-allowed opacity-75" : ""
                      }`}
                      disabled={sale.status === "returned"}
                    >
                      {/* Sale Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Receipt className={`w-5 h-5 ${sale.status === "returned" ? "text-red-300" : "text-red-500"}`} />
                          <div>
                            <p className={`font-semibold ${sale.status === "returned" ? "text-gray-500" : "text-gray-900 group-hover:text-red-600"}`}>
                              {sale.invoiceNumber || sale.transactionId}
                            </p>
                            {sale.invoiceNumber && sale.transactionId && (
                              <p className="text-sm text-gray-500">
                                ID: {sale.transactionId}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-lg ${sale.status === "returned" ? "text-gray-500" : "text-gray-900"}`}>
                            {formatCurrency(sale.total)}
                          </p>
                        </div>
                      </div>

                      {/* Badges Row */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {getInvoiceTypeBadge(sale)}
                        {getStatusBadge(sale)}
                      </div>

                      {/* Sale Details */}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {sale.customerName && (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{sale.customerName}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(sale.createdAt)}</span>
                        </div>
                      </div>

                      {/* Items Summary */}
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        {(() => {
                          const summary = getItemSummary(sale);
                          return (
                            <div className="space-y-2">
                              {/* Item counts and quantities */}
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-3 text-gray-600">
                                  <span className="font-medium">
                                    {summary.totalItems} item(s)
                                  </span>
                                  <span>
                                    {summary.totalQuantity} qty total
                                  </span>
                                  {summary.returnedQuantity > 0 && (
                                    <>
                                      <span className="text-red-600 font-medium">
                                        {summary.returnedQuantity} returned
                                      </span>
                                      {summary.remainingQuantity > 0 && (
                                        <span className="text-green-600 font-medium">
                                          {summary.remainingQuantity} remaining
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Additional info row */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  {sale.tableNumber && (
                                    <span>Table {sale.tableNumber}</span>
                                  )}
                                  {sale.paymentMethod !== undefined && (
                                    <span>
                                      {sale.tableNumber && " • "}
                                      {sale.paymentMethod === 0
                                        ? "Cash"
                                        : sale.paymentMethod === 1
                                        ? "Card"
                                        : "Other"}
                                    </span>
                                  )}
                                </div>

                                {/* Action buttons */}
                                <div className="flex items-center gap-1">
                                  {/* Print Button */}
                                  <button
                                    onClick={(e) => handlePrintInvoice(sale.id, e)}
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                    title="Print Invoice"
                                  >
                                    <Printer className="w-4 h-4" />
                                    <span className="hidden sm:inline">Print</span>
                                  </button>

                                  {/* Expand/Collapse Button */}
                                  {hasReturns && (
                                    <button
                                      onClick={(e) => handleToggleExpand(sale.id, e)}
                                      className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                    >
                                      {isExpanded ? (
                                        <>
                                          <span className="hidden sm:inline">Hide</span>
                                          <ChevronUp className="w-4 h-4" />
                                        </>
                                      ) : (
                                        <>
                                          <span className="hidden sm:inline">Details</span>
                                          <ChevronDown className="w-4 h-4" />
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </button>

                    {/* Expanded Return Details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-200 pt-3">
                        {renderReturnDetails(sale)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {filteredSales.length} sale(s) available for return
            </span>
            <button
              onClick={loadRecentSales}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Return Invoice Dialog */}
      <ReturnInvoiceDialog
        isOpen={returnDialogOpen}
        onClose={() => {
          setReturnDialogOpen(false);
          setSelectedSale(null);
        }}
        sale={selectedSale}
        onSuccess={handleReturnSuccess}
      />
    </>
  );
};
