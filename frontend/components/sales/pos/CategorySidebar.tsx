/**
 * Category Sidebar Component
 * Display categories for filtering products in POS
 */

'use client';

import { useState, useEffect } from 'react';
import inventoryService from '@/services/inventory.service';
import { useAuth } from '@/hooks/useAuth';
import { buildCategoryImageUrl } from '@/lib/image-utils';

interface Category {
  id: string;
  nameEn: string;
  nameAr: string;
  description?: string;
  productsCount?: number;
  imagePath?: string;
}

interface CategorySidebarProps {
  selectedCategoryId: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  isHorizontal?: boolean;
}

export default function CategorySidebar({
  selectedCategoryId,
  onCategorySelect,
  isHorizontal = false,
}: CategorySidebarProps) {
  const { branch } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await inventoryService.getCategories();
      setCategories(response.data || []);
    } catch (err: any) {
      console.error('Failed to fetch categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`${isHorizontal ? 'flex gap-2 overflow-x-auto pb-2' : 'space-y-2'}`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`bg-gray-200 rounded-lg animate-pulse ${
              isHorizontal ? 'h-12 min-w-[120px]' : 'h-16 w-full'
            }`}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800">{error}</p>
        <button
          onClick={fetchCategories}
          className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  const allCategoriesButton = (
    <button
      onClick={() => onCategorySelect(null)}
      className={`w-full text-left rounded-xl font-medium transition-all touch-manipulation active:scale-95 min-h-[64px] ${
        selectedCategoryId === null
          ? 'bg-blue-600 text-white shadow-md'
          : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-200'
      } ${isHorizontal ? 'px-5 py-3 min-w-[160px] text-center' : 'px-4 py-3'}`}
    >
      <div className={`flex items-center gap-3 ${isHorizontal ? 'justify-center' : ''}`}>
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-2xl">📦</span>
        </div>
        {!isHorizontal && (
          <div className="flex-1">
            <span className="font-semibold text-base">All Products</span>
            <div className="text-xs mt-0.5 opacity-75">
              View all items
            </div>
          </div>
        )}
        {isHorizontal && <span className="text-base">All Products</span>}
      </div>
    </button>
  );

  const categoryButtons = categories.map((category) => {
    const isSelected = selectedCategoryId === category.id;

    return (
      <button
        key={category.id}
        onClick={() => onCategorySelect(category.id)}
        className={`w-full text-left rounded-xl font-medium transition-all touch-manipulation active:scale-95 min-h-[64px] ${
          isSelected
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-200'
        } ${isHorizontal ? 'px-5 py-3 min-w-[160px] text-center' : 'px-4 py-3'}`}
      >
        <div className={`flex items-center gap-3 ${isHorizontal ? 'justify-center' : ''}`}>
          {/* Category Image */}
          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm">
            {category.imagePath && branch ? (
              <img
                src={buildCategoryImageUrl(
                  branch.branchCode,
                  category.imagePath,
                  category.id,
                  'thumb'
                )}
                alt={category.nameEn}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl">🏷️</span>
            )}
          </div>

          {!isHorizontal && (
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-base truncate block">{category.nameEn}</span>
              {category.productsCount !== undefined && (
                <div className="text-xs mt-0.5 opacity-75">
                  {category.productsCount} items
                </div>
              )}
            </div>
          )}

          {isHorizontal && <span className="text-base truncate">{category.nameEn}</span>}
        </div>
      </button>
    );
  });

  if (isHorizontal) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {allCategoriesButton}
        {categoryButtons}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="sticky top-0 bg-gray-50 py-3 px-4 border-b border-gray-200 mb-2">
        <h2 className="text-lg font-bold text-gray-900">Categories</h2>
        <p className="text-xs text-gray-600 mt-1">Filter products by category</p>
      </div>
      <div className="px-2 space-y-2">
        {allCategoriesButton}
        {categoryButtons}
      </div>
    </div>
  );
}
