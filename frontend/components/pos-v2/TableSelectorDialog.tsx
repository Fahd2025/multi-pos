/**
 * Table Selector Dialog
 * Visual table selection with status indicators
 */

"use client";

import React, { useState, useEffect } from "react";
import { X, UtensilsCrossed, Users, Search } from "lucide-react";
import styles from "../pos/Pos2.module.css";
import tableService from "@/services/table.service";

interface Table {
  id: number;
  number: number;
  tableNumber?: number;
  name: string;
  capacity: number;
  zoneId?: number;
  zoneName?: string;
  status?: string;
  currentOrderId?: string;
  guestCount?: number;
}

interface TableSelectorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTable: (table: Table) => void;
}

const TableSelectorDialog: React.FC<TableSelectorDialogProps> = ({
  isOpen,
  onClose,
  onSelectTable,
}) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Load tables on open
  useEffect(() => {
    if (isOpen) {
      loadTables();
    }
  }, [isOpen]);

  const loadTables = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await tableService.getTablesWithStatus();
      setTables(result || []);
    } catch (err) {
      console.error("Error loading tables:", err);
      setError("Failed to load tables");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTable = (table: Table) => {
    // Only allow selection of available tables
    if (table.status === "Available" || !table.status) {
      onSelectTable(table);
    }
  };

  // Filter tables
  const filteredTables = tables.filter((table) => {
    const matchesSearch =
      searchQuery === "" ||
      table.number.toString().includes(searchQuery) ||
      table.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.zoneName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "available" && (table.status === "Available" || !table.status)) ||
      (filterStatus === "occupied" && table.status === "Occupied") ||
      (filterStatus === "reserved" && table.status === "Reserved");

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Occupied":
        return {
          background: "rgba(239, 68, 68, 0.1)",
          border: "rgba(239, 68, 68, 0.3)",
          text: "rgb(239, 68, 68)",
        };
      case "Reserved":
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

  const getStatusText = (status?: string) => {
    return status || "Available";
  };

  if (!isOpen) return null;

  return (
    <div className={styles.dialogBackdrop} onClick={onClose}>
      <div
        className={styles.dialogContainer}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "800px" }}
      >
        {/* Header */}
        <div className={styles.dialogHeader}>
          <h2 className={styles.dialogTitle}>Select Table</h2>
          <button className={styles.dialogCloseBtn} onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.dialogContent}>
          {/* Search and Filter */}
          <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
              {/* Search */}
              <div style={{ position: "relative", flex: 1 }}>
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
                  placeholder="Search tables..."
                  className={styles.formInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: "40px" }}
                />
              </div>

              {/* Status Filter */}
              <select
                className={styles.formSelect}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ width: "150px" }}
              >
                <option value="all">All Tables</option>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="reserved">Reserved</option>
              </select>
            </div>

            {/* Status Legend */}
            <div style={{ display: "flex", gap: "12px", fontSize: "0.8125rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: "rgb(16, 185, 129)",
                  }}
                />
                <span>Available</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: "rgb(239, 68, 68)",
                  }}
                />
                <span>Occupied</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: "rgb(251, 191, 36)",
                  }}
                />
                <span>Reserved</span>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p>Loading tables...</p>
            </div>
          )}

          {/* Error State */}
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

          {/* Empty State */}
          {!loading && !error && filteredTables.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px", opacity: 0.6 }}>
              <UtensilsCrossed size={48} style={{ margin: "0 auto 16px" }} />
              <p>No tables found</p>
            </div>
          )}

          {/* Table Grid */}
          {!loading && filteredTables.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: "12px",
                maxHeight: "500px",
                overflowY: "auto",
              }}
            >
              {filteredTables.map((table) => {
                const statusColors = getStatusColor(table.status);
                const isAvailable = table.status === "Available" || !table.status;
                const statusText = getStatusText(table.status);

                return (
                  <div
                    key={table.id}
                    onClick={() => handleSelectTable(table)}
                    style={{
                      padding: "16px",
                      border: `2px solid ${statusColors.border}`,
                      borderRadius: "12px",
                      background: statusColors.background,
                      cursor: isAvailable ? "pointer" : "not-allowed",
                      opacity: isAvailable ? 1 : 0.6,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (isAvailable) {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
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
                        display: "flex",
                        justifyContent: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "50%",
                          background: statusColors.text,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontSize: "1.25rem",
                          fontWeight: "700",
                        }}
                      >
                        {table.number || table.tableNumber}
                      </div>
                    </div>

                    {/* Table Info */}
                    <div style={{ textAlign: "center" }}>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: "600",
                          fontSize: "0.9375rem",
                          marginBottom: "4px",
                        }}
                      >
                        Table {table.number || table.tableNumber}
                      </p>
                      {table.name && (
                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.8125rem",
                            opacity: 0.7,
                            marginBottom: "8px",
                          }}
                        >
                          {table.name}
                        </p>
                      )}

                      {/* Zone */}
                      {table.zoneName && (
                        <p
                          style={{
                            margin: "0 0 8px 0",
                            fontSize: "0.75rem",
                            opacity: 0.6,
                          }}
                        >
                          {table.zoneName}
                        </p>
                      )}

                      {/* Status Badge */}
                      <div
                        style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          borderRadius: "12px",
                          background: statusColors.text,
                          color: "white",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          marginBottom: "8px",
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
                          gap: "4px",
                          fontSize: "0.8125rem",
                          opacity: 0.7,
                        }}
                      >
                        <Users size={14} />
                        <span>Capacity: {table.capacity || "N/A"}</span>
                      </div>

                      {/* Guest Count (if occupied) */}
                      {table.guestCount && (
                        <div
                          style={{
                            fontSize: "0.8125rem",
                            opacity: 0.7,
                            marginTop: "4px",
                          }}
                        >
                          Guests: {table.guestCount}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.dialogFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            className={styles.secondaryBtn}
            onClick={loadTables}
            style={{ marginLeft: "auto" }}
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableSelectorDialog;
