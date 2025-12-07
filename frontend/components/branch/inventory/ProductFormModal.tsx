/**
 * Product Form Modal
 * Modal for adding/editing products using generic FeaturedDialog
 */

"use client";

import { useState } from "react";
import { ProductDto, CategoryDto, CreateProductDto, UpdateProductDto } from "@/types/api.types";
import inventoryService from "@/services/inventory.service";
import { FeaturedDialog } from "@/components/shared";
import { FormField } from "@/types/data-table.types";
import { useApiOperation } from "@/hooks/useApiOperation";

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
  const { execute, isLoading } = useApiOperation();

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

    await execute({
      operation: async () => {
        if (product) {
          return await inventoryService.updateProduct(product.id, productData as UpdateProductDto);
        } else {
          return await inventoryService.createProduct(productData as CreateProductDto);
        }
      },
      successMessage: product ? "Product updated successfully" : "Product created successfully",
      successDetail: `${data.nameEn} has been ${product ? "updated" : "added"}`,
      onSuccess: () => {
        onSuccess();
        onClose();
      },
    });
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <>
      <FeaturedDialog
        isOpen={isOpen}
        onClose={handleClose}
        title={product ? "Edit Product" : "Add New Product"}
        mode={product ? "edit" : "create"}
        initialData={product}
        fields={fields}
        onSubmit={handleSubmit}
        isSubmitting={isLoading}
        size="lg"
      />
    </>
  );
}
