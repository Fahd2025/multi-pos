/**
 * Example Component: Product Management with useApiError Hook
 * This demonstrates best practices for using the useApiError hook
 */

"use client";

import { useState, useEffect } from "react";
import { useApiError } from "@/hooks/useApiError";
import { ApiErrorAlert, EmptyState } from "@/components/shared/ApiErrorAlert";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

// Mock service - replace with your actual service
const productService = {
  async getProducts() {
    const response = await fetch("/api/products");
    if (!response.ok) throw new Error("Failed to fetch products");
    return response.json();
  },
  async createProduct(data: any) {
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create product");
    return response.json();
  },
  async deleteProduct(id: string) {
    const response = await fetch(`/api/products/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete product");
    return response.json();
  },
};

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

export default function ProductManagementExample() {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    quantity: "",
    category: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Error handling hook
  const { error, isError, errorMessage, executeWithErrorHandling, clearError } = useApiError();

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  /**
   * Load all products
   */
  const loadProducts = async () => {
    setLoading(true);

    const result = await executeWithErrorHandling<Product[]>(async () => {
      return await productService.getProducts();
    });

    if (result) {
      setProducts(result);
    }

    setLoading(false);
  };

  /**
   * Create a new product
   */
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const result = await executeWithErrorHandling(async () => {
      return await productService.createProduct({
        name: formData.name,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        category: formData.category,
      });
    });

    setSubmitting(false);

    if (result) {
      // Success! Reset form and reload products
      setFormData({ name: "", price: "", quantity: "", category: "" });
      setShowAddForm(false);
      await loadProducts();
    }
  };

  /**
   * Delete a product
   */
  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    const result = await executeWithErrorHandling(async () => {
      return await productService.deleteProduct(id);
    });

    if (result) {
      // Success! Reload products
      await loadProducts();
    }
  };

  /**
   * Handle form close
   */
  const handleCloseForm = () => {
    setShowAddForm(false);
    setFormData({ name: "", price: "", quantity: "", category: "" });
    clearError(); // Clear any form errors
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Product
        </button>
      </div>

      {/* Error Alert - Shows for any API errors */}
      {isError && <ApiErrorAlert error={error} onRetry={loadProducts} onDismiss={clearError} />}

      {/* Loading State */}
      {loading && <LoadingSpinner size="lg" text="Loading products..." />}

      {/* Empty State */}
      {!loading && !isError && products.length === 0 && (
        <EmptyState
          icon="📦"
          title="No Products Yet"
          message="Get started by adding your first product to the inventory."
          action={{
            label: "Add Product",
            onClick: () => setShowAddForm(true),
          }}
        />
      )}

      {/* Products Grid */}
      {!loading && !isError && products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Delete
                </button>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Price:</span>
                  <span className="font-medium">${product.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span className="font-medium">{product.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span>Category:</span>
                  <span className="font-medium capitalize">{product.category}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Product Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Add New Product</h2>
              <button
                onClick={handleCloseForm}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Form Error Display */}
            {isError && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="e.g., Laptop"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a category</option>
                  <option value="electronics">Electronics</option>
                  <option value="clothing">Clothing</option>
                  <option value="food">Food</option>
                  <option value="books">Books</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? "Creating..." : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Footer */}
      {!loading && !isError && products.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Total Products: {products.length}</span>
            <span>
              Total Value: ${products.reduce((sum, p) => sum + p.price * p.quantity, 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
