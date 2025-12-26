/**
 * API Type Definitions
 * Common types for API requests, responses, and data structures
 */

// ============================================================================
// Common API Response Types
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Paginated API response
 */
export interface PaginationResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
  message?: string;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Pagination request parameters
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ============================================================================
// Authentication Types
// ============================================================================

export interface LoginRequest {
  branchName: string;
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  accessTokenExpiresIn: number;
  user: UserDto;
}

export interface RefreshTokenResponse {
  accessToken: string;
  accessTokenExpiresIn: number;
}

// ============================================================================
// User & Branch Types
// ============================================================================

export interface UserDto {
  id: string;
  username: string;
  email: string;
  fullNameEn: string;
  fullNameAr?: string;
  phone?: string;
  preferredLanguage: string;
  isActive: boolean;
  isHeadOfficeAdmin: boolean;
  branches: BranchAssignmentDto[];
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BranchAssignmentDto {
  branchId: string;
  branchCode: string;
  branchNameEn: string;
  branchNameAr?: string;
  role: number;
  isActive: boolean;
}

export interface BranchDto {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  addressEn?: string;
  addressAr?: string;
  email?: string;
  phone?: string;
  website?: string;
  crn?: string;
  taxNumber?: string;
  logoPath?: string;
  databaseProvider: number;
  language: string;
  currency: string;
  timeZone: string;
  dateFormat: string;
  taxRate: number;
  allowNegativeStock?: boolean;
  negativeStockLimit?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  fullNameEn: string;
  fullNameAr?: string;
  phone?: string;
  preferredLanguage: string;
  isHeadOfficeAdmin: boolean;
}

export interface UpdateUserDto {
  email?: string;
  fullNameEn?: string;
  fullNameAr?: string;
  phone?: string;
  preferredLanguage?: string;
  isActive?: boolean;
}

export interface CreateBranchDto {
  code: string;
  nameEn: string;
  nameAr: string;
  addressEn?: string;
  addressAr?: string;
  email?: string;
  phone?: string;
  databaseProvider: number;
  dbServer: string;
  dbName: string;
  dbPort: number;
  dbUsername?: string;
  dbPassword?: string;
  language: string;
  currency: string;
  timeZone: string;
  taxRate: number;
}

export interface UpdateBranchDto {
  nameEn?: string;
  nameAr?: string;
  addressEn?: string;
  addressAr?: string;
  email?: string;
  phone?: string;
  language?: string;
  currency?: string;
  timeZone?: string;
  taxRate?: number;
  isActive?: boolean;
}

// ============================================================================
// Sales Types
// ============================================================================

export interface CreateSaleDto {
  customerId?: string;
  invoiceType: number;
  orderNumber?: string;
  orderType?: number; // OrderType enum
  lineItems: SaleLineItemDto[];
  paymentMethod: number;
  paymentReference?: string;
  amountPaid?: number;
  changeReturned?: number;
  // Invoice-level discount
  invoiceDiscountType?: number; // DiscountType enum
  invoiceDiscountValue?: number;
  notes?: string;
  // Delivery-related fields
  deliveryAddress?: string;
  deliveryFee?: number;
  specialInstructions?: string;
  isDelivery?: boolean; // Indicates if this is a delivery order
}

export interface SaleLineItemDto {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountType: number;
  discountValue: number;
}

export interface SaleDto {
  id: string;
  transactionId: string;
  invoiceNumber?: string;
  invoiceType: number;
  customerId?: string;
  customerName?: string;
  cashierId: string;
  cashierName: string;
  saleDate: string;
  subtotal: number;
  taxAmount: number;
  totalDiscount: number;
  total: number;
  paymentMethod: number;
  paymentReference?: string;
  notes?: string;
  isVoided: boolean;
  voidedAt?: string;
  voidedBy?: string;
  voidReason?: string;
  lineItems: SaleLineItemDetailDto[];
  createdAt: string;
  // Table-related fields
  tableId?: number;
  tableNumber?: number;
  guestCount?: number;
  // Delivery-related fields
  deliveryAddress?: string;
  deliveryFee?: number;
  specialInstructions?: string;
  isDelivery?: boolean;
  deliveryStatus?: DeliveryStatus;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  driverId?: string;
  driverName?: string;
}

export interface SaleLineItemDetailDto {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  barcode?: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
  discountType: number;
  discountValue: number;
  discountedUnitPrice: number;
  lineTotal: number;
  notes?: string;
}

// ============================================================================
// Pending Orders Types
// ============================================================================

/**
 * Pending order status enum
 */
export enum PendingOrderStatus {
  Draft = 0,
  Parked = 1,
  OnHold = 2,
  Retrieved = 3,
}

/**
 * Pending order item DTO
 */
export interface PendingOrderItemDto {
  id?: string;
  productId: string;
  productName: string;
  productSku?: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  totalPrice: number;
  notes?: string;
}

/**
 * Create pending order request DTO
 */
export interface CreatePendingOrderDto {
  customerName?: string;
  customerPhone?: string;
  customerId?: string;
  tableId?: string;
  tableNumber?: string;
  guestCount?: number;
  items: PendingOrderItemDto[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  orderType: number;
  status: PendingOrderStatus;
}

/**
 * Update pending order request DTO
 */
export interface UpdatePendingOrderDto {
  customerName?: string;
  customerPhone?: string;
  customerId?: string;
  tableId?: string;
  tableNumber?: string;
  guestCount?: number;
  items?: PendingOrderItemDto[];
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount?: number;
  notes?: string;
  orderType?: number;
  status?: PendingOrderStatus;
}

/**
 * Pending order DTO (response)
 */
export interface PendingOrderDto {
  id: string;
  orderNumber: string;
  customerName?: string;
  customerPhone?: string;
  customerId?: string;
  tableId?: string;
  tableNumber?: string;
  guestCount?: number;
  items: PendingOrderItemDto[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  orderType: number;
  status: PendingOrderStatus;
  createdAt: string;
  updatedAt?: string;
  createdByUserId: string;
  createdByUsername: string;
  retrievedAt?: string;
  expiresAt: string;
}

/**
 * Retrieve pending order response DTO
 */
export interface RetrievePendingOrderDto {
  order: PendingOrderDto;
  message?: string;
}

/**
 * Pending orders statistics DTO
 */
export interface PendingOrderStatsDto {
  totalPending: number;
  totalParked: number;
  totalOnHold: number;
  totalRetrieved: number;
  byUser: Array<{
    userId: string;
    username: string;
    count: number;
  }>;
  oldestPendingDate?: string;
  averageItemsPerOrder: number;
}

// ============================================================================
// Delivery Types
// ============================================================================

/**
 * Delivery order status enum
 */
export enum DeliveryStatus {
  Pending = 0,
  Assigned = 1,
  OutForDelivery = 2,
  Delivered = 3,
  Failed = 4
}

/**
 * Delivery priority enum
 */
export enum DeliveryPriority {
  Low = 0,
  Normal = 1,
  High = 2,
  Urgent = 3
}

/**
 * Driver DTOs
 */
export interface CreateDriverDto {
  code: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  licenseNumber?: string;
  vehicleNumber?: string;
  isActive: boolean;
}

export interface UpdateDriverDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  licenseNumber?: string;
  vehicleNumber?: string;
  isActive?: boolean;
}

export interface DriverDto {
  id: string;
  code: string;
  nameEn: string;
  nameAr?: string;
  phone: string;
  email?: string;
  addressEn?: string;
  addressAr?: string;
  licenseNumber: string;
  licenseExpiryDate: string;
  vehicleNumber?: string;
  vehicleType?: string;
  vehicleColor?: string;
  profileImagePath?: string;
  licenseImagePath?: string;
  vehicleImagePath?: string;
  isActive: boolean;
  isAvailable: boolean;
  totalDeliveries: number;
  averageRating?: number;
  notes?: string;
  activeDeliveryOrdersCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Delivery order DTOs
 */
export interface CreateDeliveryOrderDto {
  orderId: string; // References the Sale ID
  customerId?: string;
  driverId?: string;
  pickupAddress: string;
  deliveryAddress: string;
  deliveryLocation?: string; // JSON field for GPS coordinates or detailed location info
  estimatedDeliveryTime?: string;
  priority: DeliveryPriority;
  specialInstructions?: string;
  deliveryFee?: number;
  estimatedDeliveryMinutes?: number; // Estimated delivery time in minutes
}

export interface UpdateDeliveryOrderDto {
  driverId?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  estimatedDeliveryTime?: string;
  deliveryStatus?: DeliveryStatus;
  priority?: DeliveryPriority;
  specialInstructions?: string;
  deliveryFee?: number;
}

export interface DeliveryOrderDto {
  id: string;
  orderId: string; // References the Sale ID
  orderTransactionId?: string; // Transaction ID from the related Sale
  customerId?: string;
  customerName?: string; // Customer name from the related Sale
  driverId?: string;
  driverName?: string;
  pickupAddress: string;
  deliveryAddress: string;
  deliveryLocation?: string; // JSON field for GPS coordinates
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  deliveryStatus: DeliveryStatus;
  priority: DeliveryPriority;
  specialInstructions?: string;
  itemsCount?: number; // Number of items in the order
  orderTotal?: number; // Total amount of the order
  estimatedDeliveryMinutes?: number; // Estimated delivery time in minutes
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  sale?: SaleDto;
  customer?: CustomerDto;
  driver?: DriverDto;
}

/**
 * Query parameters for getting delivery orders
 */
export interface GetDeliveryOrdersParams extends PaginationParams {
  status?: DeliveryStatus;
  driverId?: string;
  orderId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  priority?: DeliveryPriority;
}

export interface VoidSaleDto {
  reason: string;
}

export interface SalesStatsDto {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  todaySales: number;
  todayRevenue: number;
  topProducts: TopProductDto[];
}

export interface TopProductDto {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: number;
}

// ============================================================================
// Product & Inventory Types
// ============================================================================

export interface ProductDto {
  id: string;
  sku: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  categoryId: string;
  categoryNameEn?: string;
  categoryNameAr?: string;
  sellingPrice: number;
  costPrice: number;
  stockLevel: number;
  minStockThreshold: number;
  hasInventoryDiscrepancy: boolean;
  supplierId?: string;
  supplierName?: string;
  barcode?: string;
  isActive: boolean;
  images: ProductImageDto[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ProductImageDto {
  id: string;
  imagePath: string;
  thumbnailPath: string;
  displayOrder: number;
}

export interface CreateProductDto {
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
  supplierId?: string;
  barcode?: string;
}

export interface UpdateProductDto {
  nameEn?: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  categoryId?: string;
  sellingPrice?: number;
  costPrice?: number;
  minStockThreshold?: number;
  supplierId?: string;
  barcode?: string;
  isActive?: boolean;
}

export interface StockAdjustmentDto {
  adjustment: number;
  reason: string;
}

export interface CategoryDto {
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
  productCount: number;
}

export interface CreateCategoryDto {
  code: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  parentCategoryId?: string;
  displayOrder?: number;
}

// ============================================================================
// Customer Types
// ============================================================================

export interface CustomerDto {
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
  lastVisitAt?: string;
  loyaltyPoints: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDto {
  code: string;
  nameEn: string;
  nameAr?: string;
  email?: string;
  phone?: string;
  addressEn?: string;
  addressAr?: string;
  logoPath?: string;
  loyaltyPoints?: number;
  isActive?: boolean;
}

export interface UpdateCustomerDto {
  code: string;
  nameEn: string;
  nameAr?: string;
  email?: string;
  phone?: string;
  addressEn?: string;
  addressAr?: string;
  logoPath?: string;
  loyaltyPoints: number;
  isActive: boolean;
}

// ============================================================================
// Supplier & Purchase Types
// ============================================================================

export interface SupplierDto {
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
  createdAt: string;
  updatedAt: string;
  totalPurchases: number;
  totalSpent: number;
  lastPurchaseDate?: string;
}

export interface CreateSupplierDto {
  code: string;
  nameEn: string;
  nameAr?: string;
  email?: string;
  phone?: string;
  addressEn?: string;
  addressAr?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  isActive?: boolean;
}

export interface UpdateSupplierDto {
  code?: string;
  nameEn?: string;
  nameAr?: string;
  email?: string;
  phone?: string;
  addressEn?: string;
  addressAr?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  isActive?: boolean;
}

export interface PurchaseDto {
  id: string;
  purchaseOrderNumber: string;
  supplierId: string;
  supplierName: string;
  purchaseDate: string;
  receivedDate?: string;
  totalCost: number;
  paymentStatus: number;
  amountPaid: number;
  invoiceImagePath?: string;
  notes?: string;
  lineItems: PurchaseLineItemDto[];
  createdAt: string;
}

export interface PurchaseLineItemDto {
  id: string;
  productId: string;
  purchaseId: string;
  productNameEn: string;
  productNameAr?: string;
  productSku?: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface CreatePurchaseDto {
  supplierId: string;
  purchaseDate: string;
  purchaseOrderNumber?: string;
  lineItems: CreatePurchaseLineItemDto[];
  notes?: string;
}

export interface CreatePurchaseLineItemDto {
  productId: string;
  quantity: number;
  unitCost: number;
}

// ============================================================================
// Expense Types
// ============================================================================

export interface ExpenseDto {
  id: string;
  expenseCategoryId: string;
  categoryNameEn: string;
  categoryNameAr: string;
  amount: number;
  expenseDate: string;
  descriptionEn: string;
  descriptionAr?: string;
  paymentMethod: number;
  paymentReference?: string;
  receiptImagePath?: string;
  approvalStatus: number;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  createdBy: string;
}

export interface CreateExpenseDto {
  expenseCategoryId: string;
  amount: number;
  expenseDate: string;
  descriptionEn: string;
  descriptionAr?: string;
  paymentMethod: number;
  paymentReference?: string;
  receiptImagePath?: string;
}

export interface ExpenseCategoryDto {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  budgetAllocation?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  totalExpenses?: number;
  expenseCount?: number;
}

// ============================================================================
// Sync Types
// ============================================================================

export interface SyncTransactionDto {
  id: string;
  type: "sale" | "purchase" | "expense" | "inventory_adjust";
  timestamp: string;
  branchId: string;
  userId: string;
  data: any;
}

export interface SyncStatusDto {
  pendingCount: number;
  lastSyncAt?: string;
  isOnline: boolean;
}

// ============================================================================
// Report Types
// ============================================================================

export interface SalesReportDto {
  dateFrom: string;
  dateTo: string;
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  salesByDay: SalesByDayDto[];
  topProducts: TopProductDto[];
  salesByPaymentMethod: SalesByPaymentMethodDto[];
}

export interface SalesByDayDto {
  date: string;
  salesCount: number;
  revenue: number;
}

export interface SalesByPaymentMethodDto {
  paymentMethod: number;
  paymentMethodName: string;
  salesCount: number;
  revenue: number;
}

export interface InventoryReportDto {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  productsByCategory: ProductsByCategoryDto[];
  lowStockProducts: ProductDto[];
}

export interface ProductsByCategoryDto {
  categoryId: string;
  categoryName: string;
  productCount: number;
  totalValue: number;
}

export interface FinancialReportDto {
  dateFrom: string;
  dateTo: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  revenueByDay: RevenueByDayDto[];
  expensesByCategory: ExpensesByCategoryDto[];
}

export interface RevenueByDayDto {
  date: string;
  revenue: number;
}

export interface ExpensesByCategoryDto {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
}

// ============================================================================
// Audit Types
// ============================================================================

export interface AuditLogDto {
  id: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  branchId?: string;
  branchName?: string;
  eventType: string;
  entityType?: string;
  entityId?: string;
  action: string;
  oldValues?: string;
  newValues?: string;
  ipAddress?: string;
  success: boolean;
  errorMessage?: string;
}

// ============================================================================
// Table Management Types
// ============================================================================

export interface ZoneDto {
  id: number;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  tableCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateZoneDto {
  name: string;
  description?: string;
  displayOrder: number;
}

export interface UpdateZoneDto {
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface PositionDto {
  x: number;
  y: number;
  rotation: number;
}

export interface DimensionDto {
  width: number;
  height: number;
  shape: "Rectangle" | "Circle" | "Square";
}

export interface TableDto {
  id: number;
  number: number;
  name: string;
  capacity: number;
  position: PositionDto;
  dimensions: DimensionDto;
  zoneId?: number;
  zoneName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TableWithStatusDto extends TableDto {
  status: "available" | "occupied" | "reserved";
  saleId?: string;
  invoiceNumber?: string;
  guestCount?: number;
  orderTime?: string;
  orderTotal?: number;
}

export interface CreateTableDto {
  number: number;
  name: string;
  capacity: number;
  position: PositionDto;
  dimensions: DimensionDto;
  zoneId?: number;
}

export interface UpdateTableDto {
  number: number;
  name: string;
  capacity: number;
  position: PositionDto;
  dimensions: DimensionDto;
  zoneId?: number;
  isActive: boolean;
}

export interface TransferTableDto {
  saleId: string;
  fromTableNumber: number;
  toTableNumber: number;
}

export interface AssignTableDto {
  tableNumber: number;
  guestCount: number;
}

// ============================================================================
// Image Upload Types
// ============================================================================

export interface ImageUploadResponse {
  success: boolean;
  imagePath: string;
  thumbnailPath: string;
  message?: string;
}

// ============================================================================
// Error Types
// ============================================================================

export interface ApiError {
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
  timestamp: string;
  path: string;
}

export interface ValidationError {
  field: string;
  messages: string[];
}
