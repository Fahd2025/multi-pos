/**
 * Feature Flags for Offline Operations
 *
 * Control which operations can be performed offline.
 * Flags can be toggled per transaction type for gradual rollout.
 */

export const OFFLINE_FEATURES = {
  // Sales operations
  SALES_CREATE: true,
  SALES_VOID: true,
  SALES_PAYMENT_UPDATE: false,  // Disabled by default - enable after testing

  // Customer operations
  CUSTOMER_CREATE: true,
  CUSTOMER_UPDATE: true,
  CUSTOMER_DELETE: false,  // Disabled by default - requires careful testing

  // Pending orders (already implemented)
  PENDING_ORDERS: true,

  // Future: Inventory operations (Phase 2)
  STOCK_ADJUST: false,
  EXPENSE_CREATE: false,

  // Future: Order management (Phase 3)
  PURCHASE_CREATE: false,
  TABLE_TRANSFER: false,
  TABLE_ASSIGN: false,
  DELIVERY_CREATE: false,

  // Future: Master data (Phase 4)
  SUPPLIER_CREATE: false,
  CATEGORY_CREATE: false,
  DRIVER_CREATE: false,
  ZONE_CREATE: false,
} as const;

export type OfflineFeatureKey = keyof typeof OFFLINE_FEATURES;

/**
 * Check if a specific offline feature is enabled
 */
export function isOfflineFeatureEnabled(feature: OfflineFeatureKey): boolean {
  return OFFLINE_FEATURES[feature] ?? false;
}

/**
 * Get all enabled offline features
 */
export function getEnabledOfflineFeatures(): OfflineFeatureKey[] {
  return Object.entries(OFFLINE_FEATURES)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature as OfflineFeatureKey);
}

/**
 * Get count of enabled offline features
 */
export function getEnabledFeaturesCount(): number {
  return getEnabledOfflineFeatures().length;
}
