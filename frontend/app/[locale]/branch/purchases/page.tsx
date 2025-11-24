/**
 * Purchases Management Page
 * Track purchase orders, suppliers, and inventory receiving
 */

'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import inventoryService from '@/services/inventory.service';
import { PurchaseDto, SupplierDto } from '@/types/api.types';
import PurchaseFormModal from '@/components/inventory/PurchaseFormModal';

export default function PurchasesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);

  const [purchases, setPurchases] = useState<PurchaseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  // Modal states
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseDto | undefined>(undefined);

  /**
   * Load purchases
   */
  useEffect(() => {
    loadData();
  }, [currentPage]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const purchasesResponse = await inventoryService.getPurchases(currentPage, pageSize);
      setPurchases(purchasesResponse.data || []);
      setTotalPages(purchasesResponse.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Failed to load purchases');
      console.error('Failed to load purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle receive purchase
   */
  const handleReceivePurchase = async (id: string, purchaseOrderNumber: string) => {
    if (!confirm(`Mark purchase ${purchaseOrderNumber} as received?`)) {
      return;
    }

    try {
      await inventoryService.receivePurchase(id);
      loadData(); // Reload list
    } catch (err: any) {
      alert(`Failed to receive purchase: ${err.message}`);
    }
  };

  /**
   * Get payment status badge
   */
  const getPaymentStatusBadge = (status: number, amountPaid: number, totalCost: number) => {
    if (status === 2 || amountPaid >= totalCost) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          Paid
        </span>
      );
    } else if (amountPaid > 0) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
          Partial
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          Unpaid
        </span>
      );
    }
  };

  /**
   * Get received status badge
   */
  const getReceivedStatusBadge = (receivedDate?: string) => {
    if (receivedDate) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          Received
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          Pending
        </span>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-sm text-gray-600 mt-1">
            Track and manage inventory purchases from suppliers
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedPurchase(undefined);
            setIsPurchaseModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          ➕ New Purchase Order
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          ⚠️ {error}
        </div>
      )}

      {/* Purchases Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading purchases...</span>
          </div>
        ) : purchases.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No purchase orders found</p>
            <button
              onClick={() => setIsPurchaseModalOpen(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Your First Purchase Order
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PO Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purchase Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Cost
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Received Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {purchase.purchaseOrderNumber}
                        </div>
                        {purchase.notes && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {purchase.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{purchase.supplierName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(purchase.purchaseDate).toLocaleDateString()}
                        </div>
                        {purchase.receivedDate && (
                          <div className="text-sm text-gray-500">
                            Received: {new Date(purchase.receivedDate).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          ${purchase.totalCost.toFixed(2)}
                        </div>
                        {purchase.amountPaid > 0 && (
                          <div className="text-xs text-gray-500">
                            Paid: ${purchase.amountPaid.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getPaymentStatusBadge(purchase.paymentStatus, purchase.amountPaid, purchase.totalCost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getReceivedStatusBadge(purchase.receivedDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          {!purchase.receivedDate && (
                            <button
                              onClick={() => handleReceivePurchase(purchase.id, purchase.purchaseOrderNumber)}
                              className="text-green-600 hover:text-green-900"
                              title="Mark as Received"
                            >
                              ✓ Receive
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedPurchase(purchase);
                              setIsPurchaseModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            👁️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Total Purchase Orders</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {purchases.length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Pending Receipt</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">
            {purchases.filter((p) => !p.receivedDate).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Received</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {purchases.filter((p) => p.receivedDate).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Total Value</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            ${purchases.reduce((sum, p) => sum + p.totalCost, 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Purchase Form Modal */}
      <PurchaseFormModal
        isOpen={isPurchaseModalOpen}
        onClose={() => {
          setIsPurchaseModalOpen(false);
          setSelectedPurchase(undefined);
        }}
        onSuccess={() => {
          loadData();
        }}
        purchase={selectedPurchase}
      />
    </div>
  );
}
