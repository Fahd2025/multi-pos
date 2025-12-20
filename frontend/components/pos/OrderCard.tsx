/**
 * OrderCard Component
 * Displays delivery order information in a card format
 */

import React, { useState } from 'react';
import { Truck, MapPin, Clock, User, Printer, MoreVertical, Check, ChevronDown, Loader2 } from 'lucide-react';
import { DeliveryOrderDto, DeliveryStatus, DriverDto } from '@/types/api.types';
import { getDeliveryStatusName } from '@/types/enums';
import styles from './Pos2.module.css'; // Using existing POS styles

interface OrderCardProps {
  order: DeliveryOrderDto;
  onClick: () => void;
  onStatusChange: (orderId: string, newStatus: DeliveryStatus) => void;
  onAssignDriver: (orderId: string, driverId: string) => void;
  onPrintInvoice: (orderId: string) => void;
  drivers: DriverDto[];
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onClick,
  onStatusChange,
  onAssignDriver,
  onPrintInvoice,
  drivers,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAssigningDriver, setIsAssigningDriver] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(order.driverId || '');
  const [isAssigning, setIsAssigning] = useState(false);

  // Format time for display
  const formatTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get status variant for badge
  const getStatusVariant = (status: DeliveryStatus) => {
    switch (status) {
      case DeliveryStatus.Pending: return 'neutral';
      case DeliveryStatus.Assigned: return 'info';
      case DeliveryStatus.OutForDelivery: return 'warning';
      case DeliveryStatus.Delivered: return 'success';
      case DeliveryStatus.Failed: return 'danger';
      default: return 'neutral';
    }
  };

  // Handle driver assignment
  const handleDriverAssignment = async () => {
    if (selectedDriver) {
      setIsAssigning(true);
      try {
        await onAssignDriver(order.id, selectedDriver);
        setIsAssigningDriver(false);
        setIsMenuOpen(false); // Close the dropdown menu after successful assignment
      } finally {
        setIsAssigning(false);
      }
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus: DeliveryStatus) => {
    // If the status being changed to is "Assigned", we need to assign a driver first
    if (newStatus === DeliveryStatus.Assigned) {
      setIsMenuOpen(false); // Close the dropdown
      setIsAssigningDriver(true); // Show driver assignment UI
      return;
    }

    // For other status changes, proceed normally
    setIsUpdatingStatus(true);
    try {
      await onStatusChange(order.id, newStatus);
      setIsMenuOpen(false);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Order status options based on current status
  const getNextStatusOptions = () => {
    switch (order.deliveryStatus) {
      case DeliveryStatus.Pending:
        return [
          { value: DeliveryStatus.Assigned, label: 'Assign Driver' },
          { value: DeliveryStatus.Failed, label: 'Mark as Failed' }
        ];
      case DeliveryStatus.Assigned:
        return [
          { value: DeliveryStatus.OutForDelivery, label: 'Out for Delivery' },
          { value: DeliveryStatus.Failed, label: 'Mark as Failed' }
        ];
      case DeliveryStatus.OutForDelivery:
        return [
          { value: DeliveryStatus.Delivered, label: 'Delivered' },
          { value: DeliveryStatus.Failed, label: 'Delivery Failed' }
        ];
      case DeliveryStatus.Delivered:
      case DeliveryStatus.Failed:
        // Order is in final status
        return [];
      default:
        return [];
    }
  };

  const nextStatusOptions = getNextStatusOptions();

  return (
    <div className={styles.orderCard} onClick={onClick}>
      <div className={styles.orderCardHeader}>
        <div className={styles.orderCardId}>
          #{order.orderId?.substring(0, 8) || order.id.substring(0, 8)}
        </div>
        <div className={styles.statusBadge}>
          <span className={`status-badge ${getStatusVariant(order.deliveryStatus)}`}>
            {getDeliveryStatusName(order.deliveryStatus)}
          </span>
        </div>
      </div>

      <div className={styles.orderCardContent}>
        <div className={styles.orderCardRow}>
          <MapPin size={14} className={styles.cardIcon} />
          <span className={styles.address}>
            {order.deliveryAddress ? 
              order.deliveryAddress.length > 30 ? 
                order.deliveryAddress.substring(0, 30) + '...' : 
                order.deliveryAddress 
              : 'N/A'}
          </span>
        </div>

        <div className={styles.orderCardRow}>
          <User size={14} className={styles.cardIcon} />
          <span className={styles.customer}>
            {order.sale?.customerName || 'N/A'}
          </span>
        </div>

        {order.driverName && (
          <div className={styles.orderCardRow}>
            <Truck size={14} className={styles.cardIcon} />
            <span className={styles.driver}>
              {order.driverName}
            </span>
          </div>
        )}

        <div className={styles.orderCardRow}>
          <Clock size={14} className={styles.cardIcon} />
          <span className={styles.time}>
            {formatTime(order.estimatedDeliveryTime)}
          </span>
        </div>
      </div>

      <div className={styles.orderCardFooter}>
        <div className={styles.orderCardTotal}>
          ${order.sale?.total?.toFixed(2) || '0.00'}
        </div>

        {/* Status change menu */}
        <div className={styles.orderCardActions}>
          <div className={styles.dropdown}>
            <button
              className={styles.actionBtn}
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
            >
              <MoreVertical size={16} />
            </button>

            {isMenuOpen && (
              <div className={styles.dropdownMenu}>
                {nextStatusOptions.map(option => (
                  <button
                    key={option.value}
                    className={`${styles.dropdownItem} ${isUpdatingStatus ? styles.disabled : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(option.value);
                    }}
                    disabled={isUpdatingStatus}
                  >
                    {isUpdatingStatus ? <Loader2 size={14} className={styles.spinnerIcon} /> : <Check size={14} />}
                    <span>{option.label}</span>
                  </button>
                ))}

                <button
                  className={styles.dropdownItem}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPrintInvoice(order.id);
                    setIsMenuOpen(false);
                  }}
                >
                  <Printer size={14} />
                  <span>Print Invoice</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Driver assignment dropdown - appears when assigning driver */}
      {isAssigningDriver && (
        <div className={styles.driverAssignment}>
          <div className={styles.driverSelect}>
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className={styles.selectInput}
              disabled={isAssigning}
            >
              <option value="">Select Driver</option>
              {drivers.map(driver => (
                <option key={driver.id} value={driver.id}>
                  {driver.nameEn}
                </option>
              ))}
            </select>
            <button
              className={styles.assignBtn}
              onClick={(e) => {
                e.stopPropagation();
                handleDriverAssignment();
              }}
              disabled={isAssigning || !selectedDriver}
            >
              {isAssigning ? <Loader2 size={16} className={styles.spinnerIcon} /> : <Check size={16} />}
              {isAssigning ? 'Assigning...' : 'Assign'}
            </button>
            <button
              className={styles.cancelBtn}
              onClick={(e) => {
                e.stopPropagation();
                setIsAssigningDriver(false);
              }}
              disabled={isAssigning}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};