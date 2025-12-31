/**
 * Units Management Page
 * Manage units of measurement with base/derived unit support
 */

"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import inventoryService from "@/services/inventory.service";
import { UnitDto } from "@/types/api.types";
import UnitFormModal from "@/components/branch/inventory/UnitFormModal";
import { DataTable } from "@/components/shared";
import { ConfirmationDialog } from "@/components/shared";
import { useDataTable } from "@/hooks/useDataTable";
import { useConfirmation } from "@/hooks/useConfirmation";
import { DataTableColumn, DataTableAction } from "@/types/data-table.types";
import { Button, LoadingSpinner, StatCard, PageHeader, StatusBadge } from "@/components/shared";
import { RoleGuard, usePermission } from "@/components/auth/RoleGuard";
import { UserRole } from "@/types/enums";
import { useApiOperation } from "@/hooks/useApiOperation";

export default function UnitsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const router = useRouter();
  const { canManage } = usePermission();
  const [units, setUnits] = useState<UnitDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<UnitDto | undefined>(undefined);

  // Hooks
  const confirmation = useConfirmation();
  const { execute } = useApiOperation();

  // DataTable hook
  const {
    data: displayData,
    paginationConfig,
    sortConfig,
    handlePageChange,
    handlePageSizeChange,
    handleSort,
  } = useDataTable(units, {
    pageSize: 20,
    sortable: true,
    pagination: true,
  });

  /**
   * Load units
   */
  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await inventoryService.getUnits(false); // Active only
      setUnits(data);
    } catch (err: any) {
      setError(err.message || "Failed to load units");
      console.error("Failed to load units:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle delete unit
   */
  const handleDelete = async (id: string, name: string) => {
    confirmation.ask(
      "Delete Unit",
      `Are you sure you want to delete unit "${name}"? This action cannot be undone.`,
      async () => {
        await execute({
          operation: () => inventoryService.deleteUnit(id),
          successMessage: "Unit deleted",
          successDetail: `${name} has been removed successfully`,
          onSuccess: () => loadUnits(),
        });
      },
      "danger"
    );
  };

  /**
   * Get base unit name for derived units
   */
  const getBaseUnitName = (baseUnitId?: string) => {
    if (!baseUnitId) return "-";
    const baseUnit = units.find((u) => u.id === baseUnitId);
    return baseUnit ? `${baseUnit.nameEn} (${baseUnit.symbol || baseUnit.code})` : "Unknown";
  };

  /**
   * Calculate statistics
   */
  const stats = {
    total: units.length,
    baseUnits: units.filter((u) => u.isBaseUnit).length,
    derivedUnits: units.filter((u) => !u.isBaseUnit).length,
    activeUnits: units.filter((u) => u.isActive).length,
  };

  // Define table columns
  const columns: DataTableColumn<UnitDto>[] = [
    {
      key: "code",
      label: "Code",
      sortable: true,
      render: (value) => (
        <div className="font-mono font-medium text-gray-900 dark:text-gray-100">{value}</div>
      ),
    },
    {
      key: "nameEn",
      label: "Name",
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</div>
          {row.nameAr && <div className="text-sm text-gray-500 dark:text-gray-400">{row.nameAr}</div>}
        </div>
      ),
    },
    {
      key: "symbol",
      label: "Symbol",
      sortable: true,
      render: (value) => (
        <div className="text-sm font-mono text-gray-700 dark:text-gray-300">{value || "-"}</div>
      ),
    },
    {
      key: "isBaseUnit",
      label: "Type",
      sortable: true,
      render: (value) => (
        <div>
          {value ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              Base Unit
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Derived
            </span>
          )}
        </div>
      ),
    },
    {
      key: "baseUnitId",
      label: "Base Unit",
      sortable: false,
      render: (value, row) => (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {row.isBaseUnit ? "-" : getBaseUnitName(value)}
        </div>
      ),
    },
    {
      key: "conversionFactor",
      label: "Conversion",
      sortable: true,
      render: (value, row) => (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {row.isBaseUnit ? "-" : `1 = ${value}`}
        </div>
      ),
    },
    {
      key: "allowFractional",
      label: "Fractional",
      sortable: true,
      render: (value) => (
        <div className="text-center">
          {value ? (
            <span className="text-green-600 dark:text-green-400">✓</span>
          ) : (
            <span className="text-gray-400">✗</span>
          )}
        </div>
      ),
    },
    {
      key: "decimalPlaces",
      label: "Decimals",
      sortable: true,
      render: (value) => (
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">{value}</div>
      ),
    },
    {
      key: "productCount",
      label: "Products",
      sortable: true,
      render: (value) => (
        <div className="text-center">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {value}
          </span>
        </div>
      ),
    },
  ];

  // Define row actions
  const actions: DataTableAction<UnitDto>[] = [
    {
      label: "✏️ Edit",
      onClick: (row) => {
        setSelectedUnit(row);
        setIsUnitModalOpen(true);
      },
      variant: "primary",
    },
    {
      label: "🗑️ Delete",
      onClick: (row) => handleDelete(row.id, row.nameEn),
      variant: "danger",
    },
  ];

  // Adapter for sort change
  const handleSortChange = (config: {
    key: keyof UnitDto | string;
    direction: "asc" | "desc";
  }) => {
    handleSort(config.key);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <RoleGuard
      requireRole={UserRole.Manager}
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-6xl">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Only Managers can access Unit Management.
          </p>
          <Button onClick={() => router.push(`/${locale}/branch`)}>Go to Dashboard</Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Unit Management"
          description="Manage units of measurement for products"
          actions={
            canManage() && (
              <Button
                onClick={() => {
                  setSelectedUnit(undefined);
                  setIsUnitModalOpen(true);
                }}
                variant="primary"
              >
                ➕ Add Unit
              </Button>
            )
          }
        />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Units"
            value={stats.total}
            icon="📏"
            variant="default"
          />
          <StatCard
            title="Base Units"
            value={stats.baseUnits}
            icon="⚡"
            variant="inventory"
          />
          <StatCard
            title="Derived Units"
            value={stats.derivedUnits}
            icon="🔗"
            variant="inventory"
          />
          <StatCard
            title="Active Units"
            value={stats.activeUnits}
            icon="✅"
            variant="default"
          />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Units Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <DataTable<UnitDto>
            data={displayData}
            columns={columns}
            actions={canManage() ? actions : undefined}
            pagination={true}
            paginationConfig={paginationConfig}
            sortConfig={sortConfig ?? undefined}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onSortChange={handleSortChange}
            getRowKey={(row) => row.id}
            emptyMessage="No units found. Get started by creating your first unit of measurement."
          />
        </div>

        {/* Unit Form Modal */}
        <UnitFormModal
          isOpen={isUnitModalOpen}
          onClose={() => {
            setIsUnitModalOpen(false);
            setSelectedUnit(undefined);
          }}
          onSuccess={loadUnits}
          unit={selectedUnit}
        />

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={confirmation.isOpen}
          onClose={confirmation.cancel}
          title={confirmation.title}
          message={confirmation.message}
          variant={confirmation.variant}
          onConfirm={confirmation.confirm}
          isProcessing={confirmation.isProcessing}
        />
      </div>
    </RoleGuard>
  );
}
