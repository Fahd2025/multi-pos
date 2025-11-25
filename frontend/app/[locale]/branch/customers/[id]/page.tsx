/**
 * Customer Details Page
 * Shows customer profile, statistics, and purchase history
 */

'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import customerService from '@/services/customer.service';
import { CustomerDto, SaleDto } from '@/types/api.types';
import Link from 'next/link';
import CustomerFormModal from '@/components/customers/CustomerFormModal';
import { Button } from '@/components/shared/Button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import { EmptyState } from '@/components/shared/EmptyState';
import { Dialog } from '@/components/shared/Dialog';
import { ConfirmationDialog } from '@/components/modals/ConfirmationDialog';
import { useDialog } from '@/hooks/useDialog';
import { useConfirmation } from '@/hooks/useModal';

export default function CustomerDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = use(params);
  const router = useRouter();

  const [customer, setCustomer] = useState<CustomerDto | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<SaleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination for purchase history
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Dialog hooks
  const dialog = useDialog();
  const confirmation = useConfirmation();

  /**
   * Load customer details
   */
  useEffect(() => {
    loadCustomer();
  }, [id]);

  /**
   * Load purchase history
   */
  useEffect(() => {
    loadPurchaseHistory();
  }, [id, currentPage]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customerService.getCustomerById(id);
      setCustomer(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load customer details');
      console.error('Error loading customer:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPurchaseHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await customerService.getCustomerPurchaseHistory(id, {
        page: currentPage,
        pageSize,
      });
      setPurchaseHistory(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (err: any) {
      console.error('Error loading purchase history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!customer) return;

    confirmation.ask(
      'Delete Customer',
      `Are you sure you want to delete "${customer.nameEn}"? This action cannot be undone.`,
      async () => {
        try {
          await customerService.deleteCustomer(id);
          router.push(`/${locale}/branch/customers`);
        } catch (err: any) {
          dialog.error(`Failed to delete customer: ${err.message}`);
        }
      },
      'danger'
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingSpinner size="lg" text="Loading customer details..." />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="container mx-auto p-6">
        <ErrorAlert message={error || 'Customer not found'} />
        <Link href={`/${locale}/branch/customers`}>
          <Button variant="secondary" size="md" className="mt-4">
            ← Back to Customers
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href={`/${locale}/branch/customers`} className="text-blue-600 hover:underline mb-2 inline-block">
            ← Back to Customers
          </Link>
          <h1 className="text-3xl font-bold">{customer.nameEn}</h1>
          {customer.nameAr && <p className="text-gray-600" dir="rtl">{customer.nameAr}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="primary" size="md" onClick={() => setIsEditModalOpen(true)}>
            Edit
          </Button>
          <Button variant="danger" size="md" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      {/* Customer Profile Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Profile Information */}
        <div className="md:col-span-2 bg-white rounded shadow p-6">
          <h2 className="text-xl font-bold mb-4">Profile Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Customer Code</p>
              <p className="font-medium">{customer.code}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <StatusBadge variant={customer.isActive ? 'success' : 'danger'}>
                {customer.isActive ? 'Active' : 'Inactive'}
              </StatusBadge>
            </div>
            {customer.email && (
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{customer.email}</p>
              </div>
            )}
            {customer.phone && (
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{customer.phone}</p>
              </div>
            )}
            {customer.addressEn && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Address (English)</p>
                <p className="font-medium">{customer.addressEn}</p>
              </div>
            )}
            {customer.addressAr && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Address (Arabic)</p>
                <p className="font-medium" dir="rtl">{customer.addressAr}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Created At</p>
              <p className="font-medium">{new Date(customer.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="font-medium">{new Date(customer.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Statistics Card */}
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-xl font-bold mb-4">Customer Statistics</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Total Purchases</p>
              <p className="text-2xl font-bold text-green-600">${customer.totalPurchases.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Visit Count</p>
              <p className="text-2xl font-bold text-blue-600">{customer.visitCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Loyalty Points</p>
              <p className="text-2xl font-bold text-purple-600">{customer.loyaltyPoints}</p>
            </div>
            {customer.lastVisitAt && (
              <div>
                <p className="text-sm text-gray-600">Last Visit</p>
                <p className="font-medium">{new Date(customer.lastVisitAt).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Purchase History */}
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-bold mb-4">Purchase History</h2>

        {historyLoading ? (
          <LoadingSpinner size="md" text="Loading purchase history..." />
        ) : purchaseHistory.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchaseHistory.map((sale) => (
                    <tr key={sale.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(sale.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/${locale}/branch/sales/${sale.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {sale.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {sale.lineItems?.length || 0} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        ${sale.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {sale.paymentMethod === 0 ? 'Cash' : sale.paymentMethod === 1 ? 'Card' : 'Other'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <StatusBadge variant={sale.isVoided ? 'danger' : 'success'}>
                          {sale.isVoided ? 'Voided' : 'Completed'}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-6 gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-4 py-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title="No purchase history"
            message="This customer has not made any purchases yet."
          />
        )}
      </div>

      {/* Edit Modal */}
      <CustomerFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          loadCustomer();
          setIsEditModalOpen(false);
        }}
        customer={customer}
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
