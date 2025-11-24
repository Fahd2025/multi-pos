/**
 * Categories Management Page
 * Manage product categories with hierarchical structure
 */

'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import Link from 'next/link';
import inventoryService from '@/services/inventory.service';
import { CategoryDto } from '@/types/api.types';
import CategoryFormModal from '@/components/inventory/CategoryFormModal';

export default function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryDto | undefined>(undefined);

  /**
   * Load categories
   */
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await inventoryService.getCategories();
      setCategories(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle delete category
   */
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) {
      return;
    }

    try {
      await inventoryService.deleteCategory(id);
      loadCategories(); // Reload list
    } catch (err: any) {
      alert(`Failed to delete category: ${err.message}`);
    }
  };

  /**
   * Get parent category name
   */
  const getParentName = (parentId?: string) => {
    if (!parentId) return 'None';
    const parent = categories.find((c) => c.id === parentId);
    return parent?.nameEn || 'Unknown';
  };

  /**
   * Get child categories
   */
  const getChildCategories = (parentId: string) => {
    return categories.filter((c) => c.parentCategoryId === parentId);
  };

  /**
   * Get root categories (no parent)
   */
  const getRootCategories = () => {
    return categories.filter((c) => !c.parentCategoryId);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Organize products into categories and subcategories
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/${locale}/branch/inventory`}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            ← Back to Inventory
          </Link>
          <button
            onClick={() => {
              setSelectedCategory(undefined);
              setIsCategoryModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            ➕ Add Category
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          ⚠️ {error}
        </div>
      )}

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading categories...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No categories found</p>
            <button
              onClick={() => alert('Category form modal coming soon!')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Add Your First Category
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parent Category
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Display Order
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {category.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {category.nameEn}
                        </div>
                        {category.nameAr && (
                          <div className="text-sm text-gray-500">{category.nameAr}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {category.descriptionEn || '-'}
                        </div>
                        {category.descriptionAr && (
                          <div className="text-sm text-gray-500">
                            {category.descriptionAr}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getParentName(category.parentCategoryId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        {category.displayOrder}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedCategory(category);
                              setIsCategoryModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(category.id, category.nameEn)
                            }
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
        )}
      </div>

      {/* Category Structure View */}
      {!loading && categories.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Category Hierarchy
          </h2>
          <div className="space-y-2">
            {getRootCategories().map((root) => (
              <div key={root.id} className="space-y-1">
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium text-gray-900">
                    📁 {root.nameEn}
                  </span>
                  <span className="text-xs text-gray-500">({root.code})</span>
                </div>
                {getChildCategories(root.id).map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center gap-2 p-2 pl-8 bg-gray-50 rounded ml-6"
                  >
                    <span className="text-sm text-gray-700">
                      📄 {child.nameEn}
                    </span>
                    <span className="text-xs text-gray-500">({child.code})</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Total Categories</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {categories.length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Root Categories</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {getRootCategories().length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Subcategories</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {categories.filter((c) => c.parentCategoryId).length}
          </div>
        </div>
      </div>

      {/* Category Form Modal */}
      <CategoryFormModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setSelectedCategory(undefined);
        }}
        onSuccess={() => {
          loadCategories();
        }}
        category={selectedCategory}
        categories={categories}
      />
    </div>
  );
}
