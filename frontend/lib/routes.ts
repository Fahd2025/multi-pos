/**
 * Page Routes Constants
 * Centralized routing paths for all pages in the application
 */

/**
 * Generate localized route
 * @param locale - The locale code (e.g., 'en', 'ar')
 * @param path - The path without locale prefix
 * @returns Full localized path
 */
export const localizeRoute = (locale: string, path: string): string => {
  // Remove leading slash from path if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `/${locale}/${cleanPath}`;
};

/**
 * Authentication routes
 */
export const AUTH_ROUTES = {
  LOGIN: (locale: string) => `/${locale}/login`,
  LOGOUT: (locale: string) => `/${locale}/logout`,
};

/**
 * Head Office routes
 */
export const HEAD_OFFICE_ROUTES = {
  // Dashboard
  DASHBOARD: (locale: string) => `/${locale}/head-office`,

  // Branches
  BRANCHES: (locale: string) => `/${locale}/head-office/branches`,
  BRANCH_DETAIL: (locale: string, id: string) => `/${locale}/head-office/branches/${id}`,

  // Users
  USERS: (locale: string) => `/${locale}/head-office/users`,
  USER_DETAIL: (locale: string, id: string) => `/${locale}/head-office/users/${id}`,

  // Analytics
  ANALYTICS: (locale: string) => `/${locale}/head-office/analytics`,

  // Audit Logs
  AUDIT_LOGS: (locale: string) => `/${locale}/head-office/audit-logs`,
};

/**
 * Branch routes
 */
export const BRANCH_ROUTES = {
  // Dashboard
  DASHBOARD: (locale: string) => `/${locale}/branch`,

  // Sales
  SALES: (locale: string) => `/${locale}/branch/sales`,
  SALE_DETAIL: (locale: string, id: string) => `/${locale}/branch/sales/${id}`,
  POS: (locale: string) => `/${locale}/branch/sales/pos`,
  POS2: (locale: string) => `/${locale}/branch/sales/pos2`,

  // Inventory
  INVENTORY: (locale: string) => `/${locale}/branch/inventory`,
  CATEGORIES: (locale: string) => `/${locale}/branch/inventory/categories`,

  // Customers
  CUSTOMERS: (locale: string) => `/${locale}/branch/customers`,
  CUSTOMER_DETAIL: (locale: string, id: string) => `/${locale}/branch/customers/${id}`,

  // Suppliers
  SUPPLIERS: (locale: string) => `/${locale}/branch/suppliers`,
  SUPPLIER_DETAIL: (locale: string, id: string) => `/${locale}/branch/suppliers/${id}`,

  // Purchases
  PURCHASES: (locale: string) => `/${locale}/branch/purchases`,

  // Expenses
  EXPENSES: (locale: string) => `/${locale}/branch/expenses`,
  EXPENSE_CATEGORIES: (locale: string) => `/${locale}/branch/expense-categories`,

  // Reports
  REPORTS: (locale: string) => `/${locale}/branch/reports`,

  // Settings
  SETTINGS: (locale: string) => `/${locale}/branch/settings`,
  SETTINGS_USERS: (locale: string) => `/${locale}/branch/settings/users`,
};

/**
 * Public routes (no authentication required)
 */
export const PUBLIC_ROUTES = {
  HOME: (locale: string) => `/${locale}`,
};

/**
 * Helper function to get the base path for a route type
 */
export const getBasePath = (locale: string, type: 'head-office' | 'branch') => {
  return type === 'head-office'
    ? HEAD_OFFICE_ROUTES.DASHBOARD(locale)
    : BRANCH_ROUTES.DASHBOARD(locale);
};

/**
 * Navigation items for Branch Dashboard
 */
export const getBranchNavigation = (locale: string) => [
  { name: 'Dashboard', href: BRANCH_ROUTES.DASHBOARD(locale), icon: '📊' },
  { name: 'POS', href: BRANCH_ROUTES.POS(locale), icon: '🛒' },
  { name: 'Sales', href: BRANCH_ROUTES.SALES(locale), icon: '💰' },
  { name: 'Inventory', href: BRANCH_ROUTES.INVENTORY(locale), icon: '📦' },
  { name: 'Customers', href: BRANCH_ROUTES.CUSTOMERS(locale), icon: '👥' },
  { name: 'Suppliers', href: BRANCH_ROUTES.SUPPLIERS(locale), icon: '🚚' },
  { name: 'Purchases', href: BRANCH_ROUTES.PURCHASES(locale), icon: '📥' },
  { name: 'Expenses', href: BRANCH_ROUTES.EXPENSES(locale), icon: '💸' },
  { name: 'Reports', href: BRANCH_ROUTES.REPORTS(locale), icon: '📈' },
  { name: 'Settings', href: BRANCH_ROUTES.SETTINGS(locale), icon: '⚙️' },
];

/**
 * Navigation items for Head Office Dashboard
 */
export const getHeadOfficeNavigation = (locale: string) => [
  { name: 'Dashboard', href: HEAD_OFFICE_ROUTES.DASHBOARD(locale), icon: '📊' },
  { name: 'Branches', href: HEAD_OFFICE_ROUTES.BRANCHES(locale), icon: '🏢' },
  { name: 'Users', href: HEAD_OFFICE_ROUTES.USERS(locale), icon: '👥' },
  { name: 'Audit Logs', href: HEAD_OFFICE_ROUTES.AUDIT_LOGS(locale), icon: '📋' },
  { name: 'Analytics', href: HEAD_OFFICE_ROUTES.ANALYTICS(locale), icon: '📈' },
];
