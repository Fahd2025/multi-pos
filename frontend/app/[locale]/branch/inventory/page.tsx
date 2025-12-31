/**
 * Inventory Management Page
 * Product list with search, filters, and CRUD operations using generic DataTable
 */

"use client";

import { useState, useEffect, lazy, Suspense, useCallback } from "react";
import { use } from "react";
import inventoryService from "@/services/inventory.service";
import { ProductDto, CategoryDto } from "@/types/api.types";
import Link from "next/link";
import StockAdjustmentModal from "@/components/branch/inventory/StockAdjustmentModal";
import { DataTable } from "@/components/shared";
import { ConfirmationDialog } from "@/components/shared";
import { useDataTable } from "@/hooks/useDataTable";
import { useConfirmation } from "@/hooks/useConfirmation";
import { DataTableColumn, DataTableAction } from "@/types/data-table.types";
import {
  Button,
  StatusBadge,
  getStockStatusVariant,
  LoadingSpinner,
  StatCard,
  PageHeader,
  ActiveFiltersBadge,
  SearchInput,
} from "@/components/shared";
import { useApiError } from "@/hooks/useApiError";
import { useTableFilters } from "@/hooks/useTableFilters";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import ProductFormModalWithImages from "@/components/branch/inventory/ProductFormModalWithImages";
import { useApiOperation } from "@/hooks/useApiOperation";
import { useAuth } from "@/hooks/useAuth";
import { ImageCarousel } from "@/components/shared/image-carousel";
import { Dialog, DialogContent, DialogTitle } from "@/components/shared/RadixDialog";
import { API_BASE_URL } from "@/lib/constants";
import { Barcode } from "lucide-react";
import { RoleGuard, usePermission } from "@/components/auth/RoleGuard";
import { UserRole } from "@/types/enums";
import { useRouter } from "next/navigation";

export default function InventoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { branch } = useAuth();
  const router = useRouter();
  const { canManage } = usePermission();

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [allProducts, setAllProducts] = useState<ProductDto[]>([]); // For statistics
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, isError, executeWithErrorHandling, clearError } = useApiError();

  // Server-side pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 20;

  // Helper function to get category name for display
  const getCategoryName = useCallback((categoryId: string) => {
    if (!categoryId) return "All Categories";
    const category = categories.find((c) => c.id === categoryId);
    return category?.nameEn || "Unknown Category";
  }, [categories]);

  // Table filters using new hook
  const filters = useTableFilters({
    filterDefinitions: [
      { type: "search", label: "Search", defaultValue: "" },
      {
        type: "category",
        label: "Category",
        defaultValue: "",
        getDisplayValue: getCategoryName,
      },
      { type: "lowStock", label: "Low Stock", defaultValue: false, getDisplayValue: () => "Yes" },
      { type: "outOfStock", label: "Out of Stock", defaultValue: false, getDisplayValue: () => "Yes" },
    ],
    onFiltersChange: () => setCurrentPage(1),
  });

  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductDto | undefined>(undefined);
  const [isImageCarouselOpen, setIsImageCarouselOpen] = useState(false);
  const [selectedProductImages, setSelectedProductImages] = useState<string[]>([]);

  const [barcodeDialogOpen, setBarcodeDialogOpen] = useState(false);
  const [barcodeProduct, setBarcodeProduct] = useState<{
    name: string;
    sellingPrice: number;
    barcode: string;
  }>({ name: "", sellingPrice: 0, barcode: "" });
  const BarcodePreviewDialog = lazy(() =>
    import("@/components/branch/inventory/BarcodePreviewDialog").then((mod) => ({
      default: mod.BarcodePreviewDialog,
    }))
  );
  const handlePrintBarcode = useCallback((product: ProductDto) => {
    setBarcodeProduct({
      name: product.nameEn,
      sellingPrice: product.sellingPrice,
      barcode: product.barcode || "",
    });
    setBarcodeDialogOpen(true);
  }, []);

  // Hooks
  const confirmation = useConfirmation();
  const { execute } = useApiOperation();

  /**
   * Load products and categories
   */
  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filters.appliedFilters]);

  /**
   * Load categories (one-time load)
   */
  const loadCategories = async () => {
    const result = await executeWithErrorHandling(async () => {
      return await inventoryService.getCategories();
    });

    if (result) {
      setCategories(result);
    }
  };

  /**
   * Fetch products with server-side pagination and filters
   */
  const fetchProducts = async () => {
    try {
      setLoading(true);
      clearError();

      const params: any = {
        page: currentPage,
        pageSize,
        search: filters.appliedFilters.search || undefined,
        categoryId: filters.appliedFilters.category || undefined,
        lowStock: filters.appliedFilters.lowStock || undefined,
        outOfStock: filters.appliedFilters.outOfStock || undefined,
      };

      const response = await inventoryService.getProducts(params);
      setProducts(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);

      // Load all products for statistics (only when filters change)
      if (currentPage === 1) {
        const allResponse = await inventoryService.getProducts({
          page: 1,
          pageSize: 10000,
        });
        setAllProducts(allResponse.data);
      }
    } catch (err: any) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle pagination
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  /**
   * Handle delete product
   */
  const handleDelete = async (product: ProductDto) => {
    confirmation.ask(
      "Delete Product",
      `Are you sure you want to delete "${product.nameEn}"? This action cannot be undone.`,
      async () => {
        await execute({
          operation: () => inventoryService.deleteProduct(product.id),
          successMessage: "Product deleted successfully",
          successDetail: `${product.nameEn} has been removed from inventory`,
          onSuccess: () => {
            fetchProducts();
          },
        });
      },
      "danger"
    );
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
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</div>
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
          <div className="text-sm text-gray-900 dark:text-gray-100">{value}</div>
          {row.barcode && <div className="text-sm text-gray-500">{row.barcode}</div>}
        </div>
      ),
    },
    {
      key: "sellingPrice",
      label: "Price",
      sortable: true,
      render: (value) => (
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          ${value.toFixed(2)}
        </span>
      ),
    },
    {
      key: "stockLevel",
      label: "Stock",
      sortable: true,
      render: (value, row) => (
        <div className="text-right">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</span>
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
      label: "Barcode",
      icon: <Barcode className="h-4 w-4" />,
      onClick: (row) => {
        handlePrintBarcode(row);
      },
      variant: "secondary",
    },
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
        if (!branch || !branch.branchCode) {
          alert("Branch information is not available. Please refresh the page.");
          return;
        }
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

  return (
    <RoleGuard
      requireRole={UserRole.Manager}
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-6xl">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Only Managers can access Inventory Management.
          </p>
          <Button onClick={() => router.push(`/${locale}/branch`)}>Go to Dashboard</Button>
        </div>
      }
    >
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
                  if (!branch || !branch.branchCode) {
                    alert("Branch information is not available. Please refresh the page.");
                    return;
                  }
                  setSelectedProduct(undefined);
                  setIsProductModalOpen(true);
                }}
              >
                ➕ Add Product
              </Button>
            </>
          }
        />

        {/* Error Message */}
        {isError && <ApiErrorAlert error={error} onRetry={fetchProducts} onDismiss={clearError} />}

        {/* Loading State */}
        {loading && <LoadingSpinner size="lg" text="Loading products..." />}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Total Products" value={allProducts.length} />

          <StatCard
            title="Low Stock Alerts"
            value={
              allProducts.filter((p) => p.stockLevel > 0 && p.stockLevel <= p.minStockThreshold)
                .length
            }
            valueColor="text-yellow-600 dark:text-yellow-400"
          />

          <StatCard
            title="Out of Stock"
            value={allProducts.filter((p) => p.stockLevel <= 0).length}
            valueColor="text-red-600 dark:text-red-400"
          />

          <StatCard title="Categories" value={categories.length} />
        </div>

        {/* Active Filters Display */}
        {!loading && !isError && (
          <ActiveFiltersBadge
            filters={filters.activeFilters}
            onRemove={filters.removeFilter}
            onClearAll={filters.resetFilters}
          />
        )}

        {/* Products DataTable */}
        {!loading && (
          <DataTable
            data={products}
            columns={columns}
            actions={actions}
            getRowKey={(row) => row.id}
            loading={loading}
            pagination
            paginationConfig={{
              currentPage,
              pageSize,
              totalItems,
            }}
            onPageChange={handlePageChange}
            emptyMessage="No products found. Click 'Add Product' to create one."
            showRowNumbers
            showFilterButton
            activeFilterCount={filters.activeFilterCount}
            showResetButton={filters.hasActiveFilters}
            onResetFilters={filters.resetFilters}
            searchBar={
              <SearchInput
                value={filters.filterValues.search}
                onChange={(val) => filters.setFilterValue("search", val)}
                onSearch={filters.applyFilters}
                placeholder="Search by name, code, barcode, or SKU..."
              />
            }
            filterSection={
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <select
                      value={filters.filterValues.category}
                      onChange={(e) => filters.setFilterValue("category", e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm"
                    >
                      <option value="">All Categories</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Stock Level Filters */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Stock Level
                    </label>
                    <div className="flex items-center gap-4 h-[42px]">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.filterValues.lowStock}
                          onChange={(e) => filters.setFilterValue("lowStock", e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-200">Low Stock</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.filterValues.outOfStock}
                          onChange={(e) => filters.setFilterValue("outOfStock", e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-200">
                          Out of Stock
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Apply Filters Button */}
                <div className="flex justify-end">
                  <Button variant="primary" onClick={filters.applyFilters}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            }
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
              defaultIcon: "📦",
            }}
          />
        )}

        {/* Modals */}
        {branch && branch.branchCode && (
          <ProductFormModalWithImages
            isOpen={isProductModalOpen}
            onClose={() => {
              setIsProductModalOpen(false);
              setSelectedProduct(undefined);
            }}
            onSuccess={() => {
              fetchProducts();
            }}
            product={selectedProduct}
            categories={categories}
            branchName={branch.branchCode}
          />
        )}

        <StockAdjustmentModal
          isOpen={isStockModalOpen}
          onClose={() => {
            setIsStockModalOpen(false);
            setSelectedProduct(undefined);
          }}
          onSuccess={() => {
            fetchProducts();
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

        {/* Barcode Preview Dialog - lazy loaded */}
        {barcodeDialogOpen && (
          <Suspense fallback={<div />}>
            <BarcodePreviewDialog
              open={barcodeDialogOpen}
              onOpenChange={setBarcodeDialogOpen}
              productName={barcodeProduct.name}
              sellingPrice={barcodeProduct.sellingPrice}
              barcode={barcodeProduct.barcode}
            />
          </Suspense>
        )}
      </div>
    </RoleGuard>
  );
}
