/**
 * Inventory Management Page
 * Product list with search, filters, and CRUD operations
 */

'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import inventoryService from '@/services/inventory.service';
import { ProductDto, CategoryDto } from '@/types/api.types';
import Link from 'next/link';
import ProductFormModal from '@/components/inventory/ProductFormModal';
import StockAdjustmentModal from '@/components/inventory/StockAdjustmentModal';
import { Button } from '@/components/shared/Button';
import { StatusBadge, getStockStatusVariant } from '@/components/shared/StatusBadge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import { EmptyState } from '@/components/shared/EmptyState';
import { Dialog } from '@/components/shared/Dialog';
import { ConfirmationDialog } from '@/components/modals/ConfirmationDialog';
import { useDialog } from '@/hooks/useDialog';
import { useConfirmation } from '@/hooks/useModal';

export default function InventoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showOutOfStock, setShowOutOfStock] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductDto | undefined>(undefined);

  // Dialog hooks
  const dialog = useDialog();
  const confirmation = useConfirmation();

  /**
   * Load products and categories
   */
  useEffect(() => {
    loadData();
  }, [currentPage, selectedCategory, showLowStock, showOutOfStock]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load products with filters
      const productsResponse = await inventoryService.getProducts({
        page: currentPage,
        pageSize,
        search: searchTerm || undefined,
        categoryId: selectedCategory || undefined,
        lowStock: showLowStock || undefined,
        outOfStock: showOutOfStock || undefined,
      });

      setProducts(productsResponse.data);
      setTotalPages(productsResponse.pagination.totalPages);

      // Load categories (only once)
      if (categories.length === 0) {
        const categoriesData = await inventoryService.getCategories();
        setCategories(categoriesData);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory data');
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle search
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadData();
  };

  /**
   * Handle delete product
   */
  const handleDelete = async (id: string, name: string) => {
    confirmation.ask(
      'Delete Product',
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      async () => {
        try {
          await inventoryService.deleteProduct(id);
          loadData(); // Reload list
        } catch (err: any) {
          dialog.error(`Failed to delete product: ${err.message}`);
        }
      },
      'danger'
    );
  };

  /**
   * Get category name
   */
  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find((c) => c.id === categoryId);
    return category?.nameEn || 'Unknown';
  };

  /**
   * Get stock status label
   */
  const getStockLabel = (product: ProductDto) => {
    if (product.stockLevel <= 0) {
      return 'Out of Stock';
    } else if (product.stockLevel <= product.minStockThreshold) {
      return 'Low Stock';
    } else {
      return 'In Stock';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage products, categories, and stock levels
          </p>
        </div>
        <div className="flex gap-3">
          <Link href={`/${locale}/branch/inventory/categories`}>
            <Button variant="secondary" size="md">
              📁 Manage Categories
            </Button>
          </Link>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setSelectedProduct(undefined);
              setIsProductModalOpen(true);
            }}
          >
            ➕ Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search by name, code, barcode, or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Button type="submit" variant="primary" size="md">
              🔍 Search
            </Button>
          </div>

          {/* Filter Options */}
          <div className="flex flex-wrap gap-4">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nameEn}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showLowStock}
                onChange={(e) => {
                  setShowLowStock(e.target.checked);
                  setCurrentPage(1);
                }}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Low Stock Only</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOutOfStock}
                onChange={(e) => {
                  setShowOutOfStock(e.target.checked);
                  setCurrentPage(1);
                }}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Out of Stock Only</span>
            </label>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <LoadingSpinner size="lg" text="Loading products..." />
        ) : products.length === 0 ? (
          <EmptyState
            title="No products found"
            message="Start by adding your first product to the inventory."
            action={
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setSelectedProduct(undefined);
                  setIsProductModalOpen(true);
                }}
              >
                Add Your First Product
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
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code / SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {product.nameEn}
                            </div>
                            {product.nameAr && (
                              <div className="text-sm text-gray-500">{product.nameAr}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.sku}</div>
                        {product.barcode && (
                          <div className="text-sm text-gray-500">{product.barcode}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getCategoryName(product.categoryId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        ${product.sellingPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          {product.stockLevel}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">
                          / {product.minStockThreshold}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <StatusBadge variant={getStockStatusVariant(product.stockLevel, product.minStockThreshold)}>
                          {getStockLabel(product)}
                        </StatusBadge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setIsStockModalOpen(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="Adjust Stock"
                          >
                            📊
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setIsProductModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(product.id, product.nameEn)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            🗑️
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
          <div className="text-sm text-gray-600">Total Products</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {products.length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Low Stock Alerts</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">
            {products.filter((p) => p.stockLevel > 0 && p.stockLevel <= p.minStockThreshold).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Out of Stock</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {products.filter((p) => p.stockLevel <= 0).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Categories</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {categories.length}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setSelectedProduct(undefined);
        }}
        onSuccess={() => {
          loadData();
        }}
        product={selectedProduct}
        categories={categories}
      />

      <StockAdjustmentModal
        isOpen={isStockModalOpen}
        onClose={() => {
          setIsStockModalOpen(false);
          setSelectedProduct(undefined);
        }}
        onSuccess={() => {
          loadData();
        }}
        product={selectedProduct || null}
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
