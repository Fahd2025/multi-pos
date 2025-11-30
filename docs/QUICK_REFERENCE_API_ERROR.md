# useApiError Hook - Quick Reference

## Import

```tsx
import { useApiError } from "@/hooks/useApiError";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
```

## Basic Setup

```tsx
const {
  error, // The full error object
  isError, // Boolean: true if there's an error
  errorMessage, // User-friendly error message string
  setError, // Function to manually set an error
  clearError, // Function to clear the error
  executeWithErrorHandling, // Wrapper function for automatic error handling
} = useApiError();
```

## Method 1: Manual Error Handling

```tsx
const loadData = async () => {
  try {
    clearError(); // Clear previous errors
    const data = await api.getData();
    setData(data);
  } catch (err) {
    setError(err); // Set the error
  }
};
```

## Method 2: Automatic Error Handling (Recommended)

```tsx
const loadData = async () => {
  const result = await executeWithErrorHandling(async () => {
    return await api.getData();
  });

  if (result) {
    setData(result); // Only runs on success
  }
  // Error is automatically set if the function throws
};
```

## Display Error

```tsx
{
  isError && (
    <ApiErrorAlert
      error={error}
      onRetry={loadData} // Optional: retry function
      onDismiss={clearError} // Optional: dismiss function
    />
  );
}
```

## Common Patterns

### Pattern 1: Fetch on Mount

```tsx
useEffect(() => {
  const fetchData = async () => {
    const result = await executeWithErrorHandling(async () => {
      return await api.getData();
    });
    if (result) setData(result);
  };
  fetchData();
}, []);
```

### Pattern 2: Form Submission

```tsx
const handleSubmit = async (e) => {
  e.preventDefault();
  const result = await executeWithErrorHandling(async () => {
    return await api.submitForm(formData);
  });
  if (result) {
    onSuccess();
  }
};
```

### Pattern 3: With Loading State

```tsx
const loadData = async () => {
  setLoading(true);
  const result = await executeWithErrorHandling(async () => {
    return await api.getData();
  });
  if (result) setData(result);
  setLoading(false);
};
```

## Complete Example

```tsx
"use client";

import { useState, useEffect } from "react";
import { useApiError } from "@/hooks/useApiError";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function MyPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { error, isError, executeWithErrorHandling, clearError } = useApiError();

  const loadData = async () => {
    setLoading(true);
    const result = await executeWithErrorHandling(async () => {
      return await api.getData();
    });
    if (result) setData(result);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div>
      {isError && <ApiErrorAlert error={error} onRetry={loadData} onDismiss={clearError} />}

      {loading && <LoadingSpinner />}

      {!loading && !isError && <div>{/* Your content */}</div>}
    </div>
  );
}
```

## Error Types Handled

| Type              | Icon | Auto-Message                              |
| ----------------- | ---- | ----------------------------------------- |
| Network Error     | 🔌   | "Unable to connect to the server..."      |
| 404 Not Found     | 🔍   | "The requested resource was not found..." |
| 401 Unauthorized  | 🔒   | "Authentication required..."              |
| 403 Forbidden     | ⛔   | "You do not have permission..."           |
| 500+ Server Error | ⚠️   | "A server error occurred..."              |
| Generic           | ❌   | Custom message or generic error           |

## Best Practices

✅ **DO:**

- Use `executeWithErrorHandling` for cleaner code
- Store the full error object, not just the message
- Provide retry functionality
- Clear errors when closing modals
- Hide content when there's an error

❌ **DON'T:**

- Store only `error.message` (loses error type info)
- Show stale data when there's an error
- Forget to clear errors on navigation/modal close
- Use for non-API errors (use regular try/catch)

## TypeScript Support

```tsx
interface Product {
  id: string;
  name: string;
}

const loadProducts = async () => {
  const result = await executeWithErrorHandling<Product[]>(async () => {
    return await api.getProducts();
  });

  if (result) {
    // result is typed as Product[] | null
    setProducts(result);
  }
};
```

## With Multiple API Calls

```tsx
const loadDashboard = async () => {
  const result = await executeWithErrorHandling(async () => {
    const [sales, inventory, customers] = await Promise.all([
      api.getSales(),
      api.getInventory(),
      api.getCustomers(),
    ]);
    return { sales, inventory, customers };
  });

  if (result) {
    setDashboardData(result);
  }
};
```

## Inline Error Display

For smaller, inline errors:

```tsx
import { InlineApiError } from "@/components/shared/ApiErrorAlert";

if (error) return <InlineApiError error={error} onRetry={loadData} />;
```

## Empty State (Not an Error)

```tsx
import { EmptyState } from "@/components/shared/ApiErrorAlert";

if (data.length === 0) {
  return (
    <EmptyState
      icon="📦"
      title="No Products"
      message="Get started by adding your first product."
      action={{
        label: "Add Product",
        onClick: () => openModal(),
      }}
    />
  );
}
```
