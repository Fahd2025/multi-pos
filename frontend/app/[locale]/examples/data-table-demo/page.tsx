/**
 * DataTable Demo Page
 *
 * This page demonstrates the complete integration of all generic components:
 * - DataTable with pagination, sorting, and filtering
 * - ModalBottomSheet for creating and editing
 * - FeaturedDialog for viewing details
 * - ConfirmationDialog for delete confirmations
 *
 * This example uses a Product data type, but the same pattern works for any data type.
 */

'use client';

import React, { useState } from 'react';
import { DataTable } from '@/components/data-table';
import { ModalBottomSheet, FeaturedDialog, ConfirmationDialog } from '@/components/modals';
import { useDataTable } from '@/hooks/useDataTable';
import { useModal, useConfirmation } from '@/hooks/useModal';
import { DataTableColumn, DataTableAction, FormField, DisplayField } from '@/types/data-table.types';

// Sample data type
interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive';
  description: string;
  createdAt: string;
}

// Sample data
const SAMPLE_PRODUCTS: Product[] = [
  { id: 1, name: 'Laptop Pro 15"', category: 'Electronics', price: 1299.99, stock: 45, status: 'active', description: 'High-performance laptop with 16GB RAM', createdAt: '2024-01-15' },
  { id: 2, name: 'Wireless Mouse', category: 'Accessories', price: 29.99, stock: 120, status: 'active', description: 'Ergonomic wireless mouse', createdAt: '2024-01-16' },
  { id: 3, name: 'USB-C Cable', category: 'Accessories', price: 12.99, stock: 200, status: 'active', description: '6ft USB-C charging cable', createdAt: '2024-01-17' },
  { id: 4, name: 'Mechanical Keyboard', category: 'Accessories', price: 89.99, stock: 30, status: 'active', description: 'RGB mechanical keyboard', createdAt: '2024-01-18' },
  { id: 5, name: 'Monitor 27"', category: 'Electronics', price: 349.99, stock: 15, status: 'active', description: '4K UHD monitor', createdAt: '2024-01-19' },
  { id: 6, name: 'Webcam HD', category: 'Electronics', price: 79.99, stock: 50, status: 'active', description: '1080p HD webcam', createdAt: '2024-01-20' },
  { id: 7, name: 'Desk Lamp', category: 'Office', price: 34.99, stock: 80, status: 'active', description: 'LED desk lamp with adjustable brightness', createdAt: '2024-01-21' },
  { id: 8, name: 'Office Chair', category: 'Furniture', price: 249.99, stock: 25, status: 'active', description: 'Ergonomic office chair', createdAt: '2024-01-22' },
  { id: 9, name: 'Standing Desk', category: 'Furniture', price: 499.99, stock: 10, status: 'active', description: 'Adjustable standing desk', createdAt: '2024-01-23' },
  { id: 10, name: 'Notebook Set', category: 'Office', price: 15.99, stock: 150, status: 'active', description: 'Set of 3 notebooks', createdAt: '2024-01-24' },
  { id: 11, name: 'Pen Pack', category: 'Office', price: 8.99, stock: 300, status: 'inactive', description: 'Pack of 10 pens', createdAt: '2024-01-25' },
  { id: 12, name: 'Smartphone Case', category: 'Accessories', price: 19.99, stock: 90, status: 'active', description: 'Protective phone case', createdAt: '2024-01-26' },
];

export default function DataTableDemoPage() {
  const [products, setProducts] = useState<Product[]>(SAMPLE_PRODUCTS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize hooks
  const {
    data: displayData,
    paginationConfig,
    sortConfig,
    handlePageChange,
    handlePageSizeChange,
    handleSort
  } = useDataTable(products, {
    pageSize: 5,
    sortable: true,
    pagination: true
  });

  const createEditModal = useModal<Product>();
  const viewModal = useModal<Product>();
  const confirmation = useConfirmation();

  // Adapter for sort change to match DataTable's expected signature
  const handleSortChange = (config: { key: keyof Product | string; direction: 'asc' | 'desc' }) => {
    handleSort(config.key);
  };

  // Define table columns
  const columns: DataTableColumn<Product>[] = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      width: '80px'
    },
    {
      key: 'name',
      label: 'Product Name',
      sortable: true,
      render: (value, row) => (
        <div className="font-medium text-gray-900">{value}</div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (value) => (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          {value}
        </span>
      )
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (value) => (
        <span className="font-semibold text-gray-900">${value.toFixed(2)}</span>
      )
    },
    {
      key: 'stock',
      label: 'Stock',
      sortable: true,
      render: (value) => {
        const color = value > 50 ? 'text-green-600' : value > 20 ? 'text-yellow-600' : 'text-red-600';
        return <span className={`font-medium ${color}`}>{value}</span>;
      }
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => {
        const statusColors: Record<string, string> = {
          active: 'bg-green-100 text-green-800',
          inactive: 'bg-gray-100 text-gray-800'
        };
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[value]}`}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        );
      }
    }
  ];

  // Define row actions
  const actions: DataTableAction<Product>[] = [
    {
      label: 'View',
      onClick: (row) => viewModal.open(row, 'view'),
      variant: 'secondary'
    },
    {
      label: 'Edit',
      onClick: (row) => createEditModal.open(row, 'edit'),
      variant: 'primary'
    },
    {
      label: 'Delete',
      onClick: (row) => handleDeleteClick(row),
      variant: 'danger'
    }
  ];

  // Define form fields for create/edit modal
  const formFields: FormField<Product>[] = [
    {
      name: 'name',
      label: 'Product Name',
      type: 'text',
      placeholder: 'Enter product name',
      required: true,
      validation: {
        minLength: 3,
        maxLength: 100
      }
    },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      required: true,
      options: [
        { label: 'Electronics', value: 'Electronics' },
        { label: 'Accessories', value: 'Accessories' },
        { label: 'Office', value: 'Office' },
        { label: 'Furniture', value: 'Furniture' }
      ]
    },
    {
      name: 'price',
      label: 'Price',
      type: 'number',
      placeholder: '0.00',
      required: true,
      validation: {
        min: 0.01,
        custom: (value) => {
          if (value && value > 10000) {
            return 'Price cannot exceed $10,000';
          }
          return null;
        }
      }
    },
    {
      name: 'stock',
      label: 'Stock Quantity',
      type: 'number',
      placeholder: '0',
      required: true,
      validation: {
        min: 0
      }
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' }
      ]
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Enter product description',
      validation: {
        maxLength: 500
      }
    }
  ];

  // Define display fields for view dialog
  const displayFields: DisplayField<Product>[] = [
    { key: 'id', label: 'Product ID' },
    { key: 'name', label: 'Product Name' },
    {
      key: 'category',
      label: 'Category',
      render: (value) => (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          {value}
        </span>
      )
    },
    {
      key: 'price',
      label: 'Price',
      render: (value) => `$${value.toFixed(2)}`
    },
    { key: 'stock', label: 'Stock Quantity' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      )
    },
    { key: 'description', label: 'Description' },
    {
      key: 'createdAt',
      label: 'Created Date',
      render: (value) => new Date(value).toLocaleDateString()
    }
  ];

  // Handlers
  const handleCreate = () => {
    createEditModal.open(undefined, 'create');
  };

  const handleSubmit = async (data: Product) => {
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (createEditModal.mode === 'create') {
      // Create new product
      const newProduct: Product = {
        ...data,
        id: Math.max(...products.map(p => p.id)) + 1,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setProducts([...products, newProduct]);
    } else {
      // Update existing product
      setProducts(products.map(p => p.id === data.id ? data : p));
    }

    setIsSubmitting(false);
    createEditModal.close();
  };

  const handleDeleteClick = (product: Product) => {
    confirmation.ask(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
      async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProducts(products.filter(p => p.id !== product.id));
      },
      'danger'
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Generic Data Table Demo
          </h1>
          <p className="text-gray-600">
            A complete example showing DataTable with modals, filtering, sorting, and pagination.
          </p>
        </div>

        {/* Actions Bar */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              Manage products with full CRUD operations
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
        </div>

        {/* DataTable */}
        <DataTable
          data={displayData}
          columns={columns}
          actions={actions}
          getRowKey={(row) => row.id}
          pagination
          paginationConfig={paginationConfig}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          sortable
          sortConfig={sortConfig ?? undefined}
          onSortChange={handleSortChange}
          emptyMessage="No products found. Click 'Add Product' to create one."
        />

        {/* Statistics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Total Products</p>
            <p className="text-2xl font-bold text-gray-900">{products.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Active Products</p>
            <p className="text-2xl font-bold text-green-600">
              {products.filter(p => p.status === 'active').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Total Stock</p>
            <p className="text-2xl font-bold text-blue-600">
              {products.reduce((sum, p) => sum + p.stock, 0)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-2xl font-bold text-purple-600">
              ${products.reduce((sum, p) => sum + (p.price * p.stock), 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Implementation Notes */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Implementation Notes</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>All components are fully typed with TypeScript generics</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Custom hooks (useDataTable, useModal, useConfirmation) manage state efficiently</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Dynamic form generation with built-in validation in ModalBottomSheet</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Full accessibility support with ARIA attributes and keyboard navigation</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Responsive design using Tailwind CSS v4</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Modals */}
      <ModalBottomSheet
        isOpen={createEditModal.isOpen}
        onClose={createEditModal.close}
        title={createEditModal.mode === 'create' ? 'Create New Product' : 'Edit Product'}
        mode={createEditModal.mode as 'create' | 'edit'}
        initialData={createEditModal.data || undefined}
        fields={formFields}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        size="lg"
      />

      <FeaturedDialog
        isOpen={viewModal.isOpen}
        onClose={viewModal.close}
        title="Product Details"
        data={viewModal.data || {} as Product}
        fields={displayFields}
        actions={[
          {
            label: 'Edit',
            onClick: (data) => {
              viewModal.close();
              createEditModal.open(data, 'edit');
            },
            variant: 'primary'
          },
          {
            label: 'Delete',
            onClick: (data) => {
              viewModal.close();
              handleDeleteClick(data);
            },
            variant: 'danger'
          }
        ]}
        size="lg"
      />

      <ConfirmationDialog
        isOpen={confirmation.isOpen}
        onClose={confirmation.cancel}
        title={confirmation.title}
        message={confirmation.message}
        variant={confirmation.variant}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmation.confirm}
        isProcessing={confirmation.isProcessing}
      />
    </div>
  );
}
