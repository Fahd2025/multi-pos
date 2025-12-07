/**
 * Lazy Loaded Components
 * Heavy components that should be loaded on-demand for better performance
 */

import dynamic from "next/dynamic";

// Loading fallback component - simple loading state
const LoadingFallback = () => null;

// Data Table - Large component with complex functionality
export const LazyDataTable = dynamic(
  () => import("@/components/shared/DataTable").then((mod) => ({ default: mod.DataTable })),
  {
    loading: LoadingFallback,
    ssr: false, // Disable SSR for data tables (they're client-side heavy)
  }
);

// Featured Dialog - Modal with complex features
export const LazyFeaturedDialog = dynamic(
  () => import("@/components/shared/FeaturedDialog").then((mod) => ({ default: mod.FeaturedDialog })),
  {
    loading: LoadingFallback,
  }
);

// Product Form Modal - Heavy form with image uploads
export const LazyProductFormModal = dynamic(
  () => import("@/components/branch/inventory/ProductFormModal").then((mod) => mod.default),
  {
    loading: LoadingFallback,
  }
);

// Product Form Modal with Images - Even heavier with multi-image support
export const LazyProductFormModalWithImages = dynamic(
  () => import("@/components/branch/inventory/ProductFormModalWithImages").then((mod) => mod.default),
  {
    loading: LoadingFallback,
  }
);

// Purchase Form Modal
export const LazyPurchaseFormModal = dynamic(
  () => import("@/components/branch/inventory/PurchaseFormModal").then((mod) => mod.default),
  {
    loading: LoadingFallback,
  }
);

// Customer Form Modal
export const LazyCustomerFormModal = dynamic(
  () => import("@/components/branch/customers/CustomerFormModal").then((mod) => mod.default),
  {
    loading: LoadingFallback,
  }
);

// Expense Form Modal
export const LazyExpenseFormModal = dynamic(
  () => import("@/components/branch/expenses/ExpenseFormModal").then((mod) => mod.default),
  {
    loading: LoadingFallback,
  }
);

// Supplier Form Modal
export const LazySupplierFormModal = dynamic(
  () => import("@/components/branch/suppliers/SupplierFormModal").then((mod) => mod.default),
  {
    loading: LoadingFallback,
  }
);

// Category Form Modal
export const LazyCategoryFormModal = dynamic(
  () => import("@/components/branch/inventory/CategoryFormModal").then((mod) => mod.default),
  {
    loading: LoadingFallback,
  }
);

// Stock Adjustment Modal
export const LazyStockAdjustmentModal = dynamic(
  () => import("@/components/branch/inventory/StockAdjustmentModal").then((mod) => mod.default),
  {
    loading: LoadingFallback,
  }
);

// Report Viewer - Charts and heavy visualization
export const LazyReportViewer = dynamic(
  () => import("@/components/branch/reports/ReportViewer").then((mod) => mod.default),
  {
    loading: LoadingFallback,
    ssr: false, // Reports are client-side only
  }
);

// Branch Form Modal (Head Office) - Named export
export const LazyBranchFormModal = dynamic(
  () => import("@/components/head-office/BranchFormModal").then((mod) => ({ default: mod.BranchFormModal })),
  {
    loading: LoadingFallback,
  }
);

// Image Carousel - Can be heavy with multiple images
export const LazyImageCarousel = dynamic(
  () => import("@/components/shared").then((mod) => ({ default: mod.ImageCarousel })),
  {
    loading: LoadingFallback,
  }
);

// Multi Image Upload - Heavy component with drag-drop
export const LazyMultiImageUpload = dynamic(
  () => import("@/components/shared").then((mod) => ({ default: mod.MultiImageUpload })),
  {
    loading: LoadingFallback,
  }
);
