# Standardized Error & Success Handling Pattern

This document describes the standardized approach for handling API operations, errors, and user feedback in the frontend application.

## Table of Contents
- [Overview](#overview)
- [Available Tools](#available-tools)
- [Decision Tree](#decision-tree)
- [Usage Examples](#usage-examples)
- [Migration Guide](#migration-guide)
- [Best Practices](#best-practices)

---

## Overview

We have **4 main tools** for handling feedback and errors:

1. **`useApiOperation()`** - New standardized hook (⭐ **Recommended for most cases**)
2. **`useToast()`** - Direct toast notifications
3. **`useApiError()`** - Error state management
4. **`ApiErrorAlert`** - Error display component

---

## Available Tools

### 1. `useApiOperation()` ⭐ **Use This for Most Cases**

**Purpose:** Unified hook for API operations with automatic toast notifications and error handling.

**When to use:**
- Form submissions (create/update/delete)
- Any API operation that needs user feedback
- Operations that need success/error notifications
- When you want automatic error handling with toast

**Features:**
- ✅ Automatic toast notifications (success & error)
- ✅ Loading state management
- ✅ Error state tracking
- ✅ User-friendly error messages
- ✅ Success/error callbacks
- ✅ Customizable messages

**Example:**
```tsx
import { useApiOperation } from "@/hooks/useApiOperation";

function MyComponent() {
  const { execute, isLoading } = useApiOperation();

  const handleCreate = async (data: ProductDto) => {
    await execute({
      operation: () => productService.createProduct(data),
      successMessage: "Product created successfully",
      errorMessage: "Failed to create product",
      onSuccess: () => {
        router.push("/products");
      }
    });
  };

  return (
    <button onClick={handleCreate} disabled={isLoading}>
      {isLoading ? "Creating..." : "Create Product"}
    </button>
  );
}
```

---

### 2. `useToast()` - Direct Toast Notifications

**Purpose:** Show transient notifications to users.

**When to use:**
- Custom notifications not tied to API operations
- Manual control over toast timing and content
- Multiple notifications in sequence
- Non-API feedback (e.g., "Copied to clipboard")

**Example:**
```tsx
import { useToast } from "@/hooks/useToast";

function MyComponent() {
  const toast = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleValidation = () => {
    if (!data.email) {
      toast.warning("Email is required", "Please enter your email address");
      return;
    }
  };

  return <button onClick={handleCopy}>Copy</button>;
}
```

**Available methods:**
- `toast.success(title, message?, duration?)`
- `toast.error(title, message?, duration?)`
- `toast.warning(title, message?, duration?)`
- `toast.info(title, message?, duration?)`

---

### 3. `useApiError()` - Error State Management

**Purpose:** Manage error state and display persistent errors.

**When to use:**
- Page-level data fetching with error display
- When you need persistent error state
- When using `ApiErrorAlert` component for visual feedback
- Complex error handling with retry logic

**Example:**
```tsx
import { useApiError } from "@/hooks/useApiError";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";

function MyComponent() {
  const { error, isError, setError, clearError, executeWithErrorHandling } = useApiError();

  const fetchData = async () => {
    const result = await executeWithErrorHandling(
      () => productService.getProducts()
    );

    if (result) {
      setProducts(result);
    }
  };

  if (isError) {
    return <ApiErrorAlert error={error} onRetry={fetchData} onDismiss={clearError} />;
  }

  return <div>Content</div>;
}
```

---

### 4. `ApiErrorAlert` - Error Display Component

**Purpose:** Visual component for displaying errors.

**When to use:**
- Displaying persistent errors on page load
- Showing network/connection errors
- Providing retry functionality
- Page-level error boundaries

**Variants:**
- `<ApiErrorAlert />` - Full error card with details
- `<InlineApiError />` - Compact inline error
- `<EmptyState />` - Empty data state (not an error)

**Example:**
```tsx
import { ApiErrorAlert, InlineApiError } from "@/components/shared/ApiErrorAlert";

// Full error card
<ApiErrorAlert
  error={error}
  onRetry={refetch}
  onDismiss={clearError}
/>

// Inline error
<InlineApiError error={error} onRetry={refetch} />

// Empty state
<EmptyState
  icon="📦"
  title="No products found"
  message="Get started by creating your first product"
  action={{ label: "Create Product", onClick: handleCreate }}
/>
```

---

## Decision Tree

```
Do you need to perform an API operation?
│
├─ YES
│  │
│  ├─ Is it a form submission or mutation (create/update/delete)?
│  │  └─ ✅ Use useApiOperation()
│  │     Example: Creating product, updating customer, deleting expense
│  │
│  ├─ Is it data fetching with persistent error display?
│  │  └─ ✅ Use useApiError() + ApiErrorAlert
│  │     Example: Loading products on page load, fetching reports
│  │
│  └─ Is it a simple fetch that needs toast on error?
│     └─ ✅ Use useApiOperation() with showToast
│        Example: Quick data refresh, autocomplete search
│
└─ NO
   │
   └─ Do you need to show user feedback?
      └─ ✅ Use useToast() directly
         Example: Copy to clipboard, validation messages, client-side actions
```

---

## Usage Examples

### Example 1: Form Submission (CREATE)
```tsx
// ✅ RECOMMENDED: Using useApiOperation
const { execute, isLoading } = useApiOperation();

const handleCreate = async (formData: CreateProductDto) => {
  await execute({
    operation: () => productService.createProduct(formData),
    successMessage: "Product created successfully",
    errorMessage: "Failed to create product",
    onSuccess: (result) => {
      onClose();
      refreshProducts();
    }
  });
};
```

### Example 2: Form Submission (UPDATE)
```tsx
const { execute, isLoading } = useApiOperation();

const handleUpdate = async (id: string, data: UpdateProductDto) => {
  await execute({
    operation: () => productService.updateProduct(id, data),
    successMessage: "Product updated successfully",
    successDetail: `${data.name} has been updated`,
    onSuccess: () => {
      onClose();
      refreshProducts();
    }
  });
};
```

### Example 3: Delete Operation with Confirmation
```tsx
const { execute, isLoading } = useApiOperation();
const { confirm } = useConfirmation();

const handleDelete = async (id: string, name: string) => {
  const confirmed = await confirm({
    title: "Delete Product",
    message: `Are you sure you want to delete "${name}"?`,
    variant: "danger"
  });

  if (!confirmed) return;

  await execute({
    operation: () => productService.deleteProduct(id),
    successMessage: "Product deleted",
    successDetail: `${name} has been removed`,
    errorMessage: "Failed to delete product",
    onSuccess: () => {
      refreshProducts();
    }
  });
};
```

### Example 4: Page Data Loading with Error Display
```tsx
const { error, isError, executeWithErrorHandling } = useApiError();
const [products, setProducts] = useState<ProductDto[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchProducts();
}, []);

const fetchProducts = async () => {
  setLoading(true);
  const result = await executeWithErrorHandling(
    () => productService.getProducts()
  );

  if (result) {
    setProducts(result);
  }
  setLoading(false);
};

if (loading) return <LoadingSpinner />;

if (isError) {
  return <ApiErrorAlert error={error} onRetry={fetchProducts} />;
}

return <ProductList products={products} />;
```

### Example 5: Multiple Operations in Sequence
```tsx
const { execute } = useApiOperation();
const toast = useToast();

const handleBulkImport = async (files: File[]) => {
  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const result = await execute({
      operation: () => importService.importFile(file),
      showToast: false, // Don't show toast for each file
      onSuccess: () => successCount++,
      onError: () => errorCount++
    });
  }

  // Show summary toast
  if (successCount > 0) {
    toast.success(
      "Import completed",
      `${successCount} files imported successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`
    );
  } else {
    toast.error("Import failed", "No files were imported");
  }
};
```

### Example 6: Custom Validation with Toast
```tsx
const toast = useToast();
const { execute } = useApiOperation();

const handleSubmit = async (data: FormData) => {
  // Client-side validation
  if (!data.email) {
    toast.warning("Email required", "Please enter your email address");
    return;
  }

  if (!data.password || data.password.length < 8) {
    toast.error("Invalid password", "Password must be at least 8 characters");
    return;
  }

  // API operation
  await execute({
    operation: () => authService.register(data),
    successMessage: "Registration successful",
    successDetail: "Welcome! Please check your email to verify your account.",
    onSuccess: () => router.push("/dashboard")
  });
};
```

### Example 7: POS Transaction Flow
```tsx
const { execute, isLoading } = useApiOperation();

const handleProcessTransaction = async () => {
  // Validate cart
  if (cart.length === 0) {
    toast.error("Cart is empty", "Please add items before checkout");
    return;
  }

  // Process transaction
  await execute({
    operation: () => salesService.createSale(saleData),
    successMessage: "Transaction completed!",
    successDetail: `Invoice #${invoiceNumber} | Total: $${total.toFixed(2)}`,
    successDuration: 7000, // Show longer for POS
    errorDuration: 10000,
    onSuccess: () => {
      clearCart();
      onClose();
    }
  });
};
```

---

## Migration Guide

### Migrating from `console.error()` + manual error handling

**❌ OLD WAY:**
```tsx
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleCreate = async (data: ProductDto) => {
  setLoading(true);
  setError(null);

  try {
    await productService.createProduct(data);
    console.log("Product created");
    onSuccess();
  } catch (err: any) {
    console.error("Error creating product:", err);
    setError(err.message || "Failed to create product");
  } finally {
    setLoading(false);
  }
};
```

**✅ NEW WAY:**
```tsx
const { execute, isLoading } = useApiOperation();

const handleCreate = async (data: ProductDto) => {
  await execute({
    operation: () => productService.createProduct(data),
    successMessage: "Product created successfully",
    onSuccess: () => onSuccess()
  });
};
```

### Migrating from `useApiError()` only

**❌ OLD WAY (no user feedback):**
```tsx
const { setError, executeWithErrorHandling } = useApiError();

const handleCreate = async (data: ProductDto) => {
  const result = await executeWithErrorHandling(
    () => productService.createProduct(data)
  );

  if (result) {
    console.log("Success!");
    onSuccess();
  }
};
```

**✅ NEW WAY:**
```tsx
const { execute } = useApiOperation();

const handleCreate = async (data: ProductDto) => {
  await execute({
    operation: () => productService.createProduct(data),
    successMessage: "Product created successfully",
    onSuccess: () => onSuccess()
  });
};
```

### Migrating from mixed patterns

**❌ OLD WAY:**
```tsx
const toast = useToast();
const [loading, setLoading] = useState(false);

const handleCreate = async (data: ProductDto) => {
  setLoading(true);
  try {
    await productService.createProduct(data);
    toast.success("Product created");
    onSuccess();
  } catch (err: any) {
    toast.error("Failed to create product", err.message);
  } finally {
    setLoading(false);
  }
};
```

**✅ NEW WAY:**
```tsx
const { execute, isLoading } = useApiOperation();

const handleCreate = async (data: ProductDto) => {
  await execute({
    operation: () => productService.createProduct(data),
    successMessage: "Product created successfully",
    onSuccess: () => onSuccess()
  });
};
```

---

## Best Practices

### ✅ DO

1. **Use `useApiOperation()` for all API mutations** (create/update/delete)
2. **Provide clear, user-friendly messages** - Avoid technical jargon
3. **Use success callbacks for cleanup** - Close modals, refresh data, navigate
4. **Show appropriate toast duration** - Longer for important messages (7-10s), shorter for simple feedback (3-5s)
5. **Use `ApiErrorAlert` for page-level errors** - Network errors, 404s, initial data loading
6. **Validate client-side before API calls** - Use `toast.warning()` for validation errors
7. **Provide context in error messages** - Tell users what went wrong and what to do
8. **Use `isLoading` for button states** - Prevent double-clicks and show feedback

### ❌ DON'T

1. **Don't use `console.error()` for user-facing errors** - Users can't see the console
2. **Don't mix patterns** - Pick one approach and stick with it
3. **Don't show technical error details to users** - Keep messages friendly
4. **Don't ignore errors silently** - Always provide feedback
5. **Don't create custom loading states** - Use the built-in `isLoading` from hooks
6. **Don't nest try-catch unnecessarily** - Let the hook handle errors
7. **Don't show toast for every minor action** - Use for important feedback only
8. **Don't block the UI with errors** - Use dismissable toasts/alerts

### Message Guidelines

**Success Messages:**
- ✅ "Product created successfully"
- ✅ "Customer updated"
- ✅ "Invoice sent to customer"
- ❌ "Operation completed" (too vague)
- ❌ "Success!" (no context)

**Error Messages:**
- ✅ "Failed to create product"
- ✅ "Unable to connect to server"
- ✅ "Email is already in use"
- ❌ "Error occurred" (too vague)
- ❌ "500 Internal Server Error" (too technical)

**Warning Messages:**
- ✅ "Email is required"
- ✅ "Stock level is low (5 remaining)"
- ✅ "This action cannot be undone"
- ❌ "Invalid input" (not specific)

---

## Summary

| Tool | Use Case | User Feedback | Error State | Loading State |
|------|----------|---------------|-------------|---------------|
| `useApiOperation()` | API mutations, form submissions | ✅ Automatic toast | ✅ Yes | ✅ Yes |
| `useToast()` | Manual notifications, non-API feedback | ✅ Manual toast | ❌ No | ❌ No |
| `useApiError()` | Page data loading, persistent errors | ❌ No toast | ✅ Yes | ❌ No |
| `ApiErrorAlert` | Visual error display | ✅ Visual component | ❌ No (displays error) | ❌ No |

**General Rule of Thumb:**
- **API operation** → `useApiOperation()`
- **Non-API feedback** → `useToast()`
- **Page errors** → `useApiError()` + `ApiErrorAlert`
- **Visual error display** → `ApiErrorAlert`

---

## Questions?

If you're unsure which tool to use, ask yourself:

1. **Is this an API operation?** → Yes: `useApiOperation()`, No: `useToast()`
2. **Do I need persistent error display?** → Yes: `useApiError()` + `ApiErrorAlert`
3. **Is it just a notification?** → `useToast()`

Still unsure? **Default to `useApiOperation()`** for API calls and **`useToast()`** for everything else.
