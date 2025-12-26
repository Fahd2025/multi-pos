/**
 * Transaction Dialog V3
 * Unified dialog combining payment processing and save order functionality
 * Features tab navigation, responsive design, and touch-optimized interactions
 */

"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  X,
  CreditCard,
  Banknote,
  Percent,
  Users,
  Truck,
  UtensilsCrossed,
  ShoppingBag,
  Search,
  UserPlus,
  Calculator,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  ChevronUp,
  Save,
  FileText,
  CheckCircle,
} from "lucide-react";
import styles from "../pos/Pos2.module.css";
import { ProductDto, SaleDto, PendingOrderStatus } from "@/types/api.types";
import salesService from "@/services/sales.service";
import invoiceTemplateService from "@/services/invoice-template.service";
import branchInfoService from "@/services/branch-info.service";
import deliveryService from "@/services/delivery.service";
import customerService from "@/services/customer.service";
import tableService from "@/services/table.service";
import { InvoiceSchema } from "@/types/invoice-template.types";
import { useToast } from "@/hooks/useToast";
import { transformSaleToInvoiceData } from "@/lib/invoice-data-transformer";
import InvoicePreview from "@/components/invoice/InvoicePreview";
import { useReactToPrint } from "react-to-print";
import CashCalculator from "./CashCalculator";

interface OrderItem extends ProductDto {
  quantity: number;
}

export interface SaveOrderData {
  customerName?: string;
  customerPhone?: string;
  tableNumber?: number;
  guestCount?: number;
  orderType: number;
  status: PendingOrderStatus;
  notes?: string;
}

interface TransactionDialogV3Props {
  isOpen: boolean;
  onClose: () => void;
  cart: OrderItem[];
  subtotal: number;
  onTransactionSuccess: (sale: SaleDto) => void;
  onSaveOrder: (data: SaveOrderData) => Promise<void>;
  initialTableNumber?: string;
  initialGuestCount?: number;
}

interface CustomerDetails {
  id?: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

interface TableDetails {
  tableId?: number;
  tableNumber?: number;
  tableName: string;
  guestCount: number;
}

type OrderType = "delivery" | "dine-in" | "takeaway";
type PaymentMethod = "cash" | "credit-card" | "debit-card" | "mobile-payment";
type DiscountType = "percentage" | "amount";

export const TransactionDialogV3: React.FC<TransactionDialogV3Props> = ({
  isOpen,
  onClose,
  cart,
  subtotal,
  onTransactionSuccess,
  onSaveOrder,
  initialTableNumber,
  initialGuestCount,
}) => {
  const toast = useToast();

  // Payment Tab State
  const [orderType, setOrderType] = useState<OrderType>("takeaway");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [discountType, setDiscountType] = useState<DiscountType>("percentage");
  const [discountValue, setDiscountValue] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Customer state for payment
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Table state for payment
  const [tableDetails, setTableDetails] = useState<TableDetails>({
    tableNumber: initialTableNumber ? parseInt(initialTableNumber) : undefined,
    tableName: "",
    guestCount: initialGuestCount || 1,
  });
  const [availableTables, setAvailableTables] = useState<any[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [tableSearchQuery, setTableSearchQuery] = useState("");
  const [tableFilterStatus, setTableFilterStatus] = useState("all");
  const [tablesError, setTablesError] = useState<string | null>(null);

  // Accordion state - collapsed by default for compact view
  const [customerSectionExpanded, setCustomerSectionExpanded] = useState(false);
  const [tableSectionExpanded, setTableSectionExpanded] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  // Calculator state
  const [showCalculator, setShowCalculator] = useState(false);

  // Invoice printing state
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [invoiceSchema, setInvoiceSchema] = useState<InvoiceSchema | null>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [shouldPrint, setShouldPrint] = useState(false);
  const [closeAfterPrint, setCloseAfterPrint] = useState(false);
  const [saleAfterPrint, setSaleAfterPrint] = useState<SaleDto | null>(null);

  // Calculate paper width based on invoice schema
  const paperWidth = useMemo(() => {
    if (!invoiceSchema) return "80mm";
    switch (invoiceSchema.paperSize) {
      case "Thermal58mm":
        return "58mm";
      case "Thermal80mm":
        return "80mm";
      case "A4":
        return "210mm";
      default:
        return "80mm";
    }
  }, [invoiceSchema]);

  // Saving state
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  // Calculations for payment tab
  const taxRate = 0.15;
  const discountAmount =
    discountType === "percentage" ? (subtotal * discountValue) / 100 : discountValue;
  const subtotalAfterDiscount = subtotal - discountAmount;
  const taxAmount = subtotalAfterDiscount * taxRate;
  const total = subtotalAfterDiscount + taxAmount;
  const change = amountPaid - total;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Customer search handler
  useEffect(() => {
    const searchCustomers = async () => {
      if (!searchQuery || searchQuery.length < 2) {
        setSearchResults([]);
        setSearchError(null);
        return;
      }

      setSearchLoading(true);
      setSearchError(null);
      try {
        const results = await customerService.searchCustomers(searchQuery);
        setSearchResults(results);
      } catch (error: any) {
        console.error("Customer search error:", error);
        setSearchError(error.message || "Failed to search customers");
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchCustomers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Load tables for dine-in
  useEffect(() => {
    const loadTables = async () => {
      if (orderType !== "dine-in" || !tableSectionExpanded) return;

      setLoadingTables(true);
      setTablesError(null);
      try {
        const tables = await tableService.getTablesWithStatus();
        setAvailableTables(tables || []);
      } catch (error: any) {
        console.error("Error loading tables:", error);
        setTablesError(error.message || "Failed to load tables");
      } finally {
        setLoadingTables(false);
      }
    };

    loadTables();
  }, [orderType, tableSectionExpanded]);

  // Fetch table details when dialog opens with initialTableNumber from URL
  useEffect(() => {
    const fetchTableDetails = async () => {
      if (!isOpen || !initialTableNumber) return;

      try {
        // Fetch all tables to find the one matching the table number
        const tables = await tableService.getTablesWithStatus();
        const matchingTable = tables?.find(
          (t: any) => t.number?.toString() === initialTableNumber
        );

        if (matchingTable) {
          setTableDetails({
            tableId: matchingTable.id,
            tableNumber: matchingTable.number,
            tableName: matchingTable.name || `Table ${matchingTable.number}`,
            guestCount: initialGuestCount || 1,
          });
          // Automatically set order type to "dine-in" when table is selected
          setOrderType("dine-in");
        } else {
          console.warn("⚠️ Table not found for number:", initialTableNumber);
        }
      } catch (error: any) {
        console.error("❌ Error fetching table details:", error);
      }
    };

    fetchTableDetails();
  }, [isOpen, initialTableNumber, initialGuestCount]);

  // Customer handlers
  const handleSelectCustomer = (customer: any) => {
    setCustomerDetails({
      id: customer.id,
      name: customer.nameEn,
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.addressEn || "",
    });
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleCreateNewCustomer = () => {
    setShowNewCustomerForm(true);
    setNewCustomerForm({ name: "", phone: "", email: "", address: "" });
  };

  const handleSaveNewCustomer = () => {
    setCustomerDetails({
      name: newCustomerForm.name,
      phone: newCustomerForm.phone,
      email: newCustomerForm.email,
      address: newCustomerForm.address,
    });
    setShowNewCustomerForm(false);
    setNewCustomerForm({ name: "", phone: "", email: "", address: "" });
  };

  const handleCancelNewCustomer = () => {
    setShowNewCustomerForm(false);
    setNewCustomerForm({ name: "", phone: "", email: "", address: "" });
  };

  const handleClearCustomer = () => {
    setCustomerDetails({ name: "", phone: "", email: "", address: "" });
    setSearchQuery("");
    setSearchResults([]);
  };

  // Table handlers
  const handleSelectTable = (table: any) => {
    setTableDetails({
      tableId: table.id,
      tableNumber: table.number,
      tableName: table.name || `Table ${table.number}`,
      guestCount: table.capacity || 1,
    });
  };

  const handleClearTable = () => {
    setTableDetails({
      tableId: undefined,
      tableNumber: undefined,
      tableName: "",
      guestCount: 1,
    });
  };

  // Filter tables based on search and status
  const getFilteredTables = () => {
    return availableTables.filter((table) => {
      const matchesSearch =
        tableSearchQuery === "" ||
        table.number?.toString().includes(tableSearchQuery) ||
        table.tableNumber?.toString().includes(tableSearchQuery) ||
        table.name?.toLowerCase().includes(tableSearchQuery.toLowerCase()) ||
        table.zoneName?.toLowerCase().includes(tableSearchQuery.toLowerCase());

      const matchesStatus =
        tableFilterStatus === "all" ||
        (tableFilterStatus === "available" && (table.status === "available" || !table.status)) ||
        (tableFilterStatus === "occupied" && table.status === "occupied") ||
        (tableFilterStatus === "reserved" && table.status === "reserved");

      return matchesSearch && matchesStatus;
    });
  };

  // Get status colors for table
  const getTableStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "occupied":
        return {
          background: "rgba(239, 68, 68, 0.1)",
          border: "rgba(239, 68, 68, 0.3)",
          text: "rgb(239, 68, 68)",
        };
      case "reserved":
        return {
          background: "rgba(251, 191, 36, 0.1)",
          border: "rgba(251, 191, 36, 0.3)",
          text: "rgb(251, 191, 36)",
        };
      default:
        return {
          background: "rgba(16, 185, 129, 0.1)",
          border: "rgba(16, 185, 129, 0.3)",
          text: "rgb(16, 185, 129)",
        };
    }
  };

  // Get status text
  const getTableStatusText = (status?: string) => {
    if (!status) return "Available";
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  // Load tables
  const loadTables = async () => {
    setLoadingTables(true);
    setTablesError(null);

    try {
      const result = await tableService.getTablesWithStatus();
      setAvailableTables(result || []);
    } catch (err) {
      console.error("Error loading tables:", err);
      setTablesError("Failed to load tables");
    } finally {
      setLoadingTables(false);
    }
  };

  // Handle payment transaction
  const handleProcessTransaction = async () => {
    // Validation for delivery orders
    if (orderType === "delivery") {
      if (!customerDetails.name) {
        toast.error("Validation Error", "Customer name is required for delivery orders");
        setError("Customer name is required for delivery orders");
        return;
      }
      if (!customerDetails.phone) {
        toast.error("Validation Error", "Customer phone is required for delivery orders");
        setError("Customer phone is required for delivery orders");
        return;
      }
      if (!customerDetails.address) {
        toast.error("Validation Error", "Customer address is required for delivery orders");
        setError("Customer address is required for delivery orders");
        return;
      }
    }

    // Validation for cash payments
    if (paymentMethod === "cash" && amountPaid < total) {
      toast.error("Validation Error", "Amount paid must be greater than or equal to total");
      setError("Amount paid must be greater than or equal to total");
      return;
    }

    toast.info("Payment", "Processing transaction...");

    try {
      setProcessing(true);
      setError(null);

      // Create sale data
      const saleData = {
        customerId: customerDetails.id || undefined,
        customerName: customerDetails.name || undefined,
        customerPhone: customerDetails.phone || undefined,
        customerEmail: customerDetails.email || undefined,
        orderType: orderType === "takeaway" ? 0 : orderType === "dine-in" ? 1 : 2,
        paymentMethod:
          paymentMethod === "cash"
            ? 0
            : paymentMethod === "credit-card"
            ? 1
            : paymentMethod === "debit-card"
            ? 2
            : 3,
        invoiceType: 0, // 0 = Standard invoice
        tableId: orderType === "dine-in" ? tableDetails.tableId : undefined,
        tableNumber: orderType === "dine-in" ? tableDetails.tableNumber : undefined,
        guestCount: orderType === "dine-in" ? tableDetails.guestCount : undefined,
        deliveryAddress: orderType === "delivery" ? customerDetails.address : undefined,
        // Add DeliveryInfo object for delivery orders
        deliveryInfo: orderType === "delivery" ? {
          customerId: customerDetails.id || undefined,
          deliveryAddress: customerDetails.address || "",
          pickupAddress: undefined,
          specialInstructions: undefined,
          estimatedDeliveryMinutes: 30, // Default 30 minutes
          priority: 1, // 1 = Normal
        } : undefined,
        lineItems: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.sellingPrice,
          discountType: 0, // 0 = No discount
          discountValue: 0,
          discount: 0,
          totalPrice: item.sellingPrice * item.quantity,
        })),
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount: total,
        amountPaid,
        changeGiven: change > 0 ? change : 0,
      };

      const sale = await salesService.createSale(saleData);

      toast.success("Success!", `Transaction completed. Invoice: ${sale.invoiceNumber}`);

      // Trigger printing
      const template = await invoiceTemplateService.getActiveTemplate();
      if (template) {
        const parsedSchema = JSON.parse(template.schema) as InvoiceSchema;
        const branchInfo = await branchInfoService.getBranchInfo();
        if (branchInfo) {
          const transformedData = transformSaleToInvoiceData(sale, branchInfo);
          setInvoiceSchema(parsedSchema);
          setInvoiceData(transformedData);
          setShouldPrint(true);
          // Set flag to close after printing completes
          setCloseAfterPrint(true);
          setSaleAfterPrint(sale);
        }
      } else {
        // No invoice template, close immediately
        onTransactionSuccess(sale);
        onClose();
      }
    } catch (err: any) {
      console.error("Transaction error:", err);
      setError(err.message || "Failed to process transaction");
      toast.error("Error", err.message || "Failed to process transaction");
    } finally {
      setProcessing(false);
    }
  };

  // Handle complete without payment
  const handleCompleteWithoutPayment = async () => {
    // Validation for delivery orders
    if (orderType === "delivery") {
      if (!customerDetails.name) {
        toast.error("Validation Error", "Customer name is required for delivery orders");
        setError("Customer name is required for delivery orders");
        return;
      }
      if (!customerDetails.phone) {
        toast.error("Validation Error", "Customer phone is required for delivery orders");
        setError("Customer phone is required for delivery orders");
        return;
      }
      if (!customerDetails.address) {
        toast.error("Validation Error", "Customer address is required for delivery orders");
        setError("Customer address is required for delivery orders");
        return;
      }
    }

    toast.info("Processing", "Completing order without payment...");

    try {
      setProcessing(true);
      setError(null);

      // Create sale data with zero payment
      const saleData = {
        customerId: customerDetails.id || undefined,
        customerName: customerDetails.name || undefined,
        customerPhone: customerDetails.phone || undefined,
        customerEmail: customerDetails.email || undefined,
        orderType: orderType === "takeaway" ? 0 : orderType === "dine-in" ? 1 : 2,
        paymentMethod: 0, // Cash (but amount paid is 0)
        invoiceType: 0, // 0 = Standard invoice
        tableId: orderType === "dine-in" ? tableDetails.tableId : undefined,
        tableNumber: orderType === "dine-in" ? tableDetails.tableNumber : undefined,
        guestCount: orderType === "dine-in" ? tableDetails.guestCount : undefined,
        deliveryAddress: orderType === "delivery" ? customerDetails.address : undefined,
        // Add DeliveryInfo object for delivery orders
        deliveryInfo: orderType === "delivery" ? {
          customerId: customerDetails.id || undefined,
          deliveryAddress: customerDetails.address || "",
          pickupAddress: undefined,
          specialInstructions: undefined,
          estimatedDeliveryMinutes: 30, // Default 30 minutes
          priority: 1, // 1 = Normal
        } : undefined,
        lineItems: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.sellingPrice,
          discountType: 0, // 0 = No discount
          discountValue: 0,
          discount: 0,
          totalPrice: item.sellingPrice * item.quantity,
        })),
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount: total,
        amountPaid: 0, // No payment
        changeGiven: 0,
      };

      const sale = await salesService.createSale(saleData);

      toast.success("Success!", `Order completed without payment. Invoice: ${sale.invoiceNumber}`);

      // Trigger printing
      const template = await invoiceTemplateService.getActiveTemplate();
      if (template) {
        const parsedSchema = JSON.parse(template.schema) as InvoiceSchema;
        const branchInfo = await branchInfoService.getBranchInfo();
        if (branchInfo) {
          const transformedData = transformSaleToInvoiceData(sale, branchInfo);
          setInvoiceSchema(parsedSchema);
          setInvoiceData(transformedData);
          setShouldPrint(true);
          // Set flag to close after printing completes
          setCloseAfterPrint(true);
          setSaleAfterPrint(sale);
        }
      } else {
        // No invoice template, close immediately
        onTransactionSuccess(sale);
        onClose();
      }
    } catch (err: any) {
      console.error("Transaction error:", err);
      setError(err.message || "Failed to complete order");
      toast.error("Error", err.message || "Failed to complete order");
    } finally {
      setProcessing(false);
    }
  };

  // Handle save order - uses payment tab fields
  const handleSaveOrder = async () => {
    setSaving(true);
    try {
      // Map orderType to number: 0=Dine-in, 1=Takeaway, 2=Delivery
      const orderTypeNumber = orderType === "dine-in" ? 0 : orderType === "takeaway" ? 1 : 2;

      await onSaveOrder({
        customerName: customerDetails.name || undefined,
        customerPhone: customerDetails.phone || undefined,
        tableNumber: orderType === "dine-in" ? tableDetails.tableNumber || undefined : undefined,
        guestCount: orderType === "dine-in" ? tableDetails.guestCount : undefined,
        orderType: orderTypeNumber,
        status: PendingOrderStatus.Parked,
        notes: undefined,
      });

      toast.success("Success", "Order saved as parked");
      onClose();
    } catch (error) {
      console.error("Error saving order:", error);
      toast.error("Error", "Failed to save order");
    } finally {
      setSaving(false);
    }
  };

  // Auto-print invoice
  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice-${invoiceData?.invoiceNumber || "POS"}`,
    onAfterPrint: () => {
      setShouldPrint(false);
      setInvoiceSchema(null);
      setInvoiceData(null);

      // If we should close after printing, do so now
      if (closeAfterPrint && saleAfterPrint) {
        onTransactionSuccess(saleAfterPrint);
        setCloseAfterPrint(false);
        setSaleAfterPrint(null);
        onClose();
      }
    },
  });

  useEffect(() => {
    if (shouldPrint && invoiceSchema && invoiceData && handlePrint) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [shouldPrint, invoiceSchema, invoiceData, handlePrint]);

  return (
    <>
      {/* Invoice printing (hidden) */}
      {invoiceSchema && invoiceData && (
        <>
          <style
            key={`global-print-${paperWidth}`}
            dangerouslySetInnerHTML={{
              __html: `
              @media print {
                @page {
                  size: ${paperWidth} auto;
                  margin: 0;
                }
              }
            `,
            }}
          />
          <div
            key={`invoice-wrapper-${paperWidth}`}
            className="invoice-print-wrapper"
            style={{
              position: "fixed",
              left: "-9999px",
              top: 0,
              width: paperWidth,
              maxWidth: paperWidth,
            }}
          >
            <InvoicePreview ref={invoiceRef} schema={invoiceSchema} data={invoiceData} />
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .dialog-content-area {
          overflow-y: auto;
          max-height: calc(95vh - 200px);
        }
        @media (max-width: 640px) {
          .dialog-container {
            max-width: 100vw !important;
            max-height: 100vh !important;
            border-radius: 0 !important;
            margin: 0 !important;
          }
          .dialog-content-area {
            max-height: calc(100vh - 180px);
          }
        }
        @media (min-width: 480px) {
          .xs\\:inline {
            display: inline !important;
          }
          .xs\\:hidden {
            display: none !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          style={{ animation: "fadeIn 0.2s ease" }}
          onClick={onClose}
        />

        {/* Dialog Container */}
        <div className="flex min-h-full items-center justify-center p-0 sm:p-4">
          <div
            className="dialog-container relative w-full max-w-5xl max-h-[95vh] bg-white dark:bg-gray-800 rounded-none sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ animation: "slideUp 0.3s ease-out" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 dark:from-emerald-700 dark:to-emerald-800 px-3 sm:px-6 py-2 sm:py-3 flex-shrink-0">
              <div className="flex items-center justify-between ">
                <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span className="hidden sm:inline">Complete Order</span>
                  <span className="sm:hidden">Order</span>
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors touch-manipulation active:scale-95"
                  aria-label="Close dialog"
                >
                  <X size={20} className="sm:w-6 sm:h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="dialog-content-area flex-1 px-3 sm:px-6 py-2 sm:py-3">
              <div className={styles.dialogContent}>
                {/* Two-Column Layout */}
                <div className={styles.dialogTwoColumnLayout}>
                  {/* ORDER TYPE SECTION - Shows first on mobile */}
                  <div className={styles.dialogOrderTypeSection}>
                    {/* Order Type Selection */}
                    <div className={styles.formSection}>
                      <label className={styles.formLabel}>Order Type</label>
                      <div className={styles.orderTypeGrid}>
                        <button
                          className={`${styles.orderTypeBtn} ${
                            orderType === "delivery" ? styles.active : ""
                          }`}
                          onClick={() => setOrderType("delivery")}
                        >
                          <Truck size={24} />
                          <span>Delivery</span>
                        </button>
                        <button
                          className={`${styles.orderTypeBtn} ${
                            orderType === "dine-in" ? styles.active : ""
                          }`}
                          onClick={() => setOrderType("dine-in")}
                        >
                          <UtensilsCrossed size={24} />
                          <span>Dine-in</span>
                        </button>
                        <button
                          className={`${styles.orderTypeBtn} ${
                            orderType === "takeaway" ? styles.active : ""
                          }`}
                          onClick={() => setOrderType("takeaway")}
                        >
                          <ShoppingBag size={24} />
                          <span>Takeaway</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* LEFT COLUMN REMAINDER - Shows third on mobile */}
                  <div className={styles.dialogLeftColumn}>
                    {/* Payment Method */}
                    <div className={styles.formSection}>
                      <label className={styles.formLabel}>Payment Method</label>
                      <div className={styles.paymentMethodGrid}>
                        <button
                          className={`${styles.paymentMethodBtn} ${
                            paymentMethod === "cash" ? styles.active : ""
                          }`}
                          onClick={() => setPaymentMethod("cash")}
                        >
                          <Banknote size={20} />
                          <span>Cash</span>
                        </button>
                        <button
                          className={`${styles.paymentMethodBtn} ${
                            paymentMethod === "credit-card" ? styles.active : ""
                          }`}
                          onClick={() => setPaymentMethod("credit-card")}
                        >
                          <CreditCard size={20} />
                          <span>Credit Card</span>
                        </button>
                        <button
                          className={`${styles.paymentMethodBtn} ${
                            paymentMethod === "debit-card" ? styles.active : ""
                          }`}
                          onClick={() => setPaymentMethod("debit-card")}
                        >
                          <CreditCard size={20} />
                          <span>Debit Card</span>
                        </button>
                        <button
                          className={`${styles.paymentMethodBtn} ${
                            paymentMethod === "mobile-payment" ? styles.active : ""
                          }`}
                          onClick={() => setPaymentMethod("mobile-payment")}
                        >
                          <CreditCard size={20} />
                          <span>Mobile Pay</span>
                        </button>
                      </div>
                    </div>

                    {/* Discount */}
                    <div className={styles.formSection}>
                      <label className={styles.formLabel}>
                        <Percent size={18} />
                        Discount
                      </label>
                      <div className={styles.discountGrid}>
                        <select
                          className={styles.formSelect}
                          value={discountType}
                          onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="amount">Amount ($)</option>
                        </select>
                        <input
                          type="number"
                          placeholder="0"
                          className={styles.formInput}
                          value={discountValue || ""}
                          onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    {/* Transaction Summary */}
                    <div className={styles.transactionSummary}>
                      <h3 className={styles.summaryTitle}>Transaction Summary</h3>
                      <div className={styles.summaryGrid}>
                        <div className={styles.summaryRow}>
                          <span>Subtotal:</span>
                          <span>${subtotal.toFixed(2)}</span>
                        </div>
                        {discountAmount > 0 && (
                          <>
                            <div className={styles.summaryRow}>
                              <span>Discount:</span>
                              <span className={styles.discountText}>
                                -${discountAmount.toFixed(2)}
                              </span>
                            </div>
                            <div className={styles.summaryRow}>
                              <span>Amount After Discount:</span>
                              <span>${subtotalAfterDiscount.toFixed(2)}</span>
                            </div>
                          </>
                        )}
                        <div className={styles.summaryRow}>
                          <span>Tax (15%):</span>
                          <span>${taxAmount.toFixed(2)}</span>
                        </div>
                        <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                          <span>Total:</span>
                          <span>${total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Cash Calculator */}
                    {paymentMethod === "cash" && (
                      <CashCalculator
                        total={total}
                        amountPaid={amountPaid}
                        onAmountChange={setAmountPaid}
                      />
                    )}
                  </div>

                  {/* RIGHT COLUMN - Shows second on mobile (after order type) */}
                  <div className={styles.dialogRightColumn}>
                    {/* Table Selection for Dine-in */}
                    {orderType === "dine-in" && (
                      <div className={styles.collapsibleSection}>
                        {/* Accordion Header */}
                        <div
                          className={`${styles.collapsibleHeader} ${
                            tableSectionExpanded ? styles.active : ""
                          }`}
                          onClick={() => setTableSectionExpanded(!tableSectionExpanded)}
                        >
                          <div className={styles.collapsibleTitle}>
                            <UtensilsCrossed size={18} />
                            <span>Table Selection</span>
                            {tableDetails.tableNumber && (
                              <span className={styles.collapsibleBadge}>
                                Table {tableDetails.tableNumber}
                              </span>
                            )}
                          </div>
                          {tableSectionExpanded ? (
                            <ChevronUp size={20} />
                          ) : (
                            <ChevronDown size={20} />
                          )}
                        </div>

                        {/* Accordion Content */}
                        <div
                          className={`${styles.collapsibleContent} ${
                            tableSectionExpanded ? styles.expanded : ""
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Table Selector Section */}
                          {tableSectionExpanded && (
                            <div style={{ marginBottom: "12px" }}>
                              {/* Search and Filter */}
                              <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                                {/* Search Input */}
                                <div style={{ position: "relative", flex: 1 }}>
                                  <Search
                                    size={18}
                                    style={{
                                      position: "absolute",
                                      left: "10px",
                                      top: "50%",
                                      transform: "translateY(-50%)",
                                      opacity: 0.5,
                                    }}
                                  />
                                  <input
                                    type="text"
                                    placeholder="Search tables..."
                                    className={styles.formInput}
                                    value={tableSearchQuery}
                                    onChange={(e) => setTableSearchQuery(e.target.value)}
                                    style={{
                                      paddingLeft: "36px",
                                      fontSize: "0.875rem",
                                      padding: "8px 8px 8px 36px",
                                    }}
                                  />
                                </div>

                                {/* Status Filter */}
                                <select
                                  className={styles.formSelect}
                                  value={tableFilterStatus}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    setTableFilterStatus(e.target.value);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{ width: "120px", fontSize: "0.875rem", padding: "8px" }}
                                >
                                  <option value="all">All</option>
                                  <option value="available">Available</option>
                                  <option value="occupied">Occupied</option>
                                  <option value="reserved">Reserved</option>
                                </select>
                              </div>

                              {/* Status Legend */}
                              <div
                                style={{
                                  display: "flex",
                                  gap: "10px",
                                  fontSize: "0.75rem",
                                  marginBottom: "8px",
                                  flexWrap: "wrap",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                  <div
                                    style={{
                                      width: "10px",
                                      height: "10px",
                                      borderRadius: "50%",
                                      background: "rgb(16, 185, 129)",
                                    }}
                                  />
                                  <span>Available</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                  <div
                                    style={{
                                      width: "10px",
                                      height: "10px",
                                      borderRadius: "50%",
                                      background: "rgb(239, 68, 68)",
                                    }}
                                  />
                                  <span>Occupied</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                  <div
                                    style={{
                                      width: "10px",
                                      height: "10px",
                                      borderRadius: "50%",
                                      background: "rgb(251, 191, 36)",
                                    }}
                                  />
                                  <span>Reserved</span>
                                </div>
                              </div>

                              {/* Loading State */}
                              {loadingTables && (
                                <div style={{ textAlign: "center", padding: "16px", opacity: 0.6 }}>
                                  <p style={{ margin: 0, fontSize: "0.875rem" }}>
                                    Loading tables...
                                  </p>
                                </div>
                              )}

                              {/* Error State */}
                              {tablesError && (
                                <div
                                  style={{
                                    padding: "12px",
                                    background: "rgba(239, 68, 68, 0.1)",
                                    border: "1px solid rgba(239, 68, 68, 0.3)",
                                    borderRadius: "8px",
                                    color: "rgb(239, 68, 68)",
                                    fontSize: "0.875rem",
                                  }}
                                >
                                  {tablesError}
                                </div>
                              )}

                              {/* Empty State */}
                              {!loadingTables &&
                                !tablesError &&
                                getFilteredTables().length === 0 && (
                                  <div
                                    style={{ textAlign: "center", padding: "16px", opacity: 0.6 }}
                                  >
                                    <UtensilsCrossed size={32} style={{ margin: "0 auto 8px" }} />
                                    <p style={{ margin: 0, fontSize: "0.875rem" }}>
                                      No tables found
                                    </p>
                                  </div>
                                )}

                              {/* Table Grid */}
                              {!loadingTables && getFilteredTables().length > 0 && (
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                                    gap: "8px",
                                    maxHeight: "300px",
                                    overflowY: "auto",
                                  }}
                                >
                                  {getFilteredTables().map((tbl: any) => {
                                    const statusColors = getTableStatusColor(tbl.status);
                                    const isAvailable =
                                      tbl.status?.toLowerCase() === "available" || !tbl.status;
                                    const statusText = getTableStatusText(tbl.status);

                                    return (
                                      <div
                                        key={tbl.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSelectTable(tbl);
                                        }}
                                        style={{
                                          padding: "12px",
                                          border: `2px solid ${statusColors.border}`,
                                          borderRadius: "8px",
                                          background: statusColors.background,
                                          cursor: isAvailable ? "pointer" : "not-allowed",
                                          opacity: isAvailable ? 1 : 0.6,
                                          transition: "all 0.2s",
                                          textAlign: "center",
                                        }}
                                        onMouseEnter={(e) => {
                                          if (isAvailable) {
                                            e.currentTarget.style.transform = "translateY(-2px)";
                                            e.currentTarget.style.boxShadow =
                                              "0 4px 8px rgba(0, 0, 0, 0.1)";
                                          }
                                        }}
                                        onMouseLeave={(e) => {
                                          if (isAvailable) {
                                            e.currentTarget.style.transform = "translateY(0)";
                                            e.currentTarget.style.boxShadow = "none";
                                          }
                                        }}
                                      >
                                        {/* Table Icon */}
                                        <div
                                          style={{
                                            width: "40px",
                                            height: "40px",
                                            borderRadius: "50%",
                                            background: statusColors.text,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "white",
                                            fontSize: "1rem",
                                            fontWeight: "700",
                                            margin: "0 auto 8px",
                                          }}
                                        >
                                          {tbl.number || tbl.tableNumber}
                                        </div>

                                        {/* Table Info */}
                                        <p
                                          style={{
                                            margin: "0 0 4px 0",
                                            fontWeight: "600",
                                            fontSize: "0.8125rem",
                                          }}
                                        >
                                          Table {tbl.number || tbl.tableNumber}
                                        </p>
                                        {tbl.name && (
                                          <p
                                            style={{
                                              margin: "0 0 6px 0",
                                              fontSize: "0.75rem",
                                              opacity: 0.7,
                                            }}
                                          >
                                            {tbl.name}
                                          </p>
                                        )}

                                        {/* Zone */}
                                        {tbl.zoneName && (
                                          <p
                                            style={{
                                              margin: "0 0 6px 0",
                                              fontSize: "0.7rem",
                                              opacity: 0.6,
                                            }}
                                          >
                                            {tbl.zoneName}
                                          </p>
                                        )}

                                        {/* Status Badge */}
                                        <div
                                          style={{
                                            display: "inline-block",
                                            padding: "3px 8px",
                                            borderRadius: "10px",
                                            background: statusColors.text,
                                            color: "white",
                                            fontSize: "0.7rem",
                                            fontWeight: "600",
                                            marginBottom: "4px",
                                          }}
                                        >
                                          {statusText}
                                        </div>

                                        {/* Capacity */}
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "3px",
                                            fontSize: "0.7rem",
                                            opacity: 0.7,
                                          }}
                                        >
                                          <Users size={12} />
                                          <span>{tbl.capacity || "N/A"}</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Refresh Button */}
                              <button
                                type="button"
                                className={styles.secondaryBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  loadTables();
                                }}
                                style={{
                                  width: "100%",
                                  marginTop: "8px",
                                  fontSize: "0.875rem",
                                  padding: "8px",
                                }}
                              >
                                Refresh Tables
                              </button>
                            </div>
                          )}

                          <div className={styles.collapsibleDivider} />

                          {/* Manual Input Form */}
                          <div className={styles.formGrid}>
                            <input
                              type="number"
                              placeholder="Table Number *"
                              className={styles.formInput}
                              value={tableDetails.tableNumber || ""}
                              onChange={(e) =>
                                setTableDetails({ ...tableDetails, tableNumber: e.target.value ? parseInt(e.target.value) : undefined })
                              }
                            />
                            <input
                              type="number"
                              placeholder="Guest Count *"
                              className={styles.formInput}
                              value={tableDetails.guestCount || ""}
                              onChange={(e) =>
                                setTableDetails({
                                  ...tableDetails,
                                  guestCount: parseInt(e.target.value) || 1,
                                })
                              }
                              min="1"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Customer Section for Delivery */}
                    {/* Customer Section - Always visible, required for delivery, optional for others */}
                    <div className={styles.collapsibleSection}>
                      {/* Accordion Header */}
                      <div
                        className={`${styles.collapsibleHeader} ${
                          customerSectionExpanded ? styles.active : ""
                        }`}
                        onClick={() => setCustomerSectionExpanded(!customerSectionExpanded)}
                      >
                        <div className={styles.collapsibleTitle}>
                          <Users size={18} />
                          <span>
                            Customer Details
                            {orderType === "delivery" ? (
                              <span
                                style={{
                                  color: "rgb(239, 68, 68)",
                                  marginLeft: "4px",
                                  fontSize: "0.75rem",
                                }}
                              >
                                (Required)
                              </span>
                            ) : (
                              <span
                                style={{
                                  color: "rgb(107, 114, 128)",
                                  marginLeft: "4px",
                                  fontSize: "0.75rem",
                                }}
                              >
                                (Optional)
                              </span>
                            )}
                          </span>
                          {customerDetails.name && (
                            <span className={styles.collapsibleBadge}>{customerDetails.name}</span>
                          )}
                        </div>
                        {customerSectionExpanded ? (
                          <ChevronUp size={20} />
                        ) : (
                          <ChevronDown size={20} />
                        )}
                      </div>

                      {/* Accordion Content */}
                      <div
                        className={`${styles.collapsibleContent} ${
                          customerSectionExpanded ? styles.expanded : ""
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Action Buttons */}
                        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                          <button
                            type="button"
                            className={styles.primaryBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreateNewCustomer();
                            }}
                            style={{ flex: 1 }}
                          >
                            <UserPlus size={16} />
                            <span>New Customer</span>
                          </button>
                          {customerDetails.name && (
                            <button
                              type="button"
                              className={styles.dangerBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClearCustomer();
                              }}
                            >
                              <X size={14} />
                              <span>Clear</span>
                            </button>
                          )}
                        </div>

                        <div className={styles.collapsibleDivider} />

                        {/* Search Section - Only show when NOT in new customer form mode */}
                        {!showNewCustomerForm && customerSectionExpanded && (
                          <div style={{ marginBottom: "12px" }}>
                            {/* Search Input */}
                            <div style={{ position: "relative", marginBottom: "12px" }}>
                              <Search
                                size={20}
                                style={{
                                  position: "absolute",
                                  left: "12px",
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  opacity: 0.5,
                                }}
                              />
                              <input
                                type="text"
                                placeholder="Search by name, phone, or email..."
                                className={styles.formInput}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ paddingLeft: "40px" }}
                              />
                            </div>

                            {/* Search Results Header */}
                            <h4
                              style={{
                                fontSize: "0.875rem",
                                fontWeight: "600",
                                marginBottom: "8px",
                                opacity: 0.7,
                              }}
                            >
                              {searchQuery ? "Search Results" : "Recent Customers"}
                            </h4>

                            {/* Loading State */}
                            {searchLoading && (
                              <div style={{ textAlign: "center", padding: "16px", opacity: 0.6 }}>
                                <p style={{ margin: 0, fontSize: "0.875rem" }}>Loading...</p>
                              </div>
                            )}

                            {/* Error State */}
                            {searchError && (
                              <div
                                style={{
                                  padding: "12px",
                                  background: "rgba(239, 68, 68, 0.1)",
                                  border: "1px solid rgba(239, 68, 68, 0.3)",
                                  borderRadius: "8px",
                                  color: "rgb(239, 68, 68)",
                                  fontSize: "0.875rem",
                                }}
                              >
                                {searchError}
                              </div>
                            )}

                            {/* No Results */}
                            {!searchLoading && !searchError && searchResults.length === 0 && (
                              <div style={{ textAlign: "center", padding: "16px", opacity: 0.6 }}>
                                <p style={{ margin: 0, fontSize: "0.875rem" }}>
                                  No customers found
                                </p>
                              </div>
                            )}

                            {/* Customer Results List */}
                            {!searchLoading && searchResults.length > 0 && (
                              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                                {searchResults.map((result: any) => (
                                  <div
                                    key={result.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectCustomer(result);
                                    }}
                                    style={{
                                      padding: "10px",
                                      marginBottom: "6px",
                                      border: "1px solid rgba(0, 0, 0, 0.1)",
                                      borderRadius: "6px",
                                      cursor: "pointer",
                                      transition: "all 0.2s",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = "rgba(59, 130, 246, 0.05)";
                                      e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.3)";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = "transparent";
                                      e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.1)";
                                    }}
                                  >
                                    <div
                                      style={{ display: "flex", alignItems: "start", gap: "10px" }}
                                    >
                                      <div
                                        style={{
                                          width: "36px",
                                          height: "36px",
                                          borderRadius: "50%",
                                          background: "rgb(59, 130, 246)",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          color: "white",
                                          fontWeight: "600",
                                          fontSize: "0.875rem",
                                          flexShrink: 0,
                                        }}
                                      >
                                        {result.nameEn.charAt(0).toUpperCase()}
                                      </div>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <p
                                          style={{
                                            margin: 0,
                                            fontWeight: "600",
                                            fontSize: "0.875rem",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                          }}
                                        >
                                          {result.nameEn}
                                        </p>
                                        <div
                                          style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "2px",
                                            marginTop: "4px",
                                          }}
                                        >
                                          {result.phone && (
                                            <div
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "4px",
                                                fontSize: "0.75rem",
                                                opacity: 0.7,
                                              }}
                                            >
                                              <Phone size={12} />
                                              <span>{result.phone}</span>
                                            </div>
                                          )}
                                          {result.email && (
                                            <div
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "4px",
                                                fontSize: "0.75rem",
                                                opacity: 0.7,
                                              }}
                                            >
                                              <Mail size={12} />
                                              <span
                                                style={{
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                  whiteSpace: "nowrap",
                                                }}
                                              >
                                                {result.email}
                                              </span>
                                            </div>
                                          )}
                                          {result.addressEn && (
                                            <div
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "4px",
                                                fontSize: "0.75rem",
                                                opacity: 0.7,
                                              }}
                                            >
                                              <MapPin size={12} />
                                              <span
                                                style={{
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                  whiteSpace: "nowrap",
                                                }}
                                              >
                                                {result.addressEn}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Customer Form - Only show when in new customer form mode */}
                        {showNewCustomerForm && (
                          <div>
                            <div className={styles.collapsibleDivider} />

                            <div className={styles.formGrid}>
                              <input
                                type="text"
                                placeholder="Customer Name *"
                                className={styles.formInput}
                                value={newCustomerForm.name}
                                onChange={(e) =>
                                  setNewCustomerForm({ ...newCustomerForm, name: e.target.value })
                                }
                                autoFocus
                              />
                              <input
                                type="tel"
                                placeholder="Phone Number *"
                                className={styles.formInput}
                                value={newCustomerForm.phone}
                                onChange={(e) =>
                                  setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })
                                }
                              />
                              <input
                                type="email"
                                placeholder="Email (optional)"
                                className={styles.formInput}
                                value={newCustomerForm.email}
                                onChange={(e) =>
                                  setNewCustomerForm({ ...newCustomerForm, email: e.target.value })
                                }
                              />
                              <textarea
                                placeholder="Delivery Address *"
                                className={`${styles.formInput} ${styles.formTextarea}`}
                                value={newCustomerForm.address}
                                onChange={(e) =>
                                  setNewCustomerForm({
                                    ...newCustomerForm,
                                    address: e.target.value,
                                  })
                                }
                                rows={2}
                              />
                            </div>

                            {/* Save/Cancel Buttons */}
                            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                              <button
                                type="button"
                                className={styles.successBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveNewCustomer();
                                }}
                                style={{ flex: 1 }}
                              >
                                <span>Save Customer</span>
                              </button>
                              <button
                                type="button"
                                className={styles.secondaryBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelNewCustomer();
                                }}
                                style={{ flex: 1 }}
                              >
                                <span>Cancel</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Action Buttons Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0">
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm sm:text-base"
                >
                  <X size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSaveOrder}
                  disabled={saving || cart.length === 0}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                >
                  <Save size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span>{saving ? "Saving..." : "Save Order"}</span>
                </button>
                <button
                  onClick={handleCompleteWithoutPayment}
                  disabled={processing || cart.length === 0}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                >
                  <FileText size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span>{processing ? "Processing..." : "Complete (No Payment)"}</span>
                </button>
                <button
                  onClick={handleProcessTransaction}
                  disabled={
                    processing ||
                    cart.length === 0 ||
                    (paymentMethod === "cash" && amountPaid < total)
                  }
                  className="flex items-center gap-2 flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                >
                  <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span>{processing ? "Processing..." : `Pay $${total.toFixed(2)}`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
