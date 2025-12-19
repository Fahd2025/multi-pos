/**
 * DeliveryFilters Component
 * Provides filtering options for delivery orders
 */

import React, { useState } from 'react';
import { X, Calendar, Clock, User, MapPin, Truck, Check } from 'lucide-react';
import { DeliveryStatus, DriverDto, DeliveryPriority } from '@/types/api.types';
import { getDeliveryStatusName, getDeliveryPriorityName } from '@/types/enums';
import styles from '../Pos2.module.css'; // Using existing POS styles

interface DeliveryFiltersProps {
  onFilterChange: (filters: {
    status: DeliveryStatus | null;
    driverId: string | null;
    dateRange: string | null;
    priority: DeliveryPriority | null;
    search: string | null;
  }) => void;
  onApplyFilters: () => void;
  drivers: DriverDto[];
}

export const DeliveryFilters: React.FC<DeliveryFiltersProps> = ({
  onFilterChange,
  onApplyFilters,
  drivers,
}) => {
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | null>(null);
  const [driverFilter, setDriverFilter] = useState<string | null>(null);
  const [dateRangeFilter, setDateRangeFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<DeliveryPriority | null>(null);
  const [searchFilter, setSearchFilter] = useState<string | null>(null);
  const [showDateRange, setShowDateRange] = useState(false);

  // Handle filter changes
  const handleStatusChange = (status: DeliveryStatus | null) => {
    setStatusFilter(prev => prev === status ? null : status);
  };

  const handleDriverChange = (driverId: string | null) => {
    setDriverFilter(prev => prev === driverId ? null : driverId);
  };

  const handlePriorityChange = (priority: DeliveryPriority | null) => {
    setPriorityFilter(prev => prev === priority ? null : priority);
  };

  // Apply filters
  const applyFilters = () => {
    onFilterChange({
      status: statusFilter,
      driverId: driverFilter,
      dateRange: dateRangeFilter,
      priority: priorityFilter,
      search: searchFilter,
    });
    onApplyFilters();
  };

  // Reset all filters
  const resetFilters = () => {
    setStatusFilter(null);
    setDriverFilter(null);
    setDateRangeFilter(null);
    setPriorityFilter(null);
    setSearchFilter(null);
    onFilterChange({
      status: null,
      driverId: null,
      dateRange: null,
      priority: null,
      search: null,
    });
    onApplyFilters();
  };

  // Get status name with icon for buttons
  const getStatusButtonLabel = (status: DeliveryStatus) => {
    switch (status) {
      case DeliveryStatus.Pending:
        return { label: 'Pending', icon: 'clock' };
      case DeliveryStatus.Assigned:
        return { label: 'Assigned', icon: 'user' };
      case DeliveryStatus.OutForDelivery:
        return { label: 'Out for Delivery', icon: 'truck' };
      case DeliveryStatus.Delivered:
        return { label: 'Delivered', icon: 'check' };
      case DeliveryStatus.Failed:
        return { label: 'Failed', icon: 'x' };
      default:
        return { label: 'Unknown', icon: 'clock' };
    }
  };

  // Get today's date for date picker
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  return (
    <div className={styles.filtersPanel}>
      <div className={styles.filtersHeader}>
        <h3>Filters</h3>
        <button className={styles.clearFiltersBtn} onClick={resetFilters}>
          Clear All
        </button>
      </div>

      <div className={styles.filterSections}>
        {/* Status Filter */}
        <div className={styles.filterSection}>
          <h4>Status</h4>
          <div className={styles.statusFilterGrid}>
            {Object.values(DeliveryStatus)
              .filter((value) => typeof value === 'number')
              .map((statusNum) => {
                const status = statusNum as DeliveryStatus;
                const isSelected = statusFilter === status;
                const { label, icon: IconType } = getStatusButtonLabel(status);

                // Map string to actual icon component
                const getIcon = () => {
                  switch(IconType) {
                    case 'clock': return <Clock size={16} />;
                    case 'user': return <User size={16} />;
                    case 'truck': return <Truck size={16} />;
                    case 'check': return <Check size={16} />;
                    case 'x': return <X size={16} />;
                    default: return <Clock size={16} />;
                  }
                };

                return (
                  <button
                    key={status}
                    className={`${styles.statusFilterBtn} ${
                      isSelected ? styles.statusFilterBtnActive : ''
                    }`}
                    onClick={() => handleStatusChange(status)}
                  >
                    {getIcon()}
                    <span>{label}</span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Driver Filter */}
        <div className={styles.filterSection}>
          <h4>Driver</h4>
          <div className={styles.driverFilter}>
            <select
              value={driverFilter || ''}
              onChange={(e) => handleDriverChange(e.target.value || null)}
              className={styles.selectInput}
            >
              <option value="">All Drivers</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.firstName} {driver.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className={styles.filterSection}>
          <h4>Date Range</h4>
          <div className={styles.dateRangeFilter}>
            <div className={styles.datePresetOptions}>
              <button
                className={`${styles.datePresetBtn} ${
                  dateRangeFilter === 'today' ? styles.datePresetBtnActive : ''
                }`}
                onClick={() => setDateRangeFilter(dateRangeFilter === 'today' ? null : 'today')}
              >
                <Calendar size={14} />
                Today
              </button>
              <button
                className={`${styles.datePresetBtn} ${
                  dateRangeFilter === 'yesterday' ? styles.datePresetBtnActive : ''
                }`}
                onClick={() => setDateRangeFilter(dateRangeFilter === 'yesterday' ? null : 'yesterday')}
              >
                <Calendar size={14} />
                Yesterday
              </button>
              <button
                className={`${styles.datePresetBtn} ${
                  dateRangeFilter === '7days' ? styles.datePresetBtnActive : ''
                }`}
                onClick={() => setDateRangeFilter(dateRangeFilter === '7days' ? null : '7days')}
              >
                <Calendar size={14} />
                Last 7 Days
              </button>
            </div>

            <div className={styles.dateCustomPicker}>
              <button
                className={styles.dateCustomBtn}
                onClick={() => setShowDateRange(!showDateRange)}
              >
                <Calendar size={14} />
                Custom Range
                {dateRangeFilter === 'custom' && <span className={styles.selectedIndicator}>✓</span>}
              </button>

              {showDateRange && (
                <div className={styles.dateRangeInputs}>
                  <input
                    type="date"
                    value={dateRangeFilter?.split(' - ')[0] || ''}
                    onChange={(e) => setDateRangeFilter(`${e.target.value} - ${dateRangeFilter?.split(' - ')[1] || today}`)}
                    className={styles.dateInput}
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={dateRangeFilter?.split(' - ')[1] || ''}
                    onChange={(e) => setDateRangeFilter(`${dateRangeFilter?.split(' - ')[0] || today} - ${e.target.value}`)}
                    className={styles.dateInput}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Priority Filter */}
        <div className={styles.filterSection}>
          <h4>Priority</h4>
          <div className={styles.statusFilterGrid}>
            {Object.values(DeliveryPriority)
              .filter((value) => typeof value === 'number')
              .map((priorityNum) => {
                const priority = priorityNum as DeliveryPriority;
                const isSelected = priorityFilter === priority;
                const priorityLabel = getDeliveryPriorityName(priority);

                return (
                  <button
                    key={priority}
                    className={`${styles.statusFilterBtn} ${
                      isSelected ? styles.statusFilterBtnActive : ''
                    }`}
                    onClick={() => handlePriorityChange(priority)}
                  >
                    <User size={16} />
                    <span>{priorityLabel}</span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Search Filter */}
        <div className={styles.filterSection}>
          <h4>Search</h4>
          <div className={styles.searchFilter}>
            <input
              type="text"
              placeholder="Search by customer, address, or order ID..."
              value={searchFilter || ''}
              onChange={(e) => setSearchFilter(e.target.value || null)}
              className={styles.selectInput}
            />
          </div>
        </div>
      </div>

      {/* Apply Filters Button */}
      <div className={styles.filtersFooter}>
        <button 
          className={styles.applyFiltersBtn}
          onClick={applyFilters}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};