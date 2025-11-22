/**
 * API Configuration
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
export const API_VERSION = "v1";

/**
 * API Routes
 */
export const API_ROUTES = {
  // Authentication
  AUTH: {
    LOGIN: `/api/${API_VERSION}/auth/login`,
    LOGOUT: `/api/${API_VERSION}/auth/logout`,
    REFRESH: `/api/${API_VERSION}/auth/refresh`,
    ME: `/api/${API_VERSION}/auth/me`,
  },

  // Sales
  SALES: {
    BASE: `/api/${API_VERSION}/sales`,
    BY_ID: (id: string) => `/api/${API_VERSION}/sales/${id}`,
    VOID: (id: string) => `/api/${API_VERSION}/sales/${id}/void`,
    INVOICE: (id: string) => `/api/${API_VERSION}/sales/${id}/invoice`,
    STATS: `/api/${API_VERSION}/sales/stats`,
  },

  // Products
  PRODUCTS: {
    BASE: `/api/${API_VERSION}/products`,
    BY_ID: (id: string) => `/api/${API_VERSION}/products/${id}`,
    ADJUST_STOCK: (id: string) => `/api/${API_VERSION}/products/${id}/adjust-stock`,
  },

  // Categories
  CATEGORIES: {
    BASE: `/api/${API_VERSION}/categories`,
    BY_ID: (id: string) => `/api/${API_VERSION}/categories/${id}`,
  },

  // Customers
  CUSTOMERS: {
    BASE: `/api/${API_VERSION}/customers`,
    BY_ID: (id: string) => `/api/${API_VERSION}/customers/${id}`,
    HISTORY: (id: string) => `/api/${API_VERSION}/customers/${id}/history`,
  },

  // Suppliers
  SUPPLIERS: {
    BASE: `/api/${API_VERSION}/suppliers`,
    BY_ID: (id: string) => `/api/${API_VERSION}/suppliers/${id}`,
    HISTORY: (id: string) => `/api/${API_VERSION}/suppliers/${id}/history`,
  },

  // Purchases
  PURCHASES: {
    BASE: `/api/${API_VERSION}/purchases`,
    BY_ID: (id: string) => `/api/${API_VERSION}/purchases/${id}`,
    RECEIVE: (id: string) => `/api/${API_VERSION}/purchases/${id}/receive`,
  },

  // Expenses
  EXPENSES: {
    BASE: `/api/${API_VERSION}/expenses`,
    BY_ID: (id: string) => `/api/${API_VERSION}/expenses/${id}`,
    APPROVE: (id: string) => `/api/${API_VERSION}/expenses/${id}/approve`,
  },

  // Expense Categories
  EXPENSE_CATEGORIES: {
    BASE: `/api/${API_VERSION}/expense-categories`,
    BY_ID: (id: string) => `/api/${API_VERSION}/expense-categories/${id}`,
  },

  // Branches
  BRANCHES: {
    BASE: `/api/${API_VERSION}/branches`,
    BY_ID: (id: string) => `/api/${API_VERSION}/branches/${id}`,
    SETTINGS: (id: string) => `/api/${API_VERSION}/branches/${id}/settings`,
    TEST_CONNECTION: (id: string) => `/api/${API_VERSION}/branches/${id}/test-connection`,
  },

  // Users
  USERS: {
    BASE: `/api/${API_VERSION}/users`,
    BY_ID: (id: string) => `/api/${API_VERSION}/users/${id}`,
    ASSIGN_BRANCH: (id: string) => `/api/${API_VERSION}/users/${id}/assign-branch`,
    ACTIVITY: (id: string) => `/api/${API_VERSION}/users/${id}/activity`,
  },

  // Sync
  SYNC: {
    TRANSACTION: `/api/${API_VERSION}/sync/transaction`,
    BATCH: `/api/${API_VERSION}/sync/batch`,
    STATUS: `/api/${API_VERSION}/sync/status`,
  },

  // Images
  IMAGES: {
    UPLOAD: `/api/${API_VERSION}/images/upload`,
    GET: (branchName: string, entityType: string, entityId: string, size: string) =>
      `/api/${API_VERSION}/images/${branchName}/${entityType}/${entityId}/${size}`,
    DELETE: (id: string) => `/api/${API_VERSION}/images/${id}`,
  },

  // Reports
  REPORTS: {
    SALES: `/api/${API_VERSION}/reports/sales`,
    INVENTORY: `/api/${API_VERSION}/reports/inventory`,
    FINANCIAL: `/api/${API_VERSION}/reports/financial`,
    EXPORT: `/api/${API_VERSION}/reports/export`,
  },

  // Audit
  AUDIT: {
    LOGS: `/api/${API_VERSION}/audit/logs`,
    USER: (userId: string) => `/api/${API_VERSION}/audit/user/${userId}`,
  },

  // Health
  HEALTH: "/health",
};

/**
 * Application Configuration
 */
export const APP_CONFIG = {
  // Session
  SESSION_TIMEOUT_MINUTES: 30,
  ACCESS_TOKEN_EXPIRY_MINUTES: 15,
  REFRESH_TOKEN_EXPIRY_DAYS: 7,

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Images
  MAX_IMAGE_SIZE_MB: 10,
  SUPPORTED_IMAGE_FORMATS: ["image/jpeg", "image/png", "image/webp"],

  // Offline Sync
  MAX_OFFLINE_QUEUE_SIZE: 1000,
  SYNC_RETRY_ATTEMPTS: 3,
  SYNC_RETRY_DELAY_MS: 5000,

  // UI
  TOAST_DURATION_MS: 3000,
  DEBOUNCE_DELAY_MS: 300,
};

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER: "user",
  BRANCH: "branch",
  LANGUAGE: "language",
  THEME: "theme",
  OFFLINE_QUEUE: "offline_queue",
};

/**
 * Regular Expressions for Validation
 */
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\d\s\-+()]+$/,
  USERNAME: /^[a-zA-Z0-9_]{3,100}$/,
  SKU: /^[A-Z0-9\-_]+$/,
  BARCODE: /^[\d]{8,13}$/,
  BRANCH_CODE: /^[A-Z0-9]{1,20}$/,
};

/**
 * Date and Number Formats
 */
export const FORMATS = {
  DATE: "MM/DD/YYYY",
  DATE_TIME: "MM/DD/YYYY HH:mm:ss",
  TIME: "HH:mm:ss",
  CURRENCY: "en-US", // Locale for currency formatting
};

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection.",
  SERVER_ERROR: "Server error. Please try again later.",
  UNAUTHORIZED: "You are not authorized to access this resource.",
  SESSION_EXPIRED: "Your session has expired. Please login again.",
  INVALID_CREDENTIALS: "Invalid username or password.",
  UNKNOWN_ERROR: "An unexpected error occurred.",
};
