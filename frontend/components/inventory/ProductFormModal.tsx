/**
 * Product Form Modal
 * Modal for adding/editing products using generic ModalBottomSheet
 */

"use client";

import { useState } from "react";
import { ProductDto, CategoryDto, CreateProductDto, UpdateProductDto } from "@/types/api.types";
import inventoryService from "@/services/inventory.service";
import { ModalBottomSheet } from "@/components/modals";
import { FormField } from "@/types/data-table.types";
import { useApiError } from "@/hooks/useApiError";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: ProductDto; // If provided, edit mode; otherwise, add mode
  categories: CategoryDto[];
}

export default function ProductFormModal({
  isOpen,
  onClose,
  onSuccess,
  product,
  categories,
}: ProductFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error, isError, executeWithErrorHandling, clearError } = useApiError();

  const fields: FormField<any>[] = [
    {
      name: "sku",
      label: "SKU",
      type: "text",
      required: true,
      placeholder: "e.g., PROD001",
    },
    {
      name: "nameEn",
      label: "Name (English)",
      type: "text",
      required: true,
      placeholder: "e.g., Gaming Laptop",
    },
    {
      name: "nameAr",
      label: "Name (Arabic)",
      type: "text",
      placeholder: "مثال: حاسوب محمول",
    },
    {
      name: "barcode",
      label: "Barcode",
      type: "text",
      placeholder: "e.g., 1234567890123",
    },
    {
      name: "categoryId",
      label: "Category",
      type: "select",
      options: categories.map((c) => ({ label: c.nameEn, value: c.id })),
    },
    {
      name: "descriptionEn",
      label: "Description (English)",
      type: "textarea",
      placeholder: "Product description...",
    },
    {
      name: "descriptionAr",
      label: "Description (Arabic)",
      type: "textarea",
      placeholder: "وصف المنتج...",
    },
    {
      name: "sellingPrice",
      label: "Selling Price",
      type: "number",
      required: true,
      validation: {
        min: 0.01,
      },
    },
    {
      name: "costPrice",
      label: "Cost Price",
      type: "number",
      validation: {
        min: 0,
      },
    },
    {
      name: "stockLevel",
      label: "Initial Stock",
      type: "number",
      defaultValue: 0,
      validation: {
        min: 0,
      },
    },
    {
      name: "minStockThreshold",
      label: "Low Stock Alert Threshold",
      type: "number",
      defaultValue: 5,
      validation: {
        min: 0,
      },
    },
    {
      name: "isActive",
      label: "Product is active",
      type: "checkbox",
      defaultValue: true,
    },
  ];

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);

    const result = await executeWithErrorHandling(async () => {
      const productData = {
        sku: data.sku,
        nameEn: data.nameEn,
        nameAr: data.nameAr || "",
        descriptionEn: data.descriptionEn,
        descriptionAr: data.descriptionAr,
        sellingPrice: Number(data.sellingPrice),
        costPrice: Number(data.costPrice) || 0,
        stockLevel: Number(data.stockLevel) || 0,
        minStockThreshold: Number(data.minStockThreshold) || 0,
        barcode: data.barcode,
        categoryId: data.categoryId || "",
      };

      if (product) {
        return await inventoryService.updateProduct(product.id, productData as UpdateProductDto);
      } else {
        return await inventoryService.createProduct(productData as CreateProductDto);
      }
    });

    setIsSubmitting(false);

    if (result) {
      // Success! Close modal and notify parent
      onSuccess();
      onClose();
      clearError();
    }
  };

  const handleClose = () => {
    clearError(); // Clear any errors when closing
    onClose();
  };

  return (
    <>
      {/* Error Display - Shows above the modal */}
      {isOpen && isError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[60] max-w-2xl w-full px-4">
          <ApiErrorAlert error={error} onDismiss={clearError} />
        </div>
      )}

      <ModalBottomSheet
        isOpen={isOpen}
        onClose={handleClose}
        title={product ? "Edit Product" : "Add New Product"}
        mode={product ? "edit" : "create"}
        initialData={product}
        fields={fields}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        size="lg"
      />
    </>
  );
}
