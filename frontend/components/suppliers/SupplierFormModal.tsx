/**
 * Supplier Form Modal with Image Upload
 * Modal for adding/editing suppliers with logo upload capability
 */

"use client";

import { useState } from "react";
import { SupplierDto, CreateSupplierDto, UpdateSupplierDto } from "@/types/api.types";
import supplierService from "@/services/supplier.service";
import imageService from "@/services/image.service";
import { ModalBottomSheet } from "@/components/modals";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { FormField } from "@/types/data-table.types";
import { useApiError } from "@/hooks/useApiError";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  supplier?: SupplierDto;
  branchName: string; // Required for image upload
}

export default function SupplierFormModal({
  isOpen,
  onClose,
  onSuccess,
  supplier,
  branchName,
}: SupplierFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const { error, isError, executeWithErrorHandling, clearError } = useApiError();

  const fields: FormField<any>[] = [
    {
      name: "code",
      label: "Supplier Code",
      type: "text",
      required: true,
      placeholder: "e.g., SUP001",
      disabled: !!supplier, // Code cannot be changed in edit mode
    },
    {
      name: "nameEn",
      label: "Name (English)",
      type: "text",
      required: true,
      placeholder: "Supplier name in English",
    },
    {
      name: "nameAr",
      label: "Name (Arabic)",
      type: "text",
      placeholder: "اسم المورد بالعربية",
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      placeholder: "supplier@example.com",
      validation: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      },
    },
    {
      name: "phone",
      label: "Phone",
      type: "text",
      placeholder: "+1234567890",
    },
    {
      name: "addressEn",
      label: "Address (English)",
      type: "textarea",
      placeholder: "Street address, city, country",
    },
    {
      name: "addressAr",
      label: "Address (Arabic)",
      type: "textarea",
      placeholder: "العنوان، المدينة، الدولة",
    },
    {
      name: "contactPerson",
      label: "Contact Person",
      type: "text",
      placeholder: "Name of primary contact",
    },
    {
      name: "paymentTerms",
      label: "Payment Terms",
      type: "text",
      placeholder: "e.g., Net 30 days",
    },
    {
      name: "isActive",
      label: "Active Supplier",
      type: "checkbox",
      defaultValue: true,
    },
  ];

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);

    const result = await executeWithErrorHandling(async () => {
      const supplierData = {
        code: data.code,
        nameEn: data.nameEn,
        nameAr: data.nameAr || "",
        email: data.email,
        phone: data.phone,
        addressEn: data.addressEn,
        addressAr: data.addressAr,
        contactPerson: data.contactPerson,
        paymentTerms: data.paymentTerms,
        isActive: data.isActive !== false,
      };

      // 1. Create or update the supplier
      const savedSupplier = supplier
        ? await supplierService.updateSupplier(supplier.id, supplierData as UpdateSupplierDto)
        : await supplierService.createSupplier(supplierData as CreateSupplierDto);

      // 2. Upload logo if selected
      if (selectedImages.length > 0 && branchName) {
        setUploadingImages(true);
        try {
          await imageService.uploadImage(
            branchName,
            'Suppliers',
            savedSupplier.id,
            selectedImages[0] // Only one logo
          );
          console.log('Successfully uploaded supplier logo');
        } catch (error) {
          console.error('Error uploading logo:', error);
          // Don't fail the whole operation
        } finally {
          setUploadingImages(false);
        }
      }

      return savedSupplier;
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
    if (!supplier?.id || !branchName) return;

    try {
      await imageService.deleteImages(branchName, 'Suppliers', supplier.id);
      console.log('Logo deleted successfully');
    } catch (error) {
      console.error('Error deleting logo:', error);
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
        title={supplier ? "Edit Supplier" : "Add New Supplier"}
        mode={supplier ? "edit" : "create"}
        initialData={supplier}
        fields={fields}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting || uploadingImages}
        size="lg"
      />

      {/* Image Upload Section */}
      {isOpen && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-6 z-[45] max-h-[40vh] overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <ImageUpload
              branchName={branchName}
              entityType="Suppliers"
              entityId={supplier?.id}
              currentImages={supplier?.images || []}
              multiple={false}
              maxFiles={1}
              onUpload={handleImageUpload}
              onRemove={handleImageRemove}
              label="Supplier Logo (Optional)"
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
                <span className="text-sm font-medium">Uploading logo...</span>
              </div>
            )}

            {selectedImages.length > 0 && !uploadingImages && (
              <div className="text-sm text-gray-600 text-center mt-2">
                Logo ready to upload
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
