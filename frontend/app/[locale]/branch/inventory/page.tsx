/**
 * Inventory Management Page
 * Product list with search, filters, and CRUD operations using generic DataTable
 */

"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import inventoryService from "@/services/inventory.service";
import { ProductDto, CategoryDto } from "@/types/api.types";
import Link from "next/link";
import StockAdjustmentModal from "@/components/branch/inventory/StockAdjustmentModal";
import { DataTable } from "@/components/shared";
import { ConfirmationDialog } from "@/components/shared";
import { useDataTable } from "@/hooks/useDataTable";
import { useConfirmation } from "@/hooks/useModal";
import { DataTableColumn, DataTableAction } from "@/types/data-table.types";
import {
  Button,
  StatusBadge,
  getStockStatusVariant,
  LoadingSpinner,
  StatCard,
  PageHeader,
} from "@/components/shared";
import { useApiError } from "@/hooks/useApiError";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import ProductFormModalWithImages from "@/components/branch/inventory/ProductFormModalWithImages";
import { useAuth } from "@/hooks/useAuth";
import { ImageCarousel } from "@/components/shared/image-carousel";
import { Dialog, DialogContent, DialogTitle } from "@/components/shared/RadixDialog";
import { API_BASE_URL } from "@/lib/constants";

export default function InventoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { branch } = useAuth();

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, isError, executeWithErrorHandling, clearError } = useApiError();

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showLowStock, setShowLowStock] = useState(false);
  const [showOutOfStock, setShowOutOfStock] = useState(false);

  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductDto | undefined>(undefined);
  const [isImageCarouselOpen, setIsImageCarouselOpen] = useState(false);
  const [selectedProductImages, setSelectedProductImages] = useState<string[]>([]);

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
  } = useDataTable(products, {
    pageSize: 20,
    sortable: true,
    pagination: true,
  });

  /**
   * Load products and categories
   */
  useEffect(() => {
    loadData();
  }, [selectedCategory, showLowStock, showOutOfStock]);

  const loadData = async () => {
    setLoading(true);

    const result = await executeWithErrorHandling(async () => {
      // Load products with filters
      const productsResponse = await inventoryService.getProducts({
        page: paginationConfig?.currentPage || 1,
        pageSize: paginationConfig?.pageSize || 20,
        search: searchTerm || undefined,
        categoryId: selectedCategory || undefined,
        lowStock: showLowStock || undefined,
        outOfStock: showOutOfStock || undefined,
      });

      // Load categories (only once)
      let categoriesData = categories;
      if (categories.length === 0) {
        categoriesData = await inventoryService.getCategories();
      }

      return { products: productsResponse.data, categories: categoriesData };
    });

    if (result) {
      setProducts(result.products);
      if (result.categories.length > 0) {
        setCategories(result.categories);
      }
    }

    setLoading(false);
  };

  /**
   * Handle search
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  /**
   * Handle delete product
   */
  const handleDelete = async (product: ProductDto) => {
    confirmation.ask(
      "Delete Product",
      `Are you sure you want to delete "${product.nameEn}"? This action cannot be undone.`,
      async () => {
        const result = await executeWithErrorHandling(async () => {
          return await inventoryService.deleteProduct(product.id);
        });

        if (result) {
          loadData();
        }
      },
      "danger"
    );
  };

  /**
   * Get category name
   */
  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return "Uncategorized";
    const category = categories.find((c) => c.id === categoryId);
    return category?.nameEn || "Unknown";
  };

  /**
   * Construct image URL for product images
   */
  const getImageUrl = (
    imageId: string,
    productId: string,
    size: "thumb" | "medium" | "large" | "original" = "thumb"
  ) => {
    const branchCode = branch?.branchCode || "B001";
    return `${API_BASE_URL}/api/v1/images/${branchCode}/products/${imageId}/${size}?productId=${productId}`;
  };

  /**
   * Get stock status label
   */
  const getStockLabel = (product: ProductDto) => {
    if (product.stockLevel <= 0) {
      return "Out of Stock";
    } else if (product.stockLevel <= product.minStockThreshold) {
      return "Low Stock";
    } else {
      return "In Stock";
    }
  };

  // Define table columns
  const columns: DataTableColumn<ProductDto>[] = [
    {
      key: "nameEn",
      label: "Product",
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{getCategoryName(row.categoryId)}</div>
        </div>
      ),
    },
    {
      key: "sku",
      label: "Code / SKU",
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="text-sm text-gray-900">{value}</div>
          {row.barcode && <div className="text-sm text-gray-500">{row.barcode}</div>}
        </div>
      ),
    },
    {
      key: "sellingPrice",
      label: "Price",
      sortable: true,
      render: (value) => (
        <span className="text-sm font-medium text-gray-900">${value.toFixed(2)}</span>
      ),
    },
    {
      key: "stockLevel",
      label: "Stock",
      sortable: true,
      render: (value, row) => (
        <div className="text-right">
          <span className="text-sm font-semibold text-gray-900">{value}</span>
          <span className="text-xs text-gray-500 ml-1">/ {row.minStockThreshold}</span>
        </div>
      ),
    },
    {
      key: "stockStatus",
      label: "Status",
      sortable: false,
      render: (_, row) => (
        <StatusBadge variant={getStockStatusVariant(row.stockLevel, row.minStockThreshold)}>
          {getStockLabel(row)}
        </StatusBadge>
      ),
    },
  ];

  // Define row actions
  const actions: DataTableAction<ProductDto>[] = [
    {
      label: "📊 Stock",
      onClick: (row) => {
        setSelectedProduct(row);
        setIsStockModalOpen(true);
      },
      variant: "secondary",
    },
    {
      label: "Edit",
      onClick: (row) => {
        setSelectedProduct(row);
        setIsProductModalOpen(true);
      },
      variant: "primary",
    },
    {
      label: "Delete",
      onClick: (row) => handleDelete(row),
      variant: "danger",
    },
  ];

  // Adapter for sort change
  const handleSortChange = (config: {
    key: keyof ProductDto | string;
    direction: "asc" | "desc";
  }) => {
    handleSort(config.key);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Management"
        description="Manage products, categories, and stock levels"
        actions={
          <>
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
          </>
        }
      />

      {/* Filters */}
      <div className=" p-4 rounded-lg shadow-sm border border-gray-200">
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
                }}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-200">Low Stock Only</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOutOfStock}
                onChange={(e) => {
                  setShowOutOfStock(e.target.checked);
                }}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 "
              />
              <span className="text-sm text-gray-700 dark:text-gray-200">Out of Stock Only</span>
            </label>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {isError && <ApiErrorAlert error={error} onRetry={loadData} onDismiss={clearError} />}

      {/* Loading State */}
      {loading && <LoadingSpinner size="lg" text="Loading products..." />}

      {/* Products DataTable */}
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
          emptyMessage="No products found. Click 'Add Product' to create one."
          showRowNumbers
          imageColumn={{
            getImageUrl: (row) => {
              if (row.images && row.images.length > 0) {
                return row.images.map((img) => getImageUrl(img.imagePath, row.id, "large"));
              }
              return [];
            },
            getAltText: (row) => row.nameEn,
            onImageClick: (row, images) => {
              setSelectedProductImages(images);
              setIsImageCarouselOpen(true);
            },
            size: 64,
          }}
        />
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Products" value={products.length} />

        <StatCard
          title="Low Stock Alerts"
          value={
            products.filter((p) => p.stockLevel > 0 && p.stockLevel <= p.minStockThreshold).length
          }
          valueColor="text-yellow-600 dark:text-yellow-400"
        />

        <StatCard
          title="Out of Stock"
          value={products.filter((p) => p.stockLevel <= 0).length}
          valueColor="text-red-600 dark:text-red-400"
        />

        <StatCard title="Categories" value={categories.length} />
      </div>

      {/* Modals */}
      <ProductFormModalWithImages
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
        branchName={branch?.branchCode || ""}
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
          <DialogTitle className="sr-only">Product Images</DialogTitle>
          <ImageCarousel
            images={selectedProductImages}
            alt="Product images"
            className="w-full h-[600px]"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
