# API Error Handling Guide

This guide explains how to use the new API error handling components and hooks for better user experience when APIs are unavailable or return errors.

## Components

### 1. ApiErrorAlert

A comprehensive error alert component that displays user-friendly error messages with retry functionality.

**Features:**

- Automatically detects error type (network, 404, 401, 403, 500, etc.)
- Shows appropriate icon and message for each error type
- Includes retry button
- Collapsible technical details for debugging
- Dismissible

**Usage:**

```tsx
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";

function MyPage() {
  const [error, setError] = useState<any | null>(null);

  const loadData = async () => {
    try {
      const data = await api.getData();
    } catch (err) {
      setError(err); // Store the entire error object
    }
  };

  return (
    <div>
      {error && <ApiErrorAlert error={error} onRetry={loadData} onDismiss={() => setError(null)} />}
    </div>
  );
}
```

### 2. InlineApiError

A compact inline error display for use within content areas.

**Usage:**

```tsx
import { InlineApiError } from "@/components/shared/ApiErrorAlert";

function DataSection() {
  const [error, setError] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  if (loading) return <LoadingSpinner />;
  if (error) return <InlineApiError error={error} onRetry={loadData} />;

  return <div>{/* Your content */}</div>;
}
```

### 3. EmptyState

Shows when data is empty (not an error condition).

**Usage:**

```tsx
import { EmptyState } from "@/components/shared/ApiErrorAlert";

function ProductList({ products }) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon="📦"
        title="No Products Yet"
        message="Get started by adding your first product."
        action={{
          label: "Add Product",
          onClick: () => openAddModal(),
        }}
      />
    );
  }

  return <div>{/* Product list */}</div>;
}
```

## Hook: useApiError

A custom hook for consistent error handling across your application.

**Usage:**

```tsx
import { useApiError } from "@/hooks/useApiError";

function MyComponent() {
  const { error, isError, errorMessage, setError, clearError, executeWithErrorHandling } =
    useApiError();

  // Method 1: Manual error handling
  const loadData = async () => {
    try {
      clearError();
      const data = await api.getData();
    } catch (err) {
      setError(err);
    }
  };

  // Method 2: Automatic error handling
  const loadDataAuto = async () => {
    const result = await executeWithErrorHandling(async () => {
      return await api.getData();
    });

    if (result) {
      // Success - use the result
    }
    // Error is automatically set if it fails
  };

  return (
    <div>
      {isError && <ApiErrorAlert error={error} onRetry={loadData} />}
      {/* Your content */}
    </div>
  );
}
```

## Error Types and Messages

The components automatically detect and display appropriate messages for:

| Error Type                  | Icon | Message                                                                          |
| --------------------------- | ---- | -------------------------------------------------------------------------------- |
| Network Error (no response) | 🔌   | "Unable to connect to the server. Please check your internet connection."        |
| 404 Not Found               | 🔍   | "The requested service is not available. The backend server may not be running." |
| 401 Unauthorized            | 🔒   | "Your session has expired. Please log in again."                                 |
| 403 Forbidden               | ⛔   | "You do not have permission to access this resource."                            |
| 500+ Server Error           | ⚠️   | "An error occurred on the server. Please try again later."                       |
| Generic Error               | ❌   | Custom error message or "An unexpected error occurred."                          |

## Best Practices

### 1. Store the Full Error Object

```tsx
// ✅ Good - Store the full error
const [error, setError] = useState<any | null>(null);

try {
  await api.call();
} catch (err) {
  setError(err); // Full error object
}

// ❌ Bad - Only store the message
const [error, setError] = useState<string | null>(null);
setError(err.message); // Loses error type information
```

### 2. Provide Retry Functionality

```tsx
// ✅ Good - Allow users to retry
<ApiErrorAlert
  error={error}
  onRetry={loadData}  // Provide retry function
  onDismiss={() => setError(null)}
/>

// ❌ Bad - No way to recover
<ApiErrorAlert error={error} />
```

### 3. Hide Content When There's an Error

```tsx
// ✅ Good - Don't show partial/stale data
{
  !loading && !error && <DataTable data={data} />;
}

// ❌ Bad - Shows empty table with error
{
  !loading && <DataTable data={data} />;
}
```

### 4. Use Appropriate Component for Context

```tsx
// ✅ Good - Use ApiErrorAlert for page-level errors
function Page() {
  return (
    <div>
      {error && <ApiErrorAlert error={error} onRetry={loadData} />}
      {!error && <Content />}
    </div>
  );
}

// ✅ Good - Use InlineApiError for section-level errors
function Section() {
  if (error) return <InlineApiError error={error} onRetry={loadData} />;
  return <SectionContent />;
}
```

## Migration Guide

### From ErrorAlert to ApiErrorAlert

**Before:**

```tsx
import { ErrorAlert } from "@/components/shared/ErrorAlert";

const [error, setError] = useState<string | null>(null);

try {
  await api.call();
} catch (err: any) {
  setError(err.message || "Failed to load");
}

return <ErrorAlert message={error} onDismiss={() => setError(null)} />;
```

**After:**

```tsx
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";

const [error, setError] = useState<any | null>(null);

try {
  await api.call();
} catch (err) {
  setError(err); // Store full error object
}

return <ApiErrorAlert error={error} onRetry={loadData} onDismiss={() => setError(null)} />;
```

## Example: Complete Page Implementation

```tsx
"use client";

import { useState, useEffect } from "react";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { DataTable } from "@/components/data-table";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getProducts();
      setProducts(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <h1>Products</h1>

      {/* Error Alert with Retry */}
      {error && <ApiErrorAlert error={error} onRetry={loadData} onDismiss={() => setError(null)} />}

      {/* Loading State */}
      {loading && <LoadingSpinner size="lg" text="Loading products..." />}

      {/* Content - Only show if no error */}
      {!loading && !error && <DataTable data={products} columns={columns} />}
    </div>
  );
}
```

## Troubleshooting

### "Service Unavailable" errors

If you see 404 errors with "Service Unavailable" messages:

1. Check if the backend API server is running
2. Verify the API_BASE_URL in your environment configuration
3. Check network connectivity

### Error messages not showing

Make sure you're:

1. Storing the full error object, not just the message
2. Passing the error to the component correctly
3. Not clearing the error state too early
