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

  // Filter states (input values)
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showLowStock, setShowLowStock] = useState(false);
  const [showOutOfStock, setShowOutOfStock] = useState(false);

  // Applied filters (what's actually being used in the API call)
  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    category: "",
    lowStock: false,
    outOfStock: false,
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
  }, [currentPage, appliedFilters]);

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

      const filters: any = {
        page: currentPage,
        pageSize,
        search: appliedFilters.search || undefined,
        categoryId: appliedFilters.category || undefined,
        lowStock: appliedFilters.lowStock || undefined,
        outOfStock: appliedFilters.outOfStock || undefined,
      };

      const response = await inventoryService.getProducts(filters);
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
   * Apply current filter values
   */
  const handleApplyFilters = () => {
    setAppliedFilters({
      search: searchTerm,
      category: selectedCategory,
      lowStock: showLowStock,
      outOfStock: showOutOfStock,
    });
    setCurrentPage(1);
  };

  /**
   * Handle pagination
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  /**
   * Get active filters for display
   */
  const getActiveFilters = () => {
    const filters: { type: string; label: string; value: string }[] = [];

    if (appliedFilters.search) {
      filters.push({ type: "search", label: "Search", value: appliedFilters.search });
    }
    if (appliedFilters.category) {
      const categoryName =
        categories.find((c) => c.id === appliedFilters.category)?.nameEn || appliedFilters.category;
      filters.push({ type: "category", label: "Category", value: categoryName });
    }
    if (appliedFilters.lowStock) {
      filters.push({ type: "lowStock", label: "Low Stock", value: "Yes" });
    }
    if (appliedFilters.outOfStock) {
      filters.push({ type: "outOfStock", label: "Out of Stock", value: "Yes" });
    }

    return filters;
  };

  const activeFilters = getActiveFilters();
  const activeFilterCount = activeFilters.length;
  const hasActiveFilters = activeFilterCount > 0;

  /**
   * Remove a single filter
   */
  const handleRemoveFilter = (filterType: string) => {
    const newFilters = { ...appliedFilters };

    switch (filterType) {
      case "search":
        newFilters.search = "";
        setSearchTerm("");
        break;
      case "category":
        newFilters.category = "";
        setSelectedCategory("");
        break;
      case "lowStock":
        newFilters.lowStock = false;
        setShowLowStock(false);
        break;
      case "outOfStock":
        newFilters.outOfStock = false;
        setShowOutOfStock(false);
        break;
    }

    setAppliedFilters(newFilters);
    setCurrentPage(1);
  };

  /**
   * Reset all filters
   */
  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setShowLowStock(false);
    setShowOutOfStock(false);
    setAppliedFilters({
      search: "",
      category: "",
      lowStock: false,
      outOfStock: false,
    });
    setCurrentPage(1);
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
          fetchProducts();
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

        {/* Active Filters Display - Full Width */}
        {!loading && !isError && activeFilters.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-5 py-3">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Active Filters:
              </span>
              {activeFilters.map((filter) => (
                <span
                  key={filter.type}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 rounded-full text-sm font-medium"
                >
                  <span className="font-semibold">{filter.label}:</span>
                  <span>{filter.value}</span>
                  <button
                    onClick={() => handleRemoveFilter(filter.type)}
                    className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-700 rounded-full p-0.5 transition-colors"
                    title={`Remove ${filter.label} filter`}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </span>
              ))}
              <button
                onClick={handleResetFilters}
                className="ml-2 text-sm text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 font-medium underline"
              >
                Clear All
              </button>
            </div>
          </div>
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
            activeFilterCount={activeFilterCount}
            showResetButton={hasActiveFilters}
            onResetFilters={handleResetFilters}
            searchBar={
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name, code, barcode, or SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm"
                  />
                </div>
                <button
                  onClick={handleApplyFilters}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
              </div>
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
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
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
                          checked={showLowStock}
                          onChange={(e) => setShowLowStock(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-200">Low Stock</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showOutOfStock}
                          onChange={(e) => setShowOutOfStock(e.target.checked)}
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
                  <button
                    onClick={handleApplyFilters}
                    className="px-6 py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Apply Filters
                  </button>
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
