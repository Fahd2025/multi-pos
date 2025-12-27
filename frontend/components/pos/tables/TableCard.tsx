import { TableWithStatusDto } from "@/types/api.types";
import { MapPin, Users, Clock, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface TableCardProps {
  table: TableWithStatusDto;
  onClick: () => void;
  onClear: (e: React.MouseEvent) => void;
  isPaid: boolean;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
}

export function TableCard({
  table,
  onClick,
  onClear,
  isPaid,
  getStatusColor,
  getStatusText,
}: TableCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200",
        "border-2 border-transparent hover:border-blue-500",
        "p-4 text-left w-full group cursor-pointer"
      )}
    >
      {/* Status Badge */}
      <div
        className={cn(
          "absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-semibold",
          getStatusColor(table.status)
        )}
      >
        {getStatusText(table.status)}
      </div>

      {/* Table Info */}
      <div className="mb-3">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
          {table.name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Table #{table.number}
        </p>
      </div>

      {/* Zone */}
      {table.zoneName && (
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
          <MapPin className="w-4 h-4 mr-1" />
          {table.zoneName}
        </div>
      )}

      {/* Capacity */}
      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
        <Users className="w-4 h-4 mr-1" />
        Capacity: {table.capacity} guests
      </div>

      {/* Occupied Details */}
      {table.status === "occupied" && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
          {table.invoiceNumber && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Invoice: {table.invoiceNumber}
            </p>
          )}
          {table.guestCount && (
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
              <Users className="w-3 h-3 mr-1" />
              {table.guestCount} {table.guestCount === 1 ? "guest" : "guests"}
            </div>
          )}
          {table.orderTime && (
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
              <Clock className="w-3 h-3 mr-1" />
              {table.orderTime}
            </div>
          )}
          {table.orderTotal && (
            <div className="flex items-center text-xs font-semibold text-gray-900 dark:text-gray-100">
              <DollarSign className="w-3 h-3 mr-1" />
              ${table.orderTotal.toFixed(2)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
