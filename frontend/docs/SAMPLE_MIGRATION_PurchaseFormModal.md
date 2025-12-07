# Sample Migration: PurchaseFormModal.tsx

This document shows a **real migration** of `PurchaseFormModal.tsx` using the standardized error handling pattern.

## Summary of Changes

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Lines of code | 489 | 470 | ⬇️ 19 lines (4%) |
| State variables | 3 (loading, error, validationErrors) | 2 (validationErrors + hook) | ⬇️ 1 variable |
| User feedback | Error div only | Toast + Error div (dropdown loading) | ⬆️ Better UX |
| Error handling | Manual try-catch | Automatic via hook | ✅ Cleaner |
| Success feedback | None | Success toast | ✅ Added |

---

## Key Changes

### 1. Imports (Lines 1-11)

**BEFORE:**
```tsx
import { useState, useEffect } from "react";
// No toast/operation hooks
```

**AFTER:**
```tsx
import { useState, useEffect } from "react";
import { useApiOperation } from "@/hooks/useApiOperation";
import { useApiError } from "@/hooks/useApiError";
import { useToast } from "@/hooks/useToast";
```

---

### 2. State Management (Lines 33-46)

**BEFORE:**
```tsx
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
```

**AFTER:**
```tsx
// Hooks for API operations
const { execute, isLoading } = useApiOperation();
const { executeWithErrorHandling } = useApiError();
const toast = useToast();

// Only keep validation errors state (client-side validation)
const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
```

**Explanation:**
- ❌ Removed manual `loading` state → use `isLoading` from `useApiOperation()`
- ❌ Removed manual `error` state → handled by hooks
- ✅ Kept `validationErrors` → client-side validation (not API error)

---

### 3. Data Loading (Lines 86-97)

**BEFORE:**
```tsx
const loadDropdownData = async () => {
  try {
    const [suppliersResponse, productsData] = await Promise.all([
      supplierService.getSuppliers({ includeInactive: false, pageSize: 1000 }),
      inventoryService.getProducts({ pageSize: 1000 }),
    ]);
    setSuppliers(suppliersResponse.data);
    setProducts(productsData.data);
  } catch (err: any) {
    setError(err.message || "Failed to load dropdown data");
  }
};
```

**AFTER:**
```tsx
const loadDropdownData = async () => {
  const result = await executeWithErrorHandling(async () => {
    const [suppliersResponse, productsData] = await Promise.all([
      supplierService.getSuppliers({ includeInactive: false, pageSize: 1000 }),
      inventoryService.getProducts({ pageSize: 1000 }),
    ]);
    return { suppliers: suppliersResponse.data, products: productsData.data };
  });

  if (result) {
    setSuppliers(result.suppliers);
    setProducts(result.products);
  } else {
    // If dropdown data fails to load, show toast and close modal
    toast.error(
      "Failed to load form data",
      "Unable to load suppliers and products. Please try again."
    );
    onClose();
  }
};
```

**Explanation:**
- ✅ Use `executeWithErrorHandling` for silent error capture
- ✅ Show user-friendly toast if data loading fails
- ✅ Close modal gracefully (can't create purchase without dropdown data)
- ❌ No more manual try-catch

---

### 4. Validation (Lines 102-119)

**NO CHANGE** - Client-side validation stays the same:
```tsx
const validateForm = (): boolean => {
  const errors: Record<string, string> = {};

  if (!formData.supplierId) errors.supplierId = "Supplier is required";
  if (!formData.purchaseDate) errors.purchaseDate = "Purchase date is required";
  if (lineItems.length === 0) errors.lineItems = "At least one product is required";

  // ... more validation

  setValidationErrors(errors);
  return Object.keys(errors).length === 0;
};
```

**Explanation:**
- ✅ Keep client-side validation logic as-is
- ℹ️ This is NOT API error handling - it's form validation

---

### 5. Form Submission (Lines 191-222) ⭐ **BIGGEST CHANGE**

**BEFORE:**
```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) {
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const purchaseData = {
      supplierId: formData.supplierId,
      purchaseDate: formData.purchaseDate,
      lineItems: lineItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCost,
      })),
      notes: formData.notes.trim() || undefined,
    };

    await inventoryService.createPurchase(purchaseData);
    onSuccess();
    onClose();
  } catch (err: any) {
    setError(err.response?.data?.message || err.message || "Failed to create purchase");
    console.error("Failed to create purchase:", err);
  } finally {
    setLoading(false);
  }
};
```

**AFTER:**
```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Client-side validation
  if (!validateForm()) {
    toast.warning(
      "Form validation failed",
      "Please fill in all required fields correctly"
    );
    return;
  }

  const purchaseData = {
    supplierId: formData.supplierId,
    purchaseDate: formData.purchaseDate,
    lineItems: lineItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitCost: item.unitCost,
    })),
    notes: formData.notes.trim() || undefined,
  };

  // Get supplier name for success message
  const supplier = suppliers.find((s) => s.id === formData.supplierId);
  const totalCost = calculateTotalCost();

  await execute({
    operation: () => inventoryService.createPurchase(purchaseData),
    successMessage: "Purchase order created successfully",
    successDetail: `PO for ${supplier?.nameEn || "supplier"} - Total: $${totalCost.toFixed(2)}`,
    errorMessage: "Failed to create purchase order",
    onSuccess: () => {
      onSuccess(); // Refresh parent list
      onClose();  // Close modal
    },
  });
};
```

**Explanation:**
- ❌ Removed manual `setLoading(true/false)`
- ❌ Removed manual `setError(null)`
- ❌ Removed try-catch block
- ❌ Removed console.error
- ✅ Added validation toast (user-friendly)
- ✅ Added success toast with details (supplier name, total cost)
- ✅ Automatic error toast via `useApiOperation()`
- ✅ Cleaner, more readable code

---

### 6. Error Display (Lines 244-248)

**BEFORE:**
```tsx
{error && (
  <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
    {error}
  </div>
)}
```

**AFTER:**
```tsx
{/* No error display needed - toast handles it */}
```

**Explanation:**
- ❌ Removed manual error div
- ✅ Errors shown via toast (better UX, dismissible, auto-hide)
- ℹ️ If you want persistent error display for dropdown loading, you could use `ApiErrorAlert`

---

### 7. Button State (Lines 476-483)

**BEFORE:**
```tsx
<button
  type="submit"
  onClick={handleSubmit}
  disabled={loading}
  className="..."
>
  {loading ? "Creating..." : "Create Purchase Order"}
</button>
```

**AFTER:**
```tsx
<button
  type="submit"
  onClick={handleSubmit}
  disabled={isLoading}
  className="..."
>
  {isLoading ? "Creating..." : "Create Purchase Order"}
</button>
```

**Explanation:**
- Changed `loading` → `isLoading` (from hook)

---

## Complete Migrated Code (Key Sections)

```tsx
"use client";

import { useState, useEffect } from "react";
import { useApiOperation } from "@/hooks/useApiOperation";
import { useApiError } from "@/hooks/useApiError";
import { useToast } from "@/hooks/useToast";
import inventoryService from "@/services/inventory.service";
import supplierService from "@/services/supplier.service";
import { PurchaseDto, SupplierDto, ProductDto, CreatePurchaseLineItemDto } from "@/types/api.types";

// ... interface definitions ...

export default function PurchaseFormModal({ isOpen, onClose, onSuccess, purchase }: PurchaseFormModalProps) {
  const isViewMode = !!purchase;

  // Hooks
  const { execute, isLoading } = useApiOperation();
  const { executeWithErrorHandling } = useApiError();
  const toast = useToast();

  // Form state
  const [formData, setFormData] = useState({
    supplierId: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [lineItems, setLineItems] = useState<LineItemForm[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Load dropdown data
  useEffect(() => {
    if (isOpen) {
      loadDropdownData();
      // ... reset form logic ...
      setValidationErrors({});
    }
  }, [isOpen, purchase]);

  const loadDropdownData = async () => {
    const result = await executeWithErrorHandling(async () => {
      const [suppliersResponse, productsData] = await Promise.all([
        supplierService.getSuppliers({ includeInactive: false, pageSize: 1000 }),
        inventoryService.getProducts({ pageSize: 1000 }),
      ]);
      return { suppliers: suppliersResponse.data, products: productsData.data };
    });

    if (result) {
      setSuppliers(result.suppliers);
      setProducts(result.products);
    } else {
      toast.error("Failed to load form data", "Unable to load suppliers and products. Please try again.");
      onClose();
    }
  };

  // ... other functions (validateForm, handleAddLineItem, etc.) ...

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.warning("Form validation failed", "Please fill in all required fields correctly");
      return;
    }

    const purchaseData = {
      supplierId: formData.supplierId,
      purchaseDate: formData.purchaseDate,
      lineItems: lineItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCost,
      })),
      notes: formData.notes.trim() || undefined,
    };

    const supplier = suppliers.find((s) => s.id === formData.supplierId);
    const totalCost = calculateTotalCost();

    await execute({
      operation: () => inventoryService.createPurchase(purchaseData),
      successMessage: "Purchase order created successfully",
      successDetail: `PO for ${supplier?.nameEn || "supplier"} - Total: $${totalCost.toFixed(2)}`,
      errorMessage: "Failed to create purchase order",
      onSuccess: () => {
        onSuccess();
        onClose();
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800  rounded-lg shadow-xl max-w-4xl w-full mx-4 my-8">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {isViewMode ? "Purchase Order Details" : "Create Purchase Order"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* No error div - toast handles it */}

          {/* ... form fields (unchanged) ... */}
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
            {isViewMode ? "Close" : "Cancel"}
          </button>
          {!isViewMode && (
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating..." : "Create Purchase Order"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## Testing Checklist

### ✅ Success Cases
- [ ] Fill form with valid data → Submit → Success toast appears
- [ ] Success toast shows supplier name and total cost
- [ ] Modal closes after successful submission
- [ ] Parent list refreshes (onSuccess callback)
- [ ] Button shows "Creating..." during submission
- [ ] Cannot double-submit (button disabled)

### ✅ Error Cases
- [ ] Backend offline → Error toast with "Failed to create purchase order"
- [ ] Validation error → Toast shows field-specific errors
- [ ] API error (400) → Toast shows server message
- [ ] Network error → Toast shows connection error

### ✅ Data Loading
- [ ] Modal opens → Suppliers and products load
- [ ] Dropdown loading fails → Toast error + modal closes gracefully
- [ ] No console.error in browser console

### ✅ Validation
- [ ] Empty supplier → Warning toast + inline error
- [ ] Empty date → Warning toast + inline error
- [ ] No line items → Warning toast + inline error
- [ ] Invalid quantity/cost → Inline errors shown

---

## Benefits Demonstrated

| Benefit | Evidence |
|---------|----------|
| **Less Code** | Removed 19 lines (4% reduction) |
| **Better UX** | Success toast with details, validation warnings |
| **Cleaner Code** | No manual try-catch, state management |
| **Consistency** | Uses standardized hooks |
| **Maintainability** | Less boilerplate, easier to read |
| **Error Handling** | Automatic error extraction and display |
| **Success Feedback** | User knows operation succeeded |

---

## Migration Time

**Estimated:** 20-25 minutes
**Actual:** Can be done in one sitting

**Steps:**
1. Add imports (1 min)
2. Replace state with hooks (2 min)
3. Update loadDropdownData (3 min)
4. Update handleSubmit (10 min)
5. Remove error div (1 min)
6. Update button state (1 min)
7. Test thoroughly (10 min)

---

## Next Steps

After migrating this file:

1. **Test thoroughly** using checklist above
2. **Apply to similar modals:**
   - ExpenseFormModal.tsx
   - CustomerFormModal.tsx
   - CategoryFormModal.tsx
   - SupplierFormModal.tsx

3. **Move to pages** for consistent pattern

---

## References

- [ERROR_HANDLING_PATTERN.md](./ERROR_HANDLING_PATTERN.md) - Full documentation
- [ERROR_HANDLING_QUICK_REFERENCE.md](./ERROR_HANDLING_QUICK_REFERENCE.md) - Quick lookup
- [MIGRATION_EXAMPLES.md](./MIGRATION_EXAMPLES.md) - More examples
