/**
 * SkeletonLoader Component
 * Provides skeleton loading placeholders for delivery orders
 */

import React from 'react';
import styles from './Pos2.module.css';

interface SkeletonLoaderProps {
  count?: number;
  type?: 'order-card' | 'list' | 'detail';
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  count = 3, 
  type = 'order-card' 
}) => {
  if (type === 'order-card') {
    return (
      <div className={styles.skeletonContainer}>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className={styles.skeletonCard}>
            <div className={styles.skeletonHeader}>
              <div className={styles.skeletonTextShort}></div>
              <div className={styles.skeletonBadge}></div>
            </div>
            <div className={styles.skeletonContent}>
              <div className={styles.skeletonRow}>
                <div className={styles.skeletonIcon}></div>
                <div className={styles.skeletonTextLong}></div>
              </div>
              <div className={styles.skeletonRow}>
                <div className={styles.skeletonIcon}></div>
                <div className={styles.skeletonTextLong}></div>
              </div>
              <div className={styles.skeletonRow}>
                <div className={styles.skeletonIcon}></div>
                <div className={styles.skeletonTextShort}></div>
              </div>
            </div>
            <div className={styles.skeletonFooter}>
              <div className={styles.skeletonAmount}></div>
              <div className={styles.skeletonAction}></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // Add other skeleton types if needed
  return (
    <div className={styles.skeletonContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={styles.skeletonItem}>
          <div className={styles.skeletonTextLong}></div>
          <div className={styles.skeletonTextMedium}></div>
        </div>
      ))}
    </div>
  );
};