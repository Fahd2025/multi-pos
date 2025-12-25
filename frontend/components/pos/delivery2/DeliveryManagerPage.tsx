/**
 * DeliveryManagerPage Component
 * A full-page component for managing delivery orders
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Truck,
  MapPin,
  Clock,
  User,
  Filter,
  Printer,
  Search,
  ChevronDown,
  Check,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Table2,
} from "lucide-react";
import styles from "../Pos2.module.css";
import { DeliveryOrderDto, DeliveryStatus, DriverDto, DeliveryPriority } from "@/types/api.types";
import { getPaymentMethodName } from "@/types/enums";
import deliveryService from "@/services/delivery.service";
import salesService from "@/services/sales.service";
import branchInfoService from "@/services/branch-info.service";
import invoiceTemplateService from "@/services/invoice-template.service";
import { transformSaleToInvoiceData } from "@/lib/invoice-data-transformer";
import { InvoiceSchema } from "@/types/invoice-template.types";
import InvoicePreview from "@/components/invoice/InvoicePreview";
import { useReactToPrint } from "react-to-print";
import { OrderCard } from "../OrderCard";
import { DeliveryFilters } from "./DeliveryFilters";
import { DeliveryDetailView } from "./DeliveryDetailView";
import { SkeletonLoader } from "../SkeletonLoader";

export const DeliveryManagerPage: React.FC = () => {
  const router = useRouter();
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrderDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrderDto | null>(null);
  const [drivers, setDrivers] = useState<DriverDto[]>([]);
  const [showFilters, setShowFilters] = useState(false); // Default to false, maybe true on desktop?
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | null>(null);
  const [driverFilter, setDriverFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<DeliveryPriority | null>(null);
  const [advancedSearch, setAdvancedSearch] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Invoice printing state
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [invoiceSchema, setInvoiceSchema] = useState<InvoiceSchema | null>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);

  // Helper functions to get date ranges
  const getDateRangeStart = (range: string): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of day
    switch (range) {
      case "today":
        return today.toISOString();
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString();
      case "7days":
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return sevenDaysAgo.toISOString();
      case "30days":
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return thirtyDaysAgo.toISOString();
      default:
        return today.toISOString(); // today
    }
  };

  const getDateRangeEnd = (range: string): string => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of day
    return today.toISOString();
  };

  // Fetch delivery orders and drivers on mount
  useEffect(() => {
    fetchDeliveryOrders();
    fetchDrivers();
    // Default show filters on large screens? Let's keep it collapsed for cleaner look initially
  }, []);

  const fetchDeliveryOrders = async () => {
    try {
      setLoadingOrders(true);
      setError(null);
      const params: any = {
        status: statusFilter ?? undefined,
        driverId: driverFilter ?? undefined,
        search: advancedSearch || searchQuery || undefined,
        priority: priorityFilter ?? undefined,
        page: currentPage,
        pageSize: pageSize,
      };

      // Add date filtering based on the dateFilter value
      if (dateFilter) {
        if (dateFilter.includes(" - ")) {
          // Custom date range format: "YYYY-MM-DD - YYYY-MM-DD"
          const [startStr, endStr] = dateFilter.split(" - ");
          if (startStr && endStr) {
            const startDate = new Date(startStr);
            const endDate = new Date(endStr);
            // Set end date to end of day
            endDate.setHours(23, 59, 59, 999);

            params.dateFrom = startDate.toISOString();
            params.dateTo = endDate.toISOString();
          }
        } else {
          // Standard date ranges
          params.dateFrom = getDateRangeStart(dateFilter);
          params.dateTo = getDateRangeEnd(dateFilter);
        }
      }

      const response = await deliveryService.getDeliveryOrders(params);
      setDeliveryOrders(response.data);
      setTotalItems(response.pagination.totalItems);
      setTotalPages(response.pagination.totalPages);
    } catch (error: any) {
      console.error("Failed to fetch delivery orders:", error);
      setError(error.message || "Failed to fetch delivery orders");
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      setLoadingDrivers(true);
      const response = await deliveryService.getDrivers({
        isActive: true,
        isAvailable: true,
      });
      setDrivers(response.data);
    } catch (error: any) {
      console.error("Failed to fetch drivers:", error);
    } finally {
      setLoadingDrivers(false);
    }
  };

  // Memoized orders by status for performance
  const ordersByStatusMemo = useMemo(() => {
    const ordersByStatus: Record<string, DeliveryOrderDto[]> = {
      [DeliveryStatus.Pending.toString()]: [],
      [DeliveryStatus.Assigned.toString()]: [],
      [DeliveryStatus.OutForDelivery.toString()]: [],
      [DeliveryStatus.Delivered.toString()]: [],
      [DeliveryStatus.Failed.toString()]: [],
    };

    deliveryOrders.forEach((order) => {
      // Validate that the status is a valid DeliveryStatus
      if (order.deliveryStatus !== undefined) {
        const statusKey = order.deliveryStatus.toString();
        if (ordersByStatus[statusKey] !== undefined) {
          ordersByStatus[statusKey].push(order);
        }
      }
    });

    return ordersByStatus;
  }, [deliveryOrders]);

  const handleFilterChange = (filters: {
    status: DeliveryStatus | null;
    driverId: string | null;
    dateRange: string | null;
    priority: DeliveryPriority | null;
    search: string | null;
  }) => {
    setStatusFilter(filters.status);
    setDriverFilter(filters.driverId);
    setDateFilter(filters.dateRange);
    setPriorityFilter(filters.priority);
    setAdvancedSearch(filters.search);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleOrderStatusChange = async (orderId: string, newStatus: DeliveryStatus) => {
    try {
      setError(null);
      const updatedOrder = await deliveryService.updateDeliveryStatus(orderId, newStatus);
      setDeliveryOrders((prev) =>
        prev.map((order) => (order.id === orderId ? updatedOrder : order))
      );

      // If the selected order was updated, update it in detail view too
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(updatedOrder);
      }
      setSuccess("Delivery status updated successfully");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error("Failed to update delivery status:", error);
      setError(error.message || "Failed to update delivery status");
    }
  };

  const handleAssignDriver = async (orderId: string, driverId: string) => {
    try {
      setError(null);
      const updatedOrder = await deliveryService.assignDriverToDeliveryOrder(orderId, driverId);
      setDeliveryOrders((prev) =>
        prev.map((order) => (order.id === orderId ? updatedOrder : order))
      );

      // If the selected order was updated, update it in detail view too
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(updatedOrder);
      }
      setSuccess("Driver assigned successfully");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error("Failed to assign driver:", error);
      setError(error.message || "Failed to assign driver");
    }
  };

  const handlePrintInvoice = async (orderId: string) => {
    try {
      console.log("Starting invoice preparation for delivery order:", orderId);

      // Find the delivery order in our current list
      const deliveryOrder = deliveryOrders.find(order => order.id === orderId);

      if (!deliveryOrder) {
        console.error("Delivery order not found");
        setError("Delivery order not found");
        return;
      }

      // Check if we already have sale data in the delivery order
      let sale = deliveryOrder.sale;

      // If no sale data, fetch it
      if (!sale && deliveryOrder.orderId) {
        console.log("Fetching sale data for order:", deliveryOrder.orderId);
        sale = await salesService.getSaleById(deliveryOrder.orderId);
      }

      if (!sale) {
        console.error("Sale data not found");
        setError("Cannot print invoice without sale data");
        return;
      }

      // Load active template
      const template = await invoiceTemplateService.getActiveTemplate();
      console.log("Active template loaded:", template?.name);

      if (!template) {
        console.warn("No active template found");
        setError("No active invoice template found. Please activate a template in Settings.");
        return;
      }

      // Parse schema
      const parsedSchema = JSON.parse(template.schema) as InvoiceSchema;
      console.log("Schema parsed successfully");

      // Load branch info
      const branchInfo = await branchInfoService.getBranchInfo();
      console.log("Branch info loaded:", branchInfo?.nameEn);

      // Transform sale data to invoice data format
      const transformedData = transformSaleToInvoiceData(sale, branchInfo);

      // Set invoice data and trigger print
      setInvoiceSchema(parsedSchema);
      setInvoiceData(transformedData);

      // Trigger print after a short delay to ensure rendering
      setTimeout(() => {
        console.log("Attempting to print, invoiceRef.current:", invoiceRef.current);
        if (invoiceRef.current && handlePrint) {
          console.log("Triggering print...");
          try {
            handlePrint();
            setSuccess("Invoice sent to printer");
          } catch (printErr) {
            console.error("Error calling handlePrint:", printErr);
            setError("Failed to trigger print");
          }
        } else {
          console.error("Cannot print - invoiceRef.current:", invoiceRef.current);
          setError("Invoice component not ready");
        }
      }, 500);
    } catch (error) {
      console.error("Error printing invoice:", error);
      setError("Failed to prepare invoice for printing");
    }
  };

  // Set up print handler using react-to-print
  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice-${invoiceData?.invoiceNumber || "Delivery"}`,
  });

  const handleRefresh = () => {
    setCurrentPage(1); // Reset to first page when refreshing
    fetchDeliveryOrders();
  };

  // Navigation handlers
  const handleBackToPos = () => {
    router.push("/pos");
  };

  const handleTableManagement = () => {
    // Assuming a route exists, or placeholder
    console.log("Navigating to Table Management");
    // router.push("/pos/tables"); // Uncomment when route exists
  };

  return (
    <div className={styles.deliveryPageContainer}>
      {/* Header */}
      <div className={styles.deliveryPageHeader}>
        <div className={styles.deliveryPageTitle}>
          <button className={styles.backBtn} onClick={handleBackToPos} title="Back to POS">
            <ArrowLeft size={20} />
          </button>
          <Truck size={28} className="text-emerald-500" />
          <h1>Delivery Management</h1>
        </div>

        <div className={styles.deliveryPageActions}>
          {/* Table Management Quick Link */}
          {/* Table Management Quick Link - Hidden as requested
           <button 
            className={`${styles.navBtn} ${styles.btnSecondary} hidden md:flex`}
            onClick={handleTableManagement}
            title="Table Management"
           >
                <Table2 size={20} />
                <span className="ml-2">Tables</span>
           </button>
           */}

          {/* Search Bar */}
          {!showFilters && (
            <div className={styles.headerSearchBar}>
              <Search className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              {searchQuery && (
                <button className={styles.searchClearBtn} onClick={() => setSearchQuery("")}>
                  ×
                </button>
              )}
            </div>
          )}
          <button
            className={`${styles.filterBtn} ${showFilters ? styles.btnActive : ""}`}
            onClick={() => setShowFilters(!showFilters)}
            title="Filters"
          >
            <Filter size={20} />
          </button>

          <button className={styles.refreshBtn} onClick={handleRefresh} title="Refresh orders">
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      <div className={styles.deliveryContent}>
        {/* Search Bar - only show if filters are hidden, otherwise it's in filters */}

        {/* Filters Panel */}
        {showFilters && (
          <DeliveryFilters
            onFilterChange={handleFilterChange}
            onApplyFilters={fetchDeliveryOrders}
            drivers={drivers}
          />
        )}

        {/* Error and Success Messages */}
        {error && (
          <div className={`${styles.errorMessage} ${styles.alert}`}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className={`${styles.successMessage} ${styles.alert}`}>
            <CheckCircle size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* Kanban Board View */}
        <div className={styles.deliveryKanbanBoard}>
          {loadingOrders ? (
            // Show skeleton loaders while data is loading
            <SkeletonLoader count={3} type="order-card" />
          ) : deliveryOrders.length === 0 && (searchQuery || advancedSearch) ? (
            <div className={styles.noResults}>
              <Search size={48} className={styles.noResultsIcon} />
              <h3>No Orders Found</h3>
              <p>No delivery orders match your search criteria.</p>
            </div>
          ) : (
            Object.entries(ordersByStatusMemo).map(([statusKey, orders]) => {
              // Safe enum parsing
              const statusCode = parseInt(statusKey);
              const isValidStatus = Object.values(DeliveryStatus).includes(statusCode);
              const status = isValidStatus
                ? (statusCode as DeliveryStatus)
                : DeliveryStatus.Pending;
              const statusName = isValidStatus ? DeliveryStatus[status] : "Unknown";

              return (
                <div key={statusKey} className={styles.kanbanColumn}>
                  <div className={styles.kanbanColumnHeader}>
                    <h3>{statusName}</h3>
                    <span className={styles.badge}>{orders.length}</span>
                  </div>

                  <div className={styles.kanbanColumnContent}>
                    {orders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onClick={() => setSelectedOrder(order)}
                        onStatusChange={handleOrderStatusChange}
                        onAssignDriver={handleAssignDriver}
                        onPrintInvoice={handlePrintInvoice}
                        drivers={drivers}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Controls - Fixed at bottom or floating? Let's keep it simple at the bottom of content */}
        {totalPages > 1 && (
          <div className={styles.paginationControls}>
            <div className={styles.paginationInfo}>
              Showing {(currentPage - 1) * pageSize + 1}-
              {Math.min(currentPage * pageSize, totalItems)} of {totalItems} orders
            </div>
            <div className={styles.paginationButtons}>
              <button
                className={styles.paginationBtn}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className={styles.pageInfo}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                className={styles.paginationBtn}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail View - Appears when an order is selected as a modal/overlay */}
      {selectedOrder && (
        <DeliveryDetailView
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleOrderStatusChange}
          onAssignDriver={handleAssignDriver}
          onPrintInvoice={handlePrintInvoice}
          drivers={drivers}
        />
      )}

      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <p>Loading application...</p>
        </div>
      )}

      {/* Hidden invoice for printing */}
      {invoiceSchema && invoiceData && (
        <div style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          width: invoiceSchema.paperSize === "Thermal80mm" ? "80mm" :
                 invoiceSchema.paperSize === "Thermal58mm" ? "58mm" :
                 invoiceSchema.paperSize === "A4" ? "210mm" : "80mm",
          maxWidth: invoiceSchema.paperSize === "Thermal80mm" ? "80mm" :
                    invoiceSchema.paperSize === "Thermal58mm" ? "58mm" :
                    invoiceSchema.paperSize === "A4" ? "210mm" : "80mm",
          overflow: "hidden"
        }}>
          <InvoicePreview ref={invoiceRef} schema={invoiceSchema} data={invoiceData} />
        </div>
      )}
    </div>
  );
};
