/**
 * Sales Table Component
 * Display sales transactions with search, filters, and pagination
 * Uses generic DataTable with ExpansionTile for mobile-friendly view
 */

'use client';

import { useState, useEffect } from 'react';
import salesService, { GetSalesParams } from '@/services/sales.service';
import { SaleDto } from '@/types/api.types';
import { PaymentMethod, InvoiceType, getPaymentMethodName, getInvoiceTypeName } from '@/types/enums';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/data-table';
import { useDataTable } from '@/hooks/useDataTable';
import { DataTableColumn, DataTableAction } from '@/types/data-table.types';
import { StatusBadge } from '@/components/shared/StatusBadge';

interface SalesTableProps {
  onSaleSelect?: (sale: SaleDto) => void;
  refreshTrigger?: number;
}

export default function SalesTable({ onSaleSelect, refreshTrigger }: SalesTableProps) {
  const router = useRouter();
  const [sales, setSales] = useState<SaleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('');
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: GetSalesParams = {
        page: currentPage,
        pageSize,
        search: searchQuery || undefined,
        dateFrom: startDate || undefined,
        dateTo: endDate || undefined,
        paymentMethod: paymentMethodFilter ? parseInt(paymentMethodFilter) : undefined,
        invoiceType: invoiceTypeFilter ? parseInt(invoiceTypeFilter) : undefined,
        isVoided: statusFilter === 'voided' ? true : statusFilter === 'active' ? false : undefined,
      };

      const response = await salesService.getSales(params);
      setSales(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
    } catch (err: any) {
      console.error('Failed to fetch sales:', err);
      setError(err.message || 'Failed to load sales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [currentPage, refreshTrigger]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchSales();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setPaymentMethodFilter('');
    setInvoiceTypeFilter('');
    setStatusFilter('');
    setCurrentPage(1);
    fetchSales();
  };

  const handleRowClick = (sale: SaleDto) => {
    if (onSaleSelect) {
      onSaleSelect(sale);
    } else {
      router.push(`/branch/sales/${sale.id}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString();
  };

  // DataTable hook - convert 1-based page to 0-based for the hook
  const {
    paginationConfig,
    handlePageChange: handleDataTablePageChange,
  } = useDataTable(sales, {
    pageSize,
    sortable: false,
    pagination: true,
    serverSide: true,
    totalItems,
    currentPage: currentPage - 1, // Convert to 0-based
  });

  // Define table columns
  const columns: DataTableColumn<SaleDto>[] = [
    {
      key: 'transactionId',
      label: 'Transaction ID',
      sortable: false,
      render: (value, row) => (
        <div className="cursor-pointer" onClick={() => handleRowClick(row)}>
          <div className="text-sm font-medium text-blue-600 hover:underline">{value}</div>
          {row.invoiceNumber && (
            <div className="text-xs text-gray-500">{row.invoiceNumber}</div>
          )}
        </div>
      ),
    },
    {
      key: 'saleDate',
      label: 'Date',
      sortable: false,
      render: (value) => (
        <div>
          <div className="text-sm text-gray-900">{formatDate(value)}</div>
          <div className="text-xs text-gray-500">{formatTime(value)}</div>
        </div>
      ),
    },
    {
      key: 'customerName',
      label: 'Customer',
      sortable: false,
      render: (value) => (
        <div className="text-sm text-gray-900">{value || 'Walk-in'}</div>
      ),
    },
    {
      key: 'total',
      label: 'Total',
      sortable: false,
      render: (value, row) => (
        <div>
          <div className="text-sm font-semibold text-gray-900">
            ${value.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500">Tax: ${row.taxAmount.toFixed(2)}</div>
        </div>
      ),
    },
    {
      key: 'paymentMethod',
      label: 'Payment',
      sortable: false,
      render: (value) => (
        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
          {getPaymentMethodName(value)}
        </span>
      ),
    },
    {
      key: 'invoiceType',
      label: 'Type',
      sortable: false,
      render: (value) => (
        <span className="text-sm text-gray-600">{getInvoiceTypeName(value)}</span>
      ),
    },
    {
      key: 'isVoided',
      label: 'Status',
      sortable: false,
      render: (value) =>
        value ? (
          <StatusBadge variant="danger">Voided</StatusBadge>
        ) : (
          <StatusBadge variant="success">Active</StatusBadge>
        ),
    },
  ];

  // Define row actions
  const actions: DataTableAction<SaleDto>[] = [
    {
      label: 'View Details',
      onClick: (row) => handleRowClick(row),
      variant: 'primary',
    },
  ];

  // Handle page change (convert from 0-based to 1-based)
  const handlePageChange = (page: number) => {
    setCurrentPage(page + 1); // Convert back to 1-based
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Filters Section */}
      <div className="p-4 md:p-6 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Search & Filter</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Transaction ID, invoice number, customer..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Search
              </button>
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Methods</option>
              <option value={PaymentMethod.Cash}>Cash</option>
              <option value={PaymentMethod.Card}>Card</option>
              <option value={PaymentMethod.DigitalWallet}>Digital Wallet</option>
              <option value={PaymentMethod.BankTransfer}>Bank Transfer</option>
              <option value={PaymentMethod.Check}>Check</option>
            </select>
          </div>

          {/* Invoice Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invoice Type
            </label>
            <select
              value={invoiceTypeFilter}
              onChange={(e) => setInvoiceTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value={InvoiceType.Touch}>Touch Invoice</option>
              <option value={InvoiceType.Standard}>Standard Invoice</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="voided">Voided</option>
            </select>
          </div>

          {/* Filter Actions */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 flex justify-end gap-2">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="px-4 md:px-6 py-3 bg-gray-50 border-b border-gray-200">
        <p className="text-sm text-gray-600">
          Showing {sales.length} of {totalItems} transactions
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-12 text-center">
          <span className="text-4xl">⚠️</span>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Failed to load sales</h3>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
          <button
            onClick={fetchSales}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      )}

      {/* DataTable with ExpansionTile for mobile */}
      {!error && (
        <DataTable
          data={sales}
          columns={columns}
          actions={actions}
          getRowKey={(row) => row.id}
          loading={loading}
          pagination
          paginationConfig={paginationConfig}
          onPageChange={handlePageChange}
          emptyMessage="No sales found. Try adjusting your filters or search criteria."
          showRowNumbers
        />
      )}
    </div>
  );
}
