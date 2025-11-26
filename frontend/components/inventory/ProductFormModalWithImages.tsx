/**
 * Product Form Modal with Image Upload
 * Enhanced version of ProductFormModal that includes image upload functionality
 *
 * This is a complete example implementation showing how to integrate
 * the ImageUpload component with form submission.
 *
 * Usage: Import this instead of ProductFormModal to get image upload support
 */

"use client";

import { useState } from "react";
import { ProductDto, CategoryDto, CreateProductDto, UpdateProductDto } from "@/types/api.types";
import inventoryService from "@/services/inventory.service";
import imageService from "@/services/image.service";
import { ModalBottomSheet } from "@/components/modals";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { FormField } from "@/types/data-table.types";
import { useApiError } from "@/hooks/useApiError";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";

interface ProductFormModalWithImagesProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: ProductDto;
  categories: CategoryDto[];
  branchName: string; // Required for image upload
}

export default function ProductFormModalWithImages({
  isOpen,
  onClose,
  onSuccess,
  product,
  categories,
  branchName,
}: ProductFormModalWithImagesProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
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

      // 1. Create or update the product
      const savedProduct = product
        ? await inventoryService.updateProduct(product.id, productData as UpdateProductDto)
        : await inventoryService.createProduct(productData as CreateProductDto);

      // 2. Upload images if any selected
      if (selectedImages.length > 0 && branchName) {
        setUploadingImages(true);
        try {
          await imageService.uploadMultipleImages(
            branchName,
            'Products',
            savedProduct.id,
            selectedImages
          );
          console.log(`Successfully uploaded ${selectedImages.length} images`);
        } catch (error) {
          console.error('Error uploading images:', error);
          // Don't fail the whole operation if image upload fails
          // The product is already saved
        } finally {
          setUploadingImages(false);
        }
      }

      return savedProduct;
    });

    setIsSubmitting(false);

    if (result) {
      // Success! Close modal and notify parent
      onSuccess();
      onClose();
      clearError();
      setSelectedImages([]); // Reset selected images
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
    if (!product?.id || !branchName) return;

    try {
      await imageService.deleteImages(branchName, 'Products', product.id);
      console.log('Images deleted successfully');
      // Optionally refresh the product data here
    } catch (error) {
      console.error('Error deleting images:', error);
    }
  };

  return (
    <>
      {/* Error Display - Shows above the modal */}
      {isOpen && isError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[60] max-w-2xl w-full px-4">
          <ApiErrorAlert error={error} onDismiss={clearError} />
        </div>
      )}

      {/* Main Form Modal */}
      <ModalBottomSheet
        isOpen={isOpen}
        onClose={handleClose}
        title={product ? "Edit Product" : "Add New Product"}
        mode={product ? "edit" : "create"}
        initialData={product}
        fields={fields}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting || uploadingImages}
        size="lg"
      />

      {/* Image Upload Section - Appears below the form */}
      {isOpen && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-6 z-[45] max-h-[40vh] overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <ImageUpload
              branchName={branchName}
              entityType="Products"
              entityId={product?.id}
              currentImages={product?.images || []}
              multiple={true}
              maxFiles={5}
              onUpload={handleImageUpload}
              onRemove={handleImageRemove}
              label="Product Images (Optional)"
              className="mb-4"
            />

            {/* Upload status indicator */}
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
                <span className="text-sm font-medium">Uploading images...</span>
              </div>
            )}

            {/* Selected images count */}
            {selectedImages.length > 0 && !uploadingImages && (
              <div className="text-sm text-gray-600 text-center mt-2">
                {selectedImages.length} image{selectedImages.length > 1 ? 's' : ''} ready to upload
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
