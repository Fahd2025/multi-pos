/**
 * TransactionDialog V2
 * Enhanced payment dialog with customer search, table management, and improved UX
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
} from "lucide-react";
import styles from "../pos/Pos2.module.css";
import { ProductDto, SaleDto } from "@/types/api.types";
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

interface TransactionDialogV2Props {
  isOpen: boolean;
  onClose: () => void;
  cart: OrderItem[];
  subtotal: number;
  onSuccess: (sale: SaleDto) => void;
  initialOrderType?: OrderType;
  initialCustomerDetails?: Partial<CustomerDetails>;
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
  tableNumber: string;
  tableName: string;
  guestCount: number;
}

type OrderType = "delivery" | "dine-in" | "takeaway";
type PaymentMethod = "cash" | "credit-card" | "debit-card" | "mobile-payment";
type DiscountType = "percentage" | "amount";

export const TransactionDialogV2: React.FC<TransactionDialogV2Props> = ({
  isOpen,
  onClose,
  cart,
  subtotal,
  onSuccess,
  initialOrderType = "takeaway",
  initialCustomerDetails,
  initialTableNumber,
  initialGuestCount,
}) => {
  const toast = useToast();

  // State Management
  const [orderType, setOrderType] = useState<OrderType>(initialOrderType);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [discountType, setDiscountType] = useState<DiscountType>("percentage");
  const [discountValue, setDiscountValue] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog States
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);

  // Customer Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [customerSectionExpanded, setCustomerSectionExpanded] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);

  // Table Search State
  const [tables, setTables] = useState<any[]>([]);
  const [tableSearchQuery, setTableSearchQuery] = useState("");
  const [tableFilterStatus, setTableFilterStatus] = useState<string>("all");
  const [tablesLoading, setTablesLoading] = useState(false);
  const [tablesError, setTablesError] = useState<string | null>(null);
  const [tableSectionExpanded, setTableSectionExpanded] = useState(false);

  // Invoice printing state
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [invoiceSchema, setInvoiceSchema] = useState<InvoiceSchema | null>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [shouldPrint, setShouldPrint] = useState(false);

  // Customer Details
  const [customer, setCustomer] = useState<CustomerDetails>({
    id: undefined,
    name: initialCustomerDetails?.name || "",
    phone: initialCustomerDetails?.phone || "",
    email: initialCustomerDetails?.email || "",
    address: initialCustomerDetails?.address || "",
  });

  // Table Details
  const [table, setTable] = useState<TableDetails>({
    tableId: undefined,
    tableNumber: initialTableNumber || "",
    tableName: initialTableNumber ? `Table ${initialTableNumber}` : "",
    guestCount: initialGuestCount || 1,
  });

  // Calculate totals - Tax is applied AFTER discount
  const taxRate = 0.15; // 15% tax
  const discountAmount =
    discountType === "percentage" ? (subtotal * discountValue) / 100 : discountValue;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const tax = taxableAmount * taxRate;
  const total = taxableAmount + tax;
  const change = amountPaid - total;

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      // Auto-set order type to dine-in if table is provided
      setOrderType(initialTableNumber ? "dine-in" : initialOrderType);
      setPaymentMethod("cash");
      setDiscountValue(0);
      setAmountPaid(0);
      setError(null);
      setIsExistingCustomer(false);
      setCustomerSectionExpanded(false);
      setSearchQuery("");
      setSearchResults([]);
      setTableSectionExpanded(false);
      setTableSearchQuery("");
      setTableFilterStatus("all");
      setTables([]);
      setInvoiceSchema(null);
      setInvoiceData(null);
      setShouldPrint(false);

      if (initialCustomerDetails) {
        setCustomer({
          id: undefined,
          name: initialCustomerDetails.name || "",
          phone: initialCustomerDetails.phone || "",
          email: initialCustomerDetails.email || "",
          address: initialCustomerDetails.address || "",
        });
      }

      if (initialTableNumber) {
        setTable({
          tableId: undefined,
          tableNumber: initialTableNumber,
          tableName: `Table ${initialTableNumber}`,
          guestCount: initialGuestCount || 1,
        });
      }
    }
  }, [isOpen, initialOrderType, initialCustomerDetails, initialTableNumber, initialGuestCount]);

  // Debounced customer search
  useEffect(() => {
    if (!customerSectionExpanded) return;

    const delayTimer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchCustomers(searchQuery);
      } else if (searchQuery.length === 0) {
        loadRecentCustomers();
      }
    }, 300);

    return () => clearTimeout(delayTimer);
  }, [searchQuery, customerSectionExpanded]);

  // Load recent customers when section is expanded
  useEffect(() => {
    if (customerSectionExpanded && searchQuery === "") {
      loadRecentCustomers();
    }
  }, [customerSectionExpanded]);

  // Load tables when section is expanded
  useEffect(() => {
    if (tableSectionExpanded) {
      loadTables();
    }
  }, [tableSectionExpanded]);

  // Load recent customers
  const loadRecentCustomers = async () => {
    setSearchLoading(true);
    setSearchError(null);

    try {
      const result = await customerService.getCustomers({ page: 1, pageSize: 10 });
      setSearchResults(result.data || []);
    } catch (err) {
      console.error("Error loading customers:", err);
      setSearchError("Failed to load customers");
    } finally {
      setSearchLoading(false);
    }
  };

  // Search customers
  const searchCustomers = async (query: string) => {
    setSearchLoading(true);
    setSearchError(null);

    try {
      const result = await customerService.getCustomers({ search: query, page: 1, pageSize: 20 });
      setSearchResults(result.data || []);
    } catch (err) {
      console.error("Error searching customers:", err);
      setSearchError("Search failed");
    } finally {
      setSearchLoading(false);
    }
  };

  // Load tables
  const loadTables = async () => {
    setTablesLoading(true);
    setTablesError(null);

    try {
      const result = await tableService.getTablesWithStatus();
      setTables(result || []);
    } catch (err) {
      console.error("Error loading tables:", err);
      setTablesError("Failed to load tables");
    } finally {
      setTablesLoading(false);
    }
  };

  // Filter tables based on search and status
  const getFilteredTables = () => {
    return tables.filter((table) => {
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
    // Capitalize first letter
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  // Customer Selection Handler
  const handleSelectCustomer = (selectedCustomer: any) => {
    setCustomer({
      id: selectedCustomer.id,
      name: selectedCustomer.nameEn || selectedCustomer.name || "",
      phone: selectedCustomer.phone || "",
      email: selectedCustomer.email || "",
      address: selectedCustomer.addressEn || selectedCustomer.address || "",
    });
    setIsExistingCustomer(true);
    setCustomerSectionExpanded(false);
    setSearchQuery("");
    setShowNewCustomerForm(false);
    toast.success("Customer selected", `${selectedCustomer.nameEn || selectedCustomer.name} selected`);
  };

  // New Customer Handler
  const handleCreateNewCustomer = () => {
    setCustomer({
      id: undefined,
      name: "",
      phone: "",
      email: "",
      address: "",
    });
    setIsExistingCustomer(false);
    setCustomerSectionExpanded(true);
    setSearchQuery("");
    setShowNewCustomerForm(true); // Show the form, hide search
  };

  // Save New Customer Handler
  const handleSaveNewCustomer = async () => {
    // Validate required fields based on order type
    if (orderType === "delivery") {
      if (!customer.name || !customer.phone || !customer.address) {
        toast.error("Validation Error", "Name, phone, and address are required for delivery orders");
        return;
      }
    } else {
      // For takeaway/dine-in, at least name or phone should be provided
      if (!customer.name && !customer.phone) {
        toast.error("Validation Error", "Please provide at least name or phone");
        return;
      }
    }

    try {
      // Create customer in database
      // Generate a simple customer code (timestamp-based)
      const customerCode = `CUST-${Date.now().toString().slice(-8)}`;

      const newCustomer = await customerService.createCustomer({
        code: customerCode,
        nameEn: customer.name,
        nameAr: customer.name, // Use same name for Arabic if not provided
        phone: customer.phone || "",
        email: customer.email || undefined,
        addressEn: customer.address || undefined,
        addressAr: customer.address || undefined,
        isActive: true,
      });

      // Update state with saved customer (including ID from database)
      setCustomer({
        id: newCustomer.id,
        name: newCustomer.nameEn,
        phone: newCustomer.phone || "",
        email: newCustomer.email || "",
        address: newCustomer.addressEn || "",
      });

      setIsExistingCustomer(true); // Now it's an existing customer
      setShowNewCustomerForm(false);
      setCustomerSectionExpanded(false);
      toast.success("Customer Added", `${newCustomer.nameEn} has been saved`);
    } catch (error) {
      console.error("Error creating customer:", error);
      toast.error("Error", "Failed to save customer. Please try again.");
    }
  };

  // Cancel New Customer Handler
  const handleCancelNewCustomer = () => {
    setCustomer({
      id: undefined,
      name: "",
      phone: "",
      email: "",
      address: "",
    });
    setIsExistingCustomer(false);
    setShowNewCustomerForm(false);
    setSearchQuery("");
  };

  // Clear Customer Handler
  const handleClearCustomer = () => {
    setCustomer({
      id: undefined,
      name: "",
      phone: "",
      email: "",
      address: "",
    });
    setIsExistingCustomer(false);
    setShowNewCustomerForm(false);
  };

  // Table Selection Handler
  const handleSelectTable = (selectedTable: any) => {
    // Only allow selection of available tables
    const isAvailable = selectedTable.status?.toLowerCase() === "available" || !selectedTable.status;
    if (!isAvailable) {
      toast.warning("Table not available", "This table is currently occupied or reserved");
      return;
    }

    setTable({
      tableId: selectedTable.id,
      tableNumber: selectedTable.number || selectedTable.tableNumber || "",
      tableName: selectedTable.name || "",
      guestCount: table.guestCount || 1,
    });
    setTableSectionExpanded(false);
    setTableSearchQuery("");
    toast.success("Table selected", `Table ${selectedTable.number || selectedTable.tableNumber} selected`);
  };

  // Cash Amount Handler
  const handleCashAmount = (amount: number) => {
    setAmountPaid(amount);
  };

  // Validation
  const validateTransaction = (skipPaymentCheck = false): string | null => {
    if (cart.length === 0) {
      return "Cart is empty";
    }

    if (orderType === "delivery") {
      if (!customer.name || !customer.phone || !customer.address) {
        return "Customer name, phone, and address are required for delivery orders";
      }
    }

    if (orderType === "dine-in") {
      if (!table.tableNumber) {
        return "Table number is required for dine-in orders";
      }
      if (table.guestCount < 1) {
        return "Guest count must be at least 1";
      }
    }

    // Only validate payment if not skipping payment check
    if (!skipPaymentCheck) {
      if (paymentMethod === "cash" && amountPaid < total) {
        return `Insufficient payment. Amount paid ($${amountPaid.toFixed(
          2
        )}) is less than total ($${total.toFixed(2)})`;
      }
    }

    // Check for negative amounts
    if (amountPaid < 0) {
      return "Amount paid cannot be negative";
    }

    return null;
  };

  // Core transaction processing (extracted for reuse)
  const processTransactionCore = async (paidAmount: number, skipInvoicePrint = false) => {
    try {
      // Determine invoice type
      let invoiceType = 0; // Touch/Simplified
      if (orderType === "delivery" && customer.name) {
        invoiceType = 1; // Standard
      } else if (customer.name && customer.phone) {
        invoiceType = 1; // Standard
      }

      // Map payment method
      const paymentMethodMap: Record<PaymentMethod, number> = {
        cash: 0,
        "credit-card": 1,
        "debit-card": 2,
        "mobile-payment": 3,
      };

      // Map order type
      const orderTypeMap: Record<OrderType, number> = {
        takeaway: 0, // TakeOut
        "dine-in": 1, // DineIn
        delivery: 2, // Delivery
      };

      // Create sale DTO matching backend CreateSaleDto structure
      const saleData = {
        customerId: customer.id || undefined,
        invoiceType: invoiceType,
        orderType: orderTypeMap[orderType],
        paymentMethod: paymentMethodMap[paymentMethod],
        amountPaid: paidAmount,
        changeReturned: paidAmount > 0 && paymentMethod === "cash" ? Math.max(0, paidAmount - total) : 0,
        lineItems: cart.map((item) => ({
          productId: item.id,
          barcode: item.barcode,
          quantity: item.quantity,
          unitPrice: item.sellingPrice,
          discountType: discountValue > 0 ? (discountType === "percentage" ? 1 : 2) : 0,
          discountValue: discountValue,
        })),
        invoiceDiscountType: 0, // None (invoice-level discount)
        invoiceDiscountValue: 0,
        notes: buildNotes(),
        // Table fields (for dine-in)
        ...(orderType === "dine-in" && {
          tableId: table.tableId,
          tableNumber: parseInt(table.tableNumber) || undefined,
          guestCount: table.guestCount,
        }),
        // Delivery info
        ...(orderType === "delivery" && {
          deliveryInfo: {
            customerId: customer.id,
            deliveryAddress: customer.address,
            pickupAddress: "", // Branch address if needed
            specialInstructions: `Customer: ${customer.name} | Phone: ${customer.phone}`,
            estimatedDeliveryMinutes: 45,
            priority: 1, // Normal
          },
        }),
      };

      // Create the sale
      const sale = await salesService.createSale(saleData);

      // Success notification
      let successTitle = "Transaction completed successfully!";
      let successDetails = "";

      if (paidAmount === 0) {
        successTitle = "Order saved without payment";
        successDetails = `Invoice #${sale.invoiceNumber} | Total: $${total.toFixed(2)} | Status: Unpaid`;
      } else if (paidAmount < total) {
        successTitle = "Partial payment received";
        successDetails = `Invoice #${sale.invoiceNumber} | Total: $${total.toFixed(2)} | Paid: $${paidAmount.toFixed(2)} | Balance: $${(total - paidAmount).toFixed(2)}`;
      } else if (paymentMethod === "cash") {
        successDetails = `Invoice #${sale.invoiceNumber} | Total: $${total.toFixed(2)} | Paid: $${paidAmount.toFixed(2)} | Change: $${(paidAmount - total).toFixed(2)}`;
      } else {
        successDetails = `Invoice #${sale.invoiceNumber} | Total: $${total.toFixed(2)} | Payment: ${paymentMethod.replace("-", " ").toUpperCase()}`;
      }

      toast.success(successTitle, successDetails, 7000);

      // Prepare and print invoice (skip if saving without payment)
      if (!skipInvoicePrint) {
        await prepareAndPrintInvoice(sale);
      }

      // Close dialog and clear cart
      setTimeout(() => {
        onSuccess(sale);
        onClose();
        resetForm();
      }, 1000);

      return sale;
    } catch (err: any) {
      console.error("Error processing transaction:", err);
      const errorMessage = err.message || "Failed to process transaction";
      toast.error("Transaction failed", errorMessage, 8000);
      setError(errorMessage);
      throw err;
    }
  };

  // Save Without Payment (for dine-in orders)
  const handleSaveWithoutPayment = async () => {
    // Validation (skip payment check)
    const validationError = validateTransaction(true);
    if (validationError) {
      setError(validationError);
      toast.warning("Validation Error", validationError);
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      await processTransactionCore(0, false); // Amount paid = 0, but still print invoice/order ticket
    } catch (error) {
      // Error already handled in processTransactionCore
    } finally {
      setProcessing(false);
    }
  };

  // Process Transaction with Payment
  const handleProcessTransaction = async () => {
    // Validation
    const validationError = validateTransaction();
    if (validationError) {
      setError(validationError);
      toast.warning("Validation Error", validationError);
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      await processTransactionCore(paymentMethod === "cash" ? amountPaid : total, false);
    } catch (error) {
      // Error already handled in processTransactionCore
    } finally {
      setProcessing(false);
    }
  };

  // Build notes string
  const buildNotes = (): string => {
    let notes = `POS Transaction - ${orderType}`;

    if (orderType === "delivery") {
      notes += ` | Customer: ${customer.name} (${customer.phone}) | Address: ${customer.address}`;
    } else if (orderType === "dine-in") {
      notes += ` | Table: ${table.tableName || table.tableNumber}`;
      if (table.guestCount > 1) {
        notes += ` | Guests: ${table.guestCount}`;
      }
    }

    if (customer.name && orderType !== "delivery") {
      notes += ` | Customer: ${customer.name}`;
    }

    return notes;
  };

  // Prepare and print invoice
  const prepareAndPrintInvoice = async (sale: SaleDto) => {
    try {
      console.log("Starting invoice preparation...");
      const template = await invoiceTemplateService.getActiveTemplate();
      console.log("Active template loaded:", template?.name, "Paper size:", template?.schema ? JSON.parse(template.schema).paperSize : "unknown");

      if (!template) {
        console.warn("No active template found");
        toast.warning(
          "No invoice template",
          "Transaction completed but no active invoice template found.",
          6000
        );
        return;
      }

      const parsedSchema = JSON.parse(template.schema) as InvoiceSchema;
      console.log("Parsed schema paper size:", parsedSchema.paperSize);

      const branchInfo = await branchInfoService.getBranchInfo();
      const transformedData = transformSaleToInvoiceData(sale, branchInfo);

      // Set schema and data, then trigger print via useEffect
      setInvoiceSchema(parsedSchema);
      setInvoiceData(transformedData);
      setShouldPrint(true); // This will trigger the print in the useEffect
    } catch (printError: any) {
      console.error("Failed to prepare invoice:", printError);
      toast.warning(
        "Print preparation failed",
        "Transaction completed but failed to prepare invoice.",
        5000
      );
    }
  };

  // Reset form
  const resetForm = () => {
    setOrderType("takeaway");
    setPaymentMethod("cash");
    setDiscountValue(0);
    setAmountPaid(0);
    setCustomer({ id: undefined, name: "", phone: "", email: "", address: "" });
    setTable({ tableId: undefined, tableNumber: "", tableName: "", guestCount: 1 });
    setIsExistingCustomer(false);
    setError(null);
    setInvoiceSchema(null);
    setInvoiceData(null);
    setShouldPrint(false);
  };

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

  // Memoize page style to update when paper width changes
  const pageStyle = useMemo(() => `
    @page {
      size: ${paperWidth} auto;
      margin: 0 !important;
    }

    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }

      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: ${paperWidth} !important;
        max-width: ${paperWidth} !important;
      }
    }
  `, [paperWidth]);

  // Set up print handler - recreate when pageStyle changes
  const printConfig = useMemo(() => ({
    contentRef: invoiceRef,
    documentTitle: `Invoice-${invoiceData?.invoiceNumber || "POS"}`,
    pageStyle: pageStyle,
  }), [pageStyle, invoiceData?.invoiceNumber]);

  const handlePrint = useReactToPrint(printConfig);

  // Auto-trigger print when invoice is ready and shouldPrint is true
  useEffect(() => {
    if (shouldPrint && invoiceSchema && invoiceData && invoiceRef.current && handlePrint) {
      console.log("Auto-printing with paper size:", invoiceSchema.paperSize, "paperWidth:", paperWidth);
      // Small delay to ensure DOM is updated
      const timer = setTimeout(() => {
        handlePrint();
        setShouldPrint(false); // Reset flag
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [shouldPrint, invoiceSchema, invoiceData, handlePrint, paperWidth]);

  if (!isOpen) return null;

  return (
    <>
      {/* Global print stylesheet for invoice */}
      {invoiceSchema && invoiceData && (
        <style key={`global-print-${paperWidth}`} dangerouslySetInnerHTML={{__html: `
          @media print {
            @page {
              size: ${paperWidth} auto;
              margin: 0;
            }
          }
        `}} />
      )}

      {/* Hidden invoice for printing */}
      {invoiceSchema && invoiceData && (
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
          <style key={`wrapper-print-${paperWidth}`}>{`
            @media print {
              .invoice-print-wrapper {
                position: static !important;
                left: 0 !important;
                width: ${paperWidth} !important;
                max-width: ${paperWidth} !important;
              }
            }
          `}</style>
          <InvoicePreview ref={invoiceRef} schema={invoiceSchema} data={invoiceData} />
        </div>
      )}

      <div className={styles.dialogBackdrop} onClick={onClose}>
        <div className={styles.dialogContainer} onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className={styles.dialogHeader}>
            <h2 className={styles.dialogTitle}>Process Transaction</h2>
            <button className={styles.dialogCloseBtn} onClick={onClose} aria-label="Close">
              <X size={24} />
            </button>
          </div>

          {/* Content */}
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
                          <span className={styles.discountText}>-${discountAmount.toFixed(2)}</span>
                        </div>
                        <div className={styles.summaryRow}>
                          <span>Amount After Discount:</span>
                          <span>${taxableAmount.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    <div className={styles.summaryRow}>
                      <span>Tax (15%):</span>
                      <span>${tax.toFixed(2)}</span>
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
                    onAmountChange={handleCashAmount}
                  />
                )}
              </div>

              {/* RIGHT COLUMN - Shows second on mobile (after order type) */}
              <div className={styles.dialogRightColumn}>
                {/* Customer Section for Delivery - Accordion */}
                {orderType === "delivery" && (
                  <div className={styles.collapsibleSection}>
                    {/* Accordion Header */}
                    <div
                      className={`${styles.collapsibleHeader} ${customerSectionExpanded ? styles.active : ''}`}
                      onClick={() => setCustomerSectionExpanded(!customerSectionExpanded)}
                    >
                      <div className={styles.collapsibleTitle}>
                        <Users size={18} />
                        <span>Customer Details</span>
                        {customer.name && (
                          <span className={styles.collapsibleBadge}>
                            {customer.name}
                          </span>
                        )}
                      </div>
                      {customerSectionExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>

                    {/* Accordion Content */}
                    <div
                      className={`${styles.collapsibleContent} ${customerSectionExpanded ? styles.expanded : ''}`}
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
                        {customer.name && (
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
                            <p style={{ margin: 0, fontSize: "0.875rem" }}>No customers found</p>
                          </div>
                        )}

                        {/* Customer Results List */}
                        {!searchLoading && searchResults.length > 0 && (
                          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                            {searchResults.map((result: any) => (
                              <div
                                key={result.id}
                                onClick={(e) => { e.stopPropagation(); handleSelectCustomer(result); }}
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
                                <div style={{ display: "flex", alignItems: "start", gap: "10px" }}>
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
                            value={customer.name}
                            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                            autoFocus
                          />
                          <input
                            type="tel"
                            placeholder="Phone Number *"
                            className={styles.formInput}
                            value={customer.phone}
                            onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                          />
                          <input
                            type="email"
                            placeholder="Email (optional)"
                            className={styles.formInput}
                            value={customer.email}
                            onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                          />
                          <textarea
                            placeholder="Delivery Address *"
                            className={`${styles.formInput} ${styles.formTextarea}`}
                            value={customer.address}
                            onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
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
                )}

                {/* Table Selection for Dine-in */}
                {orderType === "dine-in" && (
                  <div className={styles.collapsibleSection}>
                    {/* Accordion Header */}
                    <div
                      className={`${styles.collapsibleHeader} ${tableSectionExpanded ? styles.active : ''}`}
                      onClick={() => setTableSectionExpanded(!tableSectionExpanded)}
                    >
                      <div className={styles.collapsibleTitle}>
                        <UtensilsCrossed size={18} />
                        <span>Table Selection</span>
                        {table.tableNumber && (
                          <span className={styles.collapsibleBadge}>
                            Table {table.tableNumber}
                          </span>
                        )}
                      </div>
                      {tableSectionExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>

                    {/* Accordion Content */}
                    <div
                      className={`${styles.collapsibleContent} ${tableSectionExpanded ? styles.expanded : ''}`}
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
                              style={{ paddingLeft: "36px", fontSize: "0.875rem", padding: "8px 8px 8px 36px" }}
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
                        <div style={{ display: "flex", gap: "10px", fontSize: "0.75rem", marginBottom: "8px", flexWrap: "wrap" }}>
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
                        {tablesLoading && (
                          <div style={{ textAlign: "center", padding: "16px", opacity: 0.6 }}>
                            <p style={{ margin: 0, fontSize: "0.875rem" }}>Loading tables...</p>
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
                        {!tablesLoading && !tablesError && getFilteredTables().length === 0 && (
                          <div style={{ textAlign: "center", padding: "16px", opacity: 0.6 }}>
                            <UtensilsCrossed size={32} style={{ margin: "0 auto 8px" }} />
                            <p style={{ margin: 0, fontSize: "0.875rem" }}>No tables found</p>
                          </div>
                        )}

                        {/* Table Grid */}
                        {!tablesLoading && getFilteredTables().length > 0 && (
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
                              const isAvailable = tbl.status?.toLowerCase() === "available" || !tbl.status;
                              const statusText = getTableStatusText(tbl.status);

                              return (
                                <div
                                  key={tbl.id}
                                  onClick={(e) => { e.stopPropagation(); handleSelectTable(tbl); }}
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
                                      e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
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
                          style={{ width: "100%", marginTop: "8px", fontSize: "0.875rem", padding: "8px" }}
                        >
                          Refresh Tables
                        </button>
                      </div>
                    )}

                      <div className={styles.collapsibleDivider} />

                      {/* Manual Input Form */}
                      <div className={styles.formGrid}>
                        <input
                          type="text"
                          placeholder="Table Number *"
                          className={styles.formInput}
                          value={table.tableNumber}
                          onChange={(e) => setTable({ ...table, tableNumber: e.target.value })}
                        />
                        <input
                          type="number"
                          placeholder="Guest Count *"
                          className={styles.formInput}
                          value={table.guestCount || ""}
                          onChange={(e) =>
                            setTable({ ...table, guestCount: parseInt(e.target.value) || 1 })
                          }
                          min="1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Optional Customer Details for Takeaway/Dine-in */}
                {orderType !== "delivery" && (
                  <div className={styles.collapsibleSection}>
                    {/* Accordion Header */}
                    <div
                      className={`${styles.collapsibleHeader} ${customerSectionExpanded ? styles.active : ''}`}
                      onClick={() => setCustomerSectionExpanded(!customerSectionExpanded)}
                    >
                      <div className={styles.collapsibleTitle}>
                        <Users size={18} />
                        <span>Customer Details (Optional)</span>
                        {customer.name && (
                          <span className={styles.collapsibleBadge}>
                            {customer.name}
                          </span>
                        )}
                      </div>
                      {customerSectionExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>

                    {/* Accordion Content */}
                    <div
                      className={`${styles.collapsibleContent} ${customerSectionExpanded ? styles.expanded : ''}`}
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
                        {customer.name && (
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

                      {customer.name && <div className={styles.collapsibleDivider} />}

                      {/* Customer Search Section - Only show when NOT in new customer form mode */}
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
                            <p style={{ margin: 0, fontSize: "0.875rem" }}>No customers found</p>
                          </div>
                        )}

                        {/* Customer Results List */}
                        {!searchLoading && searchResults.length > 0 && (
                          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                            {searchResults.map((result: any) => (
                              <div
                                key={result.id}
                                onClick={(e) => { e.stopPropagation(); handleSelectCustomer(result); }}
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
                                <div style={{ display: "flex", alignItems: "start", gap: "10px" }}>
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
                              placeholder="Customer Name"
                              className={styles.formInput}
                              value={customer.name}
                              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                              autoFocus
                            />
                            <input
                              type="tel"
                              placeholder="Phone Number"
                              className={styles.formInput}
                              value={customer.phone}
                              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
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
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && <div className={styles.errorMessage}>{error}</div>}
          </div>

          {/* Footer */}
          <div className={styles.dialogFooter}>
            <button className={styles.cancelBtn} onClick={onClose} disabled={processing}>
              Cancel
            </button>

            {/* Show "Save Without Payment" option for dine-in orders */}
            {orderType === "dine-in" && (
              <button
                className={styles.saveWithoutPaymentBtn}
                onClick={handleSaveWithoutPayment}
                disabled={processing || cart.length === 0}
                title="Save order without payment - complete payment later from tables page"
              >
                {processing ? "Saving..." : "Save Without Payment"}
              </button>
            )}

            <button
              className={styles.confirmBtn}
              onClick={handleProcessTransaction}
              disabled={processing || cart.length === 0}
            >
              {processing ? "Processing..." : `Complete Payment - $${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
