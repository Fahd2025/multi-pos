"use client";

import { useState } from "react";
import {
  MapPin,
  Phone,
  User,
  Clock,
  DollarSign,
  Truck,
} from "lucide-react";
import { DeliveryOrderDto, DeliveryStatus } from "@/types/api.types";
import { getDeliveryStatusName } from "@/types/enums";
import { DeliveryDetailSidebar } from "./DeliveryDetailSidebar";

interface DeliveryCardProps {
  delivery: DeliveryOrderDto;
  onStatusUpdate: () => void;
}

export function DeliveryCard({ delivery, onStatusUpdate }: DeliveryCardProps) {
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOrderDto | null>(null);

  const getStatusColor = (status: DeliveryStatus) => {
    switch (status) {
      case DeliveryStatus.Pending:
        return "bg-yellow-100 text-yellow-800";
      case DeliveryStatus.Assigned:
        return "bg-blue-100 text-blue-800";
      case DeliveryStatus.OutForDelivery:
        return "bg-purple-100 text-purple-800";
      case DeliveryStatus.Delivered:
        return "bg-green-100 text-green-800";
      case DeliveryStatus.Failed:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  // Parse special instructions to extract customer info if needed
  const parseSpecialInstructions = (instructions?: string) => {
    if (!instructions) return { name: "", phone: "" };

    // Try to parse format: "Customer: name | Phone: phone"
    const customerMatch = instructions.match(/Customer:\s*([^|]+)/i);
    const phoneMatch = instructions.match(/Phone:\s*(.+)/i);

    return {
      name: customerMatch ? customerMatch[1].trim() : "",
      phone: phoneMatch ? phoneMatch[1].trim() : ""
    };
  };

  const parsedInstructions = parseSpecialInstructions(delivery.specialInstructions);

  // Get customer info - prioritize DTO level properties, then parse special instructions
  const customerName =
    delivery.customerName ||
    delivery.sale?.customerName ||
    delivery.customer?.nameEn ||
    parsedInstructions.name ||
    "Walk-in Customer";

  const customerPhone =
    delivery.customer?.phone ||
    parsedInstructions.phone ||
    "";

  const deliveryAddress = delivery.deliveryAddress || "";

  return (
    <>
      <div
        className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => setSelectedDelivery(delivery)}
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono font-bold text-lg">
                #{delivery.orderId?.substring(0, 8) || delivery.id.substring(0, 8)}
              </p>
              <p className="text-sm text-gray-500">
                {formatDateTime(delivery.createdAt)}
              </p>
            </div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                delivery.deliveryStatus
              )}`}
            >
              {getDeliveryStatusName(delivery.deliveryStatus)}
            </span>
          </div>

          {/* Driver Info (if assigned) */}
          {delivery.driverName && (
            <div className="flex items-center gap-2 text-sm bg-purple-50 rounded-lg p-2">
              <Truck className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-purple-900">
                {delivery.driverName}
              </span>
            </div>
          )}

          {/* Customer Info */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span>{customerName}</span>
            </div>
            {customerPhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{customerPhone}</span>
              </div>
            )}
            {deliveryAddress && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <span className="line-clamp-2">{deliveryAddress}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t pt-3">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-400" />
              <span>{formatTime(delivery.estimatedDeliveryTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="font-bold text-lg">
                {formatCurrency(delivery.sale?.total || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Detail Sidebar */}
      <DeliveryDetailSidebar
        delivery={selectedDelivery}
        onClose={() => setSelectedDelivery(null)}
        onStatusUpdate={onStatusUpdate}
      />
    </>
  );
}
