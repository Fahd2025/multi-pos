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
    if (!confirm('Are you sure you want to delete this customer?')) {
      return;
    }

    try {
      await customerService.deleteCustomer(id);
      router.push(`/${locale}/branch/customers`);
    } catch (err: any) {
      alert(err.message || 'Failed to delete customer');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Loading customer details...</div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'Customer not found'}
        </div>
        <Link href={`/${locale}/branch/customers`} className="text-blue-600 hover:underline mt-4 inline-block">
          ← Back to Customers
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
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Delete
          </button>
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
              <span className={`px-2 py-1 rounded text-xs ${customer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {customer.isActive ? 'Active' : 'Inactive'}
              </span>
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
          <div className="text-center py-8">Loading purchase history...</div>
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
                        ${sale.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {sale.paymentMethod === 0 ? 'Cash' : sale.paymentMethod === 1 ? 'Card' : 'Other'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {sale.isVoided ? (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Voided</span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-6 gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No purchase history found for this customer.
          </div>
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
    </div>
  );
}
