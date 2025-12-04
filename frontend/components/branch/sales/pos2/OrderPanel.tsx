/**
 * Enhanced Order Panel Component
 * Combines the beautiful UI from ShoppingCart with pos2 functionality
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import styles from "./Pos2.module.css";
import { ProductDto } from "@/types/api.types";
import { buildProductImageUrl } from "@/lib/image-utils";
import { TransactionDialog } from "./TransactionDialog";

interface OrderItem extends ProductDto {
  quantity: number;
}

interface OrderPanelProps {
  cart: OrderItem[];
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onClose?: () => void;
}

export const OrderPanel: React.FC<OrderPanelProps> = ({
  cart,
  onRemoveItem,
  onClearAll,
  onUpdateQuantity,
  onClose,
}) => {
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const cartItemsRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const previousCartLength = useRef(cart.length);
  const previousQuantities = useRef<{ [key: string]: number }>({});

  // Get branch code from localStorage
  const getBranchCode = () => {
    if (typeof window !== "undefined") {
      const branch = localStorage.getItem("branch");
      if (branch) {
        try {
          return JSON.parse(branch).branchCode;
        } catch (e) {
          console.error("Error parsing branch:", e);
        }
      }
    }
    return "default";
  };

  const branchCode = getBranchCode();
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Track quantity changes for animation and scroll to changed item
  useEffect(() => {
    cart.forEach((item) => {
      if (
        previousQuantities.current[item.id] !== undefined &&
        previousQuantities.current[item.id] !== item.quantity
      ) {
        // Quantity changed, trigger animation
        setUpdatingId(item.id);
        setTimeout(() => setUpdatingId(null), 600);

        // Scroll to the changed item
        const itemElement = itemRefs.current[item.id];
        if (itemElement && cartItemsRef.current) {
          const container = cartItemsRef.current;
          const itemTop = itemElement.offsetTop;
          const itemHeight = itemElement.offsetHeight;
          const containerScrollTop = container.scrollTop;
          const containerHeight = container.clientHeight;

          // Check if item is not fully visible
          const isAboveView = itemTop < containerScrollTop + 100;
          const isBelowView = itemTop + itemHeight > containerScrollTop + containerHeight;

          if (isAboveView || isBelowView) {
            // Scroll to center the item in the view
            container.scrollTo({
              top: itemTop - containerHeight / 2 + itemHeight / 2,
              behavior: "smooth",
            });
          }
        }
      }
      previousQuantities.current[item.id] = item.quantity;
    });
  }, [cart]);

  // Auto-scroll to new items
  useEffect(() => {
    if (cart.length > previousCartLength.current) {
      // New item added - scroll to bottom
      if (cartItemsRef.current) {
        setTimeout(() => {
          cartItemsRef.current?.scrollTo({
            top: cartItemsRef.current.scrollHeight,
            behavior: "smooth",
          });
        }, 100);
      }
    }
    previousCartLength.current = cart.length;
  }, [cart]);

  const subtotal = cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleRemove = (id: string) => {
    setDeletingId(id);
    setTimeout(() => {
      onRemoveItem(id);
      setDeletingId(null);
    }, 300);
  };

  const handleOpenTransactionDialog = () => {
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }
    setShowTransactionDialog(true);
  };

  const handleTransactionSuccess = () => {
    onClearAll();
    setShowTransactionDialog(false);
  };

  return (
    <>
      {/* Close button for mobile - only visible on small screens */}
      {onClose && (
        <button className={styles.cartCloseBtn} onClick={onClose} aria-label="Close cart">
          <X size={24} />
        </button>
      )}

      {/* Action Buttons */}
      {/* <div className={styles.actionButtons}>
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
            const newDiscount = parseFloat(
              prompt("Enter discount percentage:", discount.toString()) || "0"
            );
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
      </div> */}

      {/* Header with Order Type Toggle */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                margin: 0,
                color: "var(--text-primary)",
              }}
            >
              Shopping Cart
            </h2>
            {/* <p
              style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}
            >
              {itemCount} item{itemCount !== 1 ? "s" : ""}
            </p> */}
          </div>
          {cart.length > 0 && (
            <button
              onClick={onClearAll}
              style={{
                fontSize: "0.875rem",
                color: "#ef4444",
                fontWeight: 500,
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              Clear All
            </button>
          )}
        </div>

        {/* Order Type Toggle */}
        {/* <div className={styles.toggleContainer}>
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
        </div> */}
      </div>

      {/* Cart Items with Animations */}
      <div ref={cartItemsRef} style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {cart.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              textAlign: "center",
              animation: "fadeIn 0.3s ease-in",
            }}
          >
            <span style={{ fontSize: "4rem", marginBottom: "1rem" }}>🛒</span>
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "0.5rem",
              }}
            >
              Cart is empty
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              Add products from the grid to start a sale
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {cart.map((item) => {
              const isDeleting = deletingId === item.id;
              const isUpdating = updatingId === item.id;
              const lineTotal = item.sellingPrice * item.quantity;

              return (
                <div
                  key={item.id}
                  ref={(el) => {
                    itemRefs.current[item.id] = el;
                  }}
                  style={{
                    padding: 8,
                    backgroundColor: isDeleting
                      ? "#fee2e2"
                      : isUpdating
                      ? "#eff6ff"
                      : "transparent",
                    borderRadius: "0.75rem",
                    borderTop: isUpdating ? "2px solid #3b82f6" : "2px solid transparent",
                    borderRight: isUpdating ? "2px solid #3b82f6" : "2px solid transparent",
                    borderLeft: isUpdating ? "2px solid #3b82f6" : "2px solid transparent",
                    borderBottom: isUpdating ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                    transition: "all 0.3s ease",
                    opacity: isDeleting ? 0 : 1,
                    transform: isDeleting ? "translateX(100%)" : "translateX(0)",
                    animation: "slideIn 0.3s ease-out",
                  }}
                >
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    {/* Product Image */}
                    <div
                      style={{
                        width: "64px",
                        height: "64px",
                        backgroundColor: "#f3f4f6",
                        borderRadius: "0.75rem",
                        overflow: "hidden",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {(() => {
                        const hasImage = item.images && item.images.length > 0;
                        const isError = imageErrors[item.id];

                        if (hasImage && !isError) {
                          const imageUrl = buildProductImageUrl(
                            branchCode,
                            item.images[0].imagePath,
                            item.id,
                            "thumb"
                          );

                          return (
                            <img
                              src={imageUrl}
                              alt={item.nameEn}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              onError={() => {
                                setImageErrors((prev) => ({ ...prev, [item.id]: true }));
                              }}
                            />
                          );
                        }

                        return <span style={{ fontSize: "2rem" }}>📦</span>;
                      })()}
                    </div>

                    {/* Product Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Product Name & Remove Button */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          marginBottom: "0.75rem",
                        }}
                      >
                        <div style={{ flex: 1, paddingRight: "0.5rem" }}>
                          <h4
                            style={{
                              fontWeight: 600,
                              color: "var(--text-primary)",
                              fontSize: "1rem",
                              lineHeight: 1.2,
                              margin: 0,
                            }}
                          >
                            {item.nameEn}
                          </h4>
                          <p
                            style={{
                              fontSize: "0.875rem",
                              color: "var(--text-secondary)",
                              marginTop: "0.25rem",
                            }}
                          >
                            ${item.sellingPrice.toFixed(2)} each
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemove(item.id)}
                          disabled={isDeleting}
                          style={{
                            color: "#ef4444",
                            padding: "0.5rem",
                            backgroundColor: "transparent",
                            border: "none",
                            borderRadius: "0.5rem",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            minWidth: "40px",
                            minHeight: "40px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: isDeleting ? 0.5 : 1,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#fee2e2";
                            e.currentTarget.style.transform = "scale(1.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                          title="Remove item"
                        >
                          <svg
                            style={{ width: "24px", height: "24px" }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* Quantity Controls & Line Total */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <button
                            onClick={() =>
                              onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))
                            }
                            disabled={isDeleting}
                            style={{
                              width: "32px",
                              height: "32px",
                              backgroundColor: "#e5e7eb",
                              border: "none",
                              borderRadius: "0.5rem",
                              fontWeight: 700,
                              color: "#374151",
                              fontSize: "1.25rem",
                              cursor: "pointer",
                              transition: "all 0.15s",
                              opacity: isDeleting ? 0.5 : 1,
                            }}
                            onMouseEnter={(e) => {
                              if (!isDeleting) {
                                e.currentTarget.style.backgroundColor = "#d1d5db";
                                e.currentTarget.style.transform = "scale(0.95)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "#e5e7eb";
                              e.currentTarget.style.transform = "scale(1)";
                            }}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              onUpdateQuantity(item.id, parseInt(e.target.value) || 1)
                            }
                            disabled={isDeleting}
                            min="1"
                            className={styles.quantityInput}
                            style={{
                              width: "64px",
                              height: "32px",
                              textAlign: "center",
                              border: "2px solid #d1d5db",
                              borderRadius: "0.5rem",
                              fontWeight: 600,
                              fontSize: "1.125rem",
                              transition: "all 0.2s",
                              opacity: isDeleting ? 0.5 : 1,
                            }}
                          />
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={isDeleting}
                            style={{
                              width: "32px",
                              height: "32px",
                              backgroundColor: "#e5e7eb",
                              border: "none",
                              borderRadius: "0.5rem",
                              fontWeight: 700,
                              color: "#374151",
                              fontSize: "1.25rem",
                              cursor: "pointer",
                              transition: "all 0.15s",
                              opacity: isDeleting ? 0.5 : 1,
                            }}
                            onMouseEnter={(e) => {
                              if (!isDeleting) {
                                e.currentTarget.style.backgroundColor = "#d1d5db";
                                e.currentTarget.style.transform = "scale(0.95)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "#e5e7eb";
                              e.currentTarget.style.transform = "scale(1)";
                            }}
                          >
                            +
                          </button>
                        </div>

                        {/* Line Total */}
                        <div style={{ textAlign: "right" }}>
                          <p
                            style={{
                              fontSize: "1.125rem",
                              fontWeight: 700,
                              color: "var(--text-primary)",
                              margin: 0,
                              transition: "all 0.3s",
                            }}
                          >
                            ${lineTotal.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary & Process Transaction */}
      {cart.length > 0 && (
        <div className={styles.summary} style={{ animation: "fadeIn 0.3s ease-in" }}>
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className={`${styles.summaryRow} ${styles.total}`}>
            <span>Items</span>
            <span>{itemCount}</span>
          </div>

          <button
            className={styles.processBtn}
            onClick={handleOpenTransactionDialog}
            disabled={cart.length === 0}
            style={{
              marginTop: "0.5rem",
              opacity: cart.length === 0 ? 0.5 : 1,
              cursor: cart.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            Process Transaction
          </button>
        </div>
      )}

      {/* Transaction Dialog */}
      <TransactionDialog
        isOpen={showTransactionDialog}
        onClose={() => setShowTransactionDialog(false)}
        cart={cart}
        subtotal={subtotal}
        onSuccess={handleTransactionSuccess}
      />
    </>
  );
};
