"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Truck, Phone, User } from "lucide-react";
import { DriverDto } from "@/types/api.types";
import deliveryService from "@/services/delivery.service";

interface DriverAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderNumber: string;
  onAssign: (driverId: string, driverName: string) => Promise<void>;
}

export function DriverAssignmentDialog({
  open,
  onOpenChange,
  orderId,
  orderNumber,
  onAssign,
}: DriverAssignmentDialogProps) {
  const [drivers, setDrivers] = useState<DriverDto[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (open) {
      fetchDrivers();
    }
  }, [open]);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await deliveryService.getDrivers({
        isActive: true,
        isAvailable: true,
      });
      setDrivers(response.data);
    } catch (error) {
      console.error("Failed to fetch drivers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedDriver) return;

    const driver = drivers.find((d) => d.id === selectedDriver);
    if (!driver) return;

    try {
      setAssigning(true);
      await onAssign(selectedDriver, `${driver.firstName} ${driver.lastName}`);
      onOpenChange(false);
      setSelectedDriver(null);
    } catch (error) {
      console.error("Failed to assign driver:", error);
      alert("Failed to assign driver");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Driver</DialogTitle>
          <p className="text-sm text-gray-500">
            Assign a driver for order #{orderNumber.substring(0, 8)}
          </p>
        </DialogHeader>

        <div className="space-y-2 max-h-96 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : drivers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Truck className="h-12 w-12 text-gray-300 mb-2" />
              <p className="text-gray-500">No active drivers available</p>
              <p className="text-xs text-gray-400 mt-1">
                Add drivers in the branch settings
              </p>
            </div>
          ) : (
            drivers.map((driver) => (
              <div
                key={driver.id}
                className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors ${
                  selectedDriver === driver.id
                    ? "border-emerald-500 bg-emerald-50"
                    : "hover:bg-gray-50 border-gray-200"
                }`}
                onClick={() => setSelectedDriver(driver.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <p className="font-semibold">
                      {driver.firstName} {driver.lastName}
                    </p>
                  </div>

                  {driver.phone && (
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <p className="text-sm text-gray-600">{driver.phone}</p>
                    </div>
                  )}

                  {driver.vehicleNumber && (
                    <div className="flex items-center gap-2 mt-1">
                      <Truck className="h-3 w-3 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        {driver.vehicleNumber}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <button
            className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            onClick={() => {
              onOpenChange(false);
              setSelectedDriver(null);
            }}
            disabled={assigning}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            onClick={handleAssign}
            disabled={!selectedDriver || assigning}
          >
            {assigning ? "Assigning..." : "Assign & Dispatch"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
