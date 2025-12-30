"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CashDrawer } from "@/types/cash-drawer.types";

export default function CashDrawerHistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<CashDrawer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDrawer, setSelectedDrawer] = useState<CashDrawer | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchHistory();
  }, [startDate, endDate]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5062'}/api/v1/cash-drawer/history?page=1&pageSize=100`;

      if (startDate) {
        url += `&startDate=${startDate}`;
      }
      if (endDate) {
        url += `&endDate=${endDate}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch cash drawer history");
      }

      const result = await response.json();
      setHistory(result.data || []);
    } catch (error) {
      console.error("Error fetching cash drawer history:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrawerDetails = async (drawerId: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5062'}/api/v1/cash-drawer/${drawerId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch drawer details");
      }

      const result = await response.json();
      setSelectedDrawer(result.data);
    } catch (error) {
      console.error("Error fetching drawer details:", error);
    }
  };

  const viewReconciliation = (drawerId: string) => {
    router.push(`/en/branch/cash-drawer/reconciliation/${drawerId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cash Drawer History</h1>
        <p className="text-gray-600">View all cash drawer sessions and their details</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Loading history...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* History List */}
          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
                No cash drawer history found
              </div>
            ) : (
              history.map((drawer) => (
                <div
                  key={drawer.id}
                  className={`bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow ${
                    selectedDrawer?.id === drawer.id ? "ring-2 ring-blue-500" : ""
                  }`}
                  onClick={() => fetchDrawerDetails(drawer.id)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-semibold text-lg">
                        {drawer.status === "Open" ? (
                          <span className="text-green-600">● Open</span>
                        ) : (
                          <span className="text-gray-600">● Closed</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        Opened: {formatDate(drawer.openedAt)}
                      </div>
                      {drawer.closedAt && (
                        <div className="text-sm text-gray-600">
                          Closed: {formatDate(drawer.closedAt)}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Expected Cash</div>
                      <div className="text-lg font-bold text-blue-600">
                        {formatCurrency(drawer.expectedCash)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-gray-600">Opening</div>
                      <div className="font-semibold">
                        {formatCurrency(drawer.openingBalance)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Transactions</div>
                      <div className="font-semibold">{drawer.totalTransactionCount}</div>
                    </div>
                    {drawer.variance !== undefined && drawer.variance !== null && (
                      <div>
                        <div className="text-gray-600">Variance</div>
                        <div
                          className={`font-semibold ${
                            drawer.variance === 0
                              ? "text-green-600"
                              : Math.abs(drawer.variance) > 10
                              ? "text-red-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {formatCurrency(drawer.variance)}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 text-xs text-gray-500">
                    Opened by: {drawer.openedByUsername}
                    {drawer.closedByUsername && ` • Closed by: ${drawer.closedByUsername}`}
                  </div>

                  {drawer.status === "Closed" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        viewReconciliation(drawer.id);
                      }}
                      className="mt-3 w-full px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      View Reconciliation Report
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Details Panel */}
          <div className="lg:sticky lg:top-6 lg:h-fit">
            {selectedDrawer ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Session Details</h2>

                {/* Summary */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-600">Opening Balance</div>
                      <div className="text-lg font-bold">
                        {formatCurrency(selectedDrawer.openingBalance)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Expected Cash</div>
                      <div className="text-lg font-bold text-blue-600">
                        {formatCurrency(selectedDrawer.expectedCash)}
                      </div>
                    </div>
                    {selectedDrawer.actualCash !== undefined && (
                      <>
                        <div>
                          <div className="text-sm text-gray-600">Actual Cash</div>
                          <div className="text-lg font-bold">
                            {formatCurrency(selectedDrawer.actualCash)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Variance</div>
                          <div
                            className={`text-lg font-bold ${
                              selectedDrawer.variance === 0
                                ? "text-green-600"
                                : Math.abs(selectedDrawer.variance || 0) > 10
                                ? "text-red-600"
                                : "text-yellow-600"
                            }`}
                          >
                            {formatCurrency(selectedDrawer.variance || 0)}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Sales Count</div>
                      <div className="font-semibold">{selectedDrawer.salesCount}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Cash Transactions</div>
                      <div className="font-semibold">
                        {selectedDrawer.transactions.length}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transactions List */}
                {selectedDrawer.transactions.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Cash Transactions</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {selectedDrawer.transactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-medium">{transaction.type}</div>
                              <div className="text-sm text-gray-600">
                                {transaction.reason}
                              </div>
                            </div>
                            <div
                              className={`text-lg font-bold ${
                                transaction.amount >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {transaction.amount >= 0 ? "+" : ""}
                              {formatCurrency(transaction.amount)}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(transaction.createdAt)} •{" "}
                            {transaction.createdByUsername}
                            {transaction.reference && ` • Ref: ${transaction.reference}`}
                          </div>
                          {transaction.notes && (
                            <div className="mt-2 text-sm text-gray-600 italic">
                              {transaction.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedDrawer.notes && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 mb-1">Notes</div>
                    <div className="text-sm text-gray-600 whitespace-pre-wrap">
                      {selectedDrawer.notes}
                    </div>
                  </div>
                )}

                {/* Session Info */}
                <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
                  <div>Opened: {formatDate(selectedDrawer.openedAt)}</div>
                  <div>Opened by: {selectedDrawer.openedByUsername}</div>
                  {selectedDrawer.closedAt && (
                    <>
                      <div>Closed: {formatDate(selectedDrawer.closedAt)}</div>
                      <div>Closed by: {selectedDrawer.closedByUsername}</div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
                Select a cash drawer session to view details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
