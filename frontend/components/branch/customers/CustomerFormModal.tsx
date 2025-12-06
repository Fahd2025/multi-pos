/**
 * Customer Form Modal with Image Upload
 * Modal for adding/editing customers with logo upload capability
 */

"use client";

import { useState, useEffect } from "react";
import { CustomerDto, CreateCustomerDto, UpdateCustomerDto } from "@/types/api.types";
import customerService from "@/services/customer.service";
import imageService from "@/services/image.service";
import { FeaturedDialog } from "@/components/shared";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { FormField } from "@/types/data-table.types";
import { useApiError } from "@/hooks/useApiError";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer?: CustomerDto;
  branchName: string; // Required for image upload
}

export default function CustomerFormModal({
  isOpen,
  onClose,
  onSuccess,
  customer,
  branchName,
}: CustomerFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [currentLogoPath, setCurrentLogoPath] = useState<string | null>(null); // Track current logo path separately
  const { error, isError, executeWithErrorHandling, clearError } = useApiError();

  // Initialize currentLogoPath when customer changes
  useEffect(() => {
    if (customer?.logoPath) {
      setCurrentLogoPath(customer.logoPath);
    } else {
      setCurrentLogoPath(null);
    }
    setSelectedImages([]);
  }, [customer, isOpen]);

  // Define form fields
  const fields: FormField<any>[] = [
    {
      name: "code",
      label: "Customer Code",
      type: "text",
      required: true,
      placeholder: "e.g., CUST001",
      disabled: !!customer, // Code cannot be changed in edit mode
    },
    {
      name: "nameEn",
      label: "Name (English)",
      type: "text",
      required: true,
      placeholder: "Customer name in English",
    },
    {
      name: "nameAr",
      label: "Name (Arabic)",
      type: "text",
      placeholder: "اسم العميل بالعربية",
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      placeholder: "customer@example.com",
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
      name: "loyaltyPoints",
      label: "Loyalty Points",
      type: "number",
      defaultValue: 0,
      validation: {
        min: 0,
      },
    },
    {
      name: "isActive",
      label: "Active Customer",
      type: "checkbox",
      defaultValue: true,
    },
  ];

  const handleSubmit = async (data: CustomerDto) => {
    setIsSubmitting(true);

    const result = await executeWithErrorHandling(async () => {
      let savedCustomer;

      if (customer) {
        // Update existing customer
        const updateDto: UpdateCustomerDto = {
          code: data.code,
          nameEn: data.nameEn,
          nameAr: data.nameAr || undefined,
          email: data.email || undefined,
          phone: data.phone || undefined,
          addressEn: data.addressEn || undefined,
          addressAr: data.addressAr || undefined,
          loyaltyPoints: Number(data.loyaltyPoints),
          isActive: data.isActive,
        };
        savedCustomer = await customerService.updateCustomer(customer.id, updateDto);
      } else {
        // Create new customer
        const createDto: CreateCustomerDto = {
          code: data.code,
          nameEn: data.nameEn,
          nameAr: data.nameAr || undefined,
          email: data.email || undefined,
          phone: data.phone || undefined,
          addressEn: data.addressEn || undefined,
          addressAr: data.addressAr || undefined,
          loyaltyPoints: Number(data.loyaltyPoints),
          isActive: data.isActive,
        };
        savedCustomer = await customerService.createCustomer(createDto);
      }

      // Handle logo operations
      const logoWasRemoved = currentLogoPath === null && customer?.logoPath;
      const newLogoSelected = selectedImages.length > 0;

      if (customer && customer.logoPath) {
        // Delete existing logo if user removed it OR is replacing it with a new one
        if (logoWasRemoved || newLogoSelected) {
          try {
            const success = await imageService.deleteImages(
              branchName,
              "Customers",
              savedCustomer.id
            );
            if (success) {
              console.log("Successfully deleted old customer logo from server");
            } else {
              console.error("Failed to delete old customer logo from server");
            }
          } catch (error) {
            console.error("Error deleting old logo from server:", error);
            // Don't fail the whole operation
          }
        }
      }

      // Upload logo if selected
      if (selectedImages.length > 0 && branchName) {
        setUploadingImages(true);
        try {
          await imageService.uploadImage(
            branchName,
            "Customers",
            savedCustomer.id,
            selectedImages[0] // Single logo
          );
          console.log("Successfully uploaded customer logo");
        } catch (error) {
          console.error("Error uploading logo:", error);
          // Don't fail the whole operation
        } finally {
          setUploadingImages(false);
        }
      }

      return savedCustomer;
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
    setCurrentLogoPath(customer?.logoPath || null);
    onClose();
  };

  const handleImageUpload = (files: File[]) => {
    setSelectedImages(files);
  };

  const handleImageRemove = async (imageId: string) => {
    // Only update the UI state to remove the image visually
    // The actual deletion from server will happen when the form is submitted
    setCurrentLogoPath(null);
    console.log("Customer logo visually removed, will be deleted on form submit");
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
      <FeaturedDialog
        isOpen={isOpen}
        onClose={handleClose}
        title={customer ? "Edit Customer" : "Add New Customer"}
        mode={customer ? "edit" : "create"}
        initialData={customer}
        fields={fields}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting || uploadingImages}
        size="md"
        additionalContent={
          <>
            <ImageUpload
              branchName={branchName}
              entityType="Customers"
              entityId={customer?.id}
              currentImages={currentLogoPath ? [currentLogoPath] : []}
              multiple={false}
              maxFiles={1}
              onUpload={handleImageUpload}
              onRemove={handleImageRemove}
              label="Customer Logo (Optional)"
              className="mb-4"
              cacheBust={true}
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
              <div className="text-sm text-gray-600 text-center mt-2">Logo ready to upload</div>
            )}
          </>
        }
      />
    </>
  );
}
