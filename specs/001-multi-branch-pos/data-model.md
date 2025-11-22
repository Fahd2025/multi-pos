# Data Model: Multi-Branch POS System

**Feature**: Multi-Branch POS System
**Date**: 2025-01-21
**Phase**: 1 - Design & Contracts

## Overview

This document defines the complete database schema for the Multi-Branch POS system. The system uses a **two-database architecture**:

1. **Head Office Database**: Central database containing branch metadata, user assignments, and global settings
2. **Branch Databases**: Separate database per branch containing operational data (sales, inventory, customers, etc.)

All schemas are designed to work with multiple database providers (SQLite, MSSQL, PostgreSQL, MySQL) via Entity Framework Core.

---

## Head Office Database Schema

The Head Office database is the central authority for branch management, user administration, and system-wide configuration.

### Entity: Branch

Represents a physical store location with its configuration and database connection details.

**Table**: `Branches`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `Id` | GUID | PK | Unique branch identifier |
| `Code` | VARCHAR(20) | UNIQUE, NOT NULL | Short branch code (e.g., "B001") |
| `NameEn` | VARCHAR(200) | NOT NULL | Branch display name (English) |
| `NameAr` | NVARCHAR(200) | NOT NULL | Branch display name (Arabic) |
| `LoginName` | VARCHAR(100) | UNIQUE, NOT NULL | Branch login identifier |
| `AddressEn` | VARCHAR(500) | NULL | Physical address (English) |
| `AddressAr` | NVARCHAR(500) | NULL | Physical address (Arabic) |
| `Email` | VARCHAR(255) | NULL | Branch contact email |
| `Phone` | VARCHAR(50) | NULL | Branch contact phone |
| `Website` | VARCHAR(255) | NULL | Branch website URL |
| `CRN` | VARCHAR(50) | NULL | Commercial Registration Number |
| `TaxNumber` | VARCHAR(50) | NULL | VAT/Tax identification number |
| `NationalAddress` | VARCHAR(500) | NULL | Saudi national address (or equivalent) |
| `LogoPath` | VARCHAR(500) | NULL | Path to branch logo image |
| `DatabaseProvider` | INT | NOT NULL | Enum: 0=SQLite, 1=MSSQL, 2=PostgreSQL, 3=MySQL |
| `DbServer` | VARCHAR(255) | NOT NULL | Database server hostname or file path (SQLite) |
| `DbName` | VARCHAR(100) | NOT NULL | Database name |
| `DbPort` | INT | NOT NULL | Database server port |
| `DbUsername` | VARCHAR(100) | NULL | Database username (encrypted) |
| `DbPassword` | VARCHAR(255) | NULL | Database password (encrypted) |
| `DbAdditionalParams` | VARCHAR(500) | NULL | Additional connection string parameters |
| `Language` | VARCHAR(10) | NOT NULL, DEFAULT 'en' | Default language (en/ar) |
| `Currency` | VARCHAR(10) | NOT NULL, DEFAULT 'USD' | Currency code (USD, SAR, etc.) |
| `TimeZone` | VARCHAR(100) | NOT NULL, DEFAULT 'UTC' | IANA timezone identifier |
| `DateFormat` | VARCHAR(50) | NOT NULL, DEFAULT 'MM/DD/YYYY' | Display date format |
| `NumberFormat` | VARCHAR(50) | NOT NULL, DEFAULT 'en-US' | Number/currency format locale |
| `TaxRate` | DECIMAL(5,2) | NOT NULL, DEFAULT 0 | Tax rate percentage (e.g., 15.00 for 15%) |
| `IsActive` | BOOLEAN | NOT NULL, DEFAULT TRUE | Branch operational status |
| `CreatedAt` | DATETIME | NOT NULL | Record creation timestamp |
| `UpdatedAt` | DATETIME | NOT NULL | Last update timestamp |
| `CreatedBy` | GUID | FK → Users | User who created branch |

**Indexes**:
- `IX_Branches_Code` (UNIQUE on Code)
- `IX_Branches_LoginName` (UNIQUE on LoginName)
- `IX_Branches_IsActive` (on IsActive)

**Validation Rules**:
- `Code` must match pattern: `^[A-Z0-9]{1,20}$`
- `Email` must be valid email format
- `TaxRate` must be between 0 and 100
- `DatabaseProvider` must be one of: 0, 1, 2, 3

---

### Entity: User

Represents system users (head office admins, branch managers, cashiers).

**Table**: `Users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `Id` | GUID | PK | Unique user identifier |
| `Username` | VARCHAR(100) | UNIQUE, NOT NULL | Login username |
| `Email` | VARCHAR(255) | UNIQUE, NOT NULL | User email |
| `PasswordHash` | VARCHAR(500) | NOT NULL | Hashed password (bcrypt/Argon2) |
| `FullNameEn` | VARCHAR(200) | NOT NULL | Full name (English) |
| `FullNameAr` | NVARCHAR(200) | NULL | Full name (Arabic) |
| `Phone` | VARCHAR(50) | NULL | Contact phone |
| `PreferredLanguage` | VARCHAR(10) | NOT NULL, DEFAULT 'en' | User's preferred UI language |
| `IsActive` | BOOLEAN | NOT NULL, DEFAULT TRUE | Account status |
| `IsHeadOfficeAdmin` | BOOLEAN | NOT NULL, DEFAULT FALSE | Head office admin flag |
| `LastLoginAt` | DATETIME | NULL | Last successful login timestamp |
| `LastActivityAt` | DATETIME | NULL | Last activity timestamp (for timeout) |
| `FailedLoginAttempts` | INT | NOT NULL, DEFAULT 0 | Consecutive failed login count |
| `LockedUntil` | DATETIME | NULL | Account lock expiration (after failed attempts) |
| `CreatedAt` | DATETIME | NOT NULL | Record creation timestamp |
| `UpdatedAt` | DATETIME | NOT NULL | Last update timestamp |

**Indexes**:
- `IX_Users_Username` (UNIQUE on Username)
- `IX_Users_Email` (UNIQUE on Email)
- `IX_Users_IsActive` (on IsActive)

**Validation Rules**:
- `Username` must be 3-100 characters, alphanumeric + underscore
- `Email` must be valid email format
- `PasswordHash` required (never store plain passwords)
- `FailedLoginAttempts` auto-resets on successful login

---

### Entity: BranchUser

Represents user assignments to branches with role-based permissions.

**Table**: `BranchUsers`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `Id` | GUID | PK | Unique assignment identifier |
| `UserId` | GUID | FK → Users, NOT NULL | User reference |
| `BranchId` | GUID | FK → Branches, NOT NULL | Branch reference |
| `Role` | INT | NOT NULL | Enum: 0=Cashier, 1=Manager, 2=Admin |
| `IsActive` | BOOLEAN | NOT NULL, DEFAULT TRUE | Assignment status |
| `AssignedAt` | DATETIME | NOT NULL | Assignment timestamp |
| `AssignedBy` | GUID | FK → Users | Admin who made assignment |

**Indexes**:
- `IX_BranchUsers_UserId` (on UserId)
- `IX_BranchUsers_BranchId` (on BranchId)
- `UQ_BranchUsers_UserBranch` (UNIQUE on UserId + BranchId)

**Validation Rules**:
- User cannot be assigned to same branch twice (enforced by unique constraint)
- `Role` must be one of: 0, 1, 2
- Head office admins (IsHeadOfficeAdmin=TRUE) don't need BranchUser entries

---

### Entity: RefreshToken

Represents JWT refresh tokens for session management.

**Table**: `RefreshTokens`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `Id` | GUID | PK | Unique token identifier |
| `UserId` | GUID | FK → Users, NOT NULL | User who owns token |
| `Token` | VARCHAR(500) | UNIQUE, NOT NULL | Refresh token string |
| `ExpiresAt` | DATETIME | NOT NULL | Token expiration timestamp |
| `CreatedAt` | DATETIME | NOT NULL | Token creation timestamp |
| `RevokedAt` | DATETIME | NULL | Token revocation timestamp (if revoked) |
| `LastActivityAt` | DATETIME | NOT NULL | Last activity timestamp (for 30min timeout) |
| `IpAddress` | VARCHAR(50) | NULL | Client IP address |
| `UserAgent` | VARCHAR(500) | NULL | Client user agent string |

**Indexes**:
- `IX_RefreshTokens_Token` (UNIQUE on Token)
- `IX_RefreshTokens_UserId` (on UserId)
- `IX_RefreshTokens_ExpiresAt` (on ExpiresAt, for cleanup queries)

**Validation Rules**:
- `Token` must be cryptographically secure random string (256+ bits)
- Auto-delete tokens where `RevokedAt IS NOT NULL OR ExpiresAt < NOW()`
- 30-minute inactivity enforced via `LastActivityAt`

---

### Entity: MainSetting

Represents global system settings (key-value pairs).

**Table**: `MainSettings`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `Id` | GUID | PK | Unique setting identifier |
| `Key` | VARCHAR(200) | UNIQUE, NOT NULL | Setting key (e.g., "TechnicalPassword") |
| `Value` | TEXT | NULL | Setting value (encrypted if sensitive) |
| `IsEncrypted` | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether value is encrypted |
| `Description` | VARCHAR(500) | NULL | Setting description |
| `UpdatedAt` | DATETIME | NOT NULL | Last update timestamp |
| `UpdatedBy` | GUID | FK → Users | User who last updated setting |

**Indexes**:
- `IX_MainSettings_Key` (UNIQUE on Key)

**Common Settings**:
- `TechnicalPassword`: Admin override password (encrypted)
- `DefaultBranchSettings`: JSON with default settings for new branches
- `SessionTimeoutMinutes`: Global session timeout (default: 30)
- `MaxFailedLoginAttempts`: Account lockout threshold (default: 5)

---

### Entity: AuditLog

Represents permanent audit trail for security and business events.

**Table**: `AuditLogs`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `Id` | GUID | PK | Unique log entry identifier |
| `Timestamp` | DATETIME | NOT NULL, INDEXED | Event timestamp (UTC) |
| `UserId` | GUID | FK → Users, NULL | User who performed action |
| `BranchId` | GUID | FK → Branches, NULL | Branch context (if applicable) |
| `EventType` | VARCHAR(100) | NOT NULL | Event type (Login, Sale, InventoryAdjust, etc.) |
| `EntityType` | VARCHAR(100) | NULL | Affected entity type (Product, User, Branch, etc.) |
| `EntityId` | GUID | NULL | Affected entity identifier |
| `Action` | VARCHAR(50) | NOT NULL | Action performed (Create, Update, Delete, View) |
| `OldValues` | TEXT | NULL | JSON snapshot of entity before change |
| `NewValues` | TEXT | NULL | JSON snapshot of entity after change |
| `IpAddress` | VARCHAR(50) | NULL | Client IP address |
| `UserAgent` | VARCHAR(500) | NULL | Client user agent string |
| `Success` | BOOLEAN | NOT NULL, DEFAULT TRUE | Whether action succeeded |
| `ErrorMessage` | TEXT | NULL | Error details (if Success=FALSE) |

**Indexes**:
- `IX_AuditLogs_Timestamp` (on Timestamp DESC, for recent queries)
- `IX_AuditLogs_UserId` (on UserId)
- `IX_AuditLogs_BranchId` (on BranchId)
- `IX_AuditLogs_EventType` (on EventType)
- `IX_AuditLogs_EntityType_EntityId` (composite on EntityType + EntityId)

**Retention**: Permanent (no automatic deletion)

---

### Entity: UserActivityLog

Represents recent user activity (circular buffer, last 100 per user).

**Table**: `UserActivityLogs`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `Id` | GUID | PK | Unique activity identifier |
| `UserId` | GUID | FK → Users, NOT NULL | User reference |
| `Timestamp` | DATETIME | NOT NULL | Activity timestamp |
| `ActivityType` | VARCHAR(100) | NOT NULL | Activity type (Login, Logout, PageView, etc.) |
| `Description` | VARCHAR(500) | NOT NULL | Human-readable description |
| `BranchId` | GUID | FK → Branches, NULL | Branch context (if applicable) |
| `IpAddress` | VARCHAR(50) | NULL | Client IP address |

**Indexes**:
- `IX_UserActivityLogs_UserId_Timestamp` (composite on UserId + Timestamp DESC)

**Retention**: Last 100 activities per user (circular buffer maintained by application)

---

## Branch Database Schema

Each branch has its own database containing operational data. All branch databases share the same schema but are physically separate.

### Entity: Category

Represents product categories (hierarchical structure supported).

**Table**: `Categories`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `Id` | GUID | PK | Unique category identifier |
| `Code` | VARCHAR(50) | UNIQUE, NOT NULL | Category code (e.g., "ELEC001") |
| `NameEn` | VARCHAR(200) | NOT NULL | Category name (English) |
| `NameAr` | NVARCHAR(200) | NOT NULL | Category name (Arabic) |
| `DescriptionEn` | TEXT | NULL | Category description (English) |
| `DescriptionAr` | NTEXT | NULL | Category description (Arabic) |
| `ParentCategoryId` | GUID | FK → Categories, NULL | Parent category (for hierarchy) |
| `ImagePath` | VARCHAR(500) | NULL | Category image path |
| `DisplayOrder` | INT | NOT NULL, DEFAULT 0 | Sort order for display |
| `IsActive` | BOOLEAN | NOT NULL, DEFAULT TRUE | Category status |
| `CreatedAt` | DATETIME | NOT NULL | Record creation timestamp |
| `UpdatedAt` | DATETIME | NOT NULL | Last update timestamp |
| `CreatedBy` | GUID | NOT NULL | User who created category |

**Indexes**:
- `IX_Categories_Code` (UNIQUE on Code)
- `IX_Categories_ParentCategoryId` (on ParentCategoryId)
- `IX_Categories_IsActive` (on IsActive)

**Validation Rules**:
- `Code` must be unique per branch
- `ParentCategoryId` cannot create circular references
- `DisplayOrder` used for UI sorting (lower values first)

---

### Entity: Product

Represents items for sale with inventory tracking.

**Table**: `Products`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `Id` | GUID | PK | Unique product identifier |
| `SKU` | VARCHAR(100) | UNIQUE, NOT NULL | Stock Keeping Unit code |
| `NameEn` | VARCHAR(200) | NOT NULL | Product name (English) |
| `NameAr` | NVARCHAR(200) | NOT NULL | Product name (Arabic) |
| `DescriptionEn` | TEXT | NULL | Product description (English) |
| `DescriptionAr` | NTEXT | NULL | Product description (Arabic) |
| `CategoryId` | GUID | FK → Categories, NOT NULL | Category reference |
| `SellingPrice` | DECIMAL(18,2) | NOT NULL | Current selling price |
| `CostPrice` | DECIMAL(18,2) | NOT NULL | Cost/purchase price |
| `StockLevel` | INT | NOT NULL, DEFAULT 0 | Current stock quantity |
| `MinStockThreshold` | INT | NOT NULL, DEFAULT 10 | Low stock alert threshold |
| `HasInventoryDiscrepancy` | BOOLEAN | NOT NULL, DEFAULT FALSE | Flag for negative/conflict inventory |
| `SupplierId` | GUID | FK → Suppliers, NULL | Default supplier reference |
| `Barcode` | VARCHAR(100) | NULL | Product barcode (EAN-13, UPC, etc.) |
| `IsActive` | BOOLEAN | NOT NULL, DEFAULT TRUE | Product availability status |
| `CreatedAt` | DATETIME | NOT NULL | Record creation timestamp |
| `UpdatedAt` | DATETIME | NOT NULL | Last update timestamp |
| `CreatedBy` | GUID | NOT NULL | User who created product |

**Indexes**:
- `IX_Products_SKU` (UNIQUE on SKU)
- `IX_Products_CategoryId` (on CategoryId)
- `IX_Products_SupplierId` (on SupplierId)
- `IX_Products_Barcode` (on Barcode)
- `IX_Products_IsActive` (on IsActive)
- `IX_Products_StockLevel` (on StockLevel, for low stock queries)

**Validation Rules**:
- `SellingPrice` > 0
- `CostPrice` >= 0
- `MinStockThreshold` >= 0
- `HasInventoryDiscrepancy` flagged when `StockLevel` < 0

---

### Entity: ProductImage

Represents multiple images per product.

**Table**: `ProductImages`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `Id` | GUID | PK | Unique image identifier |
| `ProductId` | GUID | FK → Products, NOT NULL | Product reference |
| `ImagePath` | VARCHAR(500) | NOT NULL | Path to original image |
| `ThumbnailPath` | VARCHAR(500) | NOT NULL | Path to thumbnail |
| `DisplayOrder` | INT | NOT NULL, DEFAULT 0 | Sort order (first image is primary) |
| `UploadedAt` | DATETIME | NOT NULL | Upload timestamp |
| `UploadedBy` | GUID | NOT NULL | User who uploaded image |

**Indexes**:
- `IX_ProductImages_ProductId` (on ProductId)

**Validation Rules**:
- First image (DisplayOrder=0) is considered primary product image
- Max 10 images per product (enforced at application level)

---

### Entity: Customer

Represents customer accounts (optional for sales).

**Table**: `Customers`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `Id` | GUID | PK | Unique customer identifier |
| `Code` | VARCHAR(50) | UNIQUE, NOT NULL | Customer code (e.g., "CUST001") |
| `NameEn` | VARCHAR(200) | NOT NULL | Customer name (English) |
| `NameAr` | NVARCHAR(200) | NULL | Customer name (Arabic) |
| `Email` | VARCHAR(255) | NULL | Customer email |
| `Phone` | VARCHAR(50) | NULL | Customer phone |
| `AddressEn` | VARCHAR(500) | NULL | Customer address (English) |
| `AddressAr` | NVARCHAR(500) | NULL | Customer address (Arabic) |
| `LogoPath` | VARCHAR(500) | NULL | Customer logo/photo path |
| `TotalPurchases` | DECIMAL(18,2) | NOT NULL, DEFAULT 0 | Lifetime purchase total |
| `VisitCount` | INT | NOT NULL, DEFAULT 0 | Number of purchases |
| `LastVisitAt` | DATETIME | NULL | Last purchase timestamp |
| `LoyaltyPoints` | INT | NOT NULL, DEFAULT 0 | Loyalty program points |
| `IsActive` | BOOLEAN | NOT NULL, DEFAULT TRUE | Customer account status |
| `CreatedAt` | DATETIME | NOT NULL | Record creation timestamp |
| `UpdatedAt` | DATETIME | NOT NULL | Last update timestamp |
| `CreatedBy` | GUID | NOT NULL | User who created customer |

**Indexes**:
- `IX_Customers_Code` (UNIQUE on Code)
- `IX_Customers_Email` (on Email)
- `IX_Customers_Phone` (on Phone)
- `IX_Customers_IsActive` (on IsActive)

**Validation Rules**:
- `Email` must be valid format (if provided)
- `TotalPurchases` auto-calculated from sales
- `VisitCount` auto-incremented on each sale

---

### Entity: Supplier

Represents vendors for purchase orders.

**Table**: `Suppliers`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `Id` | GUID | PK | Unique supplier identifier |
| `Code` | VARCHAR(50) | UNIQUE, NOT NULL | Supplier code (e.g., "SUPP001") |
| `NameEn` | VARCHAR(200) | NOT NULL | Supplier name (English) |
| `NameAr` | NVARCHAR(200) | NULL | Supplier name (Arabic) |
| `Email` | VARCHAR(255) | NULL | Supplier email |
| `Phone` | VARCHAR(50) | NULL | Supplier phone |
| `AddressEn` | VARCHAR(500) | NULL | Supplier address (English) |
| `AddressAr` | NVARCHAR(500) | NULL | Supplier address (Arabic) |
| `LogoPath` | VARCHAR(500) | NULL | Supplier logo path |
| `PaymentTerms` | VARCHAR(200) | NULL | Payment terms (e.g., "Net 30") |
| `DeliveryTerms` | VARCHAR(200) | NULL | Delivery terms |
| `IsActive` | BOOLEAN | NOT NULL, DEFAULT TRUE | Supplier status |
| `CreatedAt` | DATETIME | NOT NULL | Record creation timestamp |
| `UpdatedAt` | DATETIME | NOT NULL | Last update timestamp |
| `CreatedBy` | GUID | NOT NULL | User who created supplier |

**Indexes**:
- `IX_Suppliers_Code` (UNIQUE on Code)
- `IX_Suppliers_Email` (on Email)
- `IX_Suppliers_IsActive` (on IsActive)

---

### Entity: Sale

Represents completed sales transactions.

**Table**: `Sales`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `Id` | GUID | PK | Unique sale identifier |
| `TransactionId` | VARCHAR(50) | UNIQUE, NOT NULL | Transaction ID (for Touch invoices) |
| `InvoiceNumber` | VARCHAR(50) | NULL | Sequential invoice number (for Standard invoices) |
| `InvoiceType` | INT | NOT NULL | Enum: 0=Touch, 1=Standard |
| `CustomerId` | GUID | FK → Customers, NULL | Customer reference (NULL for anonymous) |
| `CashierId` | GUID | NOT NULL | User who processed sale |
| `SaleDate` | DATETIME | NOT NULL | Sale timestamp |
| `Subtotal` | DECIMAL(18,2) | NOT NULL | Sum of line items before tax/discount |
| `TaxAmount` | DECIMAL(18,2) | NOT NULL | Total tax amount |
| `TotalDiscount` | DECIMAL(18,2) | NOT NULL, DEFAULT 0 | Total discounts applied |
| `Total` | DECIMAL(18,2) | NOT NULL | Final sale total |
| `PaymentMethod` | INT | NOT NULL | Enum: 0=Cash, 1=Card, 2=DigitalWallet |
| `PaymentReference` | VARCHAR(200) | NULL | Payment transaction reference (if applicable) |
| `Notes` | TEXT | NULL | Additional notes |
| `IsVoided` | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether sale was cancelled |
| `VoidedAt` | DATETIME | NULL | Cancellation timestamp |
| `VoidedBy` | GUID | NULL | User who cancelled sale |
| `VoidReason` | VARCHAR(500) | NULL | Cancellation reason |
| `CreatedAt` | DATETIME | NOT NULL | Record creation timestamp |

**Indexes**:
- `IX_Sales_TransactionId` (UNIQUE on TransactionId)
- `IX_Sales_InvoiceNumber` (UNIQUE on InvoiceNumber, where NOT NULL)
- `IX_Sales_CustomerId` (on CustomerId)
- `IX_Sales_CashierId` (on CashierId)
- `IX_Sales_SaleDate` (on SaleDate DESC, for recent sales)
- `IX_Sales_IsVoided` (on IsVoided)

**Validation Rules**:
- `InvoiceNumber` required if InvoiceType=1 (Standard)
- `TransactionId` always required
- `Total` = `Subtotal` + `TaxAmount` - `TotalDiscount`
- `Subtotal` must match sum of SaleLineItems

---

### Entity: SaleLineItem

Represents individual products in a sale.

**Table**: `SaleLineItems`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `Id` | GUID | PK | Unique line item identifier |
| `SaleId` | GUID | FK → Sales, NOT NULL | Sale reference |
| `ProductId` | GUID | FK → Products, NOT NULL | Product reference |
| `Quantity` | INT | NOT NULL | Quantity sold |
| `UnitPrice` | DECIMAL(18,2) | NOT NULL | Price per unit at time of sale |
| `DiscountType` | INT | NOT NULL, DEFAULT 0 | Enum: 0=None, 1=Percentage, 2=FixedAmount |
| `DiscountValue` | DECIMAL(18,2) | NOT NULL, DEFAULT 0 | Discount percentage or fixed amount |
| `DiscountedUnitPrice` | DECIMAL(18,2) | NOT NULL | Unit price after discount |
| `LineTotal` | DECIMAL(18,2) | NOT NULL | Total for this line item |

**Indexes**:
- `IX_SaleLineItems_SaleId` (on SaleId)
- `IX_SaleLineItems_ProductId` (on ProductId)

**Validation Rules**:
- `Quantity` > 0
- `UnitPrice` > 0
- If `DiscountType`=1 (Percentage): `DiscountValue` between 0-100
- If `DiscountType`=2 (FixedAmount): `DiscountValue` between 0-UnitPrice
- `DiscountedUnitPrice` = `UnitPrice` - (calculated discount)
- `LineTotal` = `DiscountedUnitPrice` * `Quantity`

---

### Entity: Purchase

Represents purchase orders from suppliers.

**Table**: `Purchases`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `Id` | GUID | PK | Unique purchase identifier |
| `PurchaseOrderNumber` | VARCHAR(50) | UNIQUE, NOT NULL | PO number |
| `SupplierId` | GUID | FK → Suppliers, NOT NULL | Supplier reference |
| `PurchaseDate` | DATETIME | NOT NULL | Purchase date |
| `ReceivedDate` | DATETIME | NULL | Date goods received |
| `TotalCost` | DECIMAL(18,2) | NOT NULL | Total purchase cost |
| `PaymentStatus` | INT | NOT NULL, DEFAULT 0 | Enum: 0=Pending, 1=Partial, 2=Paid |
| `AmountPaid` | DECIMAL(18,2) | NOT NULL, DEFAULT 0 | Amount paid so far |
| `InvoiceImagePath` | VARCHAR(500) | NULL | Scanned invoice image path |
| `Notes` | TEXT | NULL | Additional notes |
| `CreatedAt` | DATETIME | NOT NULL | Record creation timestamp |
| `CreatedBy` | GUID | NOT NULL | User who created purchase |

**Indexes**:
- `IX_Purchases_PurchaseOrderNumber` (UNIQUE on PurchaseOrderNumber)
- `IX_Purchases_SupplierId` (on SupplierId)
- `IX_Purchases_PurchaseDate` (on PurchaseDate DESC)
- `IX_Purchases_PaymentStatus` (on PaymentStatus)

**Validation Rules**:
- `TotalCost` must match sum of PurchaseLineItems
- `AmountPaid` <= `TotalCost`
- `PaymentStatus` auto-calculated: Pending if AmountPaid=0, Partial if 0<AmountPaid<TotalCost, Paid if AmountPaid=TotalCost

---

### Entity: PurchaseLineItem

Represents individual products in a purchase order.

**Table**: `PurchaseLineItems`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `Id` | GUID | PK | Unique line item identifier |
| `PurchaseId` | GUID | FK → Purchases, NOT NULL | Purchase reference |
| `ProductId` | GUID | FK → Products, NOT NULL | Product reference |
| `Quantity` | INT | NOT NULL | Quantity purchased |
| `UnitCost` | DECIMAL(18,2) | NOT NULL | Cost per unit |
| `LineTotal` | DECIMAL(18,2) | NOT NULL | Total for this line item |

**Indexes**:
- `IX_PurchaseLineItems_PurchaseId` (on PurchaseId)
- `IX_PurchaseLineItems_ProductId` (on ProductId)

**Validation Rules**:
- `Quantity` > 0
- `UnitCost` >= 0
- `LineTotal` = `UnitCost` * `Quantity`
- Stock auto-updated when `ReceivedDate` is set on parent Purchase

---

### Entity: ExpenseCategory

Represents expense categories for cost tracking.

**Table**: `ExpenseCategories`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `Id` | GUID | PK | Unique category identifier |
| `Code` | VARCHAR(50) | UNIQUE, NOT NULL | Category code (e.g., "RENT") |
| `NameEn` | VARCHAR(200) | NOT NULL | Category name (English) |
| `NameAr` | NVARCHAR(200) | NOT NULL | Category name (Arabic) |
| `BudgetAllocation` | DECIMAL(18,2) | NULL | Monthly budget (optional) |
| `IsActive` | BOOLEAN | NOT NULL, DEFAULT TRUE | Category status |
| `CreatedAt` | DATETIME | NOT NULL | Record creation timestamp |

**Indexes**:
- `IX_ExpenseCategories_Code` (UNIQUE on Code)
- `IX_ExpenseCategories_IsActive` (on IsActive)

---

### Entity: Expense

Represents business expenses.

**Table**: `Expenses`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `Id` | GUID | PK | Unique expense identifier |
| `ExpenseCategoryId` | GUID | FK → ExpenseCategories, NOT NULL | Category reference |
| `Amount` | DECIMAL(18,2) | NOT NULL | Expense amount |
| `ExpenseDate` | DATE | NOT NULL | Date expense occurred |
| `DescriptionEn` | VARCHAR(500) | NOT NULL | Expense description (English) |
| `DescriptionAr` | NVARCHAR(500) | NULL | Expense description (Arabic) |
| `PaymentMethod` | INT | NOT NULL | Enum: 0=Cash, 1=Card, 2=BankTransfer, 3=Check |
| `PaymentReference` | VARCHAR(200) | NULL | Payment transaction reference |
| `ReceiptImagePath` | VARCHAR(500) | NULL | Scanned receipt image path |
| `ApprovalStatus` | INT | NOT NULL, DEFAULT 0 | Enum: 0=Pending, 1=Approved, 2=Rejected |
| `ApprovedBy` | GUID | NULL | User who approved expense |
| `ApprovedAt` | DATETIME | NULL | Approval timestamp |
| `CreatedAt` | DATETIME | NOT NULL | Record creation timestamp |
| `CreatedBy` | GUID | NOT NULL | User who created expense |

**Indexes**:
- `IX_Expenses_ExpenseCategoryId` (on ExpenseCategoryId)
- `IX_Expenses_ExpenseDate` (on ExpenseDate DESC)
- `IX_Expenses_ApprovalStatus` (on ApprovalStatus)

**Validation Rules**:
- `Amount` > 0
- `ApprovedBy` and `ApprovedAt` required if ApprovalStatus=1 (Approved)

---

### Entity: Setting

Represents branch-specific settings (key-value pairs).

**Table**: `Settings`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `Id` | GUID | PK | Unique setting identifier |
| `Key` | VARCHAR(200) | UNIQUE, NOT NULL | Setting key |
| `Value` | TEXT | NULL | Setting value |
| `Description` | VARCHAR(500) | NULL | Setting description |
| `UpdatedAt` | DATETIME | NOT NULL | Last update timestamp |
| `UpdatedBy` | GUID | NOT NULL | User who last updated setting |

**Indexes**:
- `IX_Settings_Key` (UNIQUE on Key)

**Common Settings** (synchronized from head office):
- `BranchName`: Branch display name
- `TaxRate`: Branch-specific tax rate
- `Currency`: Branch currency
- `Language`: Default language
- `InvoicePrefix`: Prefix for invoice numbers (e.g., "B001-INV-")

---

### Entity: SyncQueue

Represents offline transactions pending synchronization.

**Table**: `SyncQueue`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `Id` | GUID | PK | Unique sync item identifier |
| `SyncId` | VARCHAR(100) | UNIQUE, NOT NULL | Client-generated sync identifier |
| `TransactionType` | VARCHAR(100) | NOT NULL | Type: Sale, Purchase, Expense, InventoryAdjust |
| `TransactionData` | TEXT | NOT NULL | JSON serialized transaction data |
| `Timestamp` | DATETIME | NOT NULL | Transaction timestamp (for ordering) |
| `SyncStatus` | INT | NOT NULL, DEFAULT 0 | Enum: 0=Pending, 1=InProgress, 2=Completed, 3=Failed |
| `RetryCount` | INT | NOT NULL, DEFAULT 0 | Number of sync attempts |
| `LastSyncAttempt` | DATETIME | NULL | Last sync attempt timestamp |
| `ErrorMessage` | TEXT | NULL | Error details (if Failed) |
| `CreatedAt` | DATETIME | NOT NULL | Queue entry creation timestamp |

**Indexes**:
- `IX_SyncQueue_SyncId` (UNIQUE on SyncId)
- `IX_SyncQueue_SyncStatus` (on SyncStatus)
- `IX_SyncQueue_Timestamp` (on Timestamp ASC, for chronological processing)

**Validation Rules**:
- `RetryCount` max 3 (after 3 failures, status set to Failed)
- Process items in chronological order (ORDER BY Timestamp ASC)
- Auto-delete items with SyncStatus=2 (Completed) after successful sync

---

## Relationships Summary

### Head Office Database

```
Users 1---* BranchUsers *---1 Branches
Users 1---* RefreshTokens
Users 1---* AuditLogs
Users 1---* UserActivityLogs
Branches 1---* AuditLogs
Users 1---* MainSettings (UpdatedBy)
Users 1---* Branches (CreatedBy)
```

### Branch Database

```
Categories 1---* Products
Categories 1---* Categories (self-reference, ParentCategoryId)
Products 1---* ProductImages
Products 1---* SaleLineItems
Products 1---* PurchaseLineItems
Products *---1 Suppliers

Customers 1---* Sales
Sales 1---* SaleLineItems

Suppliers 1---* Purchases
Purchases 1---* PurchaseLineItems

ExpenseCategories 1---* Expenses
```

---

## Data Synchronization Notes

### Head Office → Branch Sync

Settings and users synchronized from head office to branches:
- Branch settings (when updated in head office)
- BranchUser assignments (when users added/removed from branch)
- User profile updates (when user details change)

**Mechanism**: Branch polls head office API every 5 minutes for updates, or receives webhooks (if online).

### Branch → Head Office Sync

Offline transactions synchronized from branch to head office:
- Sales (for consolidated reporting)
- Purchase orders (for inventory visibility)
- Expenses (for financial reporting)

**Mechanism**: SyncQueue table processed when connectivity restored, transactions sent in chronological order.

---

## Enumerations

### DatabaseProvider
```csharp
public enum DatabaseProvider
{
    SQLite = 0,
    MSSQL = 1,
    PostgreSQL = 2,
    MySQL = 3
}
```

### UserRole
```csharp
public enum UserRole
{
    Cashier = 0,
    Manager = 1,
    Admin = 2
}
```

### InvoiceType
```csharp
public enum InvoiceType
{
    Touch = 0,       // Simplified invoice
    Standard = 1     // Detailed formal invoice
}
```

### PaymentMethod
```csharp
public enum PaymentMethod
{
    Cash = 0,
    Card = 1,
    DigitalWallet = 2,
    BankTransfer = 3,
    Check = 4
}
```

### DiscountType
```csharp
public enum DiscountType
{
    None = 0,
    Percentage = 1,      // e.g., 20% off
    FixedAmount = 2      // e.g., $5 off
}
```

### PaymentStatus
```csharp
public enum PaymentStatus
{
    Pending = 0,
    Partial = 1,
    Paid = 2
}
```

### SyncStatus
```csharp
public enum SyncStatus
{
    Pending = 0,
    InProgress = 1,
    Completed = 2,
    Failed = 3
}
```

### ApprovalStatus
```csharp
public enum ApprovalStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2
}
```

---

## Migration Strategy

### Initial Setup

1. **Head Office Database**: Created during system installation, contains default admin user
2. **Branch Databases**: Created on-demand when branch is added via head office dashboard

### Sample Data Seeding

When new branch database is provisioned:
- 5-10 sample categories (Electronics, Clothing, Food, etc.)
- 20-30 sample products across categories
- 5 sample customers
- 3 sample suppliers
- 5 expense categories (Rent, Utilities, Salaries, Supplies, Marketing)

### Schema Versioning

- Use EF Core Migrations for schema changes
- Maintain migration compatibility across all 4 database providers
- Version tracking in `__EFMigrationsHistory` table (standard EF Core)

---

## Database Sizing Estimates

### Head Office Database

- 50 branches: ~100 KB
- 500 users: ~500 KB
- BranchUsers: ~25 KB
- AuditLogs (1 year): ~5 GB (assuming 1M events/year)
- UserActivityLogs: ~5 MB (100 activities × 500 users)
- **Total**: ~5.5 GB (primarily audit logs)

### Per-Branch Database

- 100 categories: ~50 KB
- 1,000 products: ~2 MB
- 10,000 sales/year: ~20 MB
- SaleLineItems (30K items): ~15 MB
- 500 customers: ~500 KB
- 50 suppliers: ~50 KB
- 1,000 purchases/year: ~2 MB
- 2,000 expenses/year: ~2 MB
- **Total per branch**: ~42 MB/year

**System-wide (50 branches, 1 year)**: 5.5 GB (HO) + 2.1 GB (branches) = **~7.6 GB**

---

## Performance Considerations

1. **Indexes**: All FK columns indexed for join performance
2. **Date Queries**: Timestamp columns indexed for date range queries
3. **Full-Text Search**: Consider adding FTS indexes for product/customer name search (provider-specific)
4. **Archival**: Archive AuditLogs older than 2 years to separate database
5. **Connection Pooling**: 100 max connections per branch database (configurable)
6. **Read Replicas**: Consider for head office database if reporting becomes bottleneck

---

**Phase 1 Complete**: Database schema fully defined. Ready to proceed to API contracts design.
