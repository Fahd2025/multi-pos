# Using the useApiError Hook - Practical Guide

This guide provides practical examples of how to use the `useApiError` hook in your Next.js POS application.

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [With Data Fetching](#with-data-fetching)
3. [With Form Submissions](#with-form-submissions)
4. [With Multiple API Calls](#with-multiple-api-calls)
5. [Integration with UI Components](#integration-with-ui-components)
6. [Real-World Examples](#real-world-examples)

---

## Basic Usage

### Simple Error Handling

```tsx
"use client";

import { useApiError } from "@/hooks/useApiError";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";

export default function SimpleExample() {
  const { error, isError, errorMessage, setError, clearError } = useApiError();

  const handleAction = async () => {
    try {
      clearError(); // Clear any previous errors
      const response = await fetch("/api/data");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      // Handle success
    } catch (err) {
      setError(err); // Set the error
    }
  };

  return (
    <div>
      {isError && <ApiErrorAlert error={error} onRetry={handleAction} onDismiss={clearError} />}
      <button onClick={handleAction}>Fetch Data</button>
    </div>
  );
}
```

### Using executeWithErrorHandling

The hook provides a convenient `executeWithErrorHandling` method that automatically handles errors:

```tsx
"use client";

import { useApiError } from "@/hooks/useApiError";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";

export default function AutoErrorHandling() {
  const { error, isError, executeWithErrorHandling, clearError } = useApiError();

  const fetchData = async () => {
    const result = await executeWithErrorHandling(async () => {
      const response = await fetch("/api/data");
      if (!response.ok) throw new Error("Failed to fetch");
      return await response.json();
    });

    if (result) {
      // Success! Use the result
      console.log("Data:", result);
    }
    // Error is automatically set if the function throws
  };

  return (
    <div>
      {isError && <ApiErrorAlert error={error} onRetry={fetchData} onDismiss={clearError} />}
      <button onClick={fetchData}>Fetch Data</button>
    </div>
  );
}
```

---

## With Data Fetching

### Loading Products with Error Handling

```tsx
"use client";

import { useState, useEffect } from "react";
import { useApiError } from "@/hooks/useApiError";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { inventoryService } from "@/services/inventory.service";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { error, isError, executeWithErrorHandling, clearError } = useApiError();

  const loadProducts = async () => {
    setLoading(true);
    const result = await executeWithErrorHandling(async () => {
      return await inventoryService.getProducts();
    });

    if (result) {
      setProducts(result);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Products</h1>

      {/* Error Display */}
      {isError && <ApiErrorAlert error={error} onRetry={loadProducts} onDismiss={clearError} />}

      {/* Loading State */}
      {loading && <LoadingSpinner size="lg" text="Loading products..." />}

      {/* Content - Only show if no error and not loading */}
      {!loading && !isError && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
```

### With Search and Filters

```tsx
"use client";

import { useState, useEffect } from "react";
import { useApiError } from "@/hooks/useApiError";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import { customerService } from "@/services/customer.service";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const { error, isError, executeWithErrorHandling, clearError } = useApiError();

  const searchCustomers = async (search: string) => {
    setLoading(true);
    const result = await executeWithErrorHandling(async () => {
      return await customerService.searchCustomers(search);
    });

    if (result) {
      setCustomers(result);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      searchCustomers(searchTerm);
    }, 300); // Debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Customers</h1>

      {/* Search Input */}
      <input
        type="text"
        placeholder="Search customers..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-2 border rounded-lg"
      />

      {/* Error Display */}
      {isError && (
        <ApiErrorAlert
          error={error}
          onRetry={() => searchCustomers(searchTerm)}
          onDismiss={clearError}
        />
      )}

      {/* Results */}
      {!isError && (
        <div>{loading ? <LoadingSpinner /> : <CustomerList customers={customers} />}</div>
      )}
    </div>
  );
}
```

---

## With Form Submissions

### Creating a New Product

```tsx
"use client";

import { useState } from "react";
import { useApiError } from "@/hooks/useApiError";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import { inventoryService } from "@/services/inventory.service";

export default function CreateProductForm() {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    quantity: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { error, isError, executeWithErrorHandling, clearError } = useApiError();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);

    const result = await executeWithErrorHandling(async () => {
      return await inventoryService.createProduct({
        name: formData.name,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
      });
    });

    setSubmitting(false);

    if (result) {
      setSuccess(true);
      // Reset form
      setFormData({ name: "", price: "", quantity: "" });
      // Optionally redirect or show success message
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Create New Product</h2>

      {/* Error Display */}
      {isError && (
        <ApiErrorAlert
          error={error}
          onRetry={handleSubmit}
          onDismiss={clearError}
          className="mb-4"
        />
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-4">
          ✅ Product created successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Product Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Price</label>
          <input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Quantity</label>
          <input
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create Product"}
        </button>
      </form>
    </div>
  );
}
```

---

## With Multiple API Calls

### Dashboard with Multiple Data Sources

```tsx
"use client";

import { useState, useEffect } from "react";
import { useApiError } from "@/hooks/useApiError";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import { salesService } from "@/services/sales.service";
import { inventoryService } from "@/services/inventory.service";
import { customerService } from "@/services/customer.service";

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    sales: null,
    inventory: null,
    customers: null,
  });
  const [loading, setLoading] = useState(true);
  const { error, isError, executeWithErrorHandling, clearError } = useApiError();

  const loadDashboardData = async () => {
    setLoading(true);

    const result = await executeWithErrorHandling(async () => {
      // Fetch all data in parallel
      const [sales, inventory, customers] = await Promise.all([
        salesService.getSalesSummary(),
        inventoryService.getInventorySummary(),
        customerService.getCustomerStats(),
      ]);

      return { sales, inventory, customers };
    });

    if (result) {
      setDashboardData(result);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Error Display */}
      {isError && (
        <ApiErrorAlert error={error} onRetry={loadDashboardData} onDismiss={clearError} />
      )}

      {/* Loading State */}
      {loading && <LoadingSpinner size="lg" text="Loading dashboard..." />}

      {/* Dashboard Content */}
      {!loading && !isError && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SalesWidget data={dashboardData.sales} />
          <InventoryWidget data={dashboardData.inventory} />
          <CustomersWidget data={dashboardData.customers} />
        </div>
      )}
    </div>
  );
}
```

---

## Integration with UI Components

### Using with Modal Forms

```tsx
"use client";

import { useState } from "react";
import { useApiError } from "@/hooks/useApiError";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import { Modal } from "@/components/shared/Modal";
import { expenseService } from "@/services/expense.service";

export default function ExpenseModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const { error, isError, executeWithErrorHandling, clearError } = useApiError();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const result = await executeWithErrorHandling(async () => {
      return await expenseService.createExpense({
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
      });
    });

    setSubmitting(false);

    if (result) {
      onSuccess(result);
      onClose();
      clearError();
    }
  };

  const handleClose = () => {
    clearError();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Expense">
      {/* Error Display */}
      {isError && (
        <ApiErrorAlert
          error={error}
          onRetry={handleSubmit}
          onDismiss={clearError}
          className="mb-4"
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Amount</label>
          <input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            required
          >
            <option value="">Select category</option>
            <option value="utilities">Utilities</option>
            <option value="supplies">Supplies</option>
            <option value="rent">Rent</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Expense"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
```

---

## Real-World Examples

### Complete Sales Page

```tsx
"use client";

import { useState, useEffect } from "react";
import { useApiError } from "@/hooks/useApiError";
import { ApiErrorAlert, EmptyState } from "@/components/shared/ApiErrorAlert";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { DataTable } from "@/components/data-table/DataTable";
import { salesService } from "@/services/sales.service";

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    status: "all",
  });
  const { error, isError, executeWithErrorHandling, clearError } = useApiError();

  const loadSales = async () => {
    setLoading(true);
    const result = await executeWithErrorHandling(async () => {
      return await salesService.getSales(filters);
    });

    if (result) {
      setSales(result);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSales();
  }, [filters]);

  const handleExport = async () => {
    await executeWithErrorHandling(async () => {
      const blob = await salesService.exportSales(filters);
      // Download the file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sales-report.csv";
      a.click();
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sales</h1>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Export to CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          className="px-4 py-2 border rounded-lg"
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          className="px-4 py-2 border rounded-lg"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Error Display */}
      {isError && <ApiErrorAlert error={error} onRetry={loadSales} onDismiss={clearError} />}

      {/* Loading State */}
      {loading && <LoadingSpinner size="lg" text="Loading sales..." />}

      {/* Empty State */}
      {!loading && !isError && sales.length === 0 && (
        <EmptyState
          icon="🛒"
          title="No Sales Found"
          message="No sales match your current filters. Try adjusting the date range or status."
          action={{
            label: "Clear Filters",
            onClick: () => setFilters({ startDate: "", endDate: "", status: "all" }),
          }}
        />
      )}

      {/* Data Table */}
      {!loading && !isError && sales.length > 0 && (
        <DataTable
          data={sales}
          columns={[
            { key: "id", label: "ID" },
            { key: "date", label: "Date" },
            { key: "customer", label: "Customer" },
            { key: "total", label: "Total" },
            { key: "status", label: "Status" },
          ]}
        />
      )}
    </div>
  );
}
```

---

## Best Practices Summary

1. **Always use `executeWithErrorHandling`** for cleaner code
2. **Clear errors** when closing modals or navigating away
3. **Provide retry functionality** for better UX
4. **Show loading states** while fetching data
5. **Hide content** when there's an error (don't show stale data)
6. **Use appropriate error components** (ApiErrorAlert vs InlineApiError)
7. **Handle empty states** separately from errors

---

## Common Patterns

### Pattern 1: Fetch on Mount

```tsx
const { error, isError, executeWithErrorHandling } = useApiError();

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

### Pattern 2: Fetch on User Action

```tsx
const handleRefresh = async () => {
  setLoading(true);
  const result = await executeWithErrorHandling(async () => {
    return await api.getData();
  });
  if (result) setData(result);
  setLoading(false);
};
```

### Pattern 3: Form Submission

```tsx
const handleSubmit = async (formData) => {
  const result = await executeWithErrorHandling(async () => {
    return await api.submitForm(formData);
  });
  if (result) {
    // Success handling
    onSuccess();
  }
};
```

---

## Error Message Customization

The hook automatically provides user-friendly messages, but you can access them:

```tsx
const { errorMessage, isError } = useApiError();

return <div>{isError && <div className="text-red-600">{errorMessage}</div>}</div>;
```

---

## TypeScript Support

The hook is fully typed:

```tsx
interface Product {
  id: string;
  name: string;
  price: number;
}

const loadProducts = async () => {
  const result = await executeWithErrorHandling<Product[]>(async () => {
    return await inventoryService.getProducts();
  });

  if (result) {
    // result is typed as Product[] | null
    setProducts(result);
  }
};
```
