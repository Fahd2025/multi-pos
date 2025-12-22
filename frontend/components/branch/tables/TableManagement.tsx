"use client";

import React, { useState } from "react";
import TableLayout from "./TableLayout";
import { useTablesWithStatus } from "@/hooks/useTables";
import { useZones } from "@/hooks/useZones";
import { TableWithStatusDto, CreateTableDto, UpdateTableDto, PositionDto } from "@/types/api.types";
import tableService from "@/services/table.service";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { Select } from "@/components/shared/Select";
import { SidebarDialog } from "@/components/shared/SidebarDialog";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { useApiError } from "@/hooks/useApiError";
import { toast } from "sonner";

interface TableFormData {
  number: number;
  name: string;
  capacity: number;
  position: PositionDto;
  dimensions: {
    width: number;
    height: number;
    shape: "Rectangle" | "Circle" | "Square";
  };
  zoneId?: number;
  isActive: boolean;
}

export default function TableManagement() {
  const [selectedZoneId, setSelectedZoneId] = useState<number | undefined>();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableWithStatusDto | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<TableWithStatusDto | null>(null);

  const { tables, mutate, error: tablesError } = useTablesWithStatus(selectedZoneId);
  const { zones, error: zonesError } = useZones();
  const { setError } = useApiError();

  const [formData, setFormData] = useState<TableFormData>({
    number: 1,
    name: "",
    capacity: 4,
    position: { x: 10, y: 10, rotation: 0 },
    dimensions: { width: 10, height: 10, shape: "Rectangle" },
    zoneId: undefined,
    isActive: true,
  });

  const handleTableClick = (table: TableWithStatusDto) => {
    if (isEditMode) {
      // In edit mode, open the dialog to edit table
      setSelectedTable(table);
      setFormData({
        number: table.number,
        name: table.name,
        capacity: table.capacity,
        position: table.position,
        dimensions: table.dimensions,
        zoneId: table.zoneId,
        isActive: table.isActive,
      });
      setIsDialogOpen(true);
    } else {
      // In view mode, show table details (could open a different dialog)
      toast.info(`Table ${table.number}: ${table.name}`, {
        description: `Status: ${table.status}, Capacity: ${table.capacity}`,
      });
    }
  };

  const handleTablePositionChange = async (tableId: number, position: { x: number; y: number }) => {
    const table = tables?.find(t => t.id === tableId);
    if (!table) return;

    try {
      const updateData: UpdateTableDto = {
        number: table.number,
        name: table.name,
        capacity: table.capacity,
        position: {
          x: position.x,
          y: position.y,
          rotation: table.position.rotation,
        },
        dimensions: table.dimensions,
        zoneId: table.zoneId,
        isActive: table.isActive,
      };

      await tableService.updateTable(tableId, updateData);
      await mutate();
      toast.success("Table position updated");
    } catch (error) {
      setError(error);
      toast.error("Failed to update table position");
    }
  };

  const handleAddTable = () => {
    setSelectedTable(null);
    setFormData({
      number: (tables?.length || 0) + 1,
      name: `Table ${(tables?.length || 0) + 1}`,
      capacity: 4,
      position: { x: 10, y: 10, rotation: 0 },
      dimensions: { width: 10, height: 10, shape: "Rectangle" },
      zoneId: selectedZoneId,
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const handleSaveTable = async () => {
    try {
      if (selectedTable) {
        // Update existing table
        const updateData: UpdateTableDto = {
          ...formData,
        };
        await tableService.updateTable(selectedTable.id, updateData);
        toast.success("Table updated successfully");
      } else {
        // Create new table
        const createData: CreateTableDto = {
          number: formData.number,
          name: formData.name,
          capacity: formData.capacity,
          position: formData.position,
          dimensions: formData.dimensions,
          zoneId: formData.zoneId,
        };
        await tableService.createTable(createData);
        toast.success("Table created successfully");
      }

      await mutate();
      setIsDialogOpen(false);
    } catch (error) {
      setError(error);
      toast.error("Failed to save table");
    }
  };

  const handleDeleteTable = async () => {
    if (!tableToDelete) return;

    try {
      await tableService.deleteTable(tableToDelete.id);
      await mutate();
      toast.success("Table deleted successfully");
      setIsDeleteDialogOpen(false);
      setTableToDelete(null);
    } catch (error) {
      setError(error);
      toast.error("Failed to delete table");
    }
  };

  const openDeleteDialog = (table: TableWithStatusDto) => {
    setTableToDelete(table);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with controls */}
      <div className="flex items-center justify-between mb-4 p-4 bg-white rounded-lg shadow">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Table Layout</h2>

          {/* Zone filter */}
          <Select
            value={selectedZoneId?.toString() || "all"}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedZoneId(e.target.value === "all" ? undefined : Number(e.target.value))}
            className="w-48"
            options={[
              { value: "all", label: "All Zones" },
              ...(zones?.map((zone) => ({ value: zone.id.toString(), label: zone.name })) || [])
            ]}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsEditMode(!isEditMode)}
            variant={isEditMode ? "primary" : "secondary"}
          >
            {isEditMode ? "Exit Edit Mode" : "Edit Layout"}
          </Button>
          <Button onClick={handleAddTable} variant="primary">
            Add Table
          </Button>
        </div>
      </div>

      {/* Table Layout */}
      <div className="flex-1 overflow-auto">
        <TableLayout
          tables={tables || []}
          onTableClick={handleTableClick}
          onTablePositionChange={handleTablePositionChange}
          isEditMode={isEditMode}
        />
      </div>

      {/* Edit/Create Table Dialog */}
      <SidebarDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={selectedTable ? "Edit Table" : "Add New Table"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Table Number</label>
            <Input
              type="number"
              value={formData.number}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, number: Number(e.target.value) })}
              min={1}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Table Name</label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Capacity</label>
            <Input
              type="number"
              value={formData.capacity}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, capacity: Number(e.target.value) })}
              min={1}
              max={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Zone</label>
            <Select
              value={formData.zoneId?.toString() || ""}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, zoneId: e.target.value ? Number(e.target.value) : undefined })}
              options={[
                { value: "", label: "No Zone" },
                ...(zones?.map((zone) => ({ value: zone.id.toString(), label: zone.name })) || [])
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Shape</label>
            <Select
              value={formData.dimensions.shape}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({
                ...formData,
                dimensions: { ...formData.dimensions, shape: e.target.value as "Rectangle" | "Circle" | "Square" }
              })}
              options={[
                { value: "Rectangle", label: "Rectangle" },
                { value: "Square", label: "Square" },
                { value: "Circle", label: "Circle" }
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Width (%)</label>
              <Input
                type="number"
                value={formData.dimensions.width}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({
                  ...formData,
                  dimensions: { ...formData.dimensions, width: Number(e.target.value) }
                })}
                min={1}
                max={100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Height (%)</label>
              <Input
                type="number"
                value={formData.dimensions.height}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({
                  ...formData,
                  dimensions: { ...formData.dimensions, height: Number(e.target.value) }
                })}
                min={1}
                max={100}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Position X (%)</label>
              <Input
                type="number"
                value={formData.position.x}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({
                  ...formData,
                  position: { ...formData.position, x: Number(e.target.value) }
                })}
                min={0}
                max={100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Position Y (%)</label>
              <Input
                type="number"
                value={formData.position.y}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({
                  ...formData,
                  position: { ...formData.position, y: Number(e.target.value) }
                })}
                min={0}
                max={100}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Rotation (degrees)</label>
            <Input
              type="number"
              value={formData.position.rotation}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({
                ...formData,
                position: { ...formData.position, rotation: Number(e.target.value) }
              })}
              min={0}
              max={360}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="isActive" className="text-sm font-medium">Active</label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSaveTable} variant="primary" className="flex-1">
              {selectedTable ? "Update" : "Create"}
            </Button>
            {selectedTable && (
              <Button
                onClick={() => {
                  setIsDialogOpen(false);
                  openDeleteDialog(selectedTable);
                }}
                variant="danger"
              >
                Delete
              </Button>
            )}
            <Button onClick={() => setIsDialogOpen(false)} variant="secondary">
              Cancel
            </Button>
          </div>
        </div>
      </SidebarDialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteTable}
        title="Delete Table"
        message={`Are you sure you want to delete ${tableToDelete?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}
