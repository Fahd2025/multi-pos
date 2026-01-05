/**
 * Stock History Modal
 * Modal for displaying product stock adjustment history
 */

"use client";

import { useState, useEffect } from "react";
import { ProductDto, AuditLog } from "@/types/api.types";
import inventoryService from "@/services/inventory.service";

interface StockHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductDto | null;
}

interface StockAdjustmentData {
  StockLevel: number;
  ProductName: string;
  AdjustmentType?: string;
  AdjustmentQuantity?: number;
  Reason?: string;
}

export default function StockHistoryModal({
  isOpen,
  onClose,
  product,
}: StockHistoryModalProps) {
  const [history, setHistory] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch history when modal opens
  useEffect(() => {
    if (isOpen && product) {
      fetchHistory(1);
    }
  }, [isOpen, product]);

  /**
   * Fetch stock adjustment history
   */
  const fetchHistory = async (page: number) => {
    if (!product) return;

    setLoading(true);
    setError(null);

    try {
      const response = await inventoryService.getProductStockHistory(product.id, page, 10);
      setHistory(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || "Failed to fetch history");
      console.error("Failed to fetch stock history:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Parse JSON values safely
   */
  const parseValues = (jsonString?: string): StockAdjustmentData | null => {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch {
      return null;
    }
  };

  /**
   * Format date
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Get adjustment type badge color
   */
  const getAdjustmentTypeBadge = (type?: string) => {
    switch (type?.toUpperCase()) {
      case 'ADD':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">+ Add</span>;
      case 'REMOVE':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">- Remove</span>;
      case 'SET':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">= Set</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded">{type}</span>;
    }
  };

  if (!isOpen || !product) return null;

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUpScale {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          style={{ animation: "fadeIn 0.3s ease" }}
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="flex min-h-screen items-center justify-center p-4">
          <div
            className="relative bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] flex flex-col"
            style={{
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
              animation: "slideUpScale 0.3s ease",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Stock Adjustment History
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {product.nameEn} - Current Stock: {product.stockLevel}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading && history.length === 0 ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
                  ⚠️ {error}
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-lg font-medium">No adjustment history found</p>
                  <p className="text-sm mt-1">This product has no recorded stock adjustments.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((log, index) => {
                    const oldValues = parseValues(log.oldValues);
                    const newValues = parseValues(log.newValues);

                    return (
                      <div
                        key={log.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-500">
                              #{history.length - index}
                            </span>
                            {getAdjustmentTypeBadge(newValues?.AdjustmentType)}
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(log.timestamp)}
                            </span>
                          </div>
                        </div>

                        {/* Stock Change Display */}
                        <div className="flex items-center gap-4 mb-3">
                          <div className="text-center">
                            <p className="text-xs text-gray-500 mb-1">Previous Stock</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                              {oldValues?.StockLevel ?? 'N/A'}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <svg
                              className="h-5 w-5 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 7l5 5m0 0l-5 5m5-5H6"
                              />
                            </svg>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500 mb-1">New Stock</p>
                            <p className="text-lg font-bold text-blue-600">
                              {newValues?.StockLevel ?? 'N/A'}
                            </p>
                          </div>
                          {newValues?.AdjustmentQuantity !== undefined && (
                            <div className="text-center ml-4">
                              <p className="text-xs text-gray-500 mb-1">Quantity</p>
                              <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                                {newValues.AdjustmentQuantity}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Reason */}
                        {newValues?.Reason && (
                          <div className="bg-gray-50 dark:bg-gray-800 rounded px-3 py-2">
                            <p className="text-xs text-gray-500 mb-1">Reason:</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{newValues.Reason}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer with Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => fetchHistory(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => fetchHistory(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
