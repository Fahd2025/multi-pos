# useApiError Hook Implementation Example

## Overview

This document shows a real-world example of refactoring a component to use the `useApiError` hook for better error handling.

## Component: ProductFormModal

### ❌ Before (Basic Error Handling)

```tsx
"use client";

import { useState } from "react";
import { ProductDto, CategoryDto, CreateProductDto, UpdateProductDto } from "@/types/api.types";
import inventoryService from "@/services/inventory.service";
import { ModalBottomSheet } from "@/components/modals";
import { FormField } from "@/types/data-table.types";

export default function ProductFormModal({
  isOpen,
  onClose,
  onSuccess,
  product,
  categories,
}: ProductFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const productData = {
        sku: data.sku,
        nameEn: data.nameEn,
        // ... more fields
      };

      if (product) {
        await inventoryService.updateProduct(product.id, productData);
      } else {
        await inventoryService.createProduct(productData);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to save product:", err); // ❌ Only logs to console
      alert(err.message || "Failed to save product"); // ❌ Basic alert
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={product ? "Edit Product" : "Add New Product"}
      fields={fields}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
}
```

### ✅ After (Using useApiError Hook)

```tsx
"use client";

import { useState } from "react";
import { ProductDto, CategoryDto, CreateProductDto, UpdateProductDto } from "@/types/api.types";
import inventoryService from "@/services/inventory.service";
import { ModalBottomSheet } from "@/components/modals";
import { FormField } from "@/types/data-table.types";
import { useApiError } from "@/hooks/useApiError"; // ✅ Import hook
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert"; // ✅ Import error component

export default function ProductFormModal({
  isOpen,
  onClose,
  onSuccess,
  product,
  categories,
}: ProductFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error, isError, executeWithErrorHandling, clearError } = useApiError(); // ✅ Use hook

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);

    // ✅ Use executeWithErrorHandling - no try/catch needed!
    const result = await executeWithErrorHandling(async () => {
      const productData = {
        sku: data.sku,
        nameEn: data.nameEn,
        // ... more fields
      };

      if (product) {
        return await inventoryService.updateProduct(product.id, productData);
      } else {
        return await inventoryService.createProduct(productData);
      }
    });

    setIsSubmitting(false);

    if (result) {
      // ✅ Only runs on success
      onSuccess();
      onClose();
      clearError();
    }
    // ✅ Error is automatically set and displayed if the function throws
  };

  // ✅ Clear errors when modal closes
  const handleClose = () => {
    clearError();
    onClose();
  };

  return (
    <>
      {/* ✅ User-friendly error display */}
      {isOpen && isError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[60] max-w-2xl w-full px-4">
          <ApiErrorAlert error={error} onDismiss={clearError} />
        </div>
      )}

      <ModalBottomSheet
        isOpen={isOpen}
        onClose={handleClose} // ✅ Use handleClose to clear errors
        title={product ? "Edit Product" : "Add New Product"}
        fields={fields}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
```

## Key Improvements

### 1. **Better Error Display**

- ❌ Before: `alert(err.message)` - Basic browser alert
- ✅ After: `<ApiErrorAlert>` - Beautiful, user-friendly error component with:
  - Appropriate icons for different error types
  - Clear, actionable messages
  - Dismissible
  - Technical details (collapsible)

### 2. **Cleaner Code**

- ❌ Before: Manual try/catch blocks
- ✅ After: `executeWithErrorHandling` wrapper - cleaner and more consistent

### 3. **Automatic Error Detection**

- ❌ Before: Generic error messages
- ✅ After: Automatically detects:
  - Network errors (🔌 "Unable to connect to server")
  - 404 errors (🔍 "Service unavailable")
  - 401 errors (🔒 "Authentication required")
  - 403 errors (⛔ "Access denied")
  - 500+ errors (⚠️ "Server error")

### 4. **Error Cleanup**

- ❌ Before: Errors persist even after modal closes
- ✅ After: `clearError()` called when modal closes

### 5. **No Console Pollution**

- ❌ Before: `console.error()` clutters the console
- ✅ After: Errors shown to user in UI, not just console

## Visual Comparison

### Before (Alert)

```
┌─────────────────────────────────┐
│  ⚠️  Failed to save product     │
│                                 │
│            [ OK ]               │
└─────────────────────────────────┘
```

- Blocks the entire UI
- No context about the error
- No retry option
- Not dismissible without clicking OK

### After (ApiErrorAlert)

```
┌───────────────────────────────────────────────────────────┐
│  🔌  Connection Error                           [Dismiss] │
│                                                            │
│  Unable to connect to the server. Please check your       │
│  internet connection.                                     │
│                                                            │
│  ▸ Technical Details                                      │
└───────────────────────────────────────────────────────────┘
```

- Non-blocking
- Clear, user-friendly message
- Appropriate icon
- Dismissible
- Technical details available for debugging

## Error Handling Flow

### Before

```
User Action → API Call → Error → console.error() → alert()
                                      ↓
                                  (Hidden from user)
```

### After

```
User Action → API Call → Error → executeWithErrorHandling()
                                      ↓
                                  setError()
                                      ↓
                                  <ApiErrorAlert>
                                      ↓
                                  User sees friendly message
```

## Usage in Other Components

This pattern can be applied to any component that makes API calls:

### Form Modals

- ✅ ProductFormModal (refactored)
- CustomerFormModal
- ExpenseFormModal
- CategoryFormModal
- PurchaseFormModal

### Data Pages

- Products page
- Sales page
- Customers page
- Inventory page

### Dashboard Components

- Analytics widgets
- Summary cards
- Charts with API data

## Migration Checklist

When refactoring a component to use `useApiError`:

- [ ] Import `useApiError` hook
- [ ] Import `ApiErrorAlert` component
- [ ] Add hook to component: `const { error, isError, executeWithErrorHandling, clearError } = useApiError()`
- [ ] Replace try/catch with `executeWithErrorHandling`
- [ ] Remove `console.error()` and `alert()` calls
- [ ] Add `<ApiErrorAlert>` to render
- [ ] Add `clearError()` to cleanup functions (modal close, navigation, etc.)
- [ ] Update success handling to check `if (result)`
- [ ] Test error scenarios (network error, 404, 500, etc.)

## Testing the Implementation

To test the error handling:

1. **Network Error**: Turn off backend server

   - Should show: 🔌 "Unable to connect to the server..."

2. **404 Error**: Use wrong API endpoint

   - Should show: 🔍 "The requested service is not available..."

3. **Validation Error**: Submit invalid data

   - Should show: ❌ Custom error message from API

4. **Success**: Submit valid data
   - Should close modal and clear any previous errors

## Benefits Summary

✅ **User Experience**

- Clear, actionable error messages
- Non-blocking UI
- Dismissible errors
- Retry functionality (when applicable)

✅ **Developer Experience**

- Cleaner code (no try/catch boilerplate)
- Consistent error handling across app
- Easy to test
- TypeScript support

✅ **Maintainability**

- Centralized error logic
- Easy to update error messages
- Consistent UI patterns
- Less code duplication

## Next Steps

1. Refactor other form modals to use `useApiError`
2. Update data fetching pages to use the hook
3. Add retry functionality where appropriate
4. Consider adding error tracking/logging service
5. Add unit tests for error scenarios
