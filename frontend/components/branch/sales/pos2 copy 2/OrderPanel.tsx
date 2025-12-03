import React, { useState } from "react";
import { Users, LayoutPanelTop, Percent, Save, Trash2, Plus, Minus } from "lucide-react";
import styles from "./Pos2.module.css";
import { ProductDto } from "@/types/api.types";
import salesService from "@/services/sales.service";

interface OrderItem extends ProductDto {
  quantity: number;
}

interface OrderPanelProps {
  cart: OrderItem[];
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
}

export const OrderPanel: React.FC<OrderPanelProps> = ({
  cart,
  onRemoveItem,
  onClearAll,
  onUpdateQuantity
}) => {
  const [orderType, setOrderType] = useState<"dine-in" | "take-away">("dine-in");
  const [discount, setDiscount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  const tax = subtotal * 0.1; // 10% tax
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal + tax - discountAmount;

  const handleProcessTransaction = async () => {
    if (cart.length === 0) {
      setError("Cart is empty");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Create sale DTO
      const saleData = {
        invoiceType: orderType === "dine-in" ? 0 : 1, // 0: Dine-in, 1: Take-away
        paymentMethod: 0, // 0: Cash (default for now)
        lineItems: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.sellingPrice,
          discountType: 0, // 0: None, 1: Percentage, 2: Fixed
          discountValue: 0,
        })),
        notes: `POS Transaction - ${orderType}`,
      };

      // Create the sale
      const sale = await salesService.createSale(saleData);

      // Success - show success message and clear cart
      alert(`Transaction successful! Invoice #${sale.invoiceNumber}\nTotal: $${total.toFixed(2)}`);
      onClearAll();
      setDiscount(0);
    } catch (err: any) {
      console.error("Error processing transaction:", err);
      setError(err.message || "Failed to process transaction");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className={styles.orderPanel}>
      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        <button className={styles.actionBtn}>
          <Users size={20} />
          <span>Customer</span>
        </button>
        <button className={styles.actionBtn}>
          <LayoutPanelTop size={20} />
          <span>Tables</span>
        </button>
        <button
          className={styles.actionBtn}
          onClick={() => {
            const newDiscount = parseFloat(prompt("Enter discount percentage:", discount.toString()) || "0");
            if (!isNaN(newDiscount) && newDiscount >= 0 && newDiscount <= 100) {
              setDiscount(newDiscount);
            }
          }}
        >
          <Percent size={20} />
          <span>Discount</span>
        </button>
        <button className={styles.actionBtn}>
          <Save size={20} />
          <span>Save Bill</span>
        </button>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          flex: 1,
          overflow: "hidden",
        }}
      >
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>Order Details</h2>

        {/* Toggle */}
        <div className={styles.toggleContainer}>
          <div
            className={`${styles.toggleBtn} ${orderType === "dine-in" ? styles.active : ""}`}
            onClick={() => setOrderType("dine-in")}
          >
            Dine In
          </div>
          <div
            className={`${styles.toggleBtn} ${orderType === "take-away" ? styles.active : ""}`}
            onClick={() => setOrderType("take-away")}
          >
            Take Away
          </div>
        </div>

        {/* Order List */}
        <div className={styles.orderList}>
          {cart.map((item) => (
            <div key={item.id} className={styles.orderItem}>
              <div className={styles.orderItemInfo}>
                <span className={styles.orderItemName}>{item.nameEn}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateQuantity(item.id, item.quantity - 1);
                    }}
                    style={{
                      border: "1px solid var(--border-color)",
                      background: "transparent",
                      borderRadius: "4px",
                      width: "24px",
                      height: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <Minus size={14} />
                  </button>
                  <span className={styles.orderItemMeta}>{item.quantity}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateQuantity(item.id, item.quantity + 1);
                    }}
                    style={{
                      border: "1px solid var(--border-color)",
                      background: "transparent",
                      borderRadius: "4px",
                      width: "24px",
                      height: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span className={styles.orderItemPrice}>
                  ${(item.sellingPrice * item.quantity).toFixed(2)}
                </span>
                <Trash2
                  size={16}
                  color="#ef4444"
                  style={{ cursor: "pointer" }}
                  onClick={() => onRemoveItem(item.id)}
                />
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--text-secondary)", marginTop: "2rem" }}>
              No items in order
            </div>
          )}
        </div>
      </div>

      {/* Summary & Actions */}
      <div className={styles.summary}>
        <button className={styles.clearBtn} onClick={onClearAll} disabled={cart.length === 0}>
          Clear All Order
        </button>

        <div className={styles.summaryRow}>
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>Tax (10%)</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className={styles.summaryRow}>
            <span>Discount ({discount}%)</span>
            <span>-${discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div
          className={styles.summaryRow}
          style={{ borderBottom: "1px dashed var(--border-color)", paddingBottom: "0.5rem" }}
        >
          <span>Voucher</span>
          <span>$0.00</span>
        </div>
        <div className={styles.summaryRow + " " + styles.total}>
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>

        {error && (
          <div style={{ color: "red", fontSize: "0.875rem", textAlign: "center", marginTop: "0.5rem" }}>
            {error}
          </div>
        )}

        <button
          className={styles.processBtn}
          onClick={handleProcessTransaction}
          disabled={processing || cart.length === 0}
        >
          {processing ? "Processing..." : "Process Transaction"}
        </button>
      </div>
    </div>
  );
};
