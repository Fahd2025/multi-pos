/**
 * Customer Management Page
 * Customer list with search, filters, and CRUD operations
 */

'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import customerService from '@/services/customer.service';
import { CustomerDto } from '@/types/api.types';
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

export default function CustomersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);

  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDto | undefined>(undefined);

  // Dialog hooks
  const dialog = useDialog();
  const confirmation = useConfirmation();

  /**
   * Load customers
   */
  useEffect(() => {
    loadCustomers();
  }, [currentPage, showActiveOnly]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await customerService.getCustomers({
        page: currentPage,
        pageSize,
        search: searchTerm || undefined,
        isActive: showActiveOnly ? true : undefined,
      });

      setCustomers(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to load customers');
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadCustomers();
  };

  const handleEdit = (customer: CustomerDto) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleDelete = async (customer: CustomerDto) => {
    confirmation.ask(
      'Delete Customer',
      `Are you sure you want to delete "${customer.nameEn}"? This action cannot be undone.`,
      async () => {
        try {
          await customerService.deleteCustomer(customer.id);
          loadCustomers();
        } catch (err: any) {
          dialog.error(`Failed to delete customer: ${err.message}`);
        }
      },
      'danger'
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Customers</h1>
        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setSelectedCustomer(undefined);
            setIsModalOpen(true);
          }}
        >
          + Add Customer
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search by name, code, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="mr-2"
              />
              Show Active Only
            </label>
          </div>
          <div>
            <Button variant="secondary" size="md" onClick={handleSearch}>
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Loading State */}
      {loading && <LoadingSpinner size="lg" text="Loading customers..." />}

      {/* Customers Table */}
      {!loading && customers.length > 0 && (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Purchases</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visit Count</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loyalty Points</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{customer.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link href={`/${locale}/branch/customers/${customer.id}`} className="text-blue-600 hover:underline">
                      {customer.nameEn}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{customer.email || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{customer.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">${customer.totalPurchases.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{customer.visitCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{customer.loyaltyPoints}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <StatusBadge variant={customer.isActive ? 'success' : 'danger'}>
                      {customer.isActive ? 'Active' : 'Inactive'}
                    </StatusBadge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(customer)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(customer)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && customers.length === 0 && (
        <EmptyState
          title="No customers found"
          message="Start by adding your first customer."
          action={
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setSelectedCustomer(undefined);
                setIsModalOpen(true);
              }}
            >
              Add Your First Customer
            </Button>
          }
        />
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
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

      {/* Customer Form Modal */}
      <CustomerFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCustomer(undefined);
        }}
        onSuccess={loadCustomers}
        customer={selectedCustomer}
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
