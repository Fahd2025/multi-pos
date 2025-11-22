/**
 * Entity Type Definitions
 * Frontend entity types matching backend database entities
 * These types represent the domain models used throughout the application
 */

import {
  DatabaseProvider,
  UserRole,
  InvoiceType,
  PaymentMethod,
  DiscountType,
  PaymentStatus,
  SyncStatus,
  ApprovalStatus,
} from './enums';

// ============================================================================
// Head Office Database Entities
// ============================================================================

/**
 * User entity - represents system users (head office admins, branch managers, cashiers)
 */
export interface User {
  id: string;
  username: string;
  email: string;
  fullNameEn: string;
  fullNameAr?: string;
  phone?: string;
  preferredLanguage: string;
  isActive: boolean;
  isHeadOfficeAdmin: boolean;
  lastLoginAt?: Date;
  lastActivityAt?: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Branch entity - represents a physical store location
 */
export interface Branch {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  loginName: string;
  addressEn?: string;
  addressAr?: string;
  email?: string;
  phone?: string;
  website?: string;
  crn?: string;
  taxNumber?: string;
  nationalAddress?: string;
  logoPath?: string;
  databaseProvider: DatabaseProvider;
  dbServer: string;
  dbName: string;
  dbPort: number;
  dbUsername?: string;
  dbPassword?: string;
  dbAdditionalParams?: string;
  language: string;
  currency: string;
  timeZone: string;
  dateFormat: string;
  numberFormat: string;
  taxRate: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * BranchUser entity - represents user assignments to branches with roles
 */
export interface BranchUser {
  id: string;
  userId: string;
  branchId: string;
  role: UserRole;
  isActive: boolean;
  assignedAt: Date;
  assignedBy: string;
}

/**
 * RefreshToken entity - represents JWT refresh tokens for session management
 */
export interface RefreshToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date;
  lastActivityAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * MainSetting entity - represents global system settings
 */
export interface MainSetting {
  id: string;
  key: string;
  value?: string;
  isEncrypted: boolean;
  description?: string;
  updatedAt: Date;
  updatedBy: string;
}

/**
 * AuditLog entity - represents permanent audit trail
 */
export interface AuditLog {
  id: string;
  timestamp: Date;
  userId?: string;
  branchId?: string;
  eventType: string;
  entityType?: string;
  entityId?: string;
  action: string;
  oldValues?: string;
  newValues?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

/**
 * UserActivityLog entity - represents recent user activity (circular buffer)
 */
export interface UserActivityLog {
  id: string;
  userId: string;
  timestamp: Date;
  activityType: string;
  description: string;
  branchId?: string;
  ipAddress?: string;
}

// ============================================================================
// Branch Database Entities
// ============================================================================

/**
 * Category entity - represents product categories (hierarchical)
 */
export interface Category {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  parentCategoryId?: string;
  imagePath?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Product entity - represents items for sale with inventory tracking
 */
export interface Product {
  id: string;
  sku: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  categoryId: string;
  sellingPrice: number;
  costPrice: number;
  stockLevel: number;
  minStockThreshold: number;
  hasInventoryDiscrepancy: boolean;
  supplierId?: string;
  barcode?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * ProductImage entity - represents multiple images per product
 */
export interface ProductImage {
  id: string;
  productId: string;
  imagePath: string;
  thumbnailPath: string;
  displayOrder: number;
  uploadedAt: Date;
  uploadedBy: string;
}

/**
 * Customer entity - represents customer accounts
 */
export interface Customer {
  id: string;
  code: string;
  nameEn: string;
  nameAr?: string;
  email?: string;
  phone?: string;
  addressEn?: string;
  addressAr?: string;
  logoPath?: string;
  totalPurchases: number;
  visitCount: number;
  lastVisitAt?: Date;
  loyaltyPoints: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Supplier entity - represents vendors for purchase orders
 */
export interface Supplier {
  id: string;
  code: string;
  nameEn: string;
  nameAr?: string;
  email?: string;
  phone?: string;
  addressEn?: string;
  addressAr?: string;
  logoPath?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Sale entity - represents completed sales transactions
 */
export interface Sale {
  id: string;
  transactionId: string;
  invoiceNumber?: string;
  invoiceType: InvoiceType;
  customerId?: string;
  cashierId: string;
  saleDate: Date;
  subtotal: number;
  taxAmount: number;
  totalDiscount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  notes?: string;
  isVoided: boolean;
  voidedAt?: Date;
  voidedBy?: string;
  voidReason?: string;
  createdAt: Date;
}

/**
 * SaleLineItem entity - represents individual products in a sale
 */
export interface SaleLineItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discountType: DiscountType;
  discountValue: number;
  discountedUnitPrice: number;
  lineTotal: number;
}

/**
 * Purchase entity - represents purchase orders from suppliers
 */
export interface Purchase {
  id: string;
  purchaseOrderNumber: string;
  supplierId: string;
  purchaseDate: Date;
  receivedDate?: Date;
  totalCost: number;
  paymentStatus: PaymentStatus;
  amountPaid: number;
  invoiceImagePath?: string;
  notes?: string;
  createdAt: Date;
  createdBy: string;
}

/**
 * PurchaseLineItem entity - represents individual products in a purchase order
 */
export interface PurchaseLineItem {
  id: string;
  purchaseId: string;
  productId: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

/**
 * ExpenseCategory entity - represents expense categories for cost tracking
 */
export interface ExpenseCategory {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  budgetAllocation?: number;
  isActive: boolean;
  createdAt: Date;
}

/**
 * Expense entity - represents business expenses
 */
export interface Expense {
  id: string;
  expenseCategoryId: string;
  amount: number;
  expenseDate: Date;
  descriptionEn: string;
  descriptionAr?: string;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  receiptImagePath?: string;
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  createdBy: string;
}

/**
 * Setting entity - represents branch-specific settings
 */
export interface Setting {
  id: string;
  key: string;
  value?: string;
  description?: string;
  updatedAt: Date;
  updatedBy: string;
}

/**
 * SyncQueue entity - represents offline transactions pending synchronization
 */
export interface SyncQueue {
  id: string;
  syncId: string;
  transactionType: string;
  transactionData: string;
  timestamp: Date;
  syncStatus: SyncStatus;
  retryCount: number;
  lastSyncAttempt?: Date;
  errorMessage?: string;
  createdAt: Date;
}

// ============================================================================
// Composite/Extended Types
// ============================================================================

/**
 * Extended user with branch assignments
 */
export interface UserWithBranches extends User {
  branches: BranchUser[];
}

/**
 * Extended product with category and supplier details
 */
export interface ProductWithDetails extends Product {
  category: Category;
  supplier?: Supplier;
  images: ProductImage[];
}

/**
 * Extended sale with line items and customer details
 */
export interface SaleWithDetails extends Sale {
  lineItems: SaleLineItemWithProduct[];
  customer?: Customer;
  cashier: User;
}

/**
 * Sale line item with product details
 */
export interface SaleLineItemWithProduct extends SaleLineItem {
  product: Product;
}

/**
 * Extended purchase with line items and supplier details
 */
export interface PurchaseWithDetails extends Purchase {
  lineItems: PurchaseLineItemWithProduct[];
  supplier: Supplier;
}

/**
 * Purchase line item with product details
 */
export interface PurchaseLineItemWithProduct extends PurchaseLineItem {
  product: Product;
}

/**
 * Extended expense with category details
 */
export interface ExpenseWithDetails extends Expense {
  category: ExpenseCategory;
  createdByUser: User;
  approvedByUser?: User;
}

// ============================================================================
// View Models (UI-specific)
// ============================================================================

/**
 * Product list item for display in tables/lists
 */
export interface ProductListItem {
  id: string;
  sku: string;
  name: string;
  categoryName: string;
  sellingPrice: number;
  stockLevel: number;
  isLowStock: boolean;
  isActive: boolean;
}

/**
 * Sale list item for display in tables/lists
 */
export interface SaleListItem {
  id: string;
  transactionId: string;
  invoiceNumber?: string;
  customerName?: string;
  total: number;
  paymentMethod: PaymentMethod;
  saleDate: Date;
  isVoided: boolean;
}

/**
 * Customer list item for display in tables/lists
 */
export interface CustomerListItem {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  totalPurchases: number;
  visitCount: number;
  lastVisitAt?: Date;
}

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  todaySales: number;
  todayRevenue: number;
  lowStockCount: number;
  pendingExpenses: number;
  totalCustomers: number;
  activeProducts: number;
}

/**
 * Branch statistics (for head office)
 */
export interface BranchStats {
  branchId: string;
  branchName: string;
  totalSales: number;
  totalRevenue: number;
  activeProducts: number;
  totalCustomers: number;
  lastSyncAt?: Date;
}

// ============================================================================
// Form State Types
// ============================================================================

/**
 * Product form state
 */
export interface ProductFormState {
  sku: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  categoryId: string;
  sellingPrice: string;
  costPrice: string;
  stockLevel: string;
  minStockThreshold: string;
  supplierId?: string;
  barcode?: string;
}

/**
 * Sale form state
 */
export interface SaleFormState {
  customerId?: string;
  invoiceType: InvoiceType;
  lineItems: SaleLineItemFormState[];
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  notes?: string;
}

/**
 * Sale line item form state
 */
export interface SaleLineItemFormState {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountType: DiscountType;
  discountValue: number;
}

/**
 * Customer form state
 */
export interface CustomerFormState {
  code: string;
  nameEn: string;
  nameAr?: string;
  email?: string;
  phone?: string;
  addressEn?: string;
  addressAr?: string;
}

/**
 * Expense form state
 */
export interface ExpenseFormState {
  expenseCategoryId: string;
  amount: string;
  expenseDate: string;
  descriptionEn: string;
  descriptionAr?: string;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
}

// ============================================================================
// Filter/Search Types
// ============================================================================

/**
 * Product filter criteria
 */
export interface ProductFilter {
  search?: string;
  categoryId?: string;
  supplierId?: string;
  isActive?: boolean;
  isLowStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Sale filter criteria
 */
export interface SaleFilter {
  dateFrom?: Date;
  dateTo?: Date;
  customerId?: string;
  cashierId?: string;
  paymentMethod?: PaymentMethod;
  invoiceType?: InvoiceType;
  isVoided?: boolean;
  minTotal?: number;
  maxTotal?: number;
}

/**
 * Customer filter criteria
 */
export interface CustomerFilter {
  search?: string;
  isActive?: boolean;
  hasEmail?: boolean;
  hasPhone?: boolean;
  minPurchases?: number;
  minVisits?: number;
}

/**
 * Expense filter criteria
 */
export interface ExpenseFilter {
  dateFrom?: Date;
  dateTo?: Date;
  categoryId?: string;
  approvalStatus?: ApprovalStatus;
  paymentMethod?: PaymentMethod;
  minAmount?: number;
  maxAmount?: number;
}
