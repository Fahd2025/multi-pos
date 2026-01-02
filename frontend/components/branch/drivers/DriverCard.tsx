"use client";

import { useState } from "react";
import {
  PencilIcon,
  ChartBarIcon,
  PhoneIcon,
  EnvelopeIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/20/solid";
import { DriverDto } from "@/types/api.types";
import deliveryService from "@/services/delivery.service";
import { useDriverActiveCount } from "@/hooks/useDrivers";

interface DriverCardProps {
  driver: DriverDto;
  onEdit: (driver: DriverDto) => void;
  onViewStats: (driver: DriverDto) => void;
  onUpdate: () => void;
}

export default function DriverCard({ driver, onEdit, onViewStats, onUpdate }: DriverCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch active deliveries count
  const { count: activeCount, isLoading: isCountLoading } = useDriverActiveCount(driver.id);

  // Toggle availability
  const handleToggleAvailability = async () => {
    try {
      setIsUpdating(true);
      await deliveryService.updateDriverAvailability(driver.id, !driver.isAvailable);
      onUpdate(); // Refresh parent list
    } catch (error) {
      console.error("Failed to update driver availability:", error);
      alert("Failed to update driver availability");
    } finally {
      setIsUpdating(false);
    }
  };

  // Format phone number for display
  const formatPhone = (phone: string) => {
    if (!phone) return "-";
    // Simple formatting: (123) 456-7890
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  // Format vehicle info
  const formatVehicleInfo = () => {
    const parts = [];
    if (driver.vehicleType) parts.push(driver.vehicleType);
    if (driver.vehicleNumber) parts.push(driver.vehicleNumber);
    if (driver.vehicleColor) parts.push(driver.vehicleColor);
    return parts.length > 0 ? parts.join(" - ") : null;
  };

  // Render star rating
  const renderRating = () => {
    if (!driver.averageRating || driver.averageRating === 0) {
      return (
        <span className="text-sm text-gray-400 dark:text-gray-500">
          No ratings yet
        </span>
      );
    }

    const rating = driver.averageRating;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
      <div className="flex items-center gap-1">
        <div className="flex">
          {Array.from({ length: 5 }).map((_, index) => (
            <StarIcon
              key={index}
              className={`h-5 w-5 ${
                index < fullStars
                  ? "text-yellow-400"
                  : index === fullStars && hasHalfStar
                  ? "text-yellow-400 opacity-50"
                  : "text-gray-300 dark:text-gray-600"
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-medium text-gray-900 dark:text-white ml-1">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  // Status badge color
  const getStatusColor = () => {
    if (!driver.isActive) return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    if (driver.isAvailable) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
  };

  const getStatusText = () => {
    if (!driver.isActive) return "Inactive";
    if (driver.isAvailable) return "Available";
    return "On Delivery";
  };

  return (
    <div className="relative flex flex-col overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow duration-200">
      {/* Header with Avatar and Status */}
      <div className="p-6 pb-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {driver.profileImagePath ? (
              <img
                src={driver.profileImagePath}
                alt={driver.nameEn}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 ring-2 ring-gray-200 dark:ring-gray-700">
                <span className="text-2xl font-semibold text-white">
                  {driver.nameEn.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            {/* Online indicator */}
            {driver.isActive && (
              <div
                className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white dark:border-gray-800 ${
                  driver.isAvailable ? "bg-green-500" : "bg-orange-500"
                }`}
              />
            )}
          </div>

          {/* Name and Status */}
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {driver.nameEn}
            </h3>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor()}`}
              >
                {getStatusText()}
              </span>
            </div>
            <div className="mt-2">{renderRating()}</div>
          </div>
        </div>

        {/* Active Deliveries Badge */}
        {driver.isActive && !isCountLoading && typeof activeCount === "number" && activeCount > 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-md bg-orange-50 dark:bg-orange-900/20 px-3 py-2">
            <TruckIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-medium text-orange-900 dark:text-orange-300">
              {activeCount} {activeCount === 1 ? "active delivery" : "active deliveries"}
            </span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700" />

      {/* Contact Information */}
      <div className="p-6 pt-4 space-y-3">
        {driver.phone && (
          <div className="flex items-center gap-3 text-sm">
            <PhoneIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <a
              href={`tel:${driver.phone}`}
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors min-h-[24px] flex items-center"
            >
              {formatPhone(driver.phone)}
            </a>
          </div>
        )}
        {driver.email && (
          <div className="flex items-center gap-3 text-sm">
            <EnvelopeIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <a
              href={`mailto:${driver.email}`}
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate min-h-[24px] flex items-center"
            >
              {driver.email}
            </a>
          </div>
        )}
        {driver.licenseNumber && (
          <div className="flex items-center gap-3 text-sm">
            <svg
              className="h-5 w-5 text-gray-400 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z"
              />
            </svg>
            <span className="text-gray-600 dark:text-gray-300 font-mono text-xs">
              {driver.licenseNumber}
            </span>
          </div>
        )}
        {formatVehicleInfo() && (
          <div className="flex items-center gap-3 text-sm">
            <TruckIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600 dark:text-gray-300">
              {formatVehicleInfo()}
            </span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700" />

      {/* Action Buttons */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="grid grid-cols-2 gap-3">
          {/* Edit Button */}
          <button
            type="button"
            onClick={() => onEdit(driver)}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[48px] touch-manipulation"
          >
            <PencilIcon className="h-5 w-5" />
            Edit
          </button>

          {/* Stats Button */}
          <button
            type="button"
            onClick={() => onViewStats(driver)}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[48px] touch-manipulation"
          >
            <ChartBarIcon className="h-5 w-5" />
            Stats
          </button>
        </div>

        {/* Availability Toggle */}
        {driver.isActive && (
          <button
            type="button"
            onClick={handleToggleAvailability}
            disabled={isUpdating}
            className={`mt-3 w-full inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 min-h-[48px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              driver.isAvailable
                ? "bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-600"
                : "bg-green-600 text-white hover:bg-green-700 focus:ring-green-600"
            }`}
          >
            {isUpdating ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Updating...
              </>
            ) : driver.isAvailable ? (
              <>
                <XCircleIcon className="h-5 w-5" />
                Mark as Busy
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-5 w-5" />
                Mark as Available
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
