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
  const cleanPath = path.startsWith("/") ? path.substring(1) : path;
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

  // Migrations
  MIGRATIONS: (locale: string) => `/${locale}/head-office/migrations`,

  // Audit Logs
  AUDIT_LOGS: (locale: string) => `/${locale}/head-office/audit-logs`,

  // Analytics
  ANALYTICS: (locale: string) => `/${locale}/head-office/analytics`,

  // Settings
  SETTINGS: (locale: string) => `/${locale}/head-office/settings`,
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
  POS: (locale: string) => `/${locale}/pos`,
  POS2: (locale: string) => `/${locale}/pos/pos2`,
  POS_TABLES: (locale: string) => `/${locale}/pos/tables`,

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

  // Users
  USERS: (locale: string) => `/${locale}/branch/users`,

  // Settings
  SETTINGS: (locale: string) => `/${locale}/branch/settings`,
  SETTINGS_USERS: (locale: string) => `/${locale}/branch/settings/users`,
  SETTINGS_INVOICE_TEMPLATES: (locale: string) => `/${locale}/branch/settings/invoice-templates`,
  SETTINGS_INVOICE_BUILDER: (locale: string) => `/${locale}/branch/settings/invoice-builder`,
  SETTINGS_INVOICE_BUILDER_EDIT: (locale: string, id: string) =>
    `/${locale}/branch/settings/invoice-builder/${id}`,

  // Table Management
  TABLES: (locale: string) => `/${locale}/branch/tables`,
  ZONES: (locale: string) => `/${locale}/branch/tables/zones`,
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
export const getBasePath = (locale: string, type: "head-office" | "branch") => {
  return type === "head-office"
    ? HEAD_OFFICE_ROUTES.DASHBOARD(locale)
    : BRANCH_ROUTES.DASHBOARD(locale);
};

/**
 * Navigation items for Branch Dashboard
 */
export const getBranchNavigation = (locale: string) => [
  { name: "Dashboard", href: BRANCH_ROUTES.DASHBOARD(locale), icon: "📊" },
  { name: "POS", href: BRANCH_ROUTES.POS(locale), icon: "🛒" },
  { name: "Sales", href: BRANCH_ROUTES.SALES(locale), icon: "💰" },
  { name: "Inventory", href: BRANCH_ROUTES.INVENTORY(locale), icon: "📦" },
  { name: "Customers", href: BRANCH_ROUTES.CUSTOMERS(locale), icon: "👥" },
  { name: "Suppliers", href: BRANCH_ROUTES.SUPPLIERS(locale), icon: "🚚" },
  { name: "Purchases", href: BRANCH_ROUTES.PURCHASES(locale), icon: "📥" },
  { name: "Expenses", href: BRANCH_ROUTES.EXPENSES(locale), icon: "💸" },
  { name: "Reports", href: BRANCH_ROUTES.REPORTS(locale), icon: "📈" },
  { name: "Tables", href: BRANCH_ROUTES.TABLES(locale), icon: "🍽️" },
  { name: "Users", href: BRANCH_ROUTES.USERS(locale), icon: "👥" },
  { name: "Settings", href: BRANCH_ROUTES.SETTINGS(locale), icon: "⚙️" },
];

/**
 * Navigation items for Head Office Dashboard
 */
export const getHeadOfficeNavigation = (locale: string) => [
  { name: "Dashboard", href: HEAD_OFFICE_ROUTES.DASHBOARD(locale), icon: "📊" },
  { name: "Branches", href: HEAD_OFFICE_ROUTES.BRANCHES(locale), icon: "🏢" },
  //{ name: "Users", href: HEAD_OFFICE_ROUTES.USERS(locale), icon: "👥" },
  { name: "Migrations", href: HEAD_OFFICE_ROUTES.MIGRATIONS(locale), icon: "🔄" },
  { name: "Audit Logs", href: HEAD_OFFICE_ROUTES.AUDIT_LOGS(locale), icon: "📋" },
  { name: "Analytics", href: HEAD_OFFICE_ROUTES.ANALYTICS(locale), icon: "📈" },
  { name: "Settings", href: HEAD_OFFICE_ROUTES.SETTINGS(locale), icon: "⚙️" },
];
