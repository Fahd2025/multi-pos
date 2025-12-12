"use client";

import React, { useState, useRef } from "react";
import {
  X,
  CreditCard,
  Banknote,
  Percent,
  Users,
  Truck,
  UtensilsCrossed,
  ShoppingBag,
} from "lucide-react";
import styles from "./Pos2.module.css";
import { ProductDto, SaleDto } from "@/types/api.types";
import salesService from "@/services/sales.service";
import invoiceTemplateService from "@/services/invoice-template.service";
import branchInfoService from "@/services/branch-info.service";
import { InvoiceSchema } from "@/types/invoice-template.types";
import { useToast } from "../../../../hooks/useToast";
import { transformSaleToInvoiceData } from "@/lib/invoice-data-transformer";
import InvoicePreview from "@/components/invoice/InvoicePreview";
import { useReactToPrint } from "react-to-print";

interface OrderItem extends ProductDto {
  quantity: number;
}

interface TransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cart: OrderItem[];
  subtotal: number;
  onSuccess: (sale: SaleDto) => void;
}

interface InvoiceData {
  branchName?: string;
  branchNameAr?: string;
  logoUrl?: string;
  vatNumber?: string;
  commercialRegNumber?: string;
  address?: string;
  phone?: string;
  email?: string;
  invoiceNumber: string;
  invoiceDate: string;
  cashierName?: string;
  customerName?: string;
  customerVatNumber?: string;
  customerPhone?: string;
  isSimplified: boolean;
  items: Array<{
    name: string;
    barcode?: string;
    unit?: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    notes?: string;
  }>;
  subtotal: number;
  discount: number;
  vatAmount: number;
  total: number;
  zatcaQrCode?: string;
}

interface CustomerDetails {
  name: string;
  phone: string;
  email: string;
  address: string;
}

interface TableDetails {
  tableNumber: string;
  tableName: string;
}

interface DriverDetails {
  driverId: string;
  driverName: string;
}

type OrderType = "delivery" | "dine-in" | "takeaway";
type PaymentMethod = "cash" | "credit-card" | "debit-card" | "mobile-payment";
type DiscountType = "percentage" | "amount";

export const TransactionDialog: React.FC<TransactionDialogProps> = ({
  isOpen,
  onClose,
  cart,
  subtotal,
  onSuccess,
}) => {
  const toast = useToast();
  const [orderType, setOrderType] = useState<OrderType>("takeaway");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [discountType, setDiscountType] = useState<DiscountType>("percentage");
  const [discountValue, setDiscountValue] = useState(0);
  const [amountPaid, setAmountPaid] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Invoice printing state (hidden, for direct print)
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [invoiceSchema, setInvoiceSchema] = useState<InvoiceSchema | null>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);

  // Customer Details
  const [customer, setCustomer] = useState<CustomerDetails>({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  // Table Details
  const [table, setTable] = useState<TableDetails>({
    tableNumber: "",
    tableName: "",
  });

  // Driver Details
  const [driver, setDriver] = useState<DriverDetails>({
    driverId: "",
    driverName: "",
  });

  // Calculate totals - Tax is applied AFTER discount
  const taxRate = 0.15; // 15% tax
  const discountAmount =
    discountType === "percentage" ? (subtotal * discountValue) / 100 : discountValue;
  const taxableAmount = subtotal - discountAmount; // Amount after discount
  const tax = taxableAmount * taxRate; // Tax calculated on discounted amount
  const total = taxableAmount + tax;
  const paidAmount = parseFloat(amountPaid) || 0;
  const change = paidAmount - total;

  const handleProcessTransaction = async () => {
    // Validation
    if (cart.length === 0) {
      toast.error("Cart is empty", "Please add items to cart before processing transaction");
      setError("Cart is empty");
      return;
    }

    if (orderType === "delivery" && (!customer.name || !customer.phone || !customer.address)) {
      toast.warning(
        "Missing customer details",
        "Please fill in customer name, phone, and address for delivery orders"
      );
      setError("Please fill in customer details for delivery orders");
      return;
    }

    if (orderType === "dine-in" && !table.tableNumber) {
      toast.warning("Missing table selection", "Please select a table for dine-in orders");
      setError("Please select a table for dine-in orders");
      return;
    }

    if (paymentMethod === "cash" && paidAmount < total) {
      toast.error(
        "Insufficient payment",
        `Amount paid ($${paidAmount.toFixed(2)}) is less than total ($${total.toFixed(
          2
        )}). Please collect more cash.`
      );
      setError(
        `Insufficient payment. Amount paid ($${paidAmount.toFixed(
          2
        )}) is less than total ($${total.toFixed(2)})`
      );
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Determine invoice type based on customer details
      // Touch (0) = Simplified invoice (no customer details)
      // Standard (1) = Formal invoice (with customer details)
      let invoiceType = 0; // Default to Touch/Simplified

      if (orderType === "delivery" && customer.name) {
        // Delivery with customer details = Standard invoice
        invoiceType = 1;
      } else if (customer.name && customer.phone) {
        // Any order with customer details = Standard invoice
        invoiceType = 1;
      }
      // Otherwise: Touch/Simplified (0)

      // Map payment method to enum
      const paymentMethodMap: Record<PaymentMethod, number> = {
        cash: 0,
        "credit-card": 1,
        "debit-card": 2,
        "mobile-payment": 3,
      };

      // Create notes with order details
      let notes = `POS Transaction - ${orderType}`;
      if (orderType === "delivery") {
        notes += ` | Customer: ${customer.name} (${customer.phone}) | Address: ${customer.address}`;
        if (driver.driverName) {
          notes += ` | Driver: ${driver.driverName}`;
        }
      } else if (orderType === "dine-in") {
        notes += ` | Table: ${table.tableName || table.tableNumber}`;
      }
      if (customer.name) {
        notes += ` | Customer: ${customer.name}`;
      }

      // Create sale DTO
      const saleData = {
        invoiceType: invoiceType,
        paymentMethod: paymentMethodMap[paymentMethod],
        lineItems: cart.map((item) => ({
          productId: item.id,
          barcode: item.barcode,
          quantity: item.quantity,
          unitPrice: item.sellingPrice,
          discountType: discountValue > 0 ? (discountType === "percentage" ? 1 : 2) : 0,
          discountValue: discountValue,
        })),
        notes: notes,
      };

      // Create the sale
      const sale = await salesService.createSale(saleData);

      // Success - show success notification
      const successDetails =
        paymentMethod === "cash"
          ? `Invoice #${sale.invoiceNumber} | Total: $${total.toFixed(
              2
            )} | Paid: $${paidAmount.toFixed(2)} | Change: $${change.toFixed(2)}`
          : `Invoice #${sale.invoiceNumber} | Total: $${total.toFixed(2)} | Payment: ${paymentMethod
              .replace("-", " ")
              .toUpperCase()}`;

      toast.success(
        "Transaction completed successfully!",
        successDetails,
        7000 // Show for 7 seconds
      );

      // Automatically prepare and print invoice using InvoicePreview (same as sales page)
      try {
        console.log("Starting invoice preparation...");
        // Load active template
        const template = await invoiceTemplateService.getActiveTemplate();
        console.log("Active template loaded:", template?.name);

        if (!template) {
          console.warn("No active template found");
          toast.warning(
            "No invoice template",
            "Transaction completed but no active invoice template found. Please activate a template in Settings.",
            6000
          );
        } else {
          // Parse schema
          const parsedSchema = JSON.parse(template.schema) as InvoiceSchema;
          console.log("Schema parsed successfully");

          // Load branch info
          const branchInfo = await branchInfoService.getBranchInfo();
          console.log("Branch info loaded:", branchInfo?.nameEn);

          // Transform sale data to invoice data format using shared utility
          const transformedData = transformSaleToInvoiceData(sale, branchInfo);

          // Set invoice data and trigger print automatically
          setInvoiceSchema(parsedSchema);
          setInvoiceData(transformedData);
          
          // Trigger print after a short delay to ensure rendering
          setTimeout(() => {
            console.log("Attempting to print, invoiceRef.current:", invoiceRef.current);
            console.log("handlePrint type:", typeof handlePrint);
            console.log("handlePrint:", handlePrint);
            
            if (invoiceRef.current && handlePrint) {
              console.log("Triggering print...");
              try {
                const result = handlePrint();
                console.log("Print result:", result);
              } catch (printErr) {
                console.error("Error calling handlePrint:", printErr);
              }
              
              // Close dialog after print is triggered
              setTimeout(() => {
                onSuccess(sale);
                onClose();
                
                // Reset form state
                setOrderType("takeaway");
                setPaymentMethod("cash");
                setDiscountValue(0);
                setAmountPaid("");
                setCustomer({ name: "", phone: "", email: "", address: "" });
                setTable({ tableNumber: "", tableName: "" });
                setDriver({ driverId: "", driverName: "" });
              }, 1000);
            } else {
              console.error("Cannot print - invoiceRef.current:", invoiceRef.current, "handlePrint:", handlePrint);
              // Close dialog even if print fails
              onSuccess(sale);
              onClose();
            }
          }, 500);
        }
      } catch (printError: any) {
        console.error("Failed to prepare invoice:", printError);
        // Show warning but don't fail the transaction
        toast.warning(
          "Print preparation failed",
          "Transaction completed but failed to prepare invoice. You can print it from the sales list.",
          5000
        );
        
        // Close dialog on error
        onSuccess(sale);
        onClose();
      }
    } catch (err: any) {
      console.error("Error processing transaction:", err);
      const errorMessage = err.message || "Failed to process transaction";
      toast.error("Transaction failed", errorMessage, 8000);
      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  // Set up print handler using react-to-print (same as sales page)
  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice-${invoiceData?.invoiceNumber || 'POS'}`,
  });

  if (!isOpen) return null;

  return (
    <>
      {/* Hidden invoice for printing */}
      {invoiceSchema && invoiceData && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
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
                className={`${styles.orderTypeBtn} ${orderType === "dine-in" ? styles.active : ""}`}
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

              {/* Driver Selection */}
              <div className={styles.formSubsection}>
                <label className={styles.formSubLabel}>Driver Assignment (Optional)</label>
                <div className={styles.formGrid}>
                  <input
                    type="text"
                    placeholder="Driver Name"
                    className={styles.formInput}
                    value={driver.driverName}
                    onChange={(e) => setDriver({ ...driver, driverName: e.target.value })}
                  />
                </div>
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
              <div className={styles.formGrid}>
                <input
                  type="text"
                  placeholder="Table Number *"
                  className={styles.formInput}
                  value={table.tableNumber}
                  onChange={(e) => setTable({ ...table, tableNumber: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Table Name (optional)"
                  className={styles.formInput}
                  value={table.tableName}
                  onChange={(e) => setTable({ ...table, tableName: e.target.value })}
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

          {/* Amount Paid & Change (Cash only) */}
          {paymentMethod === "cash" && (
            <div className={styles.formSection}>
              <label className={styles.formLabel}>Cash Payment</label>
              <div className={styles.formGrid}>
                <div>
                  <input
                    type="number"
                    placeholder="Amount Paid"
                    className={styles.formInput}
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className={styles.changeDisplay}>
                  <span className={styles.changeLabel}>Change:</span>
                  <span className={`${styles.changeAmount} ${change < 0 ? styles.negative : ""}`}>
                    ${change >= 0 ? change.toFixed(2) : "Insufficient"}
                  </span>
                </div>
              </div>
            </div>
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
    </>
  );
};
