/**
 * Database provider types for branch databases
 */
export enum DatabaseProvider {
  SQLite = 0,
  MSSQL = 1,
  PostgreSQL = 2,
  MySQL = 3,
}

/**
 * User roles for branch access
 */
export enum UserRole {
  Cashier = 0,
  Manager = 1,
  Admin = 2,
}

/**
 * Invoice types for sales transactions
 */
export enum InvoiceType {
  Touch = 0, // Simplified invoice (anonymous)
  Standard = 1, // Detailed formal invoice (with customer)
}

/**
 * Payment methods for transactions
 */
export enum PaymentMethod {
  Cash = 0,
  Card = 1,
  DigitalWallet = 2,
  BankTransfer = 3,
  Check = 4,
}

/**
 * Discount types for line items
 */
export enum DiscountType {
  None = 0,
  Percentage = 1, // e.g., 20% off
  FixedAmount = 2, // e.g., $5 off
}

/**
 * Payment status for purchases
 */
export enum PaymentStatus {
  Pending = 0,
  Partial = 1,
  Paid = 2,
}

/**
 * Sync status for offline queue
 */
export enum SyncStatus {
  Pending = 0,
  InProgress = 1,
  Completed = 2,
  Failed = 3,
}

/**
 * Approval status for expenses
 */
export enum ApprovalStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

/**
 * Helper function to get display name for DatabaseProvider
 */
export const getDatabaseProviderName = (provider: DatabaseProvider): string => {
  switch (provider) {
    case DatabaseProvider.SQLite:
      return "SQLite";
    case DatabaseProvider.MSSQL:
      return "Microsoft SQL Server";
    case DatabaseProvider.PostgreSQL:
      return "PostgreSQL";
    case DatabaseProvider.MySQL:
      return "MySQL";
    default:
      return "Unknown";
  }
};

/**
 * Helper function to get display name for UserRole
 */
export const getUserRoleName = (role: UserRole): string => {
  switch (role) {
    case UserRole.Cashier:
      return "Cashier";
    case UserRole.Manager:
      return "Manager";
    case UserRole.Admin:
      return "Admin";
    default:
      return "Unknown";
  }
};

/**
 * Helper function to get display name for PaymentMethod
 */
export const getPaymentMethodName = (method: PaymentMethod): string => {
  switch (method) {
    case PaymentMethod.Cash:
      return "Cash";
    case PaymentMethod.Card:
      return "Card";
    case PaymentMethod.DigitalWallet:
      return "Digital Wallet";
    case PaymentMethod.BankTransfer:
      return "Bank Transfer";
    case PaymentMethod.Check:
      return "Check";
    default:
      return "Unknown";
  }
};

/**
 * Helper function to get display name for InvoiceType
 */
export const getInvoiceTypeName = (type: InvoiceType): string => {
  switch (type) {
    case InvoiceType.Touch:
      return "Touch Invoice";
    case InvoiceType.Standard:
      return "Standard Invoice";
    default:
      return "Unknown";
  }
};
