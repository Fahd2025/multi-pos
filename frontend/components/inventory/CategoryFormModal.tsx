/**
 * Category Form Modal with Image Upload
 * Modal for adding/editing categories with image upload capability
 */

"use client";

import { useState } from "react";
import { CategoryDto } from "@/types/api.types";
import inventoryService from "@/services/inventory.service";
import imageService from "@/services/image.service";
import { ModalBottomSheet } from "@/components/modals";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { FormField } from "@/types/data-table.types";
import { useApiError } from "@/hooks/useApiError";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category?: CategoryDto;
  categories: CategoryDto[];
  branchName: string; // Required for image upload
}

export default function CategoryFormModal({
  isOpen,
  onClose,
  onSuccess,
  category,
  categories,
  branchName,
}: CategoryFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
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

      // 1. Create or update the category
      const savedCategory = category
        ? await inventoryService.updateCategory(category.id, categoryData)
        : await inventoryService.createCategory(categoryData);

      // 2. Upload image if selected
      if (selectedImages.length > 0 && branchName) {
        setUploadingImages(true);
        try {
          await imageService.uploadImage(
            branchName,
            "Categories",
            savedCategory.id,
            selectedImages[0] // Single image
          );
          console.log("Successfully uploaded category image");
        } catch (error) {
          console.error("Error uploading image:", error);
          // Don't fail the whole operation
        } finally {
          setUploadingImages(false);
        }
      }

      return savedCategory;
    });

    setIsSubmitting(false);

    if (result) {
      onSuccess();
      onClose();
      clearError();
      setSelectedImages([]);
    }
  };

  const handleClose = () => {
    clearError();
    setSelectedImages([]);
    onClose();
  };

  const handleImageUpload = (files: File[]) => {
    setSelectedImages(files);
  };

  const handleImageRemove = async (imageId: string) => {
    if (!category?.id || !branchName) return;

    try {
      await imageService.deleteImages(branchName, "Categories", category.id);
      console.log("Category image deleted successfully");
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  };

  return (
    <>
      {/* Error Display */}
      {isOpen && isError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[60] max-w-2xl w-full px-4">
          <ApiErrorAlert error={error} onDismiss={clearError} />
        </div>
      )}

      {/* Main Form Modal */}
      <ModalBottomSheet
        isOpen={isOpen}
        onClose={handleClose}
        title={category ? "Edit Category" : "Add New Category"}
        mode={category ? "edit" : "create"}
        initialData={category}
        fields={fields}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting || uploadingImages}
        size="md"
        additionalContent={
          <>
            <ImageUpload
              branchName={branchName}
              entityType="Categories"
              entityId={category?.id}
              currentImages={category?.imagePath ? [category.imagePath] : []}
              multiple={false}
              maxFiles={1}
              onUpload={handleImageUpload}
              onRemove={handleImageRemove}
              label="Category Image (Optional)"
              className="mb-4"
            />

            {/* Upload status */}
            {uploadingImages && (
              <div className="flex items-center justify-center space-x-2 text-blue-600 mt-4">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="text-sm font-medium">Uploading image...</span>
              </div>
            )}

            {selectedImages.length > 0 && !uploadingImages && (
              <div className="text-sm text-gray-600 text-center mt-2">Image ready to upload</div>
            )}
          </>
        }
      />
    </>
  );
}
