"use client";

import { StarIcon } from "@heroicons/react/20/solid";
import { TruckIcon, PhoneIcon } from "@heroicons/react/24/outline";
import { DriverDto } from "@/types/api.types";
import { useDriverActiveCount } from "@/hooks/useDrivers";

interface AvailableDriversListProps {
  drivers: DriverDto[] | undefined;
  isLoading: boolean;
  isError: any;
}

function DriverItem({ driver }: { driver: DriverDto }) {

  // Fetch active deliveries count for this driver
  const { count: activeCount, isLoading: isCountLoading } = useDriverActiveCount(driver.id);

  // Format phone number
  const formatPhone = (phone: string) => {
    if (!phone) return "-";
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
    return parts.length > 0 ? parts.join(" - ") : "No vehicle info";
  };

  // Render star rating
  const renderRating = () => {
    if (!driver.averageRating || driver.averageRating === 0) {
      return (
        <span className="text-xs text-gray-400 dark:text-gray-500">
          No rating
        </span>
      );
    }

    const rating = driver.averageRating;
    const fullStars = Math.floor(rating);

    return (
      <div className="flex items-center gap-1">
        <div className="flex">
          {Array.from({ length: 5 }).map((_, index) => (
            <StarIcon
              key={index}
              className={`h-4 w-4 ${
                index < fullStars ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"
              }`}
            />
          ))}
        </div>
        <span className="text-xs font-medium text-gray-900 dark:text-white ml-0.5">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  // Get workload badge color
  const getWorkloadBadge = () => {
    if (isCountLoading || activeCount === undefined) {
      return (
        <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
          "..."
        </span>
      );
    }

    if (activeCount === 0) {
      return (
        <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/20 px-2 py-0.5 text-xs font-medium text-green-800 dark:text-green-300">
          "Free"
        </span>
      );
    }

    if (activeCount === 1) {
      return (
        <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/20 px-2 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-300">
          1 delivery
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-full bg-orange-100 dark:bg-orange-900/20 px-2 py-0.5 text-xs font-medium text-orange-800 dark:text-orange-300">
        {`${activeCount} deliveries`}
      </span>
    );
  };

  return (
    <div className="relative flex items-center space-x-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4 shadow-sm hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-md transition-all duration-200">
      {/* Avatar */}
      <div className="flex-shrink-0">
        {driver.profileImagePath ? (
          <img
            src={driver.profileImagePath}
            alt={driver.nameEn}
            className="h-12 w-12 rounded-full object-cover ring-2 ring-green-500"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 ring-2 ring-green-500">
            <span className="text-lg font-semibold text-white">
              {driver.nameEn.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Online indicator */}
        <div className="absolute top-3 left-11 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-gray-800 bg-green-500" />
      </div>

      {/* Driver Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {driver.nameEn}
            </p>
            <div className="mt-1 flex items-center gap-2">
              {renderRating()}
            </div>
          </div>
          <div className="ml-2">
            {getWorkloadBadge()}
          </div>
        </div>

        {/* Vehicle and Phone */}
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <TruckIcon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{formatVehicleInfo()}</span>
          </div>
          {driver.phone && (
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <PhoneIcon className="h-4 w-4 flex-shrink-0" />
              <a
                href={`tel:${driver.phone}`}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {formatPhone(driver.phone)}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AvailableDriversList({ drivers, isLoading, isError }: AvailableDriversListProps) {

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
              "Failed to load drivers"
            </h3>
          </div>
        </div>
      </div>
    );
  }

  if (!drivers || drivers.length === 0) {
    return (
      <div className="text-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
          "No available drivers"
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          "All drivers are currently busy or unavailable."
        </p>
      </div>
    );
  }

  // Sort drivers by workload (least busy first) and rating (highest first)
  const sortedDrivers = [...drivers].sort((a, b) => {
    // Sort by rating descending (higher rating first)
    const ratingA = a.averageRating || 0;
    const ratingB = b.averageRating || 0;
    return ratingB - ratingA;
  });

  return (
    <div className="space-y-3">
      {sortedDrivers.map((driver) => (
        <DriverItem key={driver.id} driver={driver} />
      ))}
    </div>
  );
}
