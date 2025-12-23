/**
 * Cash Calculator Component
 * Cash payment calculator with quick amount buttons and change display
 */

"use client";

import React from "react";
import { Banknote, Calculator } from "lucide-react";
import styles from "./Pos2.module.css";

interface CashCalculatorProps {
  total: number;
  amountPaid: number;
  onAmountChange: (amount: number) => void;
}

const CashCalculator: React.FC<CashCalculatorProps> = ({ total, amountPaid, onAmountChange }) => {
  const change = amountPaid - total;

  // Quick amount buttons - smart suggestions based on total
  const getQuickAmounts = (): number[] => {
    const baseAmounts = [5, 10, 20, 50, 100, 200, 500, 1000];

    // Find the smallest amount greater than or equal to total
    const exactAmount = Math.ceil(total);

    // Find next higher denominations
    const suggestions = baseAmounts.filter((amount) => amount >= total);

    // Always include exact amount and a few higher options
    const amounts = [exactAmount, ...suggestions.slice(0, 3)];

    // Remove duplicates and sort
    return [...new Set(amounts)].sort((a, b) => a - b).slice(0, 4);
  };

  const quickAmounts = getQuickAmounts();

  const handleQuickAmount = (amount: number) => {
    onAmountChange(amount);
  };

  const handleExactAmount = () => {
    onAmountChange(Math.ceil(total * 100) / 100); // Round to 2 decimal places
  };

  const handleManualInput = (value: string) => {
    const numValue = parseFloat(value) || 0;
    onAmountChange(numValue);
  };

  return (
    <div className={styles.formSection}>
      <label className={styles.formLabel}>
        <Banknote size={18} />
        Cash Payment
      </label>

      <div
        style={{
          padding: "16px",
          background: "rgba(16, 185, 129, 0.05)",
          border: "1px solid rgba(16, 185, 129, 0.2)",
          borderRadius: "12px",
        }}
      >
        {/* Manual Input */}
        <div style={{ marginBottom: "12px" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: "600",
              marginBottom: "8px",
              opacity: 0.8,
            }}
          >
            Amount Received
          </label>
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "1.125rem",
                fontWeight: "600",
                opacity: 0.5,
              }}
            >
              $
            </span>
            <input
              type="number"
              placeholder="0.00"
              className={styles.formInput}
              value={amountPaid || ""}
              onChange={(e) => handleManualInput(e.target.value)}
              min="0"
              step="0.01"
              style={{
                paddingLeft: "32px",
                fontSize: "1.125rem",
                fontWeight: "600",
                textAlign: "right",
              }}
            />
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div style={{ marginBottom: "12px" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: "600",
              marginBottom: "8px",
              opacity: 0.8,
            }}
          >
            Quick Amounts
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
            {/* Exact Amount Button */}
            <button
              type="button"
              onClick={handleExactAmount}
              style={{
                padding: "12px",
                background: "rgba(59, 130, 246, 0.1)",
                border: "2px solid rgba(59, 130, 246, 0.3)",
                borderRadius: "8px",
                fontSize: "0.9375rem",
                fontWeight: "600",
                color: "rgb(59, 130, 246)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(59, 130, 246, 0.2)";
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <Calculator size={16} style={{ marginBottom: "4px" }} />
              <div>Exact</div>
              <div style={{ fontSize: "0.8125rem", opacity: 0.8 }}>
                ${Math.ceil(total * 100) / 100}
              </div>
            </button>

            {/* Quick Amount Buttons */}
            {quickAmounts.slice(0, 3).map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => handleQuickAmount(amount)}
                style={{
                  padding: "12px",
                  background: amountPaid === amount ? "rgb(16, 185, 129)" : "rgba(16, 185, 129, 0.1)",
                  border: `2px solid ${
                    amountPaid === amount ? "rgb(16, 185, 129)" : "rgba(16, 185, 129, 0.3)"
                  }`,
                  borderRadius: "8px",
                  fontSize: "1.125rem",
                  fontWeight: "700",
                  color: amountPaid === amount ? "white" : "rgb(16, 185, 129)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (amountPaid !== amount) {
                    e.currentTarget.style.background = "rgba(16, 185, 129, 0.2)";
                    e.currentTarget.style.transform = "scale(1.02)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (amountPaid !== amount) {
                    e.currentTarget.style.background = "rgba(16, 185, 129, 0.1)";
                    e.currentTarget.style.transform = "scale(1)";
                  }
                }}
              >
                ${amount}
              </button>
            ))}
          </div>
        </div>

        {/* Change Display */}
        <div
          style={{
            padding: "16px",
            background:
              change >= 0
                ? "rgba(16, 185, 129, 0.15)"
                : "rgba(239, 68, 68, 0.15)",
            border: `2px solid ${
              change >= 0
                ? "rgba(16, 185, 129, 0.4)"
                : "rgba(239, 68, 68, 0.4)"
            }`,
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  opacity: 0.8,
                  marginBottom: "4px",
                }}
              >
                Change to Return
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "1.875rem",
                  fontWeight: "700",
                  color: change >= 0 ? "rgb(16, 185, 129)" : "rgb(239, 68, 68)",
                }}
              >
                {change >= 0 ? `$${change.toFixed(2)}` : "Insufficient"}
              </p>
            </div>
            {change < 0 && (
              <div
                style={{
                  padding: "8px 12px",
                  background: "rgb(239, 68, 68)",
                  color: "white",
                  borderRadius: "8px",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                }}
              >
                SHORT: ${Math.abs(change).toFixed(2)}
              </div>
            )}
          </div>

          {/* Payment Breakdown */}
          {amountPaid > 0 && (
            <div
              style={{
                marginTop: "12px",
                paddingTop: "12px",
                borderTop: "1px solid rgba(0, 0, 0, 0.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.8125rem",
                  marginBottom: "4px",
                }}
              >
                <span style={{ opacity: 0.7 }}>Total Due:</span>
                <span style={{ fontWeight: "600" }}>${total.toFixed(2)}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.8125rem",
                }}
              >
                <span style={{ opacity: 0.7 }}>Amount Paid:</span>
                <span style={{ fontWeight: "600" }}>${amountPaid.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Warning Message */}
        {change < 0 && amountPaid > 0 && (
          <div
            style={{
              marginTop: "12px",
              padding: "12px",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "8px",
              fontSize: "0.8125rem",
              color: "rgb(239, 68, 68)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "1.25rem" }}>⚠️</span>
            <span>
              Amount paid is insufficient. Please collect at least ${total.toFixed(2)}.
            </span>
          </div>
        )}

        {/* Success Message */}
        {change >= 0 && amountPaid > 0 && (
          <div
            style={{
              marginTop: "12px",
              padding: "12px",
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "8px",
              fontSize: "0.8125rem",
              color: "rgb(16, 185, 129)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "1.25rem" }}>✓</span>
            <span>
              {change === 0
                ? "Exact payment received!"
                : `Return $${change.toFixed(2)} in change to customer.`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashCalculator;
