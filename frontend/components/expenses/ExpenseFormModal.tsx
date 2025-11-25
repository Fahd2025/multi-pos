/**
 * Expense Form Modal Component
 * Create or edit expense using generic ModalBottomSheet
 */

"use client";

import { useState } from "react";
import expenseService from "@/services/expense.service";
import { ExpenseDto, CreateExpenseDto, ExpenseCategoryDto } from "@/types/api.types";
import { ModalBottomSheet } from "@/components/modals";
import { FormField } from "@/types/data-table.types";

interface ExpenseFormModalProps {
  expense?: ExpenseDto;
  categories: ExpenseCategoryDto[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExpenseFormModal({
  expense,
  categories,
  onClose,
  onSuccess,
}: ExpenseFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    {
      name: "receiptImagePath",
      label: "Receipt Image Path",
      type: "text",
      placeholder: "/uploads/receipts/expense-001.jpg",
      validation: {
        maxLength: 500,
      },
    },
  ];

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
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

      if (expense) {
        await expenseService.updateExpense(expense.id, dto);
      } else {
        await expenseService.createExpense(dto);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to save expense:", err);
      alert(err.message || "Failed to save expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalBottomSheet
      isOpen={true}
      onClose={onClose}
      title={expense ? "Edit Expense" : "Add New Expense"}
      mode={expense ? "edit" : "create"}
      initialData={initialData}
      fields={fields}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      size="md"
    />
  );
}
