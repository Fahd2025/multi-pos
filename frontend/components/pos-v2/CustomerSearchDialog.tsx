/**
 * Customer Search Dialog
 * Search and select existing customers or create new ones
 */

"use client";

import React, { useState, useEffect } from "react";
import { X, Search, UserPlus, Phone, Mail, MapPin } from "lucide-react";
import styles from "./Pos2.module.css";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  isActive: boolean;
}

interface CustomerSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer) => void;
  onCreateNew: () => void;
}

const CustomerSearchDialog: React.FC<CustomerSearchDialogProps> = ({
  isOpen,
  onClose,
  onSelectCustomer,
  onCreateNew,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;

    const delayTimer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchCustomers(searchQuery);
      } else if (searchQuery.length === 0) {
        loadRecentCustomers();
      }
    }, 300);

    return () => clearTimeout(delayTimer);
  }, [searchQuery, isOpen]);

  // Load recent customers on open
  useEffect(() => {
    if (isOpen) {
      loadRecentCustomers();
    }
  }, [isOpen]);

  const loadRecentCustomers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/customers?page=1&pageSize=10");
      const result = await response.json();

      if (result.success) {
        setCustomers(result.data || []);
      } else {
        setError("Failed to load customers");
      }
    } catch (err) {
      console.error("Error loading customers:", err);
      setError("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const searchCustomers = async (query: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/v1/customers?search=${encodeURIComponent(query)}&page=1&pageSize=20`
      );
      const result = await response.json();

      if (result.success) {
        setCustomers(result.data || []);
      } else {
        setError("Search failed");
      }
    } catch (err) {
      console.error("Error searching customers:", err);
      setError("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer);
    setSearchQuery("");
  };

  const handleCreateNew = () => {
    onCreateNew();
    setSearchQuery("");
  };

  if (!isOpen) return null;

  return (
    <div className={styles.dialogBackdrop} onClick={onClose}>
      <div
        className={styles.dialogContainer}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "600px" }}
      >
        {/* Header */}
        <div className={styles.dialogHeader}>
          <h2 className={styles.dialogTitle}>Search Customer</h2>
          <button className={styles.dialogCloseBtn} onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.dialogContent}>
          {/* Search Input */}
          <div style={{ marginBottom: "16px" }}>
            <div style={{ position: "relative" }}>
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
                autoFocus
              />
            </div>
          </div>

          {/* Create New Button */}
          <button
            type="button"
            onClick={handleCreateNew}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: "rgb(59, 130, 246)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.875rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            <UserPlus size={18} />
            <span>Create New Customer</span>
          </button>

          {/* Customer List */}
          <div>
            <h3
              style={{
                fontSize: "0.875rem",
                fontWeight: "600",
                marginBottom: "12px",
                opacity: 0.7,
              }}
            >
              {searchQuery ? "Search Results" : "Recent Customers"}
            </h3>

            {loading && (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <p>Loading...</p>
              </div>
            )}

            {error && (
              <div
                style={{
                  padding: "12px",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "8px",
                  color: "rgb(239, 68, 68)",
                }}
              >
                {error}
              </div>
            )}

            {!loading && !error && customers.length === 0 && (
              <div style={{ textAlign: "center", padding: "20px", opacity: 0.6 }}>
                <p>No customers found</p>
              </div>
            )}

            {!loading && customers.length > 0 && (
              <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => handleSelectCustomer(customer)}
                    style={{
                      padding: "12px",
                      marginBottom: "8px",
                      border: "1px solid rgba(0, 0, 0, 0.1)",
                      borderRadius: "8px",
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
                    <div style={{ display: "flex", alignItems: "start", gap: "12px" }}>
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
                          flexShrink: 0,
                        }}
                      >
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            margin: 0,
                            fontWeight: "600",
                            fontSize: "0.9375rem",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {customer.name}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                            marginTop: "6px",
                          }}
                        >
                          {customer.phone && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "0.8125rem",
                                opacity: 0.7,
                              }}
                            >
                              <Phone size={14} />
                              <span>{customer.phone}</span>
                            </div>
                          )}
                          {customer.email && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "0.8125rem",
                                opacity: 0.7,
                              }}
                            >
                              <Mail size={14} />
                              <span
                                style={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {customer.email}
                              </span>
                            </div>
                          )}
                          {customer.address && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "0.8125rem",
                                opacity: 0.7,
                              }}
                            >
                              <MapPin size={14} />
                              <span
                                style={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {customer.address}
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
        </div>
      </div>
    </div>
  );
};

export default CustomerSearchDialog;
