/**
 * TransactionDialog V2
 * Enhanced payment dialog with customer search, table management, and improved UX
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import styles from "./Pos2.module.css";
import { ProductDto, SaleDto } from "@/types/api.types";
import salesService from "@/services/sales.service";
import invoiceTemplateService from "@/services/invoice-template.service";
import branchInfoService from "@/services/branch-info.service";
import deliveryService from "@/services/delivery.service";
import { InvoiceSchema } from "@/types/invoice-template.types";
import { useToast } from "@/hooks/useToast";
import { transformSaleToInvoiceData } from "@/lib/invoice-data-transformer";
import InvoicePreview from "@/components/invoice/InvoicePreview";
import { useReactToPrint } from "react-to-print";
import CustomerSearchDialog from "./CustomerSearchDialog";
import TableSelectorDialog from "./TableSelectorDialog";
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
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [tableSelectorOpen, setTableSelectorOpen] = useState(false);
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);

  // Invoice printing state
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [invoiceSchema, setInvoiceSchema] = useState<InvoiceSchema | null>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);

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
    tableName: "",
    guestCount: 1,
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
      setOrderType(initialOrderType);
      setPaymentMethod("cash");
      setDiscountValue(0);
      setAmountPaid(0);
      setError(null);
      setIsExistingCustomer(false);

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
          tableName: "",
          guestCount: 1,
        });
      }
    }
  }, [isOpen, initialOrderType, initialCustomerDetails, initialTableNumber]);

  // Customer Selection Handler
  const handleSelectCustomer = (selectedCustomer: any) => {
    setCustomer({
      id: selectedCustomer.id,
      name: selectedCustomer.name || "",
      phone: selectedCustomer.phone || "",
      email: selectedCustomer.email || "",
      address: selectedCustomer.address || "",
    });
    setIsExistingCustomer(true);
    setCustomerSearchOpen(false);
    toast.success("Customer selected", `${selectedCustomer.name} selected`);
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
    setCustomerSearchOpen(false);
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
  };

  // Table Selection Handler
  const handleSelectTable = (selectedTable: any) => {
    setTable({
      tableId: selectedTable.id,
      tableNumber: selectedTable.number || selectedTable.tableNumber || "",
      tableName: selectedTable.name || "",
      guestCount: table.guestCount || 1,
    });
    setTableSelectorOpen(false);
    toast.success("Table selected", `Table ${selectedTable.number} selected`);
  };

  // Cash Amount Handler
  const handleCashAmount = (amount: number) => {
    setAmountPaid(amount);
  };

  // Validation
  const validateTransaction = (): string | null => {
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

    if (paymentMethod === "cash" && amountPaid < total) {
      return `Insufficient payment. Amount paid ($${amountPaid.toFixed(
        2
      )}) is less than total ($${total.toFixed(2)})`;
    }

    return null;
  };

  // Process Transaction
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
        amountPaid: paymentMethod === "cash" ? amountPaid : total,
        changeReturned: paymentMethod === "cash" ? Math.max(0, change) : 0,
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
      const successDetails =
        paymentMethod === "cash"
          ? `Invoice #${sale.invoiceNumber} | Total: $${total.toFixed(
              2
            )} | Paid: $${amountPaid.toFixed(2)} | Change: $${change.toFixed(2)}`
          : `Invoice #${sale.invoiceNumber} | Total: $${total.toFixed(2)} | Payment: ${paymentMethod
              .replace("-", " ")
              .toUpperCase()}`;

      toast.success("Transaction completed successfully!", successDetails, 7000);

      // Prepare and print invoice
      await prepareAndPrintInvoice(sale);

      // Close dialog and clear cart
      setTimeout(() => {
        onSuccess(sale);
        onClose();
        resetForm();
      }, 1000);
    } catch (err: any) {
      console.error("Error processing transaction:", err);
      const errorMessage = err.message || "Failed to process transaction";
      toast.error("Transaction failed", errorMessage, 8000);
      setError(errorMessage);
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
      console.log("Active template loaded:", template?.name);

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
      const branchInfo = await branchInfoService.getBranchInfo();
      const transformedData = transformSaleToInvoiceData(sale, branchInfo);

      setInvoiceSchema(parsedSchema);
      setInvoiceData(transformedData);

      // Trigger print
      setTimeout(() => {
        if (invoiceRef.current && handlePrint) {
          console.log("Triggering print...");
          handlePrint();
        }
      }, 500);
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
  };

  // Set up print handler
  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice-${invoiceData?.invoiceNumber || "POS"}`,
  });

  if (!isOpen) return null;

  return (
    <>
      {/* Hidden invoice for printing */}
      {invoiceSchema && invoiceData && (
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
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

            {/* Customer Details for Delivery */}
            {orderType === "delivery" && (
              <div className={styles.formSection}>
                <label className={styles.formLabel}>
                  <Users size={18} />
                  Customer Details
                </label>

                {/* Customer Search Buttons */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => setCustomerSearchOpen(true)}
                    style={{ flex: 1 }}
                  >
                    <Search size={16} />
                    <span>Search Customer</span>
                  </button>
                  {isExistingCustomer && (
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={handleCreateNewCustomer}
                      style={{ flex: 1 }}
                    >
                      <UserPlus size={16} />
                      <span>New Customer</span>
                    </button>
                  )}
                </div>

                {/* Customer Badge */}
                {isExistingCustomer && customer.name && (
                  <div
                    style={{
                      padding: "12px",
                      background: "rgba(59, 130, 246, 0.1)",
                      border: "1px solid rgba(59, 130, 246, 0.3)",
                      borderRadius: "8px",
                      marginBottom: "12px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          background: "rgb(59, 130, 246)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: "600",
                        }}
                      >
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: "600", margin: 0 }}>{customer.name}</p>
                        <p style={{ fontSize: "0.875rem", opacity: 0.7, margin: 0 }}>
                          Existing customer • Click fields to update
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearCustomer}
                        style={{
                          padding: "4px 8px",
                          fontSize: "0.75rem",
                          background: "transparent",
                          border: "1px solid rgba(59, 130, 246, 0.5)",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}

                {/* Customer Form */}
                <div className={styles.formGrid}>
                  <input
                    type="text"
                    placeholder="Customer Name *"
                    className={styles.formInput}
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
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
              </div>
            )}

            {/* Table Selection for Dine-in */}
            {orderType === "dine-in" && (
              <div className={styles.formSection}>
                <label className={styles.formLabel}>
                  <UtensilsCrossed size={18} />
                  Table Selection
                </label>

                {/* Table Selector Button */}
                <div style={{ marginBottom: "12px" }}>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => setTableSelectorOpen(true)}
                    style={{ width: "100%" }}
                  >
                    <Search size={16} />
                    <span>Select Table</span>
                  </button>
                </div>

                {/* Table Info Display */}
                {table.tableNumber && (
                  <div
                    style={{
                      padding: "12px",
                      background: "rgba(16, 185, 129, 0.1)",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                      borderRadius: "8px",
                      marginBottom: "12px",
                    }}
                  >
                    <p style={{ margin: 0, fontWeight: "600" }}>
                      Table {table.tableNumber}
                      {table.tableName && ` - ${table.tableName}`}
                    </p>
                    <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem", opacity: 0.7 }}>
                      Guests: {table.guestCount}
                    </p>
                  </div>
                )}

                {/* Manual Input */}
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
            )}

            {/* Optional Customer Details for Takeaway/Dine-in */}
            {orderType !== "delivery" && (
              <div className={styles.formSection}>
                <label className={styles.formLabel}>
                  <Users size={18} />
                  Customer Details (Optional)
                </label>

                {/* Customer Search Button */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => setCustomerSearchOpen(true)}
                    style={{ flex: 1 }}
                  >
                    <Search size={16} />
                    <span>Search Customer</span>
                  </button>
                  {isExistingCustomer && (
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={handleClearCustomer}
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className={styles.formGrid}>
                  <input
                    type="text"
                    placeholder="Customer Name"
                    className={styles.formInput}
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    className={styles.formInput}
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  />
                </div>
              </div>
            )}

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

            {/* Error Message */}
            {error && <div className={styles.errorMessage}>{error}</div>}
          </div>

          {/* Footer */}
          <div className={styles.dialogFooter}>
            <button className={styles.cancelBtn} onClick={onClose} disabled={processing}>
              Cancel
            </button>
            <button
              className={styles.confirmBtn}
              onClick={handleProcessTransaction}
              disabled={processing || cart.length === 0}
            >
              {processing ? "Processing..." : `Confirm Payment - $${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>

      {/* Customer Search Dialog */}
      <CustomerSearchDialog
        isOpen={customerSearchOpen}
        onClose={() => setCustomerSearchOpen(false)}
        onSelectCustomer={handleSelectCustomer}
        onCreateNew={handleCreateNewCustomer}
      />

      {/* Table Selector Dialog */}
      <TableSelectorDialog
        isOpen={tableSelectorOpen}
        onClose={() => setTableSelectorOpen(false)}
        onSelectTable={handleSelectTable}
      />
    </>
  );
};
