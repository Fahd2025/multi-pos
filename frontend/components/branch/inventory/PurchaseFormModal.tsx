/**
 * Purchase Form Modal
 * Modal for creating new purchase orders with line items
 */

"use client";

import { useState, useEffect } from "react";
import inventoryService from "@/services/inventory.service";
import supplierService from "@/services/supplier.service";
import { PurchaseDto, SupplierDto, ProductDto, CreatePurchaseLineItemDto } from "@/types/api.types";

interface PurchaseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  purchase?: PurchaseDto;
}

interface LineItemForm extends CreatePurchaseLineItemDto {
  productName?: string;
  lineTotal: number;
}

export default function PurchaseFormModal({
  isOpen,
  onClose,
  onSuccess,
  purchase,
}: PurchaseFormModalProps) {
  const isViewMode = !!purchase;

  // Form state
  const [formData, setFormData] = useState({
    supplierId: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [lineItems, setLineItems] = useState<LineItemForm[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  /**
   * Load suppliers and products
   */
  useEffect(() => {
    if (isOpen) {
      loadDropdownData();

      if (purchase) {
        // View mode - load existing purchase
        setFormData({
          supplierId: purchase.supplierId,
          purchaseDate: purchase.purchaseDate.split("T")[0],
          notes: purchase.notes || "",
        });
        setLineItems(
          purchase.lineItems.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitCost: item.unitCost,
            lineTotal: item.lineTotal,
          }))
        );
      } else {
        // Create mode - reset form
        setFormData({
          supplierId: "",
          purchaseDate: new Date().toISOString().split("T")[0],
          notes: "",
        });
        setLineItems([]);
      }

      setError(null);
      setValidationErrors({});
    }
  }, [isOpen, purchase]);

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

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.supplierId) errors.supplierId = "Supplier is required";
    if (!formData.purchaseDate) errors.purchaseDate = "Purchase date is required";
    if (lineItems.length === 0) errors.lineItems = "At least one product is required";

    lineItems.forEach((item, index) => {
      if (!item.productId) errors[`lineItem_${index}_product`] = "Product is required";
      if (!item.quantity || item.quantity <= 0)
        errors[`lineItem_${index}_quantity`] = "Quantity must be greater than 0";
      if (!item.unitCost || item.unitCost <= 0)
        errors[`lineItem_${index}_unitCost`] = "Unit cost must be greater than 0";
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Add line item
   */
  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        productId: "",
        quantity: 1,
        unitCost: 0,
        lineTotal: 0,
      },
    ]);
  };

  /**
   * Remove line item
   */
  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  /**
   * Update line item
   */
  const handleLineItemChange = (index: number, field: keyof LineItemForm, value: any) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    // Auto-calculate line total
    if (field === "quantity" || field === "unitCost") {
      const quantity = field === "quantity" ? parseFloat(value) || 0 : updatedItems[index].quantity;
      const unitCost = field === "unitCost" ? parseFloat(value) || 0 : updatedItems[index].unitCost;
      updatedItems[index].lineTotal = quantity * unitCost;
    }

    // Get product name if product changed
    if (field === "productId") {
      const product = products.find((p) => p.id === value);
      updatedItems[index].productName = product?.nameEn;
      updatedItems[index].unitCost = product?.costPrice || 0;
      updatedItems[index].lineTotal = updatedItems[index].quantity * (product?.costPrice || 0);
    }

    setLineItems(updatedItems);

    // Clear validation error for this field
    const errorKey = `lineItem_${index}_${field}`;
    if (validationErrors[errorKey]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  /**
   * Calculate total cost
   */
  const calculateTotalCost = (): number => {
    return lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  };

  /**
   * Handle form submission
   */
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800  rounded-lg shadow-xl max-w-4xl w-full mx-4 my-8">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {isViewMode ? "Purchase Order Details" : "Create Purchase Order"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            ✕
          </button>
        </div>

        {/* Form Content */}
        <form
          onSubmit={handleSubmit}
          className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto"
        >
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Purchase Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Purchase Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Supplier */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    disabled={isViewMode}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.supplierId ? "border-red-500" : "border-gray-300"
                    } ${isViewMode ? "bg-gray-100" : ""}`}
                  >
                    <option value="">-- Select Supplier --</option>
                    {suppliers
                      .filter((s) => s.isActive)
                      .map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          [{supplier.code}] {supplier.nameEn}
                          {supplier.totalPurchases > 0
                            ? ` - ${supplier.totalPurchases} previous order${
                                supplier.totalPurchases > 1 ? "s" : ""
                              }`
                            : " - New supplier"}
                        </option>
                      ))}
                  </select>
                  {validationErrors.supplierId && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.supplierId}</p>
                  )}
                </div>

                {/* Purchase Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    disabled={isViewMode}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.purchaseDate ? "border-red-500" : "border-gray-300"
                    } ${isViewMode ? "bg-gray-100" : ""}`}
                  />
                  {validationErrors.purchaseDate && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.purchaseDate}</p>
                  )}
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    disabled={isViewMode}
                    rows={2}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isViewMode ? "bg-gray-100" : ""
                    }`}
                    placeholder="Optional purchase notes..."
                  />
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Products</h3>
                {!isViewMode && (
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    + Add Product
                  </button>
                )}
              </div>

              {validationErrors.lineItems && (
                <p className="text-red-500 text-sm mb-2">{validationErrors.lineItems}</p>
              )}

              <div className="space-y-3">
                {lineItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-3 items-start p-3 bg-gray-50 rounded-md border border-gray-200"
                  >
                    {/* Product */}
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Product
                      </label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleLineItemChange(index, "productId", e.target.value)}
                        disabled={isViewMode}
                        className={`w-full px-2 py-1 text-sm border rounded-md ${
                          validationErrors[`lineItem_${index}_product`]
                            ? "border-red-500"
                            : "border-gray-300"
                        } ${isViewMode ? "bg-gray-100" : ""}`}
                      >
                        <option value="">-- Select --</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.nameEn}
                          </option>
                        ))}
                      </select>
                      {validationErrors[`lineItem_${index}_product`] && (
                        <p className="text-red-500 text-xs mt-1">
                          {validationErrors[`lineItem_${index}_product`]}
                        </p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="w-24">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Qty</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleLineItemChange(index, "quantity", e.target.value)}
                        disabled={isViewMode}
                        min="1"
                        step="1"
                        className={`w-full px-2 py-1 text-sm border rounded-md ${
                          validationErrors[`lineItem_${index}_quantity`]
                            ? "border-red-500"
                            : "border-gray-300"
                        } ${isViewMode ? "bg-gray-100" : ""}`}
                      />
                      {validationErrors[`lineItem_${index}_quantity`] && (
                        <p className="text-red-500 text-xs mt-1">
                          {validationErrors[`lineItem_${index}_quantity`]}
                        </p>
                      )}
                    </div>

                    {/* Unit Cost */}
                    <div className="w-28">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Unit Cost
                      </label>
                      <input
                        type="number"
                        value={item.unitCost}
                        onChange={(e) => handleLineItemChange(index, "unitCost", e.target.value)}
                        disabled={isViewMode}
                        min="0"
                        step="0.01"
                        className={`w-full px-2 py-1 text-sm border rounded-md ${
                          validationErrors[`lineItem_${index}_unitCost`]
                            ? "border-red-500"
                            : "border-gray-300"
                        } ${isViewMode ? "bg-gray-100" : ""}`}
                      />
                      {validationErrors[`lineItem_${index}_unitCost`] && (
                        <p className="text-red-500 text-xs mt-1">
                          {validationErrors[`lineItem_${index}_unitCost`]}
                        </p>
                      )}
                    </div>

                    {/* Line Total */}
                    <div className="w-28">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Total</label>
                      <div className="px-2 py-1 text-sm bg-gray-100 border border-gray-300 rounded-md font-semibold">
                        ${item.lineTotal.toFixed(2)}
                      </div>
                    </div>

                    {/* Remove Button */}
                    {!isViewMode && (
                      <div className="w-8 pt-6">
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(index)}
                          className="text-red-600 hover:text-red-800"
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Total Cost */}
            <div className="flex justify-end items-center p-4 bg-blue-50 rounded-md">
              <div className="text-right">
                <div className="text-sm text-gray-600">Total Purchase Cost</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ${calculateTotalCost().toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            {isViewMode ? "Close" : "Cancel"}
          </button>
          {!isViewMode && (
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Purchase Order"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
