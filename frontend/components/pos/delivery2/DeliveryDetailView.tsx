/**
 * DeliveryDetailView Component
 * Displays detailed information for a selected delivery order
 */

import React, { useState } from 'react';
import { X, Truck, MapPin, Clock, User, Printer, ArrowLeft, Check, ChevronDown } from 'lucide-react';
import {
  DeliveryOrderDto,
  DeliveryStatus,
  DriverDto,
  SaleDto
} from '@/types/api.types';
import { getDeliveryStatusName } from '@/types/enums';
import styles from '../Pos2.module.css'; // Using existing POS styles

interface DeliveryDetailViewProps {
  order: DeliveryOrderDto;
  onClose: () => void;
  onStatusChange: (orderId: string, newStatus: DeliveryStatus) => void;
  onAssignDriver: (orderId: string, driverId: string) => void;
  onPrintInvoice: (orderId: string) => void;
  drivers: DriverDto[];
}

export const DeliveryDetailView: React.FC<DeliveryDetailViewProps> = ({
  order,
  onClose,
  onStatusChange,
  onAssignDriver,
  onPrintInvoice,
  drivers,
}) => {
  const [isAssigningDriver, setIsAssigningDriver] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(order.driverId || '');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Format time for display
  const formatTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Handle driver assignment
  const handleDriverAssignment = () => {
    if (selectedDriver) {
      onAssignDriver(order.id, selectedDriver);
      setIsAssigningDriver(false);
    }
  };

  // Handle status change
  const handleStatusChange = (newStatus: DeliveryStatus) => {
    onStatusChange(order.id, newStatus);
    setShowStatusDropdown(false);
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
    <div className={styles.deliveryDetailView}>
      <div className={styles.detailViewHeader}>
        <button className={styles.backBtn} onClick={onClose}>
          <ArrowLeft size={20} />
        </button>
        <h2>Order Details</h2>
        <div className={styles.detailViewActions}>
          <button 
            className={styles.printBtn} 
            onClick={() => onPrintInvoice(order.id)}
            title="Print Invoice"
          >
            <Printer size={18} />
          </button>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
      </div>

      <div className={styles.detailViewContent}>
        {/* Order Header */}
        <div className={styles.orderDetailHeader}>
          <div className={styles.orderDetailId}>
            <h3>Order #{order.orderId?.substring(0, 8) || order.id.substring(0, 8)}</h3>
            <div className={`status-badge ${getStatusVariant(order.deliveryStatus)}`}>
              {getDeliveryStatusName(order.deliveryStatus)}
            </div>
          </div>
          
          <div className={styles.orderDetailStats}>
            <div className={styles.statItem}>
              <Clock size={16} />
              <span>Created: {formatTime(order.createdAt)}</span>
            </div>
            <div className={styles.statItem}>
              <Clock size={16} />
              <span>Estimated: {formatTime(order.estimatedDeliveryTime)}</span>
            </div>
            {order.actualDeliveryTime && (
              <div className={styles.statItem}>
                <Clock size={16} />
                <span>Actual: {formatTime(order.actualDeliveryTime)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Customer Information */}
        <div className={styles.detailSection}>
          <h4>Customer Information</h4>
          <div className={styles.detailRow}>
            <User size={16} />
            <span className={styles.detailLabel}>Name:</span>
            <span className={styles.detailValue}>
              {order.sale?.customerName || order.customer?.nameEn || 'N/A'}
            </span>
          </div>
          <div className={styles.detailRow}>
            <User size={16} />
            <span className={styles.detailLabel}>Phone:</span>
            <span className={styles.detailValue}>
              {order.customer?.phone || 'N/A'}
            </span>
          </div>
        </div>

        {/* Delivery Address */}
        <div className={styles.detailSection}>
          <h4>Delivery Address</h4>
          <div className={styles.detailRow}>
            <MapPin size={16} />
            <span className={styles.detailLabel}>Address:</span>
            <span className={styles.detailValue}>
              {order.deliveryAddress || 'N/A'}
            </span>
          </div>
          {order.specialInstructions && (
            <div className={styles.detailRow}>
              <User size={16} />
              <span className={styles.detailLabel}>Special Instructions:</span>
              <span className={styles.detailValue}>
                {order.specialInstructions}
              </span>
            </div>
          )}
        </div>

        {/* Driver Information */}
        <div className={styles.detailSection}>
          <div className={styles.sectionHeader}>
            <h4>Driver Information</h4>
            {!isAssigningDriver && (
              <button 
                className={styles.assignDriverBtn}
                onClick={() => setIsAssigningDriver(true)}
              >
                Assign Driver
              </button>
            )}
          </div>
          
          {isAssigningDriver ? (
            <div className={styles.driverAssignment}>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className={styles.selectInput}
              >
                <option value="">Select Driver</option>
                {drivers.map(driver => (
                  <option key={driver.id} value={driver.id}>
                    {driver.firstName} {driver.lastName}
                  </option>
                ))}
              </select>
              <button 
                className={styles.assignBtn} 
                onClick={handleDriverAssignment}
              >
                <Check size={16} />
                Assign
              </button>
              <button 
                className={styles.cancelBtn} 
                onClick={() => setIsAssigningDriver(false)}
              >
                Cancel
              </button>
            </div>
          ) : order.driverName ? (
            <div className={styles.detailRow}>
              <Truck size={16} />
              <span className={styles.detailLabel}>Driver:</span>
              <span className={styles.detailValue}>
                {order.driverName}
              </span>
            </div>
          ) : (
            <div className={styles.noDriver}>
              <p>No driver assigned yet</p>
              <button 
                className={styles.assignDriverBtn}
                onClick={() => setIsAssigningDriver(true)}
              >
                Assign Driver
              </button>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className={styles.detailSection}>
          <h4>Order Items</h4>
          {order.sale?.lineItems && order.sale.lineItems.length > 0 ? (
            <div className={styles.orderItems}>
              {order.sale.lineItems.map((item, index) => (
                <div key={index} className={styles.orderItem}>
                  <span className={styles.itemName}>{item.productName}</span>
                  <span className={styles.itemQuantity}>x{item.quantity}</span>
                  <span className={styles.itemPrice}>
                    ${(item.unitPrice * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p>No items found</p>
          )}
        </div>

        {/* Order Summary */}
        <div className={styles.detailSection}>
          <h4>Order Summary</h4>
          <div className={styles.orderSummary}>
            <div className={styles.summaryRow}>
              <span>Subtotal:</span>
              <span>${order.sale?.subtotal?.toFixed(2) || '0.00'}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Tax:</span>
              <span>${order.sale?.taxAmount?.toFixed(2) || '0.00'}</span>
            </div>
            {order.sale?.deliveryFee && (
              <div className={styles.summaryRow}>
                <span>Delivery Fee:</span>
                <span>${order.sale.deliveryFee.toFixed(2)}</span>
              </div>
            )}
            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
              <span>Total:</span>
              <span className={styles.totalAmount}>
                ${order.sale?.total?.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>
        </div>

        {/* Delivery Time Estimation */}
        <div className={styles.detailSection}>
          <h4>Delivery Time</h4>
          <div className={styles.orderSummary}>
            {order.estimatedDeliveryMinutes && (
              <div className={styles.summaryRow}>
                <span>Estimated Duration:</span>
                <span>{order.estimatedDeliveryMinutes} minutes</span>
              </div>
            )}
            <div className={styles.summaryRow}>
              <span>Estimated Delivery:</span>
              <span>{order.estimatedDeliveryTime || 'Not set'}</span>
            </div>
            {order.actualDeliveryTime && (
              <div className={styles.summaryRow}>
                <span>Actual Delivery:</span>
                <span>{order.actualDeliveryTime}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Management */}
        <div className={styles.detailSection}>
          <div className={styles.sectionHeader}>
            <h4>Status Management</h4>
            <div className={styles.statusDropdown}>
              <button 
                className={styles.statusBtn}
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              >
                Change Status
                <ChevronDown size={16} />
              </button>
              
              {showStatusDropdown && (
                <div className={styles.dropdownMenu}>
                  {nextStatusOptions.map(option => (
                    <button
                      key={option.value}
                      className={styles.dropdownItem}
                      onClick={() => handleStatusChange(option.value)}
                    >
                      <Check size={14} />
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get status variant for badge
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