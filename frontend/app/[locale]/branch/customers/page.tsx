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

  const handleDelete = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) {
      return;
    }

    try {
      await customerService.deleteCustomer(customerId);
      loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete customer');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Customers</h1>
        <button
          onClick={() => {
            setSelectedCustomer(undefined);
            setIsModalOpen(true);
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Add Customer
        </button>
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
            <button
              onClick={handleSearch}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && <div className="text-center py-8">Loading customers...</div>}

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
                    <span className={`px-2 py-1 rounded text-xs ${customer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {customer.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleEdit(customer)}
                      className="text-blue-600 hover:underline mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(customer.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && customers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No customers found. Click "Add Customer" to create one.
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
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
    </div>
  );
}
