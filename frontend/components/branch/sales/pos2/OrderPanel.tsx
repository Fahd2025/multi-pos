import React, { useState } from "react";
import { Users, LayoutPanelTop, Percent, Save, Trash2 } from "lucide-react";
import styles from "./Pos2.module.css";

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface OrderPanelProps {
  cart: OrderItem[];
  onRemoveItem: (id: number) => void;
  onClearAll: () => void;
}

export const OrderPanel: React.FC<OrderPanelProps> = ({ cart, onRemoveItem, onClearAll }) => {
  const [orderType, setOrderType] = useState<"dine-in" | "take-away">("dine-in");

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

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
        <button className={styles.actionBtn}>
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
                <span className={styles.orderItemName}>{item.name}</span>
                <span className={styles.orderItemMeta}>x{item.quantity}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span className={styles.orderItemPrice}>
                  ${(item.price * item.quantity).toFixed(2)}
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
        <button className={styles.clearBtn} onClick={onClearAll}>
          Clear All Order
        </button>

        <div className={styles.summaryRow}>
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>Tax</span>
          <span>${tax.toFixed(2)}</span>
        </div>
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

        <button className={styles.processBtn}>Process Transaction</button>
      </div>
    </div>
  );
};
