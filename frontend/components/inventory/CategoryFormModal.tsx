/**
 * Category Form Modal
 * Modal for adding/editing categories using generic ModalBottomSheet
 */

"use client";

import { useState } from "react";
import { CategoryDto } from "@/types/api.types";
import inventoryService from "@/services/inventory.service";
import { ModalBottomSheet } from "@/components/modals";
import { FormField } from "@/types/data-table.types";
import { useApiError } from "@/hooks/useApiError";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category?: CategoryDto; // If provided, edit mode; otherwise, add mode
  categories: CategoryDto[];
}

export default function CategoryFormModal({
  isOpen,
  onClose,
  onSuccess,
  category,
  categories,
}: CategoryFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error, isError, executeWithErrorHandling, clearError } = useApiError();

  // Get available parent categories (exclude self and children in edit mode)
  const getAvailableParentCategories = () => {
    if (!category) {
      return categories;
    }
    return categories.filter((c) => {
      if (c.id === category.id) return false; // Can't be parent of itself
      if (c.parentCategoryId === category.id) return false; // Can't be parent of its child
      return true;
    });
  };

  const fields: FormField<any>[] = [
    {
      name: "code",
      label: "Category Code",
      type: "text",
      required: true,
      placeholder: "e.g., ELEC, FOOD",
    },
    {
      name: "displayOrder",
      label: "Display Order",
      type: "number",
      required: true,
      defaultValue: 1,
      validation: {
        min: 0,
      },
    },
    {
      name: "nameEn",
      label: "Name (English)",
      type: "text",
      required: true,
      placeholder: "e.g., Electronics",
    },
    {
      name: "nameAr",
      label: "Name (Arabic)",
      type: "text",
      placeholder: "مثال: إلكترونيات",
    },
    {
      name: "parentCategoryId",
      label: "Parent Category",
      type: "select",
      options: [
        { label: "-- None (Root Category) --", value: "" },
        ...getAvailableParentCategories().map((c) => ({ label: c.nameEn, value: c.id })),
      ],
    },
    {
      name: "descriptionEn",
      label: "Description (English)",
      type: "textarea",
      placeholder: "Category description...",
    },
    {
      name: "descriptionAr",
      label: "Description (Arabic)",
      type: "textarea",
      placeholder: "وصف الفئة...",
    },
  ];

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);

    const result = await executeWithErrorHandling(async () => {
      const categoryData = {
        code: data.code,
        nameEn: data.nameEn,
        nameAr: data.nameAr,
        descriptionEn: data.descriptionEn,
        descriptionAr: data.descriptionAr,
        parentCategoryId: data.parentCategoryId || undefined,
        displayOrder: Number(data.displayOrder),
      };

      if (category) {
        return await inventoryService.updateCategory(category.id, categoryData);
      } else {
        return await inventoryService.createCategory(categoryData);
      }
    });

    setIsSubmitting(false);

    if (result) {
      onSuccess();
      onClose();
      clearError();
    }
  };

  const handleClose = () => {
    clearError();
    onClose();
  };

  return (
    <>
      {/* Error Display */}
      {isOpen && isError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[60] max-w-2xl w-full px-4">
          <ApiErrorAlert error={error} onDismiss={clearError} />
        </div>
      )}

      <ModalBottomSheet
        isOpen={isOpen}
        onClose={handleClose}
        title={category ? "Edit Category" : "Add New Category"}
        mode={category ? "edit" : "create"}
        initialData={category}
        fields={fields}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        size="md"
      />
    </>
  );
}
