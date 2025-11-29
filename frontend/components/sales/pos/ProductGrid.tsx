/**
 * Product Grid Component
 * Display products in a responsive grid for POS
 */

'use client';

import { useState, useEffect } from 'react';
import { ProductDto } from '@/types/api.types';
import inventoryService from '@/services/inventory.service';

interface ProductGridProps {
  selectedCategoryId: string | null;
  searchQuery: string;
  onProductSelect: (product: ProductDto) => void;
}

export default function ProductGrid({
  selectedCategoryId,
  searchQuery,
  onProductSelect,
}: ProductGridProps) {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategoryId, searchQuery]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        isActive: true,
        pageSize: 100,
      };

      if (selectedCategoryId) {
        params.categoryId = selectedCategoryId;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await inventoryService.getProducts(params);
      setProducts(response.data || []);
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse"
          >
            <div className="aspect-square bg-gray-200 rounded-lg mb-3" />
            <div className="h-4 bg-gray-200 rounded mb-2" />
            <div className="h-6 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <span className="text-6xl">⚠️</span>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            Failed to load products
          </h3>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
          <button
            onClick={fetchProducts}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <span className="text-6xl">📦</span>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            No products found
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            {searchQuery
              ? `No products match "${searchQuery}"`
              : selectedCategoryId
              ? 'No products in this category'
              : 'No products available'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
      {products.map((product) => {
        const isOutOfStock = product.stockLevel <= 0;
        const isLowStock =
          product.stockLevel > 0 && product.stockLevel < product.minStockThreshold;

        return (
          <button
            key={product.id}
            onClick={() => !isOutOfStock && onProductSelect(product)}
            disabled={isOutOfStock}
            className={`group relative bg-white border-2 rounded-lg p-3 md:p-4 transition-all duration-200 touch-manipulation ${
              isOutOfStock
                ? 'border-gray-200 opacity-50 cursor-not-allowed'
                : 'border-gray-200 hover:border-blue-500 hover:shadow-lg active:scale-95 cursor-pointer'
            }`}
          >
            {/* Product Image */}
            <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden relative">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0].imagePath}
                  alt={product.nameEn}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl md:text-5xl">📦</span>
              )}

              {/* Stock Badge */}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                  <span className="px-3 py-1.5 bg-red-600 text-white text-sm font-bold rounded">
                    OUT OF STOCK
                  </span>
                </div>
              )}

              {isLowStock && (
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded shadow">
                    LOW
                  </span>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="text-left">
              <h4 className="font-semibold text-sm md:text-base text-gray-900 line-clamp-2 group-hover:text-blue-600 min-h-[2.5rem] mb-2">
                {product.nameEn}
              </h4>

              <div className="flex items-center justify-between mt-2">
                <div className="flex flex-col">
                  <span className="text-lg md:text-xl font-bold text-blue-600">
                    ${product.sellingPrice.toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-500">
                    Stock: {product.stockLevel}
                  </span>
                </div>

                {!isOutOfStock && (
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <span className="text-xl md:text-2xl font-bold">+</span>
                  </div>
                )}
              </div>

              {/* SKU */}
              <div className="mt-2 text-xs text-gray-500 truncate">
                SKU: {product.sku}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
