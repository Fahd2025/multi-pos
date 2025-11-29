/**
 * Product Search Component
 * Search and select products for sale transactions
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProductDto } from '@/types/api.types';
import inventoryService from '@/services/inventory.service';

interface ProductSearchProps {
  onProductSelect: (product: ProductDto) => void;
}

export default function ProductSearch({ onProductSelect }: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch products from the backend
  const fetchProducts = useCallback(async (search?: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await inventoryService.getProducts({
        search: search,
        isActive: true,
        pageSize: 100, // Get enough products for search
      });

      // Ensure we always have an array (handle undefined/null responses)
      const items = response?.items || [];
      setProducts(items);

      // If searching, show results immediately
      if (search && search.trim() !== '') {
        setFilteredProducts(items);
        setShowResults(true);
      }
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      setError('Failed to load products. Please try again.');
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial products
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Search products when query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts([]);
      setShowResults(false);
      return;
    }

    // Debounce search - fetch from backend after delay
    const timeoutId = setTimeout(() => {
      fetchProducts(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, fetchProducts]);

  const handleProductSelect = (product: ProductDto) => {
    onProductSelect(product);
    setSearchQuery('');
    setShowResults(false);
  };

  const handleBarcodeInput = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Search by exact barcode or SKU match
      const product = products.find(
        (p) => p.barcode === searchQuery || p.sku === searchQuery
      );

      if (product) {
        handleProductSelect(product);
      } else {
        // Try to fetch from backend if not in local list
        try {
          setLoading(true);
          const response = await inventoryService.getProducts({
            search: searchQuery,
            isActive: true,
            pageSize: 1,
          });

          const items = response?.items || [];
          if (items.length > 0) {
            handleProductSelect(items[0]);
          }
        } catch (err) {
          console.error('Product not found:', err);
        } finally {
          setLoading(false);
        }
      }
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleBarcodeInput}
            placeholder="Search by name, SKU, or barcode..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            autoFocus
            disabled={loading}
          />
          <span className="absolute right-3 top-3 text-gray-400">
            {loading ? '⏳' : '🔍'}
          </span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-pulse">Searching products...</div>
            </div>
          ) : !filteredProducts || filteredProducts.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No products found for "{searchQuery}"
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className="w-full p-4 text-left hover:bg-blue-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">
                        {product.nameEn}
                      </h4>
                      {product.stockLevel < product.minStockThreshold && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                          Low Stock
                        </span>
                      )}
                      {product.hasInventoryDiscrepancy && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded">
                          Discrepancy
                        </span>
                      )}
                      {product.stockLevel === 0 && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded">
                          Out of Stock
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      SKU: {product.sku} | Stock: {product.stockLevel} units
                      {product.barcode && ` | Barcode: ${product.barcode}`}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-lg font-bold text-blue-600">
                      ${product.sellingPrice.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">{product.categoryNameEn}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Access Hint */}
      <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
        <span>💡 Tip:</span>
        <span>Type product name, SKU, or scan barcode and press Enter</span>
      </div>
    </div>
  );
}
