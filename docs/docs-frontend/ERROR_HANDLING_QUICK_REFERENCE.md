# Error Handling Quick Reference

## 🎯 Quick Decision Guide

```
Need to make an API call?
├─ Creating/Updating/Deleting data?
│  └─ ✅ useApiOperation()
│
├─ Loading page data with error display?
│  └─ ✅ useApiError() + ApiErrorAlert
│
└─ Just showing a message (no API)?
   └─ ✅ useToast()
```

---

## 📋 Common Patterns

### Form Create/Update/Delete
```tsx
const { execute, isLoading } = useApiOperation();

await execute({
  operation: () => service.create(data),
  successMessage: "Created successfully",
  onSuccess: () => refresh()
});
```

### Delete with Confirmation
```tsx
const { execute } = useApiOperation();
const { confirm } = useConfirmation();

const handleDelete = async () => {
  if (await confirm({ title: "Delete?", variant: "danger" })) {
    await execute({
      operation: () => service.delete(id),
      successMessage: "Deleted successfully"
    });
  }
};
```

### Page Data Loading
```tsx
const { error, isError, executeWithErrorHandling } = useApiError();

const fetchData = async () => {
  const result = await executeWithErrorHandling(() => service.get());
  if (result) setData(result);
};

if (isError) return <ApiErrorAlert error={error} onRetry={fetchData} />;
```

### Client-Side Validation
```tsx
const toast = useToast();

if (!email) {
  toast.warning("Email required", "Please enter your email");
  return;
}
```

### Non-API Notification
```tsx
const toast = useToast();

toast.success("Copied to clipboard");
toast.info("Processing in background");
toast.warning("Unsaved changes");
```

---

## 🔧 Complete Examples

### Example 1: Product Form Modal
```tsx
"use client";

import { useApiOperation } from "@/hooks/useApiOperation";
import { ProductDto } from "@/types/api.types";
import productService from "@/services/inventory.service";

export function ProductFormModal({ onClose, onSuccess }) {
  const { execute, isLoading, error, errorMessage } = useApiOperation();

  const handleSubmit = async (data: ProductDto) => {
    await execute({
      operation: () => productService.createProduct(data),
      successMessage: "Product created successfully",
      errorMessage: "Failed to create product",
      onSuccess: () => {
        onClose();
        onSuccess();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{errorMessage}</div>}

      {/* form fields */}

      <button type="submit" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Product"}
      </button>
    </form>
  );
}
```

### Example 2: Products Page
```tsx
"use client";

import { useEffect, useState } from "react";
import { useApiError } from "@/hooks/useApiError";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import productService from "@/services/inventory.service";

export default function ProductsPage() {
  const { error, isError, executeWithErrorHandling } = useApiError();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const result = await executeWithErrorHandling(
      () => productService.getProducts()
    );
    if (result) setProducts(result);
    setLoading(false);
  };

  if (loading) return <LoadingSpinner />;
  if (isError) return <ApiErrorAlert error={error} onRetry={fetchProducts} />;

  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### Example 3: POS Transaction
```tsx
"use client";

import { useApiOperation } from "@/hooks/useApiOperation";
import { useToast } from "@/hooks/useToast";
import salesService from "@/services/sales.service";

export function TransactionDialog({ cart, onSuccess }) {
  const { execute, isLoading } = useApiOperation();
  const toast = useToast();

  const handleProcessTransaction = async () => {
    // Client-side validation
    if (cart.length === 0) {
      toast.error("Cart is empty", "Add items before checkout");
      return;
    }

    if (paymentMethod === "cash" && amountPaid < total) {
      toast.error("Insufficient payment", `Need $${total.toFixed(2)}`);
      return;
    }

    // Process transaction
    await execute({
      operation: () => salesService.createSale(saleData),
      successMessage: "Transaction completed!",
      successDetail: `Invoice #${invoiceNumber} | Total: $${total.toFixed(2)}`,
      successDuration: 7000,
      onSuccess: () => {
        clearCart();
        onSuccess();
      }
    });
  };

  return (
    <button onClick={handleProcessTransaction} disabled={isLoading}>
      {isLoading ? "Processing..." : `Pay $${total.toFixed(2)}`}
    </button>
  );
}
```

---

## 🎨 Toast Types

```tsx
const toast = useToast();

// Success - green, checkmark icon
toast.success("Product created", "SKU: ABC123");

// Error - red, X icon
toast.error("Failed to save", "Please try again");

// Warning - yellow, warning icon
toast.warning("Low stock", "Only 5 items remaining");

// Info - blue, info icon
toast.info("Syncing data", "This may take a moment");
```

---

## ⚡ Hook API Reference

### `useApiOperation()`
```tsx
const { execute, isLoading, error, errorMessage, clearError } = useApiOperation();

await execute({
  operation: () => Promise<T>,      // Required: async function
  successMessage: string,            // Toast title on success
  successDetail?: string,            // Toast detail on success
  errorMessage?: string,             // Custom error toast title
  onSuccess?: (result) => void,      // Callback on success
  onError?: (error) => void,         // Callback on error
  showToast?: boolean,               // Default: true
  successDuration?: number,          // Default: 5000ms
  errorDuration?: number,            // Default: 8000ms
});
```

### `useToast()`
```tsx
const toast = useToast();

toast.success(title, message?, duration?);
toast.error(title, message?, duration?);
toast.warning(title, message?, duration?);
toast.info(title, message?, duration?);
```

### `useApiError()`
```tsx
const { error, isError, errorMessage, setError, clearError, executeWithErrorHandling }
  = useApiError();

const result = await executeWithErrorHandling(() => Promise<T>);
```

---

## 🚫 Common Mistakes

### ❌ Don't do this:
```tsx
try {
  await service.create(data);
  console.log("Success!");
} catch (err) {
  console.error("Error:", err);
}
```

### ✅ Do this instead:
```tsx
const { execute } = useApiOperation();

await execute({
  operation: () => service.create(data),
  successMessage: "Created successfully"
});
```

---

### ❌ Don't do this:
```tsx
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const save = async () => {
  setLoading(true);
  try {
    await service.save();
  } catch (err) {
    setError(err);
  }
  setLoading(false);
};
```

### ✅ Do this instead:
```tsx
const { execute, isLoading } = useApiOperation();

const save = async () => {
  await execute({
    operation: () => service.save(),
    successMessage: "Saved successfully"
  });
};
```

---

## 💡 Pro Tips

1. **Always provide success messages** for mutations (create/update/delete)
2. **Use `isLoading` for button disabled states**
3. **Validation before API calls** - use `toast.warning()` for validation errors
4. **Use descriptive messages** - "Product created" not "Success"
5. **Add details for important operations** - Invoice numbers, totals, etc.
6. **Longer durations for critical info** - POS transactions, payments (7-10s)
7. **Keep error handling consistent** - One pattern across the app
8. **Use callbacks for side effects** - Don't chain `.then()` after execute

---

## 📚 Related Files

- `/frontend/hooks/useApiOperation.tsx` - Main hook
- `/frontend/hooks/useToast.tsx` - Toast notifications
- `/frontend/hooks/useApiError.ts` - Error state management
- `/frontend/components/shared/ApiErrorAlert.tsx` - Error display component
- `/frontend/docs/ERROR_HANDLING_PATTERN.md` - Full documentation

---

## Need Help?

**"Which hook should I use?"**
- API call → `useApiOperation()`
- Just a message → `useToast()`
- Page loading → `useApiError()`

**"How do I show loading state?"**
```tsx
const { execute, isLoading } = useApiOperation();
// Use isLoading for button disabled and loading text
```

**"How do I handle validation?"**
```tsx
const toast = useToast();
if (!valid) {
  toast.warning("Validation failed", "Please check your input");
  return;
}
```

**"How do I show persistent errors?"**
```tsx
const { error, isError } = useApiError();
if (isError) return <ApiErrorAlert error={error} />;
```
