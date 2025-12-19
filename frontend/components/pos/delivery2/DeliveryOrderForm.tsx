/**
 * DeliveryOrderForm Component
 * Reusable form component for collecting delivery order information
 */

import React from 'react';
import { X } from 'lucide-react';
import styles from './Pos2.module.css';

interface DeliveryFormState {
  customerName: string;
  phone: string;
  address: string;
  specialInstructions: string;
}

interface DeliveryOrderFormProps {
  formState: DeliveryFormState;
  setFormState: React.Dispatch<React.SetStateAction<DeliveryFormState>>;
  showForm: boolean;
  setShowForm: React.Dispatch<React.SetStateAction<boolean>>;
  className?: string;
}

export const DeliveryOrderForm: React.FC<DeliveryOrderFormProps> = ({
  formState,
  setFormState,
  showForm,
  setShowForm,
  className = '',
}) => {
  const handleInputChange = (field: keyof DeliveryFormState, value: string) => {
    setFormState(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className={`${styles.deliveryFormContainer} ${className}`}>
      <div className={styles.deliveryFormHeader}>
        <h3>Delivery Information</h3>
        <button 
          className={styles.closeDeliveryFormBtn} 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Hide' : 'Show'} Form
        </button>
      </div>
      
      {showForm && (
        <div className={styles.deliveryForm}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="customerName">Customer Name</label>
              <input
                id="customerName"
                type="text"
                value={formState.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                placeholder="Full name"
                className={styles.formInput}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                value={formState.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Phone number"
                className={styles.formInput}
              />
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="address">Delivery Address</label>
            <textarea
              id="address"
              value={formState.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Full delivery address"
              rows={3}
              className={`${styles.formInput} ${styles.textarea}`}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="specialInstructions">Special Instructions (Optional)</label>
            <textarea
              id="specialInstructions"
              value={formState.specialInstructions}
              onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
              placeholder="Any special delivery instructions"
              rows={2}
              className={`${styles.formInput} ${styles.textarea}`}
            />
          </div>
        </div>
      )}
    </div>
  );
};