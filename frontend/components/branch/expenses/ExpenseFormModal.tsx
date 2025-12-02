/**
 * Expense Form Modal with Receipt Image Upload
 * Create or edit expense with receipt/invoice image upload capability
 */

"use client";

import { useState, useEffect } from "react";
import expenseService from "@/services/expense.service";
import imageService from "@/services/image.service";
import { ExpenseDto, CreateExpenseDto, ExpenseCategoryDto } from "@/types/api.types";
import { ModalBottomSheet } from "@/components/shared";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { FormField } from "@/types/data-table.types";
import { useApiError } from "@/hooks/useApiError";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";

interface ExpenseFormModalProps {
  isOpen: boolean;
  expense?: ExpenseDto;
  categories: ExpenseCategoryDto[];
  branchName: string; // Required for image upload
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExpenseFormModal({
  isOpen,
  expense,
  categories,
  branchName,
  onClose,
  onSuccess,
}: ExpenseFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [currentReceiptPath, setCurrentReceiptPath] = useState<string | null>(null); // Track current receipt path separately
  const { error, isError, executeWithErrorHandling, clearError } = useApiError();

  // Initialize currentReceiptPath when expense changes
  useEffect(() => {
    if (expense?.receiptImagePath) {
      setCurrentReceiptPath(expense.receiptImagePath);
    } else {
      setCurrentReceiptPath(null);
    }
    setSelectedImages([]);
  }, [expense, isOpen]);

  // Prepare initial data
  const initialData = expense
    ? {
        ...expense,
        expenseDate: new Date(expense.expenseDate).toISOString().split("T")[0],
      }
    : {
        expenseDate: new Date().toISOString().split("T")[0],
        amount: 0,
        paymentMethod: 0,
      };

  const fields: FormField<any>[] = [
    {
      name: "expenseCategoryId",
      label: "Category",
      type: "select",
      required: true,
      options: categories.map((cat) => ({
        label: `${cat.nameEn} / ${cat.nameAr || ""}`,
        value: cat.id,
      })),
    },
    {
      name: "amount",
      label: "Amount",
      type: "number",
      required: true,
      validation: {
        min: 0.01,
      },
    },
    {
      name: "expenseDate",
      label: "Expense Date",
      type: "date",
      required: true,
    },
    {
      name: "paymentMethod",
      label: "Payment Method",
      type: "select",
      required: true,
      options: [
        { label: "Cash", value: 0 },
        { label: "Card", value: 1 },
        { label: "Bank Transfer", value: 2 },
        { label: "Other", value: 3 },
      ],
    },
    {
      name: "paymentReference",
      label: "Payment Reference",
      type: "text",
      placeholder: "Transaction ID, check number, etc.",
      validation: {
        maxLength: 200,
      },
    },
    {
      name: "descriptionEn",
      label: "Description (English)",
      type: "textarea",
      required: true,
      validation: {
        maxLength: 500,
      },
    },
    {
      name: "descriptionAr",
      label: "Description (Arabic)",
      type: "textarea",
      validation: {
        maxLength: 500,
      },
    },
  ];

  const handleSubmit = async (data: any) => {
    // Validate branchName if images are selected
    if (selectedImages.length > 0 && (!branchName || branchName.trim() === "")) {
      throw new Error("Branch information is missing. Please refresh the page and try again.");
    }

    setIsSubmitting(true);

    const result = await executeWithErrorHandling(async () => {
      const dto: CreateExpenseDto = {
        expenseCategoryId: data.expenseCategoryId,
        amount: Number(data.amount),
        expenseDate: data.expenseDate,
        descriptionEn: data.descriptionEn,
        descriptionAr: data.descriptionAr,
        paymentMethod: Number(data.paymentMethod),
        paymentReference: data.paymentReference,
        receiptImagePath: data.receiptImagePath,
      };

      // 1. Create or update the expense
      const savedExpense = expense
        ? await expenseService.updateExpense(expense.id, dto)
        : await expenseService.createExpense(dto);

      // 2. Handle receipt image operations
      const imageWasRemoved = currentReceiptPath === null && expense?.receiptImagePath;
      const imagesWereAdded = selectedImages.length > 0;

      if (expense && expense.receiptImagePath) {
        // Delete existing receipt images if user removed them OR is uploading new ones to replace them
        // Note: Backend API deletes ALL images for an entity
        if (imageWasRemoved || imagesWereAdded) {
          try {
            const success = await imageService.deleteImages(
              branchName,
              "Expenses",
              savedExpense.id
            );
            if (success) {
              console.log("Successfully deleted old receipt images from server");
            } else {
              console.error("Failed to delete old receipt images from server");
            }
          } catch (error) {
            console.error("Error deleting old receipt images from server:", error);
            // Don't fail the whole operation
          }
        }
      }

      // 3. Upload receipt images if selected
      if (selectedImages.length > 0) {
        setUploadingImages(true);
        try {
          await imageService.uploadMultipleImages(
            branchName,
            "Expenses",
            savedExpense.id,
            selectedImages // Multiple receipt images (up to 3)
          );
          console.log(`Successfully uploaded ${selectedImages.length} receipt image(s)`);
        } catch (error) {
          console.error("Error uploading receipt images:", error);
          throw error; // Re-throw to show error to user
        } finally {
          setUploadingImages(false);
        }
      }

      return savedExpense;
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
    setCurrentReceiptPath(expense?.receiptImagePath || null);
    onClose();
  };

  const handleImageUpload = (files: File[]) => {
    setSelectedImages(files);
  };

  const handleImageRemove = async (imageId: string) => {
    // For expenses, receipt images are typically all related, so remove all
    // The actual deletion from server will happen when the form is submitted
    setCurrentReceiptPath(null);
    console.log("Receipt images visually removed, will be deleted on form submit");
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
        title={expense ? "Edit Expense" : "Add New Expense"}
        mode={expense ? "edit" : "create"}
        initialData={initialData}
        fields={fields}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting || uploadingImages}
        size="md"
        additionalContent={
          <>
            <ImageUpload
              branchName={branchName}
              entityType="Expenses"
              entityId={expense?.id}
              currentImages={currentReceiptPath ? [currentReceiptPath] : []}
              multiple={true}
              maxFiles={3}
              onUpload={handleImageUpload}
              onRemove={handleImageRemove}
              label="Receipt/Invoice Images (Optional, up to 3)"
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
                <span className="text-sm font-medium">Uploading receipt images...</span>
              </div>
            )}

            {selectedImages.length > 0 && !uploadingImages && (
              <div className="text-sm text-gray-600 text-center mt-2">
                {selectedImages.length} receipt image{selectedImages.length > 1 ? "s" : ""} ready to
                upload
              </div>
            )}
          </>
        }
      />
    </>
  );
}
