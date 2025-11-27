/**
 * Product Search Component
 * Search and select products for sale transactions
 */

'use client';

import { useState, useEffect } from 'react';
import { ProductDto } from '@/types/api.types';

interface ProductSearchProps {
  onProductSelect: (product: ProductDto) => void;
}

export default function ProductSearch({ onProductSelect }: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Mock products for demonstration
  // In production, this would fetch from the backend
  useEffect(() => {
    // Simulate API call
    const mockProducts: ProductDto[] = [
      {
        id: '1',
        sku: 'SKU001',
        nameEn: 'Wireless Mouse',
        nameAr: 'ماوس لاسلكي',
        descriptionEn: 'Ergonomic wireless mouse',
        descriptionAr: 'ماوس لاسلكي مريح',
        categoryId: 'cat1',
        categoryNameEn: 'Electronics',
        categoryNameAr: 'إلكترونيات',
        sellingPrice: 29.99,
        costPrice: 15.00,
        stockLevel: 50,
        minStockThreshold: 10,
        hasInventoryDiscrepancy: false,
        barcode: '123456789',
        isActive: true,
        images: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: '00000000-0000-0000-0000-000000000000',
      },
      {
        id: '2',
        sku: 'SKU002',
        nameEn: 'Mechanical Keyboard',
        nameAr: 'لوحة مفاتيح ميكانيكية',
        descriptionEn: 'RGB mechanical keyboard',
        descriptionAr: 'لوحة مفاتيح ميكانيكية RGB',
        categoryId: 'cat1',
        categoryNameEn: 'Electronics',
        categoryNameAr: 'إلكترونيات',
        sellingPrice: 89.99,
        costPrice: 45.00,
        stockLevel: 30,
        minStockThreshold: 5,
        hasInventoryDiscrepancy: false,
        barcode: '987654321',
        isActive: true,
        images: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: '00000000-0000-0000-0000-000000000000',
      },
      {
        id: '3',
        sku: 'SKU003',
        nameEn: 'USB Cable',
        nameAr: 'كابل USB',
        descriptionEn: 'USB-C charging cable',
        descriptionAr: 'كابل شحن USB-C',
        categoryId: 'cat2',
        categoryNameEn: 'Accessories',
        categoryNameAr: 'ملحقات',
        sellingPrice: 9.99,
        costPrice: 3.00,
        stockLevel: 100,
        minStockThreshold: 20,
        hasInventoryDiscrepancy: false,
        barcode: '555666777',
        isActive: true,
        images: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: '00000000-0000-0000-0000-000000000000',
      },
    ];

    setProducts(mockProducts);
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts([]);
      setShowResults(false);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = products.filter(
      (product) =>
        product.nameEn.toLowerCase().includes(query) ||
        product.nameAr?.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.barcode?.toLowerCase().includes(query)
    );

    setFilteredProducts(filtered);
    setShowResults(true);
  }, [searchQuery, products]);

  const handleProductSelect = (product: ProductDto) => {
    onProductSelect(product);
    setSearchQuery('');
    setShowResults(false);
  };

  const handleBarcodeInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Search by exact barcode match
      const product = products.find(
        (p) => p.barcode === searchQuery || p.sku === searchQuery
      );
      if (product) {
        handleProductSelect(product);
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
          />
          <span className="absolute right-3 top-3 text-gray-400">🔍</span>
        </div>
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {filteredProducts.length === 0 ? (
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
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      SKU: {product.sku} | Stock: {product.stockLevel} units
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-lg font-bold text-blue-600">
                      ${product.sellingPrice.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">{product.categoryName}</p>
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
