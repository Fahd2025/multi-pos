"use client";

import React, { useState } from "react";
import { useZones } from "@/hooks/useZones";
import { ZoneDto, CreateZoneDto, UpdateZoneDto } from "@/types/api.types";
import zoneService from "@/services/zone.service";
import { DataTableColumn } from "@/types/data-table.types";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { SidebarDialog } from "@/components/shared/SidebarDialog";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { DataTable } from "@/components/shared/DataTable";
import { useApiError } from "@/hooks/useApiError";
import { toast } from "sonner";

interface ZoneFormData {
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
}

export default function ZoneManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<ZoneDto | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<ZoneDto | null>(null);

  const { zones, mutate, error } = useZones();
  const { setError } = useApiError();

  const [formData, setFormData] = useState<ZoneFormData>({
    name: "",
    description: "",
    displayOrder: 0,
    isActive: true,
  });

  const handleAddZone = () => {
    setSelectedZone(null);
    setFormData({
      name: "",
      description: "",
      displayOrder: (zones?.length || 0) + 1,
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const handleEditZone = (zone: ZoneDto) => {
    setSelectedZone(zone);
    setFormData({
      name: zone.name,
      description: zone.description || "",
      displayOrder: zone.displayOrder,
      isActive: zone.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSaveZone = async () => {
    try {
      if (selectedZone) {
        // Update existing zone
        const updateData: UpdateZoneDto = {
          ...formData,
        };
        await zoneService.updateZone(selectedZone.id, updateData);
        toast.success("Zone updated successfully");
      } else {
        // Create new zone
        const createData: CreateZoneDto = {
          name: formData.name,
          description: formData.description,
          displayOrder: formData.displayOrder,
        };
        await zoneService.createZone(createData);
        toast.success("Zone created successfully");
      }

      await mutate();
      setIsDialogOpen(false);
    } catch (error) {
      setError(error);
      toast.error("Failed to save zone");
    }
  };

  const handleDeleteZone = async () => {
    if (!zoneToDelete) return;

    try {
      await zoneService.deleteZone(zoneToDelete.id);
      await mutate();
      toast.success("Zone deleted successfully");
      setIsDeleteDialogOpen(false);
      setZoneToDelete(null);
    } catch (error) {
      setError(error);
      toast.error("Failed to delete zone");
    }
  };

  const openDeleteDialog = (zone: ZoneDto) => {
    setZoneToDelete(zone);
    setIsDeleteDialogOpen(true);
  };

  const columns: DataTableColumn<ZoneDto>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (value, zone) => (
        <div className="font-medium">{zone.name}</div>
      ),
    },
    {
      key: "description",
      label: "Description",
      render: (value, zone) => (
        <div className="text-gray-600">{zone.description || "-"}</div>
      ),
    },
    {
      key: "displayOrder",
      label: "Display Order",
      sortable: true,
      render: (value, zone) => (
        <div className="text-center">{zone.displayOrder}</div>
      ),
    },
    {
      key: "tableCount",
      label: "Tables",
      sortable: true,
      render: (value, zone) => (
        <div className="text-center">{zone.tableCount || 0}</div>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      sortable: true,
      render: (value, zone) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            zone.isActive
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {zone.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "id",
      label: "Actions",
      render: (value, zone) => (
        <div className="flex gap-2">
          <Button
            onClick={() => handleEditZone(zone)}
            variant="secondary"
            size="sm"
          >
            Edit
          </Button>
          <Button
            onClick={() => openDeleteDialog(zone)}
            variant="danger"
            size="sm"
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Zone Management</h2>
          <p className="text-gray-600">Manage restaurant zones and areas</p>
        </div>
        <Button onClick={handleAddZone} variant="primary">
          Add Zone
        </Button>
      </div>

      {/* Zones Table */}
      <div className="bg-white rounded-lg shadow">
        <DataTable<ZoneDto>
          data={zones || []}
          columns={columns}
          getRowKey={(row) => row.id}
        />
      </div>

      {/* Edit/Create Zone Dialog */}
      <SidebarDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={selectedZone ? "Edit Zone" : "Add New Zone"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Zone Name *</label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Main Dining Area"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Display Order</label>
            <Input
              type="number"
              value={formData.displayOrder}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
              min={0}
            />
            <p className="text-xs text-gray-500 mt-1">
              Lower numbers appear first in the zone list
            </p>
          </div>

          {selectedZone && (
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
          )}

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSaveZone} variant="primary" className="flex-1">
              {selectedZone ? "Update" : "Create"}
            </Button>
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
        onConfirm={handleDeleteZone}
        title="Delete Zone"
        message={
          zoneToDelete?.tableCount && zoneToDelete.tableCount > 0
            ? `This zone has ${zoneToDelete.tableCount} table(s). Are you sure you want to delete "${zoneToDelete.name}"? This action cannot be undone.`
            : `Are you sure you want to delete "${zoneToDelete?.name}"? This action cannot be undone.`
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}
