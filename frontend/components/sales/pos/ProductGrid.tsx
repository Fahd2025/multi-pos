/**
 * Product Grid Component
 * Display products in a responsive grid for POS
 */

'use client';

import { useState, useEffect } from 'react';
import { ProductDto } from '@/types/api.types';
import inventoryService from '@/services/inventory.service';
import { useAuth } from '@/hooks/useAuth';
import { buildProductImageUrl } from '@/lib/image-utils';

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
  const { branch } = useAuth();
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clickedProductId, setClickedProductId] = useState<string | null>(null);

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

  const handleProductClick = (product: ProductDto) => {
    if (product.stockLevel <= 0) return;

    // Trigger visual feedback
    setClickedProductId(product.id);
    setTimeout(() => setClickedProductId(null), 400);

    // Add to cart
    onProductSelect(product);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-8 gap-3 sm:gap-4 lg:gap-5">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 animate-pulse min-h-[180px] sm:min-h-[200px] lg:min-h-[240px]"
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
      <div className="flex items-center justify-center min-h-[50vh] px-4">
        <div className="text-center max-w-md">
          <span className="text-6xl sm:text-7xl lg:text-8xl">⚠️</span>
          <h3 className="mt-4 text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
            Failed to load products
          </h3>
          <p className="mt-2 text-sm sm:text-base text-gray-600">{error}</p>
          <button
            onClick={fetchProducts}
            className="
              mt-6
              px-6 py-3
              bg-blue-600 hover:bg-blue-700 active:bg-blue-800
              text-white
              rounded-xl
              font-medium text-base
              touch-manipulation
              active:scale-95
              transition-all
              min-w-touch-target min-h-touch-target
            "
            aria-label="Retry loading products"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] px-4">
        <div className="text-center max-w-md">
          <span className="text-6xl sm:text-7xl lg:text-8xl">📦</span>
          <h3 className="mt-4 text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
            No products found
          </h3>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
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
    <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-8 gap-3 sm:gap-4 lg:gap-5">
      {products.map((product) => {
        const isOutOfStock = product.stockLevel <= 0;
        const isLowStock =
          product.stockLevel > 0 && product.stockLevel < product.minStockThreshold;
        const isClicked = clickedProductId === product.id;

        return (
          <button
            key={product.id}
            onClick={() => handleProductClick(product)}
            disabled={isOutOfStock}
            className={`
              group relative bg-white
              border-2 rounded-xl
              p-3 sm:p-4 lg:p-5
              transition-all duration-200
              touch-manipulation
              min-h-[180px] sm:min-h-[200px] lg:min-h-[240px]

              // Focus styles for keyboard navigation
              focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2

              ${
                isOutOfStock
                  ? 'border-gray-200 opacity-50 cursor-not-allowed'
                  : 'border-gray-200 mouse:hover:border-blue-500 mouse:hover:shadow-lg active:scale-95 cursor-pointer'
              }
              ${isClicked ? 'animate-pulse-once' : ''}
            `}
            aria-label={`${product.nameEn}, Price: $${product.sellingPrice.toFixed(2)}, Stock: ${product.stockLevel} units${isOutOfStock ? ', Out of stock' : ''}`}
            aria-disabled={isOutOfStock}
          >
            {/* Product Image */}
            <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden relative">
              {product.images && product.images.length > 0 && branch ? (
                <img
                  src={buildProductImageUrl(
                    branch.branchCode,
                    product.images[0].imagePath,
                    product.id,
                    'thumb'
                  )}
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
              <h4 className="
                font-semibold
                text-sm sm:text-base lg:text-lg
                text-gray-900
                line-clamp-2
                mouse:group-hover:text-blue-600
                min-h-[2.5rem] sm:min-h-[3rem]
                mb-2
              ">
                {product.nameEn}
              </h4>

              <div className="flex items-center justify-between mt-2">
                <div className="flex flex-col">
                  <span className="
                    text-lg sm:text-xl lg:text-2xl
                    font-bold
                    text-blue-600
                  " aria-label={`Price: ${product.sellingPrice.toFixed(2)} dollars`}>
                    ${product.sellingPrice.toFixed(2)}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500" aria-label={`Stock: ${product.stockLevel} units`}>
                    Stock: {product.stockLevel}
                  </span>
                </div>

                {!isOutOfStock && (
                  <div className="
                    w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12
                    bg-blue-100 text-blue-600
                    rounded-full
                    flex items-center justify-center
                    mouse:group-hover:bg-blue-600
                    mouse:group-hover:text-white
                    transition-colors
                  " aria-hidden="true">
                    <span className="text-xl sm:text-2xl font-bold">+</span>
                  </div>
                )}
              </div>

              {/* SKU */}
              <div className="mt-2 text-xs sm:text-sm text-gray-500 truncate">
                <span className="sr-only">SKU: </span>
                <span aria-label={`SKU ${product.sku}`}>SKU: {product.sku}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
