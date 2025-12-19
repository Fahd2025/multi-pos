"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowLeft, Filter, Truck } from "lucide-react";
import { DeliveryOrderDto, DeliveryStatus } from "@/types/api.types";
import deliveryService from "@/services/delivery.service";
import { DeliveryCard } from "./DeliveryCard";
import { DeliveryForm } from "./DeliveryForm";
import styles from "../Pos2.module.css";

export function DeliveryManagement() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<DeliveryOrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | null>(null);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const params: any = {
        status: statusFilter ?? undefined,
      };
      const response = await deliveryService.getDeliveryOrders(params);
      setDeliveries(response.data);
    } catch (error) {
      console.error("Failed to fetch deliveries:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [statusFilter]);

  const handleStatusUpdate = () => {
    fetchDeliveries();
  };

  const filteredDeliveries =
    statusFilter === null
      ? deliveries
      : deliveries.filter((d) => d.deliveryStatus === statusFilter);

  const pendingCount = deliveries.filter((d) => d.deliveryStatus === DeliveryStatus.Pending).length;
  const assignedCount = deliveries.filter(
    (d) => d.deliveryStatus === DeliveryStatus.Assigned
  ).length;
  const outForDeliveryCount = deliveries.filter(
    (d) => d.deliveryStatus === DeliveryStatus.OutForDelivery
  ).length;
  const deliveredCount = deliveries.filter(
    (d) => d.deliveryStatus === DeliveryStatus.Delivered
  ).length;
  const failedCount = deliveries.filter((d) => d.deliveryStatus === DeliveryStatus.Failed).length;

  // Navigation handlers
  const handleBackToPos = () => {
    router.push("/pos");
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/pos")}
            className="flex items-center justify-center h-10 w-10 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Truck size={28} className="text-emerald-500" />
          <div>
            <h1 className="text-2xl font-bold">Delivery Management</h1>
            <p className="text-sm text-gray-500">Track and manage delivery orders</p>
          </div>
        </div>
        {/* 
        <div className={styles.deliveryPageTitle}>
          <button className={styles.backBtn} onClick={handleBackToPos} title="Back to POS">
            <ArrowLeft size={20} />
          </button>
          <Truck size={28} className="text-emerald-500" />
          <h1 >Delivery Management</h1>
           <p className="text-sm text-gray-500">
              Track and manage delivery orders
            </p>
        </div> */}

        <button
          onClick={() => setAddDialogOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Delivery Order
        </button>
      </div>

      {/* Status Filter */}
      <div className="border-b bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === null
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setStatusFilter(null)}
            >
              All ({deliveries.length})
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === DeliveryStatus.Pending
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setStatusFilter(DeliveryStatus.Pending)}
            >
              Pending ({pendingCount})
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === DeliveryStatus.Assigned
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setStatusFilter(DeliveryStatus.Assigned)}
            >
              Assigned ({assignedCount})
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === DeliveryStatus.OutForDelivery
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setStatusFilter(DeliveryStatus.OutForDelivery)}
            >
              Out for Delivery ({outForDeliveryCount})
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === DeliveryStatus.Delivered
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setStatusFilter(DeliveryStatus.Delivered)}
            >
              Delivered ({deliveredCount})
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === DeliveryStatus.Failed
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setStatusFilter(DeliveryStatus.Failed)}
            >
              Failed ({failedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Deliveries Grid */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-gray-500">No delivery orders found</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredDeliveries.map((delivery) => (
              <DeliveryCard
                key={delivery.id}
                delivery={delivery}
                onStatusUpdate={handleStatusUpdate}
              />
            ))}
          </div>
        )}
      </div>

      {/* New Delivery Order Dialog */}
      <DeliveryForm
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={() => {
          fetchDeliveries();
          setAddDialogOpen(false);
        }}
      />
    </div>
  );
}
