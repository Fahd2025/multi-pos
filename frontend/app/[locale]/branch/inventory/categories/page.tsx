/**
 * Categories Management Page
 * Manage product categories with hierarchical structure
 */

"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import inventoryService from "@/services/inventory.service";
import { CategoryDto } from "@/types/api.types";
import CategoryFormModal from "@/components/branch/inventory/CategoryFormModal";
import { DataTable } from "@/components/shared";
import { ConfirmationDialog } from "@/components/shared";
import { useDataTable } from "@/hooks/useDataTable";
import { useConfirmation } from "@/hooks/useModal";
import { DataTableColumn, DataTableAction } from "@/types/data-table.types";
import { Button } from "@/components/shared/Button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorAlert } from "@/components/shared/ErrorAlert";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE_URL } from "@/lib/constants";
import { ImageCarousel } from "@/components/shared/image-carousel";
import { Dialog, DialogContent, DialogTitle } from "@/components/shared/RadixDialog";

export default function CategoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { branch } = useAuth();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryDto | undefined>(undefined);
  const [isImageCarouselOpen, setIsImageCarouselOpen] = useState(false);
  const [selectedCategoryImage, setSelectedCategoryImage] = useState<string>("");

  // Hooks
  const confirmation = useConfirmation();

  // DataTable hook
  const {
    data: displayData,
    paginationConfig,
    sortConfig,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
  } = useDataTable(categories, {
    pageSize: 20,
    sortable: true,
    pagination: true,
  });

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
      setError(err.message || "Failed to load categories");
      console.error("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle delete category
   */
  const handleDelete = async (id: string, name: string) => {
    confirmation.ask(
      "Delete Category",
      `Are you sure you want to delete category "${name}"? This action cannot be undone.`,
      async () => {
        try {
          await inventoryService.deleteCategory(id);
          loadCategories();
        } catch (err: any) {
          setError(`Failed to delete category: ${err.message}`);
        }
      },
      "danger"
    );
  };

  /**
   * Get parent category name
   */
  const getParentName = (parentId?: string) => {
    if (!parentId) return "None";
    const parent = categories.find((c) => c.id === parentId);
    return parent?.nameEn || "Unknown";
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

  /**
   * Construct image URL for category images
   */
  const getCategoryImageUrl = (
    imageId: string,
    categoryId: string,
    size: "thumb" | "medium" | "large" | "original" = "thumb"
  ) => {
    const branchCode = branch?.branchCode || "B001";
    return `${API_BASE_URL}/api/v1/images/${branchCode}/categories/${imageId}/${size}`;
  };

  // Define table columns
  const columns: DataTableColumn<CategoryDto>[] = [
    {
      key: "code",
      label: "Code",
      sortable: true,
      render: (value) => <div className="font-medium text-gray-900">{value}</div>,
    },
    {
      key: "nameEn",
      label: "Name",
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{value}</div>
          {row.nameAr && <div className="text-sm text-gray-500">{row.nameAr}</div>}
        </div>
      ),
    },
    {
      key: "descriptionEn",
      label: "Description",
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="text-sm text-gray-900">{value || "-"}</div>
          {row.descriptionAr && <div className="text-sm text-gray-500">{row.descriptionAr}</div>}
        </div>
      ),
    },
    {
      key: "parentCategoryId",
      label: "Parent Category",
      sortable: true,
      render: (value) => <div className="text-sm text-gray-500">{getParentName(value)}</div>,
    },
    {
      key: "displayOrder",
      label: "Display Order",
      sortable: true,
      render: (value) => <div className="text-center text-sm text-gray-500">{value}</div>,
    },
  ];

  // Define row actions
  const actions: DataTableAction<CategoryDto>[] = [
    {
      label: "✏️ Edit",
      onClick: (row) => {
        setSelectedCategory(row);
        setIsCategoryModalOpen(true);
      },
      variant: "primary",
    },
    {
      label: "🗑️ Delete",
      onClick: (row) => handleDelete(row.id, row.nameEn),
      variant: "danger",
    },
  ];

  // Adapter for sort change
  const handleSortChange = (config: {
    key: keyof CategoryDto | string;
    direction: "asc" | "desc";
  }) => {
    handleSort(config.key);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Category Management
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Organize products into categories and subcategories
          </p>
        </div>
        <div className="flex gap-3">
          <Link href={`/${locale}/branch/inventory`}>
            <Button variant="secondary" size="md">
              ← Back to Inventory
            </Button>
          </Link>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setSelectedCategory(undefined);
              setIsCategoryModalOpen(true);
            }}
          >
            ➕ Add Category
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Loading State */}
      {loading && <LoadingSpinner size="lg" text="Loading categories..." />}

      {/* Categories DataTable */}
      {!loading && (
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
          emptyMessage="No categories found. Click 'Add Category' to create one."
          showRowNumbers
          imageColumn={{
            getImageUrl: (row) =>
              row.imagePath ? getCategoryImageUrl(row.imagePath, row.id, "large") : "",
            getAltText: (row) => row.nameEn,
            onImageClick: (row, images) => {
              if (images[0]) {
                setSelectedCategoryImage(images[0]);
                setIsImageCarouselOpen(true);
              }
            },
            size: 64,
            defaultIcon: "📁",
          }}
        />
      )}

      {/* Category Structure View */}
      {!loading && categories.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Hierarchy</h2>
          <div className="space-y-2">
            {getRootCategories().map((root) => (
              <div key={root.id} className="space-y-1">
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium text-gray-900">📁 {root.nameEn}</span>
                  <span className="text-xs text-gray-500">({root.code})</span>
                </div>
                {getChildCategories(root.id).map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center gap-2 p-2 pl-8 bg-gray-50 rounded ml-6"
                  >
                    <span className="text-sm text-gray-700">📄 {child.nameEn}</span>
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
          <div className="text-2xl font-bold text-gray-900 mt-1">{categories.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">Root Categories</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{getRootCategories().length}</div>
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
        branchName={branch?.branchCode || ""}
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

      {/* Image Carousel Modal */}
      <Dialog open={isImageCarouselOpen} onOpenChange={setIsImageCarouselOpen}>
        <DialogContent className="max-w-4xl p-0" showCloseButton={false}>
          <DialogTitle className="sr-only">Category Image</DialogTitle>
          <ImageCarousel
            images={[selectedCategoryImage]}
            alt="Category image"
            className="w-full h-[600px]"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
