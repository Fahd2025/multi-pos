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
import { Button } from '@/components/shared/Button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import { EmptyState } from '@/components/shared/EmptyState';
import { Dialog } from '@/components/shared/Dialog';
import { ConfirmationDialog } from '@/components/modals/ConfirmationDialog';
import { useDialog } from '@/hooks/useDialog';
import { useConfirmation } from '@/hooks/useModal';

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

  // Dialog hooks
  const dialog = useDialog();
  const confirmation = useConfirmation();

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
    confirmation.ask(
      'Receive Purchase Order',
      `Mark purchase ${purchaseOrderNumber} as received? This will update inventory stock levels.`,
      async () => {
        try {
          await inventoryService.receivePurchase(id);
          loadData(); // Reload list
        } catch (err: any) {
          dialog.error(`Failed to receive purchase: ${err.message}`);
        }
      },
      'success'
    );
  };

  /**
   * Get payment status variant and label
   */
  const getPaymentStatus = (status: number, amountPaid: number, totalCost: number) => {
    if (status === 2 || amountPaid >= totalCost) {
      return { variant: 'success' as const, label: 'Paid' };
    } else if (amountPaid > 0) {
      return { variant: 'warning' as const, label: 'Partial' };
    } else {
      return { variant: 'danger' as const, label: 'Unpaid' };
    }
  };

  /**
   * Get received status variant and label
   */
  const getReceivedStatus = (receivedDate?: string) => {
    if (receivedDate) {
      return { variant: 'info' as const, label: 'Received' };
    } else {
      return { variant: 'neutral' as const, label: 'Pending' };
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
        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setSelectedPurchase(undefined);
            setIsPurchaseModalOpen(true);
          }}
        >
          ➕ New Purchase Order
        </Button>
      </div>

      {/* Error Message */}
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Purchases Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <LoadingSpinner size="lg" text="Loading purchases..." />
        ) : purchases.length === 0 ? (
          <EmptyState
            title="No purchase orders found"
            message="Start by creating your first purchase order to track inventory."
            action={
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsPurchaseModalOpen(true)}
              >
                Create Your First Purchase Order
              </Button>
            }
          />
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
                        {(() => {
                          const status = getPaymentStatus(purchase.paymentStatus, purchase.amountPaid, purchase.totalCost);
                          return <StatusBadge variant={status.variant}>{status.label}</StatusBadge>;
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {(() => {
                          const status = getReceivedStatus(purchase.receivedDate);
                          return <StatusBadge variant={status.variant}>{status.label}</StatusBadge>;
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          {!purchase.receivedDate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReceivePurchase(purchase.id, purchase.purchaseOrderNumber)}
                              title="Mark as Received"
                            >
                              ✓ Receive
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPurchase(purchase);
                              setIsPurchaseModalOpen(true);
                            }}
                            title="View Details"
                          >
                            👁️
                          </Button>
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
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    ← Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next →
                  </Button>
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

      {/* Alert Dialog */}
      <Dialog
        isOpen={dialog.isOpen}
        onClose={dialog.handleClose}
        onConfirm={dialog.showCancel ? undefined : dialog.handleClose}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
        showCancel={dialog.showCancel}
        isLoading={dialog.isProcessing}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmation.isOpen}
        onClose={confirmation.cancel}
        onConfirm={confirmation.confirm}
        title={confirmation.title}
        message={confirmation.message}
        variant={confirmation.variant}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        isProcessing={confirmation.isProcessing}
      />
    </div>
  );
}
