"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ReconciliationReport } from "@/types/cash-drawer.types";

export default function ReconciliationReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [report, setReport] = useState<ReconciliationReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5062'}/api/v1/cash-drawer/${id}/reconciliation`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch reconciliation report");
      }

      const result = await response.json();
      setReport(result.data);
    } catch (error) {
      console.error("Error fetching reconciliation report:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const printReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-gray-500">Loading reconciliation report...</div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-red-500">Failed to load reconciliation report</div>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const sessionDuration = report.closedAt
    ? Math.round(
        (new Date(report.closedAt).getTime() -
          new Date(report.openedAt).getTime()) /
          (1000 * 60)
      )
    : 0;

  const totalCashIn = report.openingBalance + report.totalCashSales + report.totalDeposits;
  const totalCashOut = report.totalWithdrawals + report.totalPettyCash;
  const calculatedExpected = totalCashIn - totalCashOut;

  return (
    <div >
      {/* Header */}
      <div className="mb-6 flex justify-between items-start print:mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cash Drawer Reconciliation Report</h1>
          <p className="text-gray-600">{report.branchName}</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button
            onClick={printReport}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Print Report
          </button>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Back
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div className="space-y-6">
        {/* Session Information */}
        <div className="bg-white rounded-lg shadow-md p-6 print:shadow-none print:border print:border-gray-300">
          <h2 className="text-xl font-bold mb-4">Session Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Opened At</div>
              <div className="font-semibold">{formatDate(report.openedAt)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Opened By</div>
              <div className="font-semibold">{report.openedByUsername}</div>
            </div>
            {report.closedAt && (
              <>
                <div>
                  <div className="text-sm text-gray-600">Closed At</div>
                  <div className="font-semibold">{formatDate(report.closedAt)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Closed By</div>
                  <div className="font-semibold">{report.closedByUsername}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Session Duration</div>
                  <div className="font-semibold">
                    {Math.floor(sessionDuration / 60)}h {sessionDuration % 60}m
                  </div>
                </div>
              </>
            )}
            <div>
              <div className="text-sm text-gray-600">Status</div>
              <div className={`font-semibold ${report.status === 'Open' ? 'text-green-600' : 'text-gray-600'}`}>
                {report.status}
              </div>
            </div>
          </div>
        </div>

        {/* Cash Flow Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 print:shadow-none print:border print:border-gray-300">
          <h2 className="text-xl font-bold mb-4">Cash Flow Summary</h2>

          {/* Cash In */}
          <div className="mb-6">
            <h3 className="font-semibold text-green-700 mb-3">Cash In</h3>
            <div className="space-y-2 pl-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Opening Balance</span>
                <span className="font-semibold">{formatCurrency(report.openingBalance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Cash Sales ({report.cashSalesCount} transactions)
                </span>
                <span className="font-semibold">{formatCurrency(report.totalCashSales)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Deposits</span>
                <span className="font-semibold">{formatCurrency(report.totalDeposits)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="font-semibold">Total Cash In</span>
                <span className="font-bold text-green-700">
                  {formatCurrency(totalCashIn)}
                </span>
              </div>
            </div>
          </div>

          {/* Cash Out */}
          <div className="mb-6">
            <h3 className="font-semibold text-red-700 mb-3">Cash Out</h3>
            <div className="space-y-2 pl-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Withdrawals</span>
                <span className="font-semibold">{formatCurrency(report.totalWithdrawals)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Petty Cash</span>
                <span className="font-semibold">{formatCurrency(report.totalPettyCash)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="font-semibold">Total Cash Out</span>
                <span className="font-bold text-red-700">
                  {formatCurrency(totalCashOut)}
                </span>
              </div>
            </div>
          </div>

          {/* Final Calculation */}
          <div className="pt-4 border-t-2 border-gray-300">
            <div className="space-y-3">
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Calculated Expected Cash</span>
                <span className="font-bold">{formatCurrency(calculatedExpected)}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="font-semibold">System Expected Cash</span>
                <span className="font-bold">{formatCurrency(report.expectedCash)}</span>
              </div>
              {report.actualCash !== undefined && (
                <>
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Actual Cash Count</span>
                    <span className="font-bold">{formatCurrency(report.actualCash)}</span>
                  </div>
                  <div className="flex justify-between text-xl pt-3 border-t-2 border-gray-300">
                    <span className="font-bold">Variance</span>
                    <span
                      className={`font-bold ${
                        report.variance === 0
                          ? "text-green-600"
                          : Math.abs(report.variance || 0) > 10
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {formatCurrency(report.variance || 0)}
                      {report.variance !== 0 && (
                        <span className="text-sm ml-2">
                          ({report.variance && report.variance > 0 ? "Over" : "Short"})
                        </span>
                      )}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Variance Warning */}
          {report.requiresManagerApproval && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <span className="text-xl">⚠️</span>
                <div>
                  <div className="font-semibold">Manager Approval Required</div>
                  <div className="text-sm">
                    Variance exceeds threshold - requires manager review
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Transactions Detail */}
        {report.transactions && report.transactions.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 print:shadow-none print:border print:border-gray-300 print:break-inside-avoid">
            <h2 className="text-xl font-bold mb-4">Cash Transactions ({report.transactions.length})</h2>
            <div className="space-y-2">
              {report.transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-3 bg-gray-50 rounded border border-gray-200"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium">{transaction.type}</div>
                      <div className="text-sm text-gray-600">{transaction.reason}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(transaction.createdAt)} • {transaction.createdByUsername}
                      </div>
                    </div>
                    <div
                      className={`text-lg font-bold ${
                        transaction.amount >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {transaction.amount >= 0 ? "+" : ""}
                      {formatCurrency(transaction.amount)}
                    </div>
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
        {report.notes && (
          <div className="bg-white rounded-lg shadow-md p-6 print:shadow-none print:border print:border-gray-300">
            <h2 className="text-xl font-bold mb-4">Notes</h2>
            <div className="whitespace-pre-wrap text-gray-700">{report.notes}</div>
          </div>
        )}

        {/* Footer */}
        <div className="text-sm text-gray-500 text-center print:mt-8">
          Report generated on {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
}
