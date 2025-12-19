# Migration Examples - Before & After

This document shows **real examples** from the codebase migrated to use the standardized error handling pattern.

## Table of Contents
1. [Form Modals](#form-modals)
2. [POS Components](#pos-components)
3. [Page Components](#page-components)
4. [Service Layer](#service-layer)

---

## Form Modals

### Example 1: CustomerFormModal.tsx

**❌ BEFORE:**
```tsx
"use client";

import { useState } from "react";
import { useApiError } from "@/hooks/useApiError";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import customerService from "@/services/customer.service";

export function CustomerFormModal({ customer, onClose, onSuccess }) {
  const { error, isError, setError, clearError } = useApiError();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    clearError();

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const data = Object.fromEntries(formData);

      if (customer?.id) {
        console.log("Updating customer:", customer.id);
        await customerService.updateCustomer(customer.id, data);
        console.log("Customer updated successfully");
      } else {
        console.log("Creating customer");
        await customerService.createCustomer(data);
        console.log("Customer created successfully");
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error saving customer:", err);
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {isError && <ApiErrorAlert error={error} onDismiss={clearError} />}

        {/* Form fields */}

        <button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : customer ? "Update" : "Create"}
        </button>
      </form>
    </div>
  );
}
```

**✅ AFTER:**
```tsx
"use client";

import { useApiOperation } from "@/hooks/useApiOperation";
import customerService from "@/services/customer.service";

export function CustomerFormModal({ customer, onClose, onSuccess }) {
  const { execute, isLoading } = useApiOperation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData);

    await execute({
      operation: () =>
        customer?.id
          ? customerService.updateCustomer(customer.id, data)
          : customerService.createCustomer(data),
      successMessage: customer
        ? "Customer updated successfully"
        : "Customer created successfully",
      successDetail: `${data.name} has been ${customer ? "updated" : "added to your customers"}`,
      errorMessage: customer ? "Failed to update customer" : "Failed to create customer",
      onSuccess: () => {
        onSuccess();
        onClose();
      },
    });
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {/* Form fields - No need for error alert, toast handles it */}

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : customer ? "Update" : "Create"}
        </button>
      </form>
    </div>
  );
}
```

**Changes:**
- ✅ Removed manual `console.log()` and `console.error()`
- ✅ Removed manual `useState` for loading and error
- ✅ Removed `ApiErrorAlert` component (toast provides feedback)
- ✅ Removed manual try-catch blocks
- ✅ Added automatic success/error toast notifications
- ✅ Cleaner, more concise code
- ⚡ Reduced from ~50 lines to ~30 lines

---

### Example 2: PurchaseFormModal.tsx

**❌ BEFORE:**
```tsx
"use client";

import { useState } from "react";
import purchaseService from "@/services/purchase.service";

export function PurchaseFormModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreatePurchaseDto) => {
    setLoading(true);
    setError(null);

    try {
      const purchase = await purchaseService.createPurchase(data);
      console.log("Purchase created:", purchase);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error creating purchase:", err);
      setError(err.message || "Failed to create purchase order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded">
          {error}
        </div>
      )}

      <form>
        {/* Form fields */}

        <button onClick={handleSubmit} disabled={loading}>
          {loading ? "Creating..." : "Create Purchase Order"}
        </button>
      </form>
    </div>
  );
}
```

**✅ AFTER:**
```tsx
"use client";

import { useApiOperation } from "@/hooks/useApiOperation";
import purchaseService from "@/services/purchase.service";

export function PurchaseFormModal({ onClose, onSuccess }) {
  const { execute, isLoading } = useApiOperation();

  const handleSubmit = async (data: CreatePurchaseDto) => {
    await execute({
      operation: () => purchaseService.createPurchase(data),
      successMessage: "Purchase order created",
      successDetail: `PO for ${data.supplierName} has been created`,
      errorMessage: "Failed to create purchase order",
      onSuccess: () => {
        onSuccess();
        onClose();
      },
    });
  };

  return (
    <div>
      <form>
        {/* Form fields */}

        <button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Purchase Order"}
        </button>
      </form>
    </div>
  );
}
```

**Changes:**
- ✅ Removed manual error state and display
- ✅ Removed console logging
- ✅ Added user-friendly toast notifications
- ⚡ Reduced from ~45 lines to ~25 lines

---

## POS Components

### Example 3: PosLayout.tsx

**❌ BEFORE:**
```tsx
"use client";

import { useEffect, useState } from "react";
import productService from "@/services/inventory.service";

export function PosLayout() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [productsData, categoriesData] = await Promise.all([
        productService.getProducts(),
        productService.getCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (err: any) {
      console.error("Error loading POS data:", err);
      setError("Failed to load products and categories");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return <div>{/* POS UI */}</div>;
}
```

**✅ AFTER:**
```tsx
"use client";

import { useEffect, useState } from "react";
import { useApiError } from "@/hooks/useApiError";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import productService from "@/services/inventory.service";

export function PosLayout() {
  const { error, isError, executeWithErrorHandling } = useApiError();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const result = await executeWithErrorHandling(async () => {
      const [productsData, categoriesData] = await Promise.all([
        productService.getProducts(),
        productService.getCategories(),
      ]);
      return { products: productsData, categories: categoriesData };
    });

    if (result) {
      setProducts(result.products);
      setCategories(result.categories);
    }

    setLoading(false);
  };

  if (loading) return <LoadingSpinner />;

  if (isError) {
    return <ApiErrorAlert error={error} onRetry={fetchData} />;
  }

  return <div>{/* POS UI */}</div>;
}
```

**Changes:**
- ✅ Replaced manual error handling with `useApiError()`
- ✅ Used `ApiErrorAlert` for persistent error display with retry
- ✅ Removed console.error
- ✅ Better UX with retry functionality
- ✅ Consistent error display pattern

---

### Example 4: OrderPanel.tsx

**❌ BEFORE:**
```tsx
"use client";

import { useEffect } from "react";
import { useToast } from "@/hooks/useToast";

export function OrderPanel() {
  const toast = useToast();

  useEffect(() => {
    const branchData = localStorage.getItem("branch");

    if (!branchData) {
      console.error("No branch data found in localStorage");
      return;
    }

    try {
      const branch = JSON.parse(branchData);
      // Use branch data
    } catch (err) {
      console.error("Error parsing branch data:", err);
    }
  }, []);

  return <div>{/* Order panel UI */}</div>;
}
```

**✅ AFTER:**
```tsx
"use client";

import { useEffect } from "react";
import { useToast } from "@/hooks/useToast";

export function OrderPanel() {
  const toast = useToast();

  useEffect(() => {
    const branchData = localStorage.getItem("branch");

    if (!branchData) {
      toast.error(
        "Branch not selected",
        "Please select a branch from the settings"
      );
      return;
    }

    try {
      const branch = JSON.parse(branchData);
      // Use branch data
    } catch (err) {
      toast.error(
        "Invalid branch data",
        "Please re-select your branch from settings"
      );
    }
  }, []);

  return <div>{/* Order panel UI */}</div>;
}
```

**Changes:**
- ✅ Replaced `console.error()` with `toast.error()`
- ✅ User now sees actionable error messages
- ✅ Better UX with clear guidance

---

## Page Components

### Example 5: Products Page

**❌ BEFORE:**
```tsx
"use client";

import { useEffect, useState } from "react";
import productService from "@/services/inventory.service";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await productService.getProducts();
      setProducts(data);
    } catch (err: any) {
      console.error("Error fetching products:", err);
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await productService.deleteProduct(id);
      console.log("Product deleted");
      fetchProducts(); // Refresh
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("Failed to delete product");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onDelete={() => handleDelete(product.id)}
        />
      ))}
    </div>
  );
}
```

**✅ AFTER:**
```tsx
"use client";

import { useEffect, useState } from "react";
import { useApiError } from "@/hooks/useApiError";
import { useApiOperation } from "@/hooks/useApiOperation";
import { useConfirmation } from "@/hooks/useConfirmation";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import productService from "@/services/inventory.service";

export default function ProductsPage() {
  const { error, isError, executeWithErrorHandling } = useApiError();
  const { execute: executeDelete } = useApiOperation();
  const { confirm } = useConfirmation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const result = await executeWithErrorHandling(() =>
      productService.getProducts()
    );
    if (result) setProducts(result);
    setLoading(false);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: "Delete Product",
      message: `Are you sure you want to delete "${name}"?`,
      variant: "danger",
    });

    if (!confirmed) return;

    await executeDelete({
      operation: () => productService.deleteProduct(id),
      successMessage: "Product deleted",
      successDetail: `${name} has been removed`,
      errorMessage: "Failed to delete product",
      onSuccess: () => fetchProducts(),
    });
  };

  if (loading) return <LoadingSpinner />;
  if (isError) return <ApiErrorAlert error={error} onRetry={fetchProducts} />;

  return (
    <div>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onDelete={() => handleDelete(product.id, product.name)}
        />
      ))}
    </div>
  );
}
```

**Changes:**
- ✅ Page loading uses `useApiError()` + `ApiErrorAlert`
- ✅ Delete operation uses `useApiOperation()` with toast
- ✅ Added confirmation dialog for delete
- ✅ Removed console.error and alert()
- ✅ Better UX with automatic feedback
- ✅ Persistent error display for page load errors
- ✅ Transient toast for mutations

---

## Service Layer

### Example 6: Sales Service Error Handling

**❌ BEFORE:**
```tsx
// sales.service.ts
class SalesService {
  async createSale(data: CreateSaleDto): Promise<SaleDto> {
    try {
      const response = await api.post("/api/v1/sales", data);
      return response.data;
    } catch (error: any) {
      console.error("Error creating sale:", error);
      throw error; // Just re-throw
    }
  }
}
```

**✅ AFTER:**
```tsx
// sales.service.ts
class SalesService {
  async createSale(data: CreateSaleDto): Promise<SaleDto> {
    // No try-catch needed - let errors propagate to UI layer
    // UI components will handle errors with useApiOperation
    const response = await api.post("/api/v1/sales", data);
    return response.data;
  }
}

// Components handle errors
function SalesForm() {
  const { execute, isLoading } = useApiOperation();

  const handleSubmit = async (data: CreateSaleDto) => {
    await execute({
      operation: () => salesService.createSale(data),
      successMessage: "Sale created successfully",
      errorMessage: "Failed to create sale",
    });
  };
}
```

**Changes:**
- ✅ Removed unnecessary try-catch in service layer
- ✅ Let errors propagate to UI layer
- ✅ UI handles errors with standardized pattern
- ✅ Cleaner separation of concerns

---

## Summary of Benefits

### Code Reduction
- **Form modals**: ~40% less code
- **Page components**: ~30% less code
- **Error handling**: Eliminated boilerplate

### Consistency
- ✅ Same pattern everywhere
- ✅ Predictable behavior
- ✅ Easy to maintain

### User Experience
- ✅ Automatic toast notifications
- ✅ Persistent errors with retry
- ✅ Clear, actionable messages
- ✅ No silent failures

### Developer Experience
- ✅ Less boilerplate
- ✅ No manual state management
- ✅ Built-in loading states
- ✅ Automatic error extraction

---

## Migration Checklist

When migrating a file:

1. **Import the appropriate hook**
   - `useApiOperation` for mutations
   - `useApiError` for page loading
   - `useToast` for manual notifications

2. **Remove manual state**
   - Delete `useState` for loading, error
   - Delete manual try-catch blocks
   - Delete console.log/console.error

3. **Replace error displays**
   - Remove custom error divs
   - Use toast for mutations
   - Use `ApiErrorAlert` for page errors

4. **Update button states**
   - Use `isLoading` from hook
   - Remove manual loading state

5. **Add success messages**
   - Every mutation should have success feedback
   - Include relevant details

6. **Test thoroughly**
   - Test success cases
   - Test error cases
   - Test loading states
   - Test validation

---

## Next Steps

1. Start with **form modals** - easiest wins
2. Move to **POS components** - high visibility
3. Update **page components** - consistent pattern
4. Clean up **service layer** - remove console.error

See `ERROR_HANDLING_PATTERN.md` for complete documentation.
