/**
 * Enhanced Order Panel Component
 * Combines the beautiful UI from ShoppingCart with pos functionality
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, ShoppingBag } from "lucide-react";
import styles from "./Pos2.module.css";
import { ProductDto, SaleDto } from "@/types/api.types";
import { buildProductImageUrl } from "@/lib/image-utils";
import { TransactionDialog } from "./TransactionDialog";
import { useToast } from "@/hooks/useToast";
import { DeliveryOrderForm } from "./delivery2/DeliveryOrderForm";
import { TransactionDialogV2 } from "../pos-v2/TransactionDialogV2";

interface OrderItem extends ProductDto {
  quantity: number;
}

interface OrderPanelProps {
  cart: OrderItem[];
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onClose?: () => void;
  onTransactionComplete?: (sale: SaleDto) => void;
  initialTableNumber?: string;
  initialGuestCount?: number;
}

export const OrderPanel: React.FC<OrderPanelProps> = ({
  cart,
  onRemoveItem,
  onClearAll,
  onUpdateQuantity,
  onClose,
  onTransactionComplete,
  initialTableNumber,
  initialGuestCount,
}) => {
  const toast = useToast();
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const cartItemsRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const previousCartLength = useRef(cart.length);
  const previousQuantities = useRef<{ [key: string]: number }>({});

  // Order type and delivery form state
  //const [orderType, setOrderType] = useState<"dine-in" | "takeaway" | "delivery">("dine-in");
  // const [deliveryForm, setDeliveryForm] = useState({
  //   customerName: "",
  //   phone: "",
  //   address: "",
  //   specialInstructions: "",
  // });
  // const [showDeliveryForm, setShowDeliveryForm] = useState(false);

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
      toast.warning("Cart is empty", "Please add products before processing a transaction");
      return;
    }

    // if (orderType === "delivery") {
    //   // Validate delivery form
    //   if (!deliveryForm.customerName || !deliveryForm.phone || !deliveryForm.address) {
    //     toast.warning(
    //       "Missing delivery details",
    //       "Please fill in customer name, phone, and address for delivery orders"
    //     );
    //     return;
    //   }
    // }

    setShowTransactionDialog(true);
  };

  const handleTransactionSuccess = (sale?: SaleDto) => {
    if (sale && onTransactionComplete) {
      onTransactionComplete(sale);
    }
    onClearAll();
    setShowTransactionDialog(false);
  };

  return (
    <>
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
      <div className={styles.cartHeader}>
        <div className={styles.cartTitle}>
          <ShoppingBag size={20} />
          <span>Cart</span>
          {itemCount > 0 && (
            <span
              style={{
                fontSize: "0.85rem",
                fontWeight: 500,
                color: "var(--muted-foreground)",
                marginLeft: "0.25rem",
              }}
            >
              ({itemCount})
            </span>
          )}
        </div>
        <div className={styles.cartActions}>
          {cart.length > 0 && (
            <button className={styles.clearAllBtn} onClick={onClearAll}>
              Clear All
            </button>
          )}
          {onClose && (
            <button
              className={styles.cartCloseBtn}
              onClick={onClose}
              aria-label="Close cart"
              style={{ position: "static", display: "flex" }}
            >
              <X size={24} />
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
            className={`${styles.toggleBtn} ${orderType === "takeaway" ? styles.active : ""}`}
            onClick={() => setOrderType("takeaway")}
          >
            Take Away
          </div>
          <div
            className={`${styles.toggleBtn} ${orderType === "delivery" ? styles.active : ""}`}
            onClick={() => {
              setOrderType("delivery");
              setShowDeliveryForm(true);
            }}
          >
            Delivery
          </div>
        </div>*/}
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
                color: "var(--foreground)",
                marginBottom: "0.5rem",
              }}
            >
              Cart is empty
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
              Add products from the grid to start a sale
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
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
                      ? "var(--destructive)"
                      : isUpdating
                      ? "var(--primary)"
                      : "transparent",
                    borderRadius: "0.75rem",
                    borderTop: isUpdating ? "2px solid var(--primary)" : "2px solid transparent",
                    borderRight: isUpdating ? "2px solid var(--primary)" : "2px solid transparent",
                    borderLeft: isUpdating ? "2px solid var(--primary)" : "2px solid transparent",
                    borderBottom: isUpdating
                      ? "2px solid var(--primary)"
                      : "1px solid var(--border)",
                    transition: "all 0.3s ease",
                    opacity: isDeleting ? 0 : isUpdating ? 0.3 : 1,
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
                        backgroundColor: "var(--muted)",
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
                              color: "var(--foreground)",
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
                              color: "var(--muted-foreground)",
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
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                          <button
                            onClick={() =>
                              onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))
                            }
                            disabled={isDeleting}
                            style={{
                              width: "32px",
                              height: "32px",
                              backgroundColor: "var(--secondary)",
                              border: "none",
                              borderRadius: "0.5rem",
                              fontWeight: 700,
                              color: "var(--foreground)",
                              fontSize: "1.25rem",
                              cursor: "pointer",
                              transition: "all 0.15s",
                              opacity: isDeleting ? 0.5 : 1,
                            }}
                            onMouseEnter={(e) => {
                              if (!isDeleting) {
                                e.currentTarget.style.backgroundColor = "var(--muted)";
                                e.currentTarget.style.transform = "scale(0.95)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "var(--secondary)";
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
                              border: "2px solid var(--border)",
                              borderRadius: "0.5rem",
                              fontWeight: 600,
                              fontSize: "1.125rem",
                              transition: "all 0.2s",
                              opacity: isDeleting ? 0.5 : 1,
                              backgroundColor: "var(--background)",
                              color: "var(--foreground)",
                            }}
                          />
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={isDeleting}
                            style={{
                              width: "32px",
                              height: "32px",
                              backgroundColor: "var(--secondary)",
                              border: "none",
                              borderRadius: "0.5rem",
                              fontWeight: 700,
                              color: "var(--foreground)",
                              fontSize: "1.25rem",
                              cursor: "pointer",
                              transition: "all 0.15s",
                              opacity: isDeleting ? 0.5 : 1,
                            }}
                            onMouseEnter={(e) => {
                              if (!isDeleting) {
                                e.currentTarget.style.backgroundColor = "var(--muted)";
                                e.currentTarget.style.transform = "scale(0.95)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "var(--secondary)";
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
                              color: "var(--foreground)",
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
          <div className={styles.summaryRow}>
            <span>Tax (15%)</span>
            <span>${(subtotal * 0.15).toFixed(2)}</span>
          </div>
          <div className={`${styles.summaryRow} ${styles.total}`}>
            <span>Total</span>
            <span>${(subtotal * 1.15).toFixed(2)}</span>
          </div>
          <button
            className={styles.processBtn}
            onClick={handleOpenTransactionDialog}
            disabled={cart.length === 0}
          >
            Process Transaction
          </button>
        </div>
      )}

      {/* Delivery Form - Only shown when order type is delivery */}
      {/* {orderType === "delivery" && (
        <DeliveryOrderForm
          formState={deliveryForm}
          setFormState={setDeliveryForm}
          showForm={showDeliveryForm}
          setShowForm={setShowDeliveryForm}
        />
      )} */}

      {/* Transaction Dialog */}
      <TransactionDialogV2
        isOpen={showTransactionDialog}
        onClose={() => setShowTransactionDialog(false)}
        cart={cart}
        subtotal={subtotal}
        onSuccess={(sale) => handleTransactionSuccess(sale)}
        initialTableNumber={initialTableNumber}
        initialGuestCount={initialGuestCount}
        // initialOrderType={orderType}
        // initialCustomerDetails={
        //   orderType === "delivery"
        //     ? {
        //         name: deliveryForm.customerName,
        //         phone: deliveryForm.phone,
        //         address: deliveryForm.address,
        //       }
        //     : undefined
        // }
      />
    </>
  );
};
