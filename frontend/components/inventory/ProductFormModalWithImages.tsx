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

import { useState, useEffect } from "react";
import { ProductDto, CategoryDto, CreateProductDto, UpdateProductDto } from "@/types/api.types";
import inventoryService from "@/services/inventory.service";
import imageService from "@/services/image.service";
import { ModalBottomSheet } from "@/components/modals";
import { MultiImageUpload } from "@/components/shared/ui/multi-image-upload";
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
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]); // Base64 strings for MultiImageUpload
  const [imagesToUpload, setImagesToUpload] = useState<File[]>([]); // Actual files to upload
  const { error, isError, executeWithErrorHandling, clearError } = useApiError();

  // Initialize image preview URLs when product changes
  useEffect(() => {
    if (product?.images && product.images.length > 0) {
      // Load existing images as preview URLs
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5062';
      const imageUrls = product.images.map((img) =>
        `${apiUrl}/api/v1/images/${branchName}/Products/${product.id}/medium?path=${encodeURIComponent(img.imagePath)}`
      );
      setImagePreviewUrls(imageUrls);
    } else {
      setImagePreviewUrls([]);
    }
    setImagesToUpload([]);
  }, [product, isOpen, branchName]);

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

      // 2. Handle image operations
      const originalImageCount = product?.images?.length || 0;
      const newImageCount = imagesToUpload.length;
      const imagesChanged = originalImageCount > 0 || newImageCount > 0;

      if (product && product.images && product.images.length > 0 && imagesChanged) {
        // Delete all existing images when images are modified
        // Backend API deletes ALL images for an entity
        try {
          const success = await imageService.deleteImages(branchName, "Products", savedProduct.id);
          if (success) {
            console.log("Successfully deleted old product images from server");
          } else {
            console.error("Failed to delete old product images from server");
          }
        } catch (error) {
          console.error("Error deleting old images from server:", error);
          // Don't fail the whole operation
        }
      }

      // 3. Upload new images if any selected
      if (imagesToUpload.length > 0 && branchName) {
        setUploadingImages(true);
        try {
          await imageService.uploadMultipleImages(
            branchName,
            "Products",
            savedProduct.id,
            imagesToUpload
          );
          console.log(`Successfully uploaded ${imagesToUpload.length} images`);
        } catch (error) {
          console.error("Error uploading images:", error);
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
      setImagesToUpload([]); // Reset selected images
      setImagePreviewUrls([]);
    }
  };

  const handleClose = () => {
    clearError();
    setImagesToUpload([]);
    setImagePreviewUrls(product?.images?.map((img) => img.imagePath) || []);
    onClose();
  };

  // Convert base64 to File object
  const base64ToFile = (base64String: string, filename: string): File => {
    const arr = base64String.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleImagesChange = (newImages: string[]) => {
    setImagePreviewUrls(newImages);

    // Convert base64 images to File objects for upload
    // Filter only new base64 images (not existing URLs)
    const base64Images = newImages.filter(img => img.startsWith('data:'));
    const files = base64Images.map((base64, index) =>
      base64ToFile(base64, `product-image-${Date.now()}-${index}.jpg`)
    );
    setImagesToUpload(files);
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
        additionalContent={
          <>
            <ImageUpload
              branchName={branchName}
              entityType="Products"
              entityId={product?.id}
              currentImages={currentImagePaths}
              multiple={true}
              maxFiles={5}
              onUpload={handleImageUpload}
              onRemove={handleImageRemove}
              label="Product Images (Optional)"
              className="mb-4"
              cacheBust={true}
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
                {selectedImages.length} image{selectedImages.length > 1 ? "s" : ""} ready to upload
              </div>
            )}
          </>
        }
      />
    </>
  );
}
