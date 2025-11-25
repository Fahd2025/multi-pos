/**
 * Customer Form Modal
 * Modal for adding/editing customers using generic ModalBottomSheet
 */

"use client";

import { useState } from "react";
import { CustomerDto, CreateCustomerDto, UpdateCustomerDto } from "@/types/api.types";
import customerService from "@/services/customer.service";
import { ModalBottomSheet } from "@/components/modals";
import { FormField } from "@/types/data-table.types";

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer?: CustomerDto; // If provided, edit mode; otherwise, add mode
}

export default function CustomerFormModal({
  isOpen,
  onClose,
  onSuccess,
  customer,
}: CustomerFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    try {
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
        await customerService.updateCustomer(customer.id, updateDto);
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
        await customerService.createCustomer(createDto);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to save customer:", err);
      // Ideally we would show this error in the modal, but ModalBottomSheet doesn't support external errors yet.
      // We could add a toast notification here if we had a toast system.
      alert(err.message || "Failed to save customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? "Edit Customer" : "Add New Customer"}
      mode={customer ? "edit" : "create"}
      initialData={customer}
      fields={fields}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      size="md"
    />
  );
}
