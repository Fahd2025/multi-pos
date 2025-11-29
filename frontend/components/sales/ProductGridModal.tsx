/**
 * Product Grid Modal Component
 * Display products in a responsive grid for easy selection
 */

'use client';

import { useState, useEffect } from 'react';
import { ProductDto } from '@/types/api.types';
import inventoryService from '@/services/inventory.service';

interface ProductGridModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductSelect: (product: ProductDto) => void;
}

export default function ProductGridModal({
  isOpen,
  onClose,
  onProductSelect,
}: ProductGridModalProps) {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      fetchCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, selectedCategory, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await inventoryService.getProducts({
        isActive: true,
        pageSize: 100,
      });

      setProducts(response.data || []);
      setFilteredProducts(response.data || []);
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await inventoryService.getCategories();
      const categoryList = response.data || [];
      setCategories(
        categoryList.map((cat: any) => ({
          id: cat.id,
          name: cat.nameEn,
        }))
      );
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.nameEn.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          (p.barcode && p.barcode.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((p) => p.categoryId === selectedCategory);
    }

    setFilteredProducts(filtered);
  };

  const handleProductClick = (product: ProductDto) => {
    onProductSelect(product);
    setSearchQuery('');
    // Don't close modal - allow multiple selections
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                Select Products
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Tap on products to add them to your sale
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              ×
            </button>
          </div>

          {/* Search and Filter */}
          <div className="p-4 md:p-6 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, SKU, or barcode..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-2 text-sm text-gray-600">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
                  <p className="mt-4 text-gray-600">Loading products...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <span className="text-6xl">⚠️</span>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">
                    Failed to load products
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">{error}</p>
                  <button
                    onClick={fetchProducts}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <span className="text-6xl">📦</span>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">
                    No products found
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Try adjusting your search or category filter
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    className="group bg-white border-2 border-gray-200 rounded-lg p-3 md:p-4 hover:border-blue-500 hover:shadow-lg transition-all duration-200 touch-manipulation active:scale-95"
                  >
                    {/* Product Image Placeholder */}
                    <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                      {product.imageUrls && product.imageUrls.length > 0 ? (
                        <img
                          src={product.imageUrls[0]}
                          alt={product.nameEn}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl md:text-5xl">📦</span>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="text-left">
                      <h4 className="font-semibold text-sm md:text-base text-gray-900 line-clamp-2 group-hover:text-blue-600 min-h-[2.5rem]">
                        {product.nameEn}
                      </h4>

                      <p className="text-xs text-gray-500 mt-1">
                        SKU: {product.sku}
                      </p>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-lg md:text-xl font-bold text-blue-600">
                          ${product.sellingPrice.toFixed(2)}
                        </span>

                        {product.stockLevel <= 0 ? (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-800 rounded">
                            Out
                          </span>
                        ) : product.stockLevel < product.minStockThreshold ? (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded">
                            Low
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-800 rounded">
                            {product.stockLevel}
                          </span>
                        )}
                      </div>

                      {/* Category Badge */}
                      {product.categoryNameEn && (
                        <div className="mt-2">
                          <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            {product.categoryNameEn}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 md:p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
