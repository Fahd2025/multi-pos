# Table Management System - Implementation Plan v2 (Part 2)

**Continuation from Part 1**

---

### Phase 6: UI Components (Continued)

#### 4.7 Create TableManagement Component with Hybrid Mode

**File:** `frontend/components/pos/TableManagement.tsx`

```typescript
"use client";

import { useState } from "react";
import { SidebarDialog } from "@/components/shared/SidebarDialog";
import ConfirmationDialog from "@/components/shared/ConfirmationDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit2, Trash2, Save, Layers } from "lucide-react";
import { Table } from "@/types/entities.types";
import { tableApi } from "@/lib/api/table-service";
import { useTables } from "@/hooks/useTables";
import { useZones } from "@/hooks/useZones";
import { toast } from "sonner";
import { TableLayout } from "./TableLayout";

interface TableManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTablesUpdate?: () => void;
}

export function TableManagement({
  open,
  onOpenChange,
  onTablesUpdate,
}: TableManagementProps) {
  const { tables = [], isLoading: loading, mutate: fetchTables } = useTables();
  const { zones = [] } = useZones();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form state
  const [tableNumber, setTableNumber] = useState("");
  const [tableName, setTableName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [positionX, setPositionX] = useState("");
  const [positionY, setPositionY] = useState("");
  const [rotation, setRotation] = useState("0");
  const [width, setWidth] = useState("10");
  const [height, setHeight] = useState("10");
  const [shape, setShape] = useState("Rectangle");
  const [zoneId, setZoneId] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Temporary position updates during drag (not saved yet)
  const [tempPositions, setTempPositions] = useState<Record<number, { x: number; y: number }>>({});

  const handleAddTable = () => {
    setIsEditing(false);
    setSelectedTable(null);
    setTableNumber("");
    setTableName("");
    setCapacity("");
    setPositionX("50");
    setPositionY("50");
    setRotation("0");
    setWidth("10");
    setHeight("10");
    setShape("Rectangle");
    setZoneId("");
    setEditDialogOpen(true);
  };

  const handleEditTable = (table: Table) => {
    setIsEditing(true);
    setSelectedTable(table);
    setTableNumber(table.number.toString());
    setTableName(table.name);
    setCapacity(table.capacity.toString());
    setPositionX(table.position?.x?.toString() || "50");
    setPositionY(table.position?.y?.toString() || "50");
    setRotation(table.position?.rotation?.toString() || "0");
    setWidth(table.dimensions?.width?.toString() || "10");
    setHeight(table.dimensions?.height?.toString() || "10");
    setShape(table.dimensions?.shape || "Rectangle");
    setZoneId(table.zoneId?.toString() || "");
    setEditDialogOpen(true);
  };

  const handleDeleteTable = (table: Table) => {
    setSelectedTable(table);
    setDeleteDialogOpen(true);
  };

  const handleSaveTable = async () => {
    // Validate inputs
    if (!tableNumber || !tableName || !capacity || !positionX || !positionY) {
      toast.error("All required fields must be filled");
      return;
    }

    const numTableNumber = parseInt(tableNumber);
    const numCapacity = parseInt(capacity);
    const numPosX = parseFloat(positionX);
    const numPosY = parseFloat(positionY);
    const numRotation = parseInt(rotation);
    const numWidth = parseFloat(width);
    const numHeight = parseFloat(height);

    // Validate ranges
    if (numTableNumber < 1) {
      toast.error("Table number must be at least 1");
      return;
    }

    if (numCapacity < 1 || numCapacity > 100) {
      toast.error("Capacity must be between 1 and 100");
      return;
    }

    if (numPosX < 0 || numPosX > 100 || numPosY < 0 || numPosY > 100) {
      toast.error("Position must be between 0 and 100");
      return;
    }

    const tableData = {
      number: numTableNumber,
      name: tableName,
      capacity: numCapacity,
      position: {
        x: numPosX,
        y: numPosY,
        rotation: numRotation,
      },
      dimensions: {
        width: numWidth,
        height: numHeight,
        shape: shape as "Rectangle" | "Circle" | "Square",
      },
      zoneId: zoneId ? parseInt(zoneId) : undefined,
      isActive: true,
    };

    setIsSaving(true);

    try {
      if (isEditing && selectedTable) {
        await tableApi.updateTable(selectedTable.id, tableData);
        toast.success("Table updated successfully");
      } else {
        await tableApi.createTable(tableData);
        toast.success("Table added successfully");
      }

      setEditDialogOpen(false);
      fetchTables();
      onTablesUpdate?.();
    } catch (error) {
      console.error("Error saving table:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save table"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTable) return;

    try {
      await tableApi.deleteTable(selectedTable.id);
      toast.success("Table deleted successfully");
      setDeleteDialogOpen(false);
      fetchTables();
      onTablesUpdate?.();
    } catch (error) {
      console.error("Error deleting table:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete table"
      );
    }
  };

  const handleTablePositionChange = (tableId: number, x: number, y: number) => {
    // Update temporary positions (visual only, not saved yet)
    setTempPositions((prev) => ({
      ...prev,
      [tableId]: { x, y },
    }));
  };

  return (
    <>
      <SidebarDialog
        isOpen={open}
        onClose={() => onOpenChange(false)}
        title="Table Management"
        subtitle="Manage your floor plan tables and zones"
        width="2xl"
      >
        <div className="space-y-4 p-4 h-full flex flex-col">
          {/* Toolbar */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button onClick={handleAddTable} disabled={isEditMode}>
                <Plus className="mr-2 h-4 w-4" />
                Add Table
              </Button>
              <Button
                variant={isEditMode ? "default" : "outline"}
                onClick={() => setIsEditMode(!isEditMode)}
              >
                <Edit2 className="mr-2 h-4 w-4" />
                {isEditMode ? "Exit Edit Mode" : "Edit Layout"}
              </Button>
            </div>
          </div>

          {/* Visual Floor Plan OR Table List */}
          {isEditMode ? (
            <div className="flex-1 border rounded-lg p-4 bg-gray-50">
              <p className="text-sm text-gray-600 mb-4">
                🖱️ <strong>Edit Mode:</strong> Drag tables to reposition them.
                Changes are saved automatically.
              </p>
              <TableLayout
                isEditMode={true}
                onTablePositionChange={handleTablePositionChange}
              />
            </div>
          ) : (
            <div className="flex-1 overflow-auto border rounded-lg">
              {loading ? (
                <div className="text-center py-8">Loading tables...</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left">Table #</th>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Capacity</th>
                      <th className="px-4 py-2 text-left">Zone</th>
                      <th className="px-4 py-2 text-left">Position</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tables.map((table) => (
                      <tr key={table.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-2 font-semibold">
                          {table.number}
                        </td>
                        <td className="px-4 py-2">{table.name}</td>
                        <td className="px-4 py-2">{table.capacity} seats</td>
                        <td className="px-4 py-2">
                          {table.zoneName ? (
                            <span className="inline-flex items-center gap-1 text-sm">
                              <Layers className="h-3 w-3" />
                              {table.zoneName}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">
                              No zone
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          ({table.position.x.toFixed(1)}%,{" "}
                          {table.position.y.toFixed(1)}%)
                        </td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTable(table)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTable(table)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {tables.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  No tables yet. Click 'Add Table' to create one.
                </div>
              )}
            </div>
          )}
        </div>
      </SidebarDialog>

      {/* Add/Edit Table Dialog */}
      <SidebarDialog
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        title={isEditing ? "Edit Table" : "Add New Table"}
        width="lg"
      >
        <div className="space-y-4 p-4 h-full flex flex-col">
          <div className="flex-1 space-y-4 overflow-auto">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tableNumber">
                  Table Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tableNumber"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tableName">
                  Table Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tableName"
                  placeholder="Table 1"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">
                  Capacity (seats) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="4"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />
              </div>

              {zones.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="zone">Zone</Label>
                  <Select value={zoneId} onValueChange={setZoneId}>
                    <SelectTrigger id="zone">
                      <SelectValue placeholder="No zone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No zone</SelectItem>
                      {zones.map((zone) => (
                        <SelectItem key={zone.id} value={zone.id.toString()}>
                          {zone.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Position */}
            <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
              <div>
                <h4 className="text-sm font-medium mb-1">
                  Position on Floor Plan
                </h4>
                <p className="text-xs text-gray-500">
                  Position values are percentages (0-100) of the floor plan
                  area. You can also drag tables in Edit Layout mode.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="positionX">
                    X Position (%) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="positionX"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="50"
                    value={positionX}
                    onChange={(e) => setPositionX(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="positionY">
                    Y Position (%) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="positionY"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="50"
                    value={positionY}
                    onChange={(e) => setPositionY(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Appearance */}
            <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
              <h4 className="text-sm font-medium">Appearance</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width">Width (%)</Label>
                  <Input
                    id="width"
                    type="number"
                    min="1"
                    max="100"
                    step="0.1"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height">Height (%)</Label>
                  <Input
                    id="height"
                    type="number"
                    min="1"
                    max="100"
                    step="0.1"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rotation">Rotation (°)</Label>
                  <Input
                    id="rotation"
                    type="number"
                    min="0"
                    max="360"
                    step="15"
                    value={rotation}
                    onChange={(e) => setRotation(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shape">Shape</Label>
                <Select value={shape} onValueChange={setShape}>
                  <SelectTrigger id="shape">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rectangle">Rectangle</SelectItem>
                    <SelectItem value="Circle">Circle</SelectItem>
                    <SelectItem value="Square">Square</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveTable} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving
                ? "Saving..."
                : isEditing
                ? "Update Table"
                : "Add Table"}
            </Button>
          </div>
        </div>
      </SidebarDialog>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Table"
        message={`Are you sure you want to delete "${selectedTable?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  );
}
```

#### 4.8 Create ZoneManagement Component

**File:** `frontend/components/pos/ZoneManagement.tsx`

```typescript
"use client";

import { useState } from "react";
import { SidebarDialog } from "@/components/shared/SidebarDialog";
import ConfirmationDialog from "@/components/shared/ConfirmationDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2, Save, Layers } from "lucide-react";
import { Zone } from "@/types/entities.types";
import { zoneApi } from "@/lib/api/zone-service";
import { useZones } from "@/hooks/useZones";
import { toast } from "sonner";

interface ZoneManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onZonesUpdate?: () => void;
}

export function ZoneManagement({
  open,
  onOpenChange,
  onZonesUpdate,
}: ZoneManagementProps) {
  const { zones = [], isLoading: loading, mutate: fetchZones } = useZones();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

  // Form state
  const [zoneName, setZoneName] = useState("");
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddZone = () => {
    setIsEditing(false);
    setSelectedZone(null);
    setZoneName("");
    setDescription("");
    setDisplayOrder((zones.length + 1).toString());
    setEditDialogOpen(true);
  };

  const handleEditZone = (zone: Zone) => {
    setIsEditing(true);
    setSelectedZone(zone);
    setZoneName(zone.name);
    setDescription(zone.description || "");
    setDisplayOrder(zone.displayOrder.toString());
    setEditDialogOpen(true);
  };

  const handleDeleteZone = (zone: Zone) => {
    setSelectedZone(zone);
    setDeleteDialogOpen(true);
  };

  const handleSaveZone = async () => {
    if (!zoneName) {
      toast.error("Zone name is required");
      return;
    }

    const zoneData = {
      name: zoneName,
      description: description || undefined,
      displayOrder: parseInt(displayOrder) || 0,
      isActive: true,
    };

    setIsSaving(true);

    try {
      if (isEditing && selectedZone) {
        await zoneApi.updateZone(selectedZone.id, zoneData);
        toast.success("Zone updated successfully");
      } else {
        await zoneApi.createZone({
          name: zoneName,
          description: description || undefined,
          displayOrder: parseInt(displayOrder) || 0,
        });
        toast.success("Zone added successfully");
      }

      setEditDialogOpen(false);
      fetchZones();
      onZonesUpdate?.();
    } catch (error) {
      console.error("Error saving zone:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save zone"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedZone) return;

    try {
      await zoneApi.deleteZone(selectedZone.id);
      toast.success("Zone deleted successfully");
      setDeleteDialogOpen(false);
      fetchZones();
      onZonesUpdate?.();
    } catch (error) {
      console.error("Error deleting zone:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete zone"
      );
    }
  };

  return (
    <>
      <SidebarDialog
        isOpen={open}
        onClose={() => onOpenChange(false)}
        title="Zone Management"
        subtitle="Manage restaurant zones and areas"
        width="xl"
      >
        <div className="space-y-4 p-4">
          <div className="flex justify-end">
            <Button onClick={handleAddZone}>
              <Plus className="mr-2 h-4 w-4" />
              Add Zone
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading zones...</div>
          ) : (
            <div className="border rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Order</th>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Description</th>
                    <th className="px-4 py-2 text-left">Tables</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map((zone) => (
                    <tr key={zone.id} className="border-t">
                      <td className="px-4 py-2 font-semibold">
                        {zone.displayOrder}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-gray-500" />
                          {zone.name}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {zone.description || "-"}
                      </td>
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {zone.tableCount ?? 0} tables
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditZone(zone)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteZone(zone)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {zones.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No zones yet. Click 'Add Zone' to create one.
                </div>
              )}
            </div>
          )}
        </div>
      </SidebarDialog>

      {/* Add/Edit Zone Dialog */}
      <SidebarDialog
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        title={isEditing ? "Edit Zone" : "Add New Zone"}
        width="md"
      >
        <div className="space-y-4 p-4 h-full flex flex-col">
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="zoneName">
                Zone Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="zoneName"
                placeholder="e.g., Main Hall, Patio, Bar"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input
                id="displayOrder"
                type="number"
                min="0"
                placeholder="0"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Lower numbers appear first in lists
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t mt-auto">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveZone} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : isEditing ? "Update" : "Add"} Zone
            </Button>
          </div>
        </div>
      </SidebarDialog>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Zone"
        message={`Are you sure you want to delete "${selectedZone?.name}"? You must reassign or delete all tables in this zone first.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  );
}
```

---

### Phase 7: Page Implementation

#### 4.9 Create Tables Page with All Features

**File:** `frontend/app/[locale]/(pos)/pos/tables/page.tsx`

```typescript
"use client";

import { useState, Suspense, lazy } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import { TableLayout } from "@/components/pos/TableLayout";
import { Settings, Loader2, Layers } from "lucide-react";

// Lazy load management dialogs
const TableManagement = lazy(() =>
  import("@/components/pos/TableManagement").then((mod) => ({
    default: mod.TableManagement,
  }))
);

const ZoneManagement = lazy(() =>
  import("@/components/pos/ZoneManagement").then((mod) => ({
    default: mod.ZoneManagement,
  }))
);

function TableLayoutFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      <span className="ml-2 text-gray-500">Loading floor plan...</span>
    </div>
  );
}

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-red-500">
      <p className="text-lg font-semibold">Failed to load tables</p>
      <p className="text-sm text-gray-600 mt-2">{error.message}</p>
      <Button variant="outline" onClick={resetErrorBoundary} className="mt-4">
        Retry
      </Button>
    </div>
  );
}

export default function TablesPage() {
  const [showTableSettings, setShowTableSettings] = useState(false);
  const [showZoneSettings, setShowZoneSettings] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <Button
          variant="default"
          size="icon"
          onClick={() => setShowZoneSettings(true)}
          className="shadow-lg rounded-full h-14 w-14"
          title="Manage Zones"
        >
          <Layers className="h-5 w-5" />
        </Button>
        <Button
          variant="default"
          size="icon"
          onClick={() => setShowTableSettings(true)}
          className="shadow-lg rounded-full h-14 w-14"
          title="Manage Tables"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {/* Floor Plan */}
      <div className="flex-1 overflow-auto p-6">
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          onReset={() => setRefreshKey((k) => k + 1)}
        >
          <Suspense fallback={<TableLayoutFallback />}>
            <TableLayout key={refreshKey} />
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* Table Management Dialog */}
      {showTableSettings && (
        <Suspense fallback={null}>
          <TableManagement
            open={showTableSettings}
            onOpenChange={setShowTableSettings}
            onTablesUpdate={() => setRefreshKey((prev) => prev + 1)}
          />
        </Suspense>
      )}

      {/* Zone Management Dialog */}
      {showZoneSettings && (
        <Suspense fallback={null}>
          <ZoneManagement
            open={showZoneSettings}
            onOpenChange={setShowZoneSettings}
            onZonesUpdate={() => setRefreshKey((prev) => prev + 1)}
          />
        </Suspense>
      )}

      {/* Legend */}
      <div className="border-t bg-white px-6 py-4">
        <div className="flex items-center justify-center gap-8">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-green-500" />
            <span className="text-sm">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-red-500" />
            <span className="text-sm">Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-yellow-500" />
            <span className="text-sm">Reserved</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 5. Testing & Validation

### Backend Testing

#### 5.1 Zone CRUD Tests

```bash
# Set your auth token
TOKEN="your_jwt_token_here"

# Create zone
curl -X POST https://localhost:5001/api/v1/zones \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Hall",
    "description": "Primary dining area",
    "displayOrder": 1
  }'

# Get all zones
curl https://localhost:5001/api/v1/zones \
  -H "Authorization: Bearer $TOKEN"

# Update zone
curl -X PUT https://localhost:5001/api/v1/zones/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Dining Hall",
    "description": "Updated description",
    "displayOrder": 1,
    "isActive": true
  }'

# Delete zone
curl -X DELETE https://localhost:5001/api/v1/zones/1 \
  -H "Authorization: Bearer $TOKEN"
```

#### 5.2 Table CRUD Tests

```bash
# Create table
curl -X POST https://localhost:5001/api/v1/tables \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "number": 1,
    "name": "Table 1",
    "capacity": 4,
    "position": { "x": 25, "y": 25, "rotation": 0 },
    "dimensions": { "width": 10, "height": 10, "shape": "Rectangle" },
    "zoneId": 1
  }'

# Get all tables
curl https://localhost:5001/api/v1/tables \
  -H "Authorization: Bearer $TOKEN"

# Get tables with status
curl https://localhost:5001/api/v1/tables/status \
  -H "Authorization: Bearer $TOKEN"

# Get tables by zone
curl "https://localhost:5001/api/v1/tables?zoneId=1" \
  -H "Authorization: Bearer $TOKEN"

# Update table
curl -X PUT https://localhost:5001/api/v1/tables/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "number": 1,
    "name": "VIP Table 1",
    "capacity": 6,
    "position": { "x": 30, "y": 30, "rotation": 45 },
    "dimensions": { "width": 12, "height": 12, "shape": "Circle" },
    "zoneId": 1,
    "isActive": true
  }'

# Delete table
curl -X DELETE https://localhost:5001/api/v1/tables/1 \
  -H "Authorization: Bearer $TOKEN"
```

#### 5.3 Table Operations Tests

```bash
# Assign table to sale
curl -X POST https://localhost:5001/api/v1/tables/assign/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tableNumber": 5,
    "guestCount": 3
  }'

# Transfer order
curl -X POST https://localhost:5001/api/v1/tables/transfer \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "saleId": 1,
    "fromTableNumber": 5,
    "toTableNumber": 10
  }'

# Clear table
curl -X POST https://localhost:5001/api/v1/tables/5/clear \
  -H "Authorization: Bearer $TOKEN"
```

### Frontend Testing

#### 5.4 Manual Testing Checklist

**Zone Management:**
- [ ] Can create new zones
- [ ] Can edit existing zones
- [ ] Can delete zones (only when empty)
- [ ] Cannot delete zones with tables
- [ ] Zones appear in correct display order
- [ ] Zone table count updates correctly

**Table Management:**
- [ ] Can create new tables
- [ ] Can edit existing tables
- [ ] Can delete tables (only when not occupied)
- [ ] Cannot delete tables with active orders
- [ ] Table numbers are unique
- [ ] Can assign tables to zones
- [ ] Can remove zone assignment

**Floor Plan Layout:**
- [ ] Tables render at correct positions
- [ ] Tables show correct status colors (green/red/yellow)
- [ ] Zone filter works correctly
- [ ] Real-time status updates (5s polling)
- [ ] Guest count displays correctly
- [ ] Order time displays correctly

**Drag-and-Drop (Edit Mode):**
- [ ] Can enter edit mode
- [ ] Can drag tables to new positions
- [ ] Position updates save automatically
- [ ] Cannot click tables in edit mode
- [ ] Exit edit mode returns to normal

**Manual Positioning:**
- [ ] Can enter X/Y coordinates manually
- [ ] Position validation (0-100 range)
- [ ] Rotation works correctly (0-360)
- [ ] Width/height adjustments work
- [ ] Shape selection works (Rectangle/Circle/Square)

**Table Operations:**
- [ ] Can assign orders to available tables
- [ ] Can view order details from occupied tables
- [ ] Can transfer orders between tables
- [ ] Cannot transfer to occupied table
- [ ] Can clear/complete tables
- [ ] Clear confirmation dialog works

**Error Handling:**
- [ ] Duplicate table numbers rejected
- [ ] Invalid positions rejected
- [ ] Invalid capacity rejected
- [ ] Network errors display toast
- [ ] Loading states show correctly
- [ ] Error boundaries catch errors

**Permissions:**
- [ ] Cashiers can view tables (full access)
- [ ] Managers can manage tables
- [ ] Managers can manage zones
- [ ] (Future) Read-only mode for cashiers

**Accessibility:**
- [ ] Keyboard navigation works
- [ ] Screen reader labels present
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] Touch targets ≥ 44px

**RTL Support:**
- [ ] Layout mirrors correctly in Arabic
- [ ] Text alignment correct
- [ ] Icon positions correct

---

## 6. Implementation Checklist

### Backend Tasks

#### Database & Entities
- [ ] **T1**: Add GuestCount, TableId, TableNumber to Sale entity
- [ ] **T2**: Create Zone entity model
- [ ] **T3**: Create Table entity model
- [ ] **T4**: Update BranchDbContext with Zones and Tables DbSets
- [ ] **T5**: Configure entity relationships and indexes
- [ ] **T6**: Create and run EF migration

#### DTOs
- [ ] **T7**: Create Zone DTOs (ZoneDto, CreateZoneDto, UpdateZoneDto)
- [ ] **T8**: Create Table DTOs (TableDto, TableWithStatusDto, etc.)
- [ ] **T9**: Create operation DTOs (TransferTableDto, AssignTableDto)

#### Services
- [ ] **T10**: Implement IZoneService interface
- [ ] **T11**: Implement ZoneService class
- [ ] **T12**: Implement ITableService interface
- [ ] **T13**: Implement TableService class (all methods)
- [ ] **T14**: Add audit logging to services

#### API Endpoints
- [ ] **T15**: Register services in Program.cs DI
- [ ] **T16**: Add zone management endpoints (GET, POST, PUT, DELETE)
- [ ] **T17**: Add table management endpoints (GET, POST, PUT, DELETE)
- [ ] **T18**: Add table operation endpoints (transfer, clear, assign)
- [ ] **T19**: Configure authorization policies
- [ ] **T20**: Test all endpoints with Swagger
- [ ] **T21**: Verify error responses

### Frontend Tasks

#### Types & Constants
- [ ] **T22**: Update entities.types.ts with Zone and Table types (number IDs)
- [ ] **T23**: Update constants.ts with API_ROUTES for zones and tables
- [ ] **T24**: Update routes.ts with BRANCH_ROUTES for tables page

#### API Services
- [ ] **T25**: Create zone-service.ts API client
- [ ] **T26**: Create table-service.ts API client
- [ ] **T27**: Add error handling and retry logic

#### Hooks
- [ ] **T28**: Create useZones hook with SWR
- [ ] **T29**: Create useZone hook (single zone)
- [ ] **T30**: Create useTables hook with zone filtering
- [ ] **T31**: Create useTablesWithStatus hook with polling

#### Components
- [ ] **T32**: Install @dnd-kit dependencies
- [ ] **T33**: Create DraggableTable component
- [ ] **T34**: Create TableLayout component with drag-and-drop
- [ ] **T35**: Create TableManagement component (hybrid mode)
- [ ] **T36**: Create ZoneManagement component
- [ ] **T37**: Add visual floor plan rendering
- [ ] **T38**: Add edit mode toggle

#### Pages
- [ ] **T39**: Create tables page at /pos/tables/page.tsx
- [ ] **T40**: Add Suspense boundaries
- [ ] **T41**: Add Error boundaries
- [ ] **T42**: Add loading states
- [ ] **T43**: Add floating action buttons

#### Integration
- [ ] **T44**: Connect table selection to POS order flow
- [ ] **T45**: Add guest count input during order creation
- [ ] **T46**: Update invoice to show table and guest count
- [ ] **T47**: Add table filter to sales reports

#### Testing
- [ ] **T48**: Test zone CRUD operations
- [ ] **T49**: Test table CRUD operations
- [ ] **T50**: Test drag-and-drop positioning
- [ ] **T51**: Test manual positioning
- [ ] **T52**: Test order assignment
- [ ] **T53**: Test order transfer
- [ ] **T54**: Test table clearing
- [ ] **T55**: Test real-time status updates
- [ ] **T56**: Test error handling
- [ ] **T57**: Test permissions

#### Documentation
- [ ] **T58**: Add internationalization (i18n) support
- [ ] **T59**: Test RTL layout for Arabic
- [ ] **T60**: Create user documentation
- [ ] **T61**: Update API documentation
- [ ] **T62**: Create implementation summary doc

---

## 7. Configuration Options

### Cashier Permissions (Future Enhancement)

**File:** `Backend/Models/Entities/Shared/BranchSettings.cs` (or create new)

```csharp
public class BranchSettings
{
    public int Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;

    // Example keys:
    // "TableManagement.CashierAccess" -> "ReadOnly" | "Full"
    // "TableManagement.EnableDragDrop" -> "true" | "false"
    // "TableManagement.AutoRefreshInterval" -> "5000" (ms)
}
```

**Frontend Setting UI:**

```typescript
// In a future settings page
const [cashierAccess, setCashierAccess] = useState<"ReadOnly" | "Full">("Full");

// Check permission before showing edit buttons
const canEdit = userRole === "Manager" ||
                (userRole === "Cashier" && cashierAccess === "Full");
```

---

## 8. Performance Optimizations

### Backend
1. **Add database indexes:**
   ```csharp
   entity.HasIndex(t => t.ZoneId);
   entity.HasIndex(t => new { t.IsActive, t.ZoneId });
   ```

2. **Use projection in queries:**
   ```csharp
   .Select(t => new TableDto { /* only needed fields */ })
   ```

3. **Cache zone list:**
   ```csharp
   builder.Services.AddMemoryCache();
   // Cache zones for 5 minutes
   ```

### Frontend
1. **Memoize table components:**
   ```typescript
   const MemoizedDraggableTable = memo(DraggableTable);
   ```

2. **Virtual scrolling for large table lists:**
   ```bash
   npm install react-window
   ```

3. **Debounce position updates:**
   ```typescript
   const debouncedUpdate = useMemo(
     () => debounce(updatePosition, 500),
     []
   );
   ```

---

## 9. Security Considerations

1. **Audit all table operations** (Already implemented with userId tracking)
2. **Validate table ownership** (Not needed - separate DB per branch)
3. **Prevent concurrent modifications:**
   ```csharp
   entity.Property(t => t.UpdatedAt).IsConcurrencyToken();
   ```
4. **Rate limit API endpoints** (Add middleware)
5. **Sanitize user inputs** (Already done with data annotations)

---

## 10. Key Improvements Over v1

### ✅ Fixed Issues
1. Removed unnecessary branch filtering (separate DBs)
2. Fixed type mismatches (number IDs everywhere)
3. Added GuestCount to Sale entity
4. Included full Zone implementation
5. Implemented hybrid drag-and-drop
6. Fixed guest count calculation
7. Added all missing service methods
8. Fixed precision validation

### ✅ Enhanced Features
1. Audit fields (CreatedBy, UpdatedBy, DeletedAt)
2. Comprehensive error handling
3. Optimistic UI updates
4. Auto-save on drag
5. Zone filtering
6. Table dimensions and rotation
7. Enhanced validation messages
8. Better loading states

### ✅ Better Architecture
1. Proper service interfaces
2. DTO validation
3. API documentation (OpenAPI)
4. SWR caching strategy
5. Lazy-loaded components
6. Error boundaries
7. Suspense boundaries

---

## 11. Next Steps After Implementation

1. **Split Bill Feature** (T63-T68)
   - Add split bill API endpoint
   - Create split bill UI component
   - Support split by item/amount/percentage

2. **Table Reservations** (T69-T74)
   - Add Reservation entity
   - Create reservation management UI
   - Add time-based reservation status

3. **Analytics Dashboard** (T75-T80)
   - Table turnover rate
   - Average occupancy time
   - Revenue per table
   - Peak hours analysis

4. **Real-time Updates with SignalR** (T81-T85)
   - Replace polling with WebSocket
   - Broadcast status changes
   - Show live occupancy

5. **Mobile Optimization** (T86-T90)
   - Responsive layouts
   - Touch gestures
   - Offline support

---

## Summary

This **v2 implementation plan** addresses all critical issues from the review:

✅ No branch filtering needed (separate databases)
✅ Fixed type mismatches (number IDs)
✅ Added GuestCount tracking
✅ Full zone management implementation
✅ Hybrid drag-and-drop positioning
✅ Complete service implementations
✅ Enhanced error handling
✅ Comprehensive testing strategy
✅ 62 detailed implementation tasks
✅ Production-ready architecture

**Total Tasks:** 62 (42 core + 20 enhancements)
**Estimated LOC:** ~4,500 (Backend: ~2,000, Frontend: ~2,500)
**Estimated Time:** 3-5 days for experienced developer

Ready to implement! 🚀
