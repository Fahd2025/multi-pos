/**
 * Unit Form Modal
 * Modal for adding/editing units of measurement
 */

"use client";

import { useState, useEffect } from "react";
import { UnitDto, CreateUnitRequest } from "@/types/api.types";
import inventoryService from "@/services/inventory.service";
import { FeaturedDialog } from "@/components/shared";
import { FormField } from "@/types/data-table.types";
import { useApiOperation } from "@/hooks/useApiOperation";

interface UnitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  unit?: UnitDto;
}

export default function UnitFormModal({
  isOpen,
  onClose,
  onSuccess,
  unit,
}: UnitFormModalProps) {
  const { execute, isLoading } = useApiOperation();
  const [baseUnits, setBaseUnits] = useState<UnitDto[]>([]);

  // Load base units for dropdown
  useEffect(() => {
    if (isOpen) {
      loadBaseUnits();
    }
  }, [isOpen]);

  const loadBaseUnits = async () => {
    try {
      const units = await inventoryService.getBaseUnits();
      setBaseUnits(units);
    } catch (error) {
      console.error("Failed to load base units:", error);
    }
  };

  const fields: FormField<any>[] = [
    {
      name: "code",
      label: "Unit Code",
      type: "text",
      required: true,
      placeholder: "e.g., KG, L, PCS",
      helperText: "Unique code for this unit (uppercase recommended)",
    },
    {
      name: "nameEn",
      label: "Name (English)",
      type: "text",
      required: true,
      placeholder: "e.g., Kilogram, Liter, Piece",
    },
    {
      name: "nameAr",
      label: "Name (Arabic)",
      type: "text",
      required: true,
      placeholder: "مثال: كيلوجرام، لتر، قطعة",
    },
    {
      name: "symbol",
      label: "Symbol",
      type: "text",
      placeholder: "e.g., kg, L, pc",
      helperText: "Short abbreviation for display",
    },
    {
      name: "displayOrder",
      label: "Display Order",
      type: "number",
      required: true,
      defaultValue: 0,
      validation: {
        min: 0,
      },
      helperText: "Order in dropdowns (lower appears first)",
    },
    {
      name: "isBaseUnit",
      label: "Is Base Unit",
      type: "checkbox",
      defaultValue: true,
      helperText: "Base units are used for conversions (e.g., Gram is base, Kilogram is derived)",
    },
    {
      name: "baseUnitId",
      label: "Base Unit",
      type: "select",
      options: [
        { label: "-- Select Base Unit --", value: "" },
        ...baseUnits.map((u) => ({
          label: `${u.nameEn} (${u.symbol || u.code})`,
          value: u.id,
        })),
      ],
      helperText: "The base unit this unit is derived from (only for derived units)",
    },
    {
      name: "conversionFactor",
      label: "Conversion Factor",
      type: "number",
      placeholder: "e.g., 1000 for kg (1 kg = 1000 g)",
      validation: {
        min: 0.000001,
      },
      helperText: "How many base units equal 1 of this unit (only for derived units)",
    },
    {
      name: "allowFractional",
      label: "Allow Fractional Quantities",
      type: "checkbox",
      defaultValue: false,
      helperText: "Allow decimal quantities (e.g., 0.5 kg). Disable for discrete items like pieces.",
    },
    {
      name: "decimalPlaces",
      label: "Decimal Places",
      type: "number",
      required: true,
      defaultValue: 0,
      validation: {
        min: 0,
        max: 4,
      },
      helperText: "Number of decimal places to display (0-4)",
    },
    {
      name: "notes",
      label: "Notes",
      type: "textarea",
      placeholder: "Additional information about this unit...",
      helperText: "Optional notes for internal reference",
    },
  ];

  const handleSubmit = async (data: any) => {
    await execute({
      operation: async () => {
        const unitData: CreateUnitRequest = {
          code: data.code.toUpperCase().trim(),
          nameEn: data.nameEn.trim(),
          nameAr: data.nameAr.trim(),
          symbol: data.symbol?.trim() || undefined,
          isBaseUnit: data.isBaseUnit ?? true,
          baseUnitId: data.isBaseUnit ? undefined : data.baseUnitId || undefined,
          conversionFactor: data.isBaseUnit ? undefined : Number(data.conversionFactor) || undefined,
          allowFractional: data.allowFractional ?? false,
          decimalPlaces: Number(data.decimalPlaces) || 0,
          displayOrder: Number(data.displayOrder) || 0,
          notes: data.notes?.trim() || undefined,
        };

        const savedUnit = unit
          ? await inventoryService.updateUnit(unit.id, unitData)
          : await inventoryService.createUnit(unitData);

        return savedUnit;
      },
      successMessage: unit ? "Unit updated successfully" : "Unit created successfully",
      successDetail: `${data.nameEn} has been ${unit ? "updated" : "added"}`,
      onSuccess: () => {
        onSuccess();
        onClose();
      },
    });
  };

  return (
    <FeaturedDialog
      isOpen={isOpen}
      onClose={onClose}
      title={unit ? "Edit Unit" : "Add New Unit"}
      mode={unit ? "edit" : "create"}
      initialData={unit}
      fields={fields}
      onSubmit={handleSubmit}
      isSubmitting={isLoading}
      size="md"
    />
  );
}
